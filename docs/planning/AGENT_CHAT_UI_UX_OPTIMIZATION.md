# Agent Chat UI 深度研究界面优化方案

**任务**: 优化 Agent Chat UI 的用户体验，解决 7 大核心问题

**工作目录**: `/Users/batfic887/Documents/project/chairman-agent/thirdparty/agent-chat-ui`

**创建日期**: 2025-11-28

---

## 问题诊断汇总

| # | 问题 | 根本原因 | 优先级 |
|---|------|---------|--------|
| 1 | 研究过程中界面空白，状态感知不明显 | 加载状态指示器过早消失 | 🔴 高 |
| 2 | 切换界面回来时白屏 10+ 秒 | 无页面可见性管理和重连机制 | 🔴 高 |
| 3 | 界面展示排版不对齐，timeline 感不强 | 工具调用间距太小，缺少左边框线 | 🟡 中 |
| 4 | chat 调用工具时用英文返回消息 | 硬编码英文文本 | 🟡 中 |
| 5 | 调研完成后只看到报告，过程看不到了 | 消息过滤逻辑覆盖中间消息 | 🟡 中 |
| 6 | 状态丢失 (threads 列表) | ThreadProvider 无持久化 | 🟢 低 |
| 7 | **Agent Chat UI 和 LangSmith 消息不互通** | ThreadProvider 缺少默认值 + useEffect 依赖错误 | 🔴 高 |

---

## 一、问题 1 & 2：增强加载状态 + 页面可见性管理

### 1.1 修改 `src/providers/Stream.tsx`

**目标**: 添加页面可见性监听，切换回来时自动重连

```typescript
// 在 StreamProvider 组件内添加
import { useEffect, useRef } from "react";

// 添加 visibility change 监听
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && threadId) {
      // 页面变为可见时，重新获取线程状态
      refetchThreadState();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [threadId]);

// 添加 refetchThreadState 函数
const refetchThreadState = async () => {
  if (!threadId || !assistantId) return;
  setIsStreaming(true);
  try {
    const state = await client.threads.getState(threadId);
    if (state?.values?.messages) {
      setMessages(state.values.messages);
    }
  } catch (error) {
    console.error('Failed to refetch thread state:', error);
  } finally {
    setIsStreaming(false);
  }
};
```

### 1.2 修改 `src/components/thread/index.tsx`

**目标**: 增强加载状态指示器，显示研究阶段

**位置**: 约 Line 430-450

```typescript
// 替换简单的 loading 指示器
{isStreaming && (
  <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border border-border/50 animate-pulse">
    <div className="relative">
      <div className="w-3 h-3 bg-primary rounded-full animate-ping absolute" />
      <div className="w-3 h-3 bg-primary rounded-full" />
    </div>
    <span className="text-sm text-muted-foreground">
      正在深度研究中...
    </span>
  </div>
)}
```

---

## 二、问题 3：Timeline 视觉增强

### 2.1 修改 `src/components/thread/messages/tool-calls.tsx`

**目标**: 添加左边框线 + 圆点指示器，形成 Claude 风格 timeline

```typescript
// 工具调用容器样式更改
<div className="relative pl-6 ml-3 border-l-2 border-primary/30">
  {/* Timeline 圆点 */}
  <div className="absolute -left-[9px] top-3 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
  </div>

  {/* 工具调用内容 */}
  <div className="space-y-4"> {/* 增加间距从 gap-2 到 space-y-4 */}
    {/* 原有内容 */}
  </div>
</div>
```

### 2.2 修改 `src/app/globals.css`

**添加 Timeline 专用样式**:

```css
/* Timeline 样式 - Claude 风格 */
.timeline-container {
  @apply relative pl-6 ml-3;
}

.timeline-container::before {
  content: '';
  @apply absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent;
}

.timeline-dot {
  @apply absolute -left-[9px] w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center;
}

.timeline-dot::after {
  content: '';
  @apply w-1.5 h-1.5 rounded-full bg-primary;
}

.timeline-dot.completed {
  @apply bg-primary border-primary;
}

.timeline-dot.completed::after {
  @apply bg-white;
}

/* 工具调用卡片增强 */
.tool-call-card {
  @apply bg-card border border-border/50 rounded-lg p-4 shadow-sm;
  @apply hover:border-primary/30 hover:shadow-md transition-all duration-200;
}
```

---

## 三、问题 4：中文本地化

### 3.1 创建新文件 `src/lib/i18n/zh-CN.ts`

```typescript
export const zhCN = {
  // 工具调用相关
  toolCall: {
    result: "工具结果",
    running: "正在执行...",
    completed: "执行完成",
    failed: "执行失败",
    expand: "展开详情",
    collapse: "收起",
  },

  // 消息操作
  message: {
    copy: "复制内容",
    copied: "已复制",
    edit: "编辑",
    cancelEdit: "取消编辑",
    submit: "提交",
    regenerate: "重新生成",
  },

  // 状态提示
  status: {
    researching: "正在深度研究中...",
    analyzing: "正在分析...",
    generating: "正在生成报告...",
    completed: "研究完成",
    error: "发生错误",
    reconnecting: "正在重新连接...",
  },

  // 欢迎页
  welcome: {
    title: "TuringFlow 深度研究",
    subtitle: "输入研究主题，开始智能调研",
    placeholder: "请输入您想研究的主题...",
  },

  // 通用
  common: {
    loading: "加载中...",
    retry: "重试",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    delete: "删除",
  },
};

export type I18nKey = keyof typeof zhCN;
```

### 3.2 修改 `src/components/thread/messages/tool-calls.tsx`

**替换所有英文文本**:

```typescript
import { zhCN } from "@/lib/i18n/zh-CN";

// 替换 "Tool Result:" -> zhCN.toolCall.result
// 替换 "Running..." -> zhCN.toolCall.running
```

### 3.3 修改 `src/components/thread/messages/shared.tsx`

**替换按钮文本**:

```typescript
import { zhCN } from "@/lib/i18n/zh-CN";

// "Copy content" -> zhCN.message.copy
// "Cancel edit" -> zhCN.message.cancelEdit
// "Submit" -> zhCN.message.submit
```

---

## 四、问题 5：保留完整研究过程

### 4.1 修改 `src/components/thread/index.tsx`

**目标**: 移除或修改 DO_NOT_RENDER_ID_PREFIX 过滤逻辑

**位置**: Line 406-408

```typescript
// 原代码
const filteredMessages = messages.filter(
  (msg) => !msg.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)
);

// 修改为：保留所有消息，但用视觉样式区分
const processMessages = messages.map((msg) => ({
  ...msg,
  isSystemMessage: msg.id?.startsWith(DO_NOT_RENDER_ID_PREFIX) ?? false,
}));
```

### 4.2 添加"展开/收起研究过程"功能

```typescript
// 在组件内添加状态
const [showProcessMessages, setShowProcessMessages] = useState(true);

// 添加切换按钮
<Button
  variant="ghost"
  size="sm"
  onClick={() => setShowProcessMessages(!showProcessMessages)}
  className="text-xs text-muted-foreground"
>
  {showProcessMessages ? "收起研究过程" : "展开研究过程"}
</Button>

// 渲染时根据状态过滤
const displayMessages = showProcessMessages
  ? processMessages
  : processMessages.filter(m => !m.isSystemMessage);
```

---

## 五、问题 6：状态持久化

### 5.1 修改 `src/providers/Thread.tsx`

**添加 sessionStorage 缓存**:

```typescript
const THREADS_STORAGE_KEY = 'agent-chat-threads';

// 初始化时从 sessionStorage 读取
const [threads, setThreads] = useState<Thread[]>(() => {
  if (typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(THREADS_STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  }
  return [];
});

// 监听 threads 变化，同步到 sessionStorage
useEffect(() => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
  }
}, [threads]);
```

---

## 六、问题 7：Agent Chat UI 和 LangSmith 消息互通

### 问题根因分析

```
Agent Chat UI                         LangSmith Studio
     │                                      │
     │  ThreadProvider                      │  直接读取后端
     │  ├─ apiUrl = null (无默认值)         │
     │  └─ assistantId = null              │
     │         ↓                            │
     │  getThreads() → []                  │  threads.search() → [有数据]
     │         ↓                            │
     │  历史列表为空                         │  历史列表有内容
     └─────────────────────────────────────┘
              两边数据不同步！
```

### 6.1 修改 `src/providers/Thread.tsx` - 添加默认值

**位置**: 第 37-38 行

```typescript
// 原代码 (问题代码)
const [apiUrl] = useQueryState("apiUrl");
const [assistantId] = useQueryState("assistantId");

// 修改为：添加环境变量默认值
const [apiUrl] = useQueryState("apiUrl", {
  defaultValue: process.env.NEXT_PUBLIC_API_URL || "",
});
const [assistantId] = useQueryState("assistantId", {
  defaultValue: process.env.NEXT_PUBLIC_ASSISTANT_ID || "",
});
```

### 6.2 修改 `src/components/thread/history/index.tsx` - 添加依赖

**位置**: 第 88-95 行

```typescript
// 原代码 (问题代码)
useEffect(() => {
  if (typeof window === "undefined") return;
  setThreadsLoading(true);
  getThreads()
    .then(setThreads)
    .catch(console.error)
    .finally(() => setThreadsLoading(false));
}, []);  // ❌ 空依赖数组

// 修改为：添加正确的依赖
useEffect(() => {
  if (typeof window === "undefined") return;
  if (!apiUrl || !assistantId) return;  // 等待参数准备好

  setThreadsLoading(true);
  getThreads()
    .then(setThreads)
    .catch(console.error)
    .finally(() => setThreadsLoading(false));
}, [apiUrl, assistantId, getThreads]);  // ✅ 添加依赖
```

### 6.3 添加手动刷新按钮

**位置**: `src/components/thread/history/index.tsx`

```typescript
// 在历史列表头部添加刷新按钮
<div className="flex items-center justify-between px-4 py-2">
  <span className="text-sm font-medium">研究历史</span>
  <Button
    variant="ghost"
    size="icon"
    onClick={() => {
      setThreadsLoading(true);
      getThreads()
        .then(setThreads)
        .catch(console.error)
        .finally(() => setThreadsLoading(false));
    }}
    disabled={threadsLoading}
    className="h-6 w-6"
  >
    <RefreshCw className={cn("h-3.5 w-3.5", threadsLoading && "animate-spin")} />
  </Button>
</div>
```

### 6.4 数据流修复图

```
修复后的数据流：

Application 启动
       ↓
StreamProvider + ThreadProvider
(两者都有正确的默认值)
       ↓
apiUrl = "http://localhost:2024"
assistantId = "Deep Researcher"
       ↓
ThreadHistory useEffect 触发
(依赖 [apiUrl, assistantId, getThreads])
       ↓
client.threads.search({
  metadata: { graph_id: "Deep Researcher" }
})
       ↓
返回所有匹配的历史 threads
       ↓
两边数据同步！
```

---

## 七、文件修改清单

| 操作 | 文件 | 修改内容 |
|------|------|----------|
| 修改 | `src/providers/Stream.tsx` | 添加页面可见性监听和重连逻辑 |
| 修改 | `src/providers/Thread.tsx` | **添加默认值** + sessionStorage 持久化 |
| 修改 | `src/components/thread/index.tsx` | 增强加载指示器 + 保留研究过程 |
| 修改 | `src/components/thread/history/index.tsx` | **修复 useEffect 依赖** + 添加刷新按钮 |
| 修改 | `src/components/thread/messages/tool-calls.tsx` | Timeline 样式 + 中文化 |
| 修改 | `src/components/thread/messages/shared.tsx` | 按钮文本中文化 |
| 新建 | `src/lib/i18n/zh-CN.ts` | 中文翻译文件 |
| 修改 | `src/app/globals.css` | Timeline CSS 样式 |

---

## 八、实施顺序

1. **第一阶段** (🔴 高优先级 - 数据互通 + 体验阻断)
   - [ ] **修复历史消息互通** (Thread.tsx 添加默认值 + history/index.tsx 修复依赖)
   - [ ] 修复页面切换白屏 (Stream.tsx 可见性监听)
   - [ ] 增强加载状态指示器 (thread/index.tsx)

2. **第二阶段** (🟡 中优先级 - 视觉体验)
   - [ ] Timeline 视觉增强 (tool-calls.tsx + globals.css)
   - [ ] 中文本地化 (创建 i18n 文件 + 替换文本)

3. **第三阶段** (🟡 中优先级 - 功能完善)
   - [ ] 保留研究过程 (修改消息过滤逻辑)
   - [ ] 添加展开/收起控制
   - [ ] 添加历史列表刷新按钮

4. **第四阶段** (🟢 低优先级 - 增强)
   - [ ] 状态持久化 (Thread.tsx sessionStorage)

---

## 九、预期效果

修改完成后：

1. ✅ 研究过程中始终显示进度状态，不会空白
2. ✅ 切换标签页回来后快速恢复，无长时间白屏
3. ✅ 工具调用以 Timeline 形式清晰展示，类似 Claude
4. ✅ 所有界面文本为中文
5. ✅ 研究完成后可查看完整过程，也可收起只看报告
6. ✅ 刷新页面不丢失 threads 列表
7. ✅ **Agent Chat UI 和 LangSmith Studio 的 threads 互通，历史消息可见**
