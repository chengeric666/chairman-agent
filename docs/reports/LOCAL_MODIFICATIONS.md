# 本地修改说明

**修改日期**：2025-11-23
**修改目的**：修复依赖冲突、容器配置问题，并添加 Ollama 本地 embedding 支持

---

## 📊 修改文件统计

| 类型 | 数量 | 文件 |
|------|------|------|
| **修改的文件** | 9个 | requirements.txt, docker-compose.yml, src/config.py, src/agents/*.py (6个) |
| **新增的文件** | 1个 | src/langchain_openrouter.py |
| **总计改动** | 10个文件 | 新增 ~80 行，修改 ~27 行 |

---

## 🔧 详细修改内容

### 1️⃣ requirements.txt - 修复Python依赖冲突

**问题**：原仓库的依赖版本存在冲突，Docker build 失败

**修改内容**：
```diff
- langchain-core==0.1.0        # 与langchain冲突
+ langchain-core>=0.1.8,<0.2   # 满足所有依赖要求

- langgraph==0.0.4             # 版本不存在
+ langgraph==0.0.9             # 最小可用版本

- sentence-transformers==2.2.2  # 与新版huggingface_hub不兼容
+ sentence-transformers>=2.3.0  # 兼容版本

+ langchain-openai>=0.0.5      # 新增：OpenAI兼容层
+ openai>=1.0.0                # 新增：OpenAI SDK
```

**影响**：解决了 Docker build 失败的问题

---

### 2️⃣ docker-compose.yml - 修复容器配置并添加Ollama服务

**重大修改（58行变更）**：

#### A. SurrealDB 配置修复
```diff
- command: start --auth --user root --pass root
+ command: start --bind 0.0.0.0:8000 --user root --pass root
```
**原因**：`--auth` 参数在当前版本不支持

#### B. Milvus 添加启动命令
```diff
  milvus:
    image: milvusdb/milvus:latest
+   command: milvus run standalone
```
**原因**：容器需要明确的启动命令

#### C. Etcd 环境变量冲突修复
```diff
  environment:
    - ETCD_AUTO_COMPACTION_MODE=revision
    - ETCD_AUTO_COMPACTION_RETENTION=1000
-   - ETCD_QUOTA_BACKEND_BYTES=4294967296  # 与命令行参数冲突
    - ETCD_SNAPSHOT_COUNT=50000
```

#### D. **新增 Ollama 服务**（关键修改）
```yaml
# 7. Ollama - 本地LLM和Embedding服务
ollama:
  image: ollama/ollama:latest
  container_name: chairman_ollama
  ports:
    - "11434:11434"
  volumes:
    - ./data/ollama:/root/.ollama
  networks:
    - chairman_network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:11434/api/version"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**作用**：
- 提供本地免费的 embedding 模型服务
- 避免 embedding API 调用费用
- 已预装 nomic-embed-text 模型（274MB）

#### E. Open-Notebook 环境变量更新
```diff
+ # Ollama 配置（用于本地 Embedding）
+ - OLLAMA_BASE_URL=http://ollama:11434
+
+ # 默认模型配置
+ - DEFAULT_CHAT_MODEL=x-ai/grok-beta
+ - DEFAULT_TRANSFORMATION_MODEL=x-ai/grok-beta
+ - DEFAULT_TOOLS_MODEL=x-ai/grok-beta
+ - DEFAULT_LARGE_CONTEXT_MODEL=x-ai/grok-beta
+ - DEFAULT_EMBEDDING_MODEL=nomic-embed-text
+ - DEFAULT_TEXT_TO_SPEECH_MODEL=
```

#### F. 移除健康检查依赖
```diff
  depends_on:
-   surreal:
-     condition: service_healthy
+   - surreal
```
**原因**：简化依赖关系，避免启动顺序问题

---

### 3️⃣ src/config.py - 修复OpenRouter API URL

```diff
- OPENROUTER_API_URL: str = "https://openrouter.io/api/v1"  # 错误的域名
+ OPENROUTER_API_URL: str = "https://openrouter.ai/api/v1"  # 正确的域名
```

**影响**：修复了所有 LLM API 调用失败的问题（用户发现的关键错误）

---

### 4️⃣ src/langchain_openrouter.py - 新创建的模块

**文件大小**：1.2KB

**作用**：提供 OpenRouter 的 LangChain 兼容包装器

**核心代码**：
```python
from langchain_openai import ChatOpenAI
from src.config import config

class ChatOpenRouter(ChatOpenAI):
    """OpenRouter LLM 包装器，兼容 OpenAI API"""

    def __init__(self, **kwargs):
        defaults = {
            "model": kwargs.get("model", config.MODEL_REASONING),
            "openai_api_key": kwargs.get("openai_api_key", config.OPENROUTER_API_KEY),
            "openai_api_base": kwargs.get("openai_api_base", "https://openrouter.ai/api/v1"),
            "temperature": kwargs.get("temperature", config.LLM_TEMPERATURE),
            "max_tokens": kwargs.get("max_tokens", config.LLM_MAX_TOKENS),
        }
        super().__init__(**defaults)
```

**原因**：原代码导入 `from langchain_openrouter import ChatOpenRouter`，但该模块不存在

---

### 5️⃣ src/agents/*.py - 修复Import路径（6个文件）

**修改的文件**：
- `simple_knowledge_agent.py`
- `deep_analyzer.py`
- `meeting_analyzer.py`
- `thought_systemizer.py`
- `writing_assistant.py`
- `writing_coach.py`

**统一修改**：
```diff
- from langchain_openrouter import ChatOpenRouter
+ from src.langchain_openrouter import ChatOpenRouter
```

---

## 🎯 修改分类总结

| 修改类型 | 文件数 | 目的 |
|---------|--------|------|
| **Bug修复** | 3 | 修复配置错误、启动失败 |
| **依赖管理** | 1 | 解决版本冲突 |
| **功能增强** | 1 | 添加Ollama免费embedding |
| **模块创建** | 1 | 补充缺失的LangChain包装器 |
| **路径修正** | 6 | 统一import路径 |

---

## ✅ 修改效果

### 修复的问题：
1. ✅ Docker容器无法启动 → 所有8个容器正常运行
2. ✅ Python依赖冲突 → 成功构建Docker镜像
3. ✅ OpenRouter API调用失败 → API调用正常
4. ✅ 缺少embedding方案 → Ollama本地embedding可用
5. ✅ Import错误 → 所有Agent模块可正常导入

### 新增功能：
1. 🆕 Ollama服务（nomic-embed-text模型，274MB）
2. 🆕 本地免费embedding能力
3. 🆕 LangChain OpenRouter包装器

---

## 🚀 系统状态

### 运行的容器（8个）：
- ✅ chairman_open_notebook (Healthy) - 端口 5055, 8502
- ✅ chairman_ollama (Running) - 端口 11434
- ✅ chairman_api (Running) - 端口 8001
- ✅ chairman_milvus (Healthy) - 端口 19530, 9091
- ✅ chairman_redis (Healthy) - 端口 6379
- ✅ chairman_surreal (Running) - 端口 8000
- ✅ chairman_minio (Healthy) - 端口 9000-9001
- ✅ chairman_etcd (Running) - 端口 2379-2380

### 已配置的模型：
- **语言模型**：x-ai/grok-4.1-fast:free (OpenRouter)
- **Embedding模型**：nomic-embed-text (Ollama 本地)

---

## 📝 使用说明

### 访问地址：
- **Open-Notebook UI**: http://localhost:8502
- **Open-Notebook API**: http://localhost:5055
- **Chairman API**: http://localhost:8001
- **Ollama API**: http://localhost:11434

### 启动命令：
```bash
docker compose up -d
```

### Ollama 模型管理：
```bash
# 查看已安装模型
docker exec chairman_ollama ollama list

# 下载新模型（如果需要）
docker exec chairman_ollama ollama pull nomic-embed-text
```

---

## 🔍 技术亮点

1. **最小化原则**：所有修改都是为了解决实际问题，没有进行不必要的重构。

2. **向后兼容**：依赖版本使用范围而非固定版本（如 `>=0.1.8,<0.2`），提高兼容性。

3. **成本优化**：引入Ollama避免了embedding的API调用费用，这对于大量文档处理非常重要（每个文档可能产生数十次embedding调用）。

4. **容器化最佳实践**：使用容器间DNS（如 `http://ollama:11434`）而非 localhost，确保服务间正确通信。

5. **用户协作**：用户发现的 `openrouter.io` → `openrouter.ai` 错误展示了人机协作的价值。

---

**修改者**：Claude Code
**协作者**：batfic887 (用户)
