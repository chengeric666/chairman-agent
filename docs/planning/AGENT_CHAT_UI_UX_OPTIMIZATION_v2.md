# Agent Chat UI 深度研究界面优化方案 v2

**任务**: 优化 Agent Chat UI 的用户体验，解决核心 UX 问题

**工作目录**: `/Users/batfic887/Documents/project/chairman-agent/thirdparty/agent-chat-ui`

**版本**: v2 (2025-11-28)

---

## 🔴 当前最高优先级：研究过程 UI 重复显示问题

### 问题现象

研究进行中时出现 **2 个研究过程 UI**：
1. 上面：动态 Timeline 瀑布流
2. 下面：带折叠的研究过程 Box（内容与 Timeline 不同步，显示"共 2 条研究记录"）

### 问题根因分析

当前代码有两个**独立的条件分支**渲染 `SupervisorMessagesContainer`：

```tsx
// 情况1：研究完成后（Line 543-558）
if (showProcessMessages && index === lastAiIndex && hasFinalReport && supervisorMessages.length > 0) {
  // 渲染一个 SupervisorMessagesContainer
}

// 情况2：研究进行中（Line 583-598）
if (showProcessMessages && isLoading && !hasFinalReport && (supervisorMessages.length > 0 || isLoading)) {
  // 渲染另一个 SupervisorMessagesContainer
}
```

**问题**：
- 两个条件看似互斥，但在**中断后继续**场景下状态混乱
- `SupervisorMessagesContainer` 内部没有区分"进行中"和"已完成"的不同展示模式
- 缺少清晰的**状态机**驱动 UI 变化

### 解决方案：状态机驱动的单一组件

```
研究状态机：

┌─────────────────┐
│ INITIAL         │  用户提交问题
│ (无消息,无报告) │
└───────┬─────────┘
        │ isLoading=true
        ▼
┌─────────────────┐
│ STARTING        │  显示："研究过程" 框 + "研究进行中"
│ (isLoading,     │  UI: 简洁卡片，无展开按钮
│  supervisor=0)  │
└───────┬─────────┘
        │ supervisor_messages.length > 0
        ▼
┌─────────────────┐
│ RESEARCHING     │  显示：头部 "研究过程 - 进行中" + 动态 Timeline
│ (isLoading,     │  UI: 固定头部 + 实时更新的 Timeline 内容
│  supervisor>0)  │       不可折叠，始终展开
└───────┬─────────┘
        │ final_report 出现 && !isLoading
        ▼
┌─────────────────┐
│ COMPLETED       │  显示：可折叠的完整研究历史框
│ (!isLoading,    │  UI: 默认收起，点击展开查看完整 Timeline
│  有final_report)│       显示 "共 N 条研究记录"
└─────────────────┘
```

---

## 实施方案

### Step 1: 重新设计 SupervisorMessagesContainer 组件

**位置**: `src/components/thread/index.tsx` Line 94-201

**修改思路**：
1. 添加明确的 `phase` 属性来区分 3 个状态
2. 根据 phase 渲染不同的 UI 模式
3. 只在消息列表末尾渲染一个实例

```tsx
type ResearchPhase = 'starting' | 'researching' | 'completed';

function SupervisorMessagesContainer({
  messages,
  phase,  // 新增：明确的研究阶段
  handleRegenerate,
}: {
  messages: Message[];
  phase: ResearchPhase;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  // STARTING 阶段：简洁的"研究进行中"卡片
  if (phase === 'starting') {
    return (
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <LoaderCircle className="w-4 h-4 animate-spin text-primary" />
            <span className="font-medium text-foreground">研究过程</span>
            <span className="text-sm text-primary">启动中...</span>
          </div>
        </div>
      </div>
    );
  }

  // RESEARCHING 阶段：固定头部 + 动态 Timeline（不可折叠）
  if (phase === 'researching') {
    return (
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <LoaderCircle className="w-4 h-4 animate-spin text-primary" />
            <span className="font-medium text-foreground">研究过程</span>
            <span className="text-sm text-primary">进行中...</span>
          </div>
        </div>
        {/* 始终展开的 Timeline 内容 */}
        <div className="p-4 bg-muted/30">
          <div className="relative pl-6 ml-3 border-l-2 border-primary/30">
            {messages.map((message, index) => (
              <div key={`supervisor-msg-${index}`} className="relative mb-4">
                <div className="absolute -left-[33px] top-3 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary" />
                <AssistantMessage message={message} isLoading={false} handleRegenerate={handleRegenerate} />
              </div>
            ))}
            {/* 加载指示器 */}
            <div className="relative">
              <div className="absolute -left-[33px] top-2 w-4 h-4 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground">正在研究...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // COMPLETED 阶段：可折叠的完整历史框（默认收起）
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">研究过程</span>
          <span className="text-sm text-muted-foreground">共 {messages.length} 条研究记录</span>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-muted/30">
          {/* 完整的 Timeline 内容 */}
        </div>
      )}

      <button onClick={() => setIsExpanded(!isExpanded)} className="...">
        {isExpanded ? '收起' : '展开详情'}
      </button>
    </div>
  );
}
```

### Step 2: 简化渲染逻辑

**位置**: `src/components/thread/index.tsx` Line 522-601

**修改前**（两个独立条件）：
```tsx
// 情况1 在消息循环内
// 情况2 在消息循环后
```

**修改后**（统一的状态计算 + 单一渲染点）：
```tsx
// 在消息列表渲染完成后统一处理
const supervisorMessages = values?.supervisor_messages || [];
const hasFinalReport = !!values?.final_report;

// 计算研究阶段
const researchPhase: ResearchPhase | null = (() => {
  if (!showProcessMessages) return null;
  if (!isLoading && hasFinalReport && supervisorMessages.length > 0) return 'completed';
  if (isLoading && supervisorMessages.length > 0) return 'researching';
  if (isLoading && supervisorMessages.length === 0) return 'starting';
  return null;
})();

// 只渲染一个实例
{researchPhase && (
  <SupervisorMessagesContainer
    key="supervisor-messages-unified"
    messages={supervisorMessages}
    phase={researchPhase}
    handleRegenerate={handleRegenerate}
  />
)}
```

### Step 3: 调整渲染位置

- **STARTING / RESEARCHING 阶段**：在消息列表末尾显示（用户看到的是对话的"当前进度"）
- **COMPLETED 阶段**：在最终报告之前显示（用户先看完整过程，再看报告）

---

## 问题诊断汇总（完整列表）

| # | 问题 | 根本原因 | 状态 |
|---|------|---------|--------|
| **0** | **研究进行中有2个重复的研究过程UI** | **缺少状态机，两个条件分支独立渲染** | **🔴 待修复** |
| 1 | 研究过程中界面空白，状态感知不明显 | 加载状态指示器 | ✅ 已完成 |
| 2 | 切换界面回来时白屏 10+ 秒 | `handleVisibilityChange` 已实现 (Stream.tsx:116-139) | ✅ 已完成 |
| 3 | 界面展示排版不对齐，timeline 感不强 | `border-l-2 border-primary/30` 已添加 | ✅ 已完成 |
| 4 | chat 调用工具时用英文返回消息 | 界面已中文化 | ✅ 已完成 |
| 5 | 调研完成后只看到报告，过程看不到了 | `showProcessMessages` 开关已实现 | ✅ 已完成 |
| 6 | 状态丢失 (threads 列表) | ThreadProvider 已有默认值 (Thread.tsx:42-47) | ✅ 已完成 |
| 7 | Agent Chat UI 和 LangSmith 消息互通 | ThreadProvider 默认值已添加 | ✅ 已完成 |

---

## ⚠️ 唯一待修复问题：研究过程 UI 重复

**当前状态**：上述 1-7 问题均已修复，只剩下**问题 0：研究进行中有 2 个重复的研究过程 UI**

---

## 八、实施顺序

### ✅ 已完成的功能 (无需再做)

| 功能 | 实现位置 |
|------|---------|
| 页面可见性管理 | `Stream.tsx:116-139` handleVisibilityChange |
| Timeline 样式 | `tool-calls.tsx` border-l-2 + 圆点指示器 |
| 中文界面 | 全局已中文化 |
| 研究过程开关 | `index.tsx:237` showProcessMessages |
| 研究过程折叠 | `SupervisorMessagesContainer` isExpanded |
| ThreadProvider 默认值 | `Thread.tsx:42-47` defaultValue |

### 🔴 唯一待完成任务：修复研究过程 UI 重复

**修改文件**: `src/components/thread/index.tsx`

**步骤**:
1. [ ] 重新设计 `SupervisorMessagesContainer` 组件，添加 `phase` 属性
2. [ ] 实现 3 种状态的不同 UI 渲染：`starting` / `researching` / `completed`
3. [ ] 简化渲染逻辑：移除两个独立条件 (Line 543-558, 583-598)，改为统一的状态机计算
4. [ ] 调整渲染位置：进行中放末尾，完成后放报告之前

---

## 九、预期效果

修改完成后：

### 🔴 核心问题 0 解决效果
- ✅ **研究启动时**：显示简洁的"研究过程 - 启动中..."卡片
- ✅ **研究进行中**：显示固定头部"研究过程 - 进行中" + 动态 Timeline 瀑布流（始终展开，不可折叠）
- ✅ **研究完成后**：显示可折叠的"研究过程"卡片，默认收起，显示"共 N 条研究记录"
- ✅ **全程只有一个研究过程 UI 实例**，不再重复

### 其他问题修复（已完成）
1. ✅ 研究过程中始终显示进度状态，不会空白
2. ✅ 切换标签页回来后快速恢复，无长时间白屏
3. ✅ 工具调用以 Timeline 形式清晰展示，类似 Claude
4. ✅ 所有界面文本为中文
5. ✅ 研究完成后可查看完整过程，也可收起只看报告
6. ✅ 刷新页面不丢失 threads 列表
7. ✅ **Agent Chat UI 和 LangSmith Studio 的 threads 互通，历史消息可见**

---

## 历史参考：v1 版本方案

以下是 v1 版本中计划但已完成的方案，保留作为参考：

### 问题 1 & 2：增强加载状态 + 页面可见性管理 ✅

**实现位置**: `src/providers/Stream.tsx` Line 116-139

```typescript
// 页面可见性管理：切换回来时重新获取线程状态，解决白屏问题
const lastVisibleTime = useRef<number>(Date.now());
const STALE_THRESHOLD = 30000; // 30秒后认为数据可能过期

const handleVisibilityChange = useCallback(() => {
  if (document.visibilityState === "visible" && threadId) {
    const timeSinceLastVisible = Date.now() - lastVisibleTime.current;
    if (timeSinceLastVisible > STALE_THRESHOLD) {
      console.log("[StreamProvider] 页面重新可见，刷新线程状态...");
      getThreads().then(setThreads).catch(console.error);
    }
  } else if (document.visibilityState === "hidden") {
    lastVisibleTime.current = Date.now();
  }
}, [threadId, getThreads, setThreads]);
```

### 问题 3：Timeline 视觉增强 ✅

**实现位置**: `src/components/thread/messages/tool-calls.tsx`

```typescript
{/* Timeline 容器 - Claude 风格左边框线 */}
<div className="relative pl-6 ml-3 border-l-2 border-primary/30">
  {/* Timeline 圆点指示器 */}
  <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary" />
  ...
</div>
```

### 问题 6 & 7：ThreadProvider 默认值 ✅

**实现位置**: `src/providers/Thread.tsx` Line 42-47

```typescript
// 环境变量配置
const envApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
const envAssistantId = process.env.NEXT_PUBLIC_ASSISTANT_ID || "";

// 添加默认值，确保与 StreamProvider 一致
const [apiUrl] = useQueryState("apiUrl", {
  defaultValue: envApiUrl,
});
const [assistantId] = useQueryState("assistantId", {
  defaultValue: envAssistantId,
});
```
