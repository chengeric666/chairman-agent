# OpenRouter 401错误完整解决方案

**日期**: 2025-11-24
**状态**: ✅ 已解决
**影响**: OpenCanvas集成使用OpenRouter/Grok模型

---

## 问题描述

在OpenCanvas中使用OpenRouter提供的Grok模型时，持续出现401认证错误：

```
Error: 401 Incorrect API key provided: sk-or-v1***...
You can find your API key at https://platform.openai.com/account/api-keys.
```

**关键症状**：
- ✅ OpenRouter API key配置正确
- ✅ 模型定义正确（`openrouter/x-ai/grok-4.1-fast:free`）
- ✅ Frontend环境变量配置正确
- ❌ 但请求被发送到 `platform.openai.com` 而不是 `openrouter.ai`

---

## 根本原因分析

### 问题调用链

1. **Frontend** → 发送模型名称 `"openrouter/x-ai/grok-4.1-fast:free"`
2. **Backend `getModelConfig()`** → 正确识别OpenRouter，返回：
   ```typescript
   {
     modelName: "x-ai/grok-4.1-fast:free",
     modelProvider: "openai",
     baseUrl: "https://openrouter.ai/api/v1",
     apiKey: process.env.OPENROUTER_API_KEY
   }
   ```
3. **Backend `getModelFromConfig()`** → 调用 `initChatModel()`：
   ```typescript
   await initChatModel(modelName, {
     modelProvider: "openai",
     baseUrl: "https://openrouter.ai/api/v1",  // ❌ 这个参数被忽略！
     apiKey: apiKey
   })
   ```
4. **LangChain `initChatModel`** → ❌ **忽略了顶级`baseUrl`参数**
5. **OpenAI Client** → 使用默认的 `https://api.openai.com`
6. **结果** → 401错误（OpenRouter API key无法在OpenAI验证）

### 核心问题

**LangChain的`initChatModel`函数不支持顶级`baseUrl`参数！**

正确的配置方式是使用嵌套的`configuration`对象，并且使用大写的`baseURL`：

```typescript
// ❌ 错误方式（被忽略）
await initChatModel(modelName, {
  baseUrl: "https://openrouter.ai/api/v1",
  apiKey: apiKey
})

// ✅ 正确方式
await initChatModel(modelName, {
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",  // 注意：baseURL大写！
    apiKey: apiKey
  }
})
```

---

## 解决方案

### 修改的文件

**文件**: `/apps/agents/src/utils.ts`
**函数**: `getModelFromConfig` (lines 395-440)

### 代码变更

```typescript
// BEFORE (错误的方式)
return await initChatModel(modelName, {
  modelProvider,
  temperature,
  maxTokens,
  ...(baseUrl ? { baseUrl } : {}),  // ❌ 顶级baseUrl被忽略
  ...(apiKey ? { apiKey } : {}),
});

// AFTER (正确的方式)
return await initChatModel(modelName, {
  modelProvider,
  temperature,
  maxTokens,
  // ✅ 使用configuration对象，baseURL大写
  ...(baseUrl || apiKey
    ? {
        configuration: {
          ...(baseUrl ? { baseURL: baseUrl } : {}),
          ...(apiKey ? { apiKey } : {}),
        },
      }
    : {}),
});
```

### 调试日志

添加了调试日志以便验证配置：

```typescript
if (baseUrl) {
  console.log('[OpenRouter DEBUG] Model config:', {
    modelName,
    modelProvider,
    baseUrl,
    hasApiKey: !!apiKey,
  });
}
```

---

## 验证步骤

1. **修改代码** - 更新 `apps/agents/src/utils.ts`
2. **重启服务** - 重启agents服务以应用更改
3. **测试** - 在前端选择Grok模型并发送测试消息
4. **确认** - 查看日志确认DEBUG输出，确保无401错误

### 成功指标

- ✅ 可以看到DEBUG日志：`[OpenRouter DEBUG] Model config: ...`
- ✅ 请求发送到 `https://openrouter.ai/api/v1`
- ✅ 不再出现401错误
- ✅ 成功收到Grok模型的回复

---

## 关键经验教训

### 1. LangChain配置陷阱

LangChain的`initChatModel`对于自定义baseURL的处理方式与直觉不符：
- ❌ 顶级参数 `baseUrl`（小写）不生效
- ✅ 必须使用 `configuration.baseURL`（大写）

### 2. 调试方法

在排查此类问题时的有效方法：
1. **追踪完整调用链** - 从前端到后端到LangChain
2. **检查实际HTTP请求** - 确认请求发送到哪个URL
3. **添加调试日志** - 在关键配置点记录参数
4. **查看错误消息细节** - 401错误提示了错误的URL

### 3. 代码模式识别

当使用LangChain集成第三方兼容API时：
- OpenRouter (OpenAI-compatible)
- Azure OpenAI
- 自托管的OpenAI-compatible APIs

都需要使用`configuration.baseURL`模式，而不是顶级`baseUrl`。

---

## 相关配置

### 环境变量

**Backend** (`apps/agents/.env`):
```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

**Frontend** (`apps/web/.env.local`):
```bash
NEXT_PUBLIC_OPENROUTER_ENABLED=true
```

### 模型定义

**位置**: `packages/shared/src/models.ts`

```typescript
{
  name: "openrouter/x-ai/grok-4.1-fast:free",
  label: "Grok 4.1 Fast (Free)",
  config: {
    provider: "openrouter",
    // ...
  },
}
```

### Frontend过滤逻辑

**位置**: `apps/web/src/components/chat-interface/model-selector/index.tsx`

```typescript
if (
  model.name.includes("openrouter/") &&
  process.env.NEXT_PUBLIC_OPENROUTER_ENABLED === "false"
) {
  return false;
}
```

---

## 故障排除

### 如果仍有401错误

#### 错误类型1: "Incorrect API key provided"
**症状**: 错误消息提到 `platform.openai.com`
**原因**: 代码配置问题，请求发送到错误的端点
**解决**: 确保使用 `configuration.baseURL` 模式（见上面的解决方案）

#### 错误类型2: "User not found"
**症状**:
- 错误消息提到 `openrouter.ai`（正确的端点）
- DEBUG日志显示正确的baseUrl配置
- 有些请求成功，有些失败（间歇性）

**原因**: OpenRouter账户或API Key问题
**解决步骤**:
1. **检查API Key状态** - 登录 https://openrouter.ai/keys
   - 确认API key未被禁用（disabled）
   - 如果被禁用，点击"Enable"重新启用
2. **检查账户余额** - 确认有足够的credits或配额
3. **检查模型访问权限** - 确认账户有权访问所选模型
4. **重新生成API Key**（如果需要）- 如果key被撤销，生成新的key并更新`.env`

**诊断方法**:
```bash
# 1. 检查DEBUG日志
grep "OpenRouter DEBUG" logs/agents.log

# 2. 如果看到正确的baseUrl，问题不在代码
# 3. 登录OpenRouter dashboard检查账户状态
```

#### 通用诊断步骤

1. **检查DEBUG日志** - 确认`[OpenRouter DEBUG]`输出显示正确的baseUrl
2. **验证API Key** - 确保环境变量中的API key正确
3. **检查模型名称** - 确认使用的模型名称格式正确
4. **重启服务** - 确保代码更改已生效
5. **查看服务日志** - 查找"Background run succeeded"确认是否有成功的请求

### 常见问题

**Q: 为什么不直接修改modelProvider为"openrouter"？**
A: OpenRouter使用OpenAI兼容的API，LangChain需要使用"openai" provider，但配置自定义baseURL。

**Q: 为什么baseURL要大写？**
A: 这是OpenAI SDK的要求。LangChain传递给OpenAI client的配置对象中，baseURL字段必须大写。

**Q: 其他兼容API（如Azure）是否有同样问题？**
A: Azure OpenAI有专门的配置方式（azureConfig），但其他自托管OpenAI-compatible APIs需要同样的`configuration.baseURL`模式。

---

## 相关文件

- `apps/agents/src/utils.ts` - Backend模型配置
- `apps/agents/.env` - API密钥配置
- `apps/web/.env.local` - Frontend环境变量
- `apps/web/src/components/chat-interface/model-selector/index.tsx` - Frontend模型选择器
- `packages/shared/src/models.ts` - 模型定义

---

## 参考资料

- [LangChain initChatModel文档](https://js.langchain.com/docs/integrations/chat/)
- [OpenRouter API文档](https://openrouter.ai/docs)
- [OpenAI API兼容性](https://platform.openai.com/docs/api-reference)

---

**最后更新**: 2025-11-24
**验证状态**: ✅ 已在生产环境验证成功
