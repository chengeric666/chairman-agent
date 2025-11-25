# Grok 模型独占配置更新

**日期**: 2025-11-24
**项目**: Chairman Agent - OpenCanvas 模型简化
**状态**: ✅ 完成

---

## 📋 概述

按照用户要求，移除了所有其他LLM模型，只保留 **Grok 4.1 Fast (Free)** 作为唯一可用模型。

---

## 🎯 用户需求

用户发现OpenCanvas的模型选择器中只显示OpenAI的模型（GPT 4.1 mini, o4 mini, GPT 4o mini, o3 mini, o1 mini, GPT-4o mini (Azure)），没有看到之前添加的Grok模型。

**用户要求**：
> "请你把其他所有模型都去掉，只保留grok,请ultrathink"

---

## 🔧 执行的更改

### 1. 修改 `packages/shared/src/models.ts`

#### 变更 1：注释掉所有其他provider的模型

**位置**: packages/shared/src/models.ts:695-705

```typescript
// 只保留 Grok 模型，移除所有其他模型
export const ALL_MODELS: ModelConfigurationParams[] = [
  // ...OPENAI_MODELS,        // ❌ 已注释
  // ...ANTHROPIC_MODELS,     // ❌ 已注释
  // ...FIREWORKS_MODELS,     // ❌ 已注释
  // ...GEMINI_MODELS,        // ❌ 已注释
  // ...AZURE_MODELS,         // ❌ 已注释
  // ...OLLAMA_MODELS,        // ❌ 已注释
  // ...GROQ_MODELS,          // ❌ 已注释
  ...OPENROUTER_MODELS,      // ✅ 只保留这个
];
```

#### 变更 2：清理OPENROUTER_MODELS数组

**位置**: packages/shared/src/models.ts:468-505

```typescript
/**
 * OpenRouter models - 只保留 Grok 模型
 * OpenRouter使用OpenAI兼容的API格式
 */
const OPENROUTER_MODELS: ModelConfigurationParams[] = [
  {
    name: "openrouter/x-ai/grok-4.1-fast:free",
    label: "Grok 4.1 Fast (Free)",
    config: {
      provider: "openrouter",
      temperatureRange: {
        min: 0,
        max: 1,
        default: 0.5,
        current: 0.5,
      },
      maxTokens: {
        min: 1,
        max: 131_072,  // 131K context window
        default: 4_096,
        current: 4_096,
      },
    },
    isNew: true,  // 标记为新模型，将作为默认选择
  },
  // ❌ 已移除：DeepSeek Chat (OpenRouter)
  // ❌ 已移除：Claude 3.5 Sonnet (OpenRouter)
  // ❌ 已移除：GPT-4o Mini (OpenRouter)
];
```

### 2. Git提交

**Commit Hash**: `cafd3f4`

**Commit Message**:
```
feat(opencanvas): Remove all models except Grok 4.1 Fast

- Commented out all other model providers (OpenAI, Anthropic, Fireworks, Gemini, Azure, Ollama, Groq)
- Removed other OpenRouter models (DeepSeek Chat, Claude 3.5 Sonnet, GPT-4o Mini)
- Only Grok 4.1 Fast (Free) model is available now
- Simplified model selection to single model as requested

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**统计**:
- 删除行数: 69 行
- 新增行数: 26 行
- 净减少: 43 行

---

## 🚀 服务重启

### 步骤

1. **停止现有服务**
   - 停止 agents 服务 (shell 71599f)
   - 停止 web 服务 (shell 1437ab)

2. **清理缓存**
   ```bash
   rm -rf thirdparty/open-canvas/apps/web/.next
   ```

3. **重启服务**
   - 启动 agents 服务: `yarn dev` (端口 54367)
   - 启动 web 服务: `PORT=8080 yarn dev`

### 启动结果

✅ **Agents API** (shell 8d83ce)
```
- 🚀 API: http://localhost:54367
- 注册了5个图: agent, reflection, thread_title, summarizer, web_search
- 启动了10个workers
- 状态: ✅ Running
```

✅ **Web UI** (shell ee812a)
```
- ▲ Next.js 14.2.25
- Local: http://localhost:8080
- 启动时间: 763ms
- 状态: ✅ Ready
```

---

## 📊 最终配置

| 配置项 | 值 |
|-------|---|
| **可用模型总数** | 1 个 |
| **模型名称** | Grok 4.1 Fast (Free) |
| **Model ID** | openrouter/x-ai/grok-4.1-fast:free |
| **Provider** | OpenRouter |
| **Max Context** | 131,072 tokens (131K) |
| **Temperature Range** | 0.0 - 1.0 (默认 0.5) |
| **Max Tokens** | 1 - 131,072 (默认 4,096) |
| **是否免费** | ✅ Yes (Free tier) |
| **是否为默认模型** | ✅ Yes (`isNew: true`) |

---

## 💡 技术洞察

`★ Insight ─────────────────────────────────────`
**问题根源分析**：
1. **多Provider干扰**: ALL_MODELS数组包含8个provider的所有模型，导致OpenAI模型优先显示
2. **数组顺序问题**: OPENAI_MODELS在数组开头，而OPENROUTER_MODELS在末尾，导致UI优先显示OpenAI模型
3. **浏览器缓存**: 即使后端更新了模型配置，前端可能缓存了旧的模型列表

**解决方案设计**：
1. **激进简化**: 直接注释掉所有其他provider，而不是调整顺序
2. **单一模型策略**: OPENROUTER_MODELS中也只保留Grok模型
3. **强制重新编译**: 清理.next缓存，确保前端重新加载最新配置
4. **服务完全重启**: 杀掉旧进程，启动新进程，确保内存中没有旧配置
`─────────────────────────────────────────────────`

---

## ✅ 验证清单

- [x] models.ts文件已修改（注释掉7个provider，清理OPENROUTER_MODELS）
- [x] Git commit成功（cafd3f4）
- [x] .next缓存已清理
- [x] Agents服务成功重启（5个图注册，10个workers运行）
- [x] Web服务成功重启（Next.js 14.2.25，HTTP 200响应）
- [ ] **待用户验证**: 浏览器刷新后，模型选择器只显示"Grok 4.1 Fast (Free)"

---

## 📝 用户操作指南

### 验证步骤

1. **打开浏览器**，访问 http://localhost:8080

2. **硬刷新页面**（清除浏览器缓存）
   - macOS: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + Shift + R`

3. **点击模型选择器**（左上角"董智"旁边的模型名称）

4. **预期结果**：
   - ✅ 应该只看到一个模型：**"Grok 4.1 Fast (Free)"**
   - ✅ 带有 **"New!"** 标签
   - ❌ 不应看到任何OpenAI、Anthropic或其他模型

5. **如果仍然看到旧模型**：
   - 尝试清除浏览器缓存和Cookie
   - 尝试使用隐私模式/无痕模式访问
   - 确认浏览器访问的是正确的端口 (8080)

---

## 🔄 如需恢复其他模型

如果将来需要恢复其他模型，可以执行以下操作：

### 方法1：Git Revert
```bash
cd thirdparty/open-canvas
git revert cafd3f4
```

### 方法2：手动恢复
编辑 `packages/shared/src/models.ts`，取消注释相应的模型数组：

```typescript
export const ALL_MODELS: ModelConfigurationParams[] = [
  ...OPENAI_MODELS,        // 恢复OpenAI模型
  ...ANTHROPIC_MODELS,     // 恢复Anthropic模型
  // ... 其他
  ...OPENROUTER_MODELS,
];
```

然后重启服务即可。

---

## 📂 相关文件

- **修改文件**: `thirdparty/open-canvas/packages/shared/src/models.ts`
- **Commit Hash**: `cafd3f4`
- **本文档**: `GROK_MODEL_ONLY_UPDATE.md`
- **之前的优化文档**: `OPENCANVAS_OPTIMIZATION_SUMMARY.md`

---

## 🎉 总结

✅ **成功移除所有模型，只保留Grok 4.1 Fast (Free)**
✅ **服务已重启并正常运行**
✅ **Git已提交，可随时恢复**

**等待用户验证**: 请刷新浏览器（硬刷新），确认模型选择器中只显示Grok模型。

---

**更新时间**: 2025-11-24 16:56 (UTC+8)
**服务状态**: ✅ 全部正常运行
**验证状态**: ⏳ 等待用户确认
