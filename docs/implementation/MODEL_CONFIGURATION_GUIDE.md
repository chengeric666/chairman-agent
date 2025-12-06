# 模型配置指南

**文档版本**: 1.0
**最后更新**: 2025-12-04
**适用范围**: Chairman Agent 全部服务

---

## 一、配置架构总览

### 1.1 配置层次关系

```
┌─────────────────────────────────────────────────────────────────────┐
│                        配置优先级（从高到低）                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐                                                │
│  │   数据库配置      │  ← 运行时最高优先级（Open Notebook）             │
│  │   (SurrealDB)    │    通过 API 或 Web UI 修改                      │
│  └────────┬────────┘                                                │
│           │                                                          │
│  ┌────────▼────────┐                                                │
│  │  Docker 环境变量  │  ← 容器启动时读取（docker-compose.yml）          │
│  │                  │    需要 --force-recreate 才能更新               │
│  └────────┬────────┘                                                │
│           │                                                          │
│  ┌────────▼────────┐                                                │
│  │   .env 文件      │  ← 被 docker-compose 和 Python 代码引用         │
│  │                  │    修改后需重启服务                             │
│  └────────┬────────┘                                                │
│           │                                                          │
│  ┌────────▼────────┐                                                │
│  │  代码默认值       │  ← 硬编码在 .py/.ts 文件中                      │
│  │  (config.py等)   │    修改后需重启/重新构建                         │
│  └─────────────────┘                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 各配置文件说明

| 文件 | 作用域 | 影响的服务 | 何时生效 |
|------|--------|-----------|---------|
| **根目录 `.env`** | 全局环境变量 | Chairman API、被 docker-compose 引用 | 容器重建后 |
| **`docker-compose.yml`** | Docker 容器环境 | Open Notebook 容器内的环境变量 | `--force-recreate` 后 |
| **`src/config.py`** | Chairman Agent | 主 API 网关服务 | 服务重启后 |
| **`thirdparty/open_deep_research/.../configuration.py`** | Deep Research | LangGraph 研究 Agent | 服务重启后 |
| **`thirdparty/open-canvas/.../models.ts`** | OpenCanvas | 协同创作前端 | 重新构建后 |
| **SurrealDB 数据库** | Open Notebook 运行时 | 知识库的 Insight、Chat 等功能 | **立即生效** |

---

## 二、Open Notebook 的双重配置机制

### 2.1 配置流程

```
启动时读取                          运行时使用
┌──────────────┐                  ┌──────────────┐
│ 环境变量      │ ──初始化──────▶ │ 数据库存储    │
│ LLM_MODEL    │                  │ model:xxx    │
│ DEFAULT_*    │                  │ defaults     │
└──────────────┘                  └──────────────┘
       │                                 │
       │                                 ▼
       │                          ┌──────────────┐
       └───── 仅首次启动 ────────▶ │ 实际 API 调用 │
              或数据库为空时        └──────────────┘
```

### 2.2 关键说明

- **环境变量** (`LLM_MODEL`, `DEFAULT_CHAT_MODEL` 等) 仅在**首次启动**或数据库为空时用于初始化
- 一旦数据库中有配置记录，**环境变量不会覆盖**已存在的数据库值
- 要修改运行中的配置，必须通过 **API 或脚本** 更新数据库

---

## 三、修改配置的方法

### 3.1 快速修改（推荐）

使用提供的脚本一键修改所有配置：

```bash
# 查看当前配置
./scripts/update_model.sh status

# 修改模型（会更新所有配置文件和数据库）
./scripts/update_model.sh x-ai/grok-4.1-fast

# 修改后重启服务
./scripts/update_model.sh x-ai/grok-4.1-fast --restart
```

### 3.2 手动修改各配置位置

#### 3.2.1 修改 Open Notebook 数据库配置

```bash
# 1. 查看当前模型
curl -s http://localhost:5055/api/models

# 2. 创建新模型记录
curl -s -X POST "http://localhost:5055/api/models" \
  -H "Content-Type: application/json" \
  -d '{"name": "x-ai/grok-4.1-fast", "provider": "openrouter", "type": "language"}'

# 3. 更新默认配置（使用返回的 model ID）
curl -s -X PUT "http://localhost:5055/api/models/defaults" \
  -H "Content-Type: application/json" \
  -d '{
    "default_chat_model": "model:新ID",
    "default_transformation_model": "model:新ID",
    "large_context_model": "x-ai/grok-4.1-fast",
    "default_tools_model": "model:新ID"
  }'
```

#### 3.2.2 修改配置文件

| 场景 | 修改位置 | 命令/操作 |
|------|---------|----------|
| **Open Notebook 模型** | API 或脚本 | `./scripts/update_model.sh <model>` |
| **Deep Research 模型** | `configuration.py` | 修改后重启服务 |
| **OpenCanvas 模型** | `models.ts` | 修改后重新构建 |
| **新部署/初始化** | `.env` + `docker-compose.yml` | 首次启动时自动读取 |

---

## 四、配置文件位置速查

### 4.1 需要修改的文件列表

```
chairman-agent/
├── .env                                          # 根目录环境变量
├── docker-compose.yml                            # Docker 环境变量 (lines 121, 127-130)
├── src/config.py                                 # Chairman API 配置 (lines 18-19)
├── thirdparty/
│   ├── open_deep_research/
│   │   └── src/open_deep_research/
│   │       └── configuration.py                  # Deep Research 配置 (lines 124, 156, 175, 195)
│   └── open-canvas/
│       └── packages/shared/src/
│           └── models.ts                         # OpenCanvas 模型定义 (line 470)
└── [SurrealDB]                                   # 数据库运行时配置
```

### 4.2 搜索所有模型配置

```bash
# 搜索所有包含模型名称的文件
grep -rn "grok" --include="*.py" --include="*.yml" --include="*.ts" --include="*.env" . | grep -v node_modules
```

---

## 五、常见问题

### Q1: 修改了 docker-compose.yml 但配置没生效？

**原因**: Open Notebook 的模型配置存储在数据库中，环境变量仅首次初始化时使用。

**解决**: 使用 `./scripts/update_model.sh` 脚本更新数据库配置。

### Q2: 出现 "No endpoints found for xxx" 错误？

**原因**: 模型名称在 OpenRouter 上不存在或已弃用。

**解决**:
1. 检查 OpenRouter 可用模型: https://openrouter.ai/models
2. 使用脚本更新为有效的模型名称

### Q3: 如何查看当前使用的模型？

```bash
# Open Notebook 数据库配置
curl -s http://localhost:5055/api/models/defaults

# Docker 容器环境变量
docker exec chairman_open_notebook printenv | grep -E "LLM_MODEL|DEFAULT_"
```

### Q4: OpenCanvas 报错 "No endpoints found for x-ai/grok-xxx:free"？

**原因**: OpenCanvas 使用 LangGraph 持久化存储，已创建的 Assistant 配置保存在缓存文件中。即使更新了代码中的模型名，旧的 Assistant 仍使用缓存的旧配置。

**缓存文件位置**:
```
thirdparty/open-canvas/.langgraph_api/
├── .langgraphjs_api.checkpointer.json  ← 线程状态和 Assistant 配置
├── .langgraphjs_api.store.json         ← 存储数据
└── .langgraphjs_ops.json               ← 操作日志
```

**解决方案**:

**方案 A: 修复缓存数据（保留历史）**
```bash
cd thirdparty/open-canvas/.langgraph_api

# 备份
cp .langgraphjs_api.checkpointer.json .langgraphjs_api.checkpointer.json.bak
cp .langgraphjs_ops.json .langgraphjs_ops.json.bak

# 替换错误的模型名
sed -i '' 's/grok-4.1-fast:free/grok-4.1-fast/g' .langgraphjs_api.checkpointer.json
sed -i '' 's/grok-4.1-fast:free/grok-4.1-fast/g' .langgraphjs_ops.json

# 重启服务
./scripts/start_opencanvas.sh restart
```

**方案 B: 清除缓存（重新开始）**
```bash
# 删除缓存文件（会丢失所有聊天历史）
rm -rf thirdparty/open-canvas/.langgraph_api/*.json

# 重启服务
./scripts/start_opencanvas.sh restart
```

---

## 六、OpenCanvas 特殊配置

### 6.1 LangGraph 持久化机制

OpenCanvas 使用 LangGraph 框架，具有独立的配置持久化机制：

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  models.ts      │ ──▶ │  创建 Assistant │ ──▶ │  缓存文件       │
│  (代码默认值)    │     │  (前端操作)     │     │  (持久化存储)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  实际 API 调用   │
                                               │  (使用缓存配置)  │
                                               └─────────────────┘
```

### 6.2 注意事项

- **代码更新不会影响已创建的 Assistant** - 已保存的配置优先
- **新创建的 Assistant 使用新配置** - 或者手动修复缓存
- **删除缓存会丢失历史** - 建议使用 sed 修复而非删除

---

## 七、OpenRouter 模型命名规范

### 7.1 模型名称格式

```
provider/model-name[-version]
```

示例:
- `x-ai/grok-4.1-fast` - xAI Grok 4.1 Fast
- `x-ai/grok-3` - xAI Grok 3
- `anthropic/claude-3-opus` - Anthropic Claude 3 Opus
- `openai/gpt-4-turbo` - OpenAI GPT-4 Turbo

### 7.2 注意事项

- **不要添加 `:free` 后缀** - 免费模型会自动路由，无需指定
- **检查模型可用性** - OpenRouter 模型会定期更新/弃用
- **保持一致性** - 所有配置位置使用相同的模型名称

---

**维护者**: Claude Code
**相关文档**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md), [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
