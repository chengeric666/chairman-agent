# Ollama Embedding迁移 - 实现指南

本文档提供从SentenceTransformers迁移到Ollama Embedding的具体步骤和代码示例。

## 快速开始

### 环境准备

```bash
# 1. 安装Ollama
curl https://ollama.ai/install.sh | sh

# 2. 启动Ollama服务
ollama serve

# 3. 拉取embedding模型 (在另一个终端)
ollama pull nomic-embed-text
# 或其他模型
# ollama pull mxbai-embed-large
# ollama pull all-minilm:l6-v2
```

### 验证Ollama安装

```bash
# 测试API
curl http://localhost:11434/api/tags

# 测试embedding
curl http://localhost:11434/api/embed -d '{
  "model": "nomic-embed-text",
  "input": ["test"]
}' | jq .

# 输出应该显示768维向量
```

---

## 代码实现

### 步骤1: 修改配置文件

**文件**: `src/config.py`

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # ==================== Ollama 配置 ====================
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "localhost")
    OLLAMA_PORT: int = int(os.getenv("OLLAMA_PORT", "11434"))

    # ==================== 嵌入模型配置 ====================
    # 选项: "nomic-embed-text" (推荐), "all-minilm:l6-v2", "mxbai-embed-large"
    MODEL_EMBEDDING: str = os.getenv("MODEL_EMBEDDING", "nomic-embed-text")

    # 根据选择的模型更新向量维度
    EMBEDDING_MODEL_DIMS = {
        "nomic-embed-text": 768,
        "all-minilm:l6-v2": 384,
        "mxbai-embed-large": 1024,
    }

    MILVUS_VECTOR_DIM: int = EMBEDDING_MODEL_DIMS.get(MODEL_EMBEDDING, 768)

    # Ollama超时配置 (秒)
    OLLAMA_TIMEOUT: int = int(os.getenv("OLLAMA_TIMEOUT", "60"))

    # 连接池配置
    OLLAMA_MAX_RETRIES: int = 3
    OLLAMA_RETRY_DELAY: float = 0.5  # 秒

    # ==================== 其他配置保持不变 ====================
    MILVUS_HOST: str = os.getenv("MILVUS_HOST", "localhost")
    MILVUS_PORT: int = int(os.getenv("MILVUS_PORT", "19530"))
    # ... 其他配置 ...

config = Config()
```

**环境变量** (`.env`):

```bash
# Ollama 配置
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
MODEL_EMBEDDING=nomic-embed-text

# Milvus 配置
MILVUS_HOST=localhost
MILVUS_PORT=19530
```

### 步骤2: 实现Ollama Embedding服务

**文件**: `src/retrieval/ollama_embedding_client.py` (新建)

```python
"""
Ollama Embedding客户端 - 处理与Ollama服务的通信
"""

import asyncio
import logging
from typing import List, Optional
import httpx
from src.config import config

logger = logging.getLogger(__name__)


class OllamaEmbeddingClient:
    """Ollama Embedding API客户端"""

    def __init__(self):
        """初始化客户端"""
        self.base_url = f"http://{config.OLLAMA_HOST}:{config.OLLAMA_PORT}"
        self.model = config.MODEL_EMBEDDING
        self.timeout = config.OLLAMA_TIMEOUT
        self.max_retries = config.OLLAMA_MAX_RETRIES
        self.retry_delay = config.OLLAMA_RETRY_DELAY

        # 验证连接和向量维度
        self._verify_connectivity()
        self._verify_vector_dimension()

    def _verify_connectivity(self) -> bool:
        """验证Ollama服务可用性"""
        try:
            response = httpx.get(
                f"{self.base_url}/api/tags",
                timeout=5
            )
            response.raise_for_status()

            # 检查目标模型是否存在
            models = response.json().get("models", [])
            model_names = [m.get("name", "").split(":")[0] for m in models]

            if self.model not in model_names:
                logger.warning(
                    f"⚠️ 模型 {self.model} 未找到，可用模型: {model_names}"
                )
                # 继续运行，等待模型加载

            logger.info(f"✅ Ollama服务可用 ({self.base_url})")
            return True
        except Exception as e:
            logger.error(f"❌ Ollama连接失败: {e}")
            raise RuntimeError(f"无法连接Ollama服务: {e}")

    def _verify_vector_dimension(self) -> None:
        """验证向量维度配置正确"""
        try:
            test_embedding = self._embed_sync("test")
            actual_dim = len(test_embedding)
            expected_dim = config.MILVUS_VECTOR_DIM

            if actual_dim != expected_dim:
                raise ValueError(
                    f"向量维度不匹配！\n"
                    f"  期望: {expected_dim} (config.MILVUS_VECTOR_DIM)\n"
                    f"  实际: {actual_dim} (来自 {self.model})\n"
                    f"  建议: 更新配置中的 EMBEDDING_MODEL_DIMS"
                )

            logger.info(f"✅ 向量维度验证通过: {actual_dim}维")
        except Exception as e:
            logger.error(f"❌ 向量维度验证失败: {e}")
            raise

    def _embed_sync(self, text: str) -> List[float]:
        """同步embedding (用于初始化验证)"""
        response = httpx.post(
            f"{self.base_url}/api/embed",
            json={"model": self.model, "input": [text]},
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()["embeddings"][0]

    async def embed_single(self, text: str) -> List[float]:
        """单条文本embedding (带重试)"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.post(
                        f"{self.base_url}/api/embed",
                        json={
                            "model": self.model,
                            "input": [text]
                        }
                    )
                    response.raise_for_status()
                    embeddings = response.json()["embeddings"]
                    return embeddings[0]

                except Exception as e:
                    if attempt == self.max_retries - 1:
                        logger.error(f"❌ Embedding失败 (最后一次): {e}")
                        raise

                    wait_time = self.retry_delay * (2 ** attempt)
                    logger.warning(
                        f"⚠️ Embedding失败 (尝试 {attempt + 1}/{self.max_retries}), "
                        f"等待{wait_time:.1f}s后重试: {e}"
                    )
                    await asyncio.sleep(wait_time)

    async def embed_batch(
        self,
        texts: List[str],
        batch_size: int = 32
    ) -> List[List[float]]:
        """批量embedding"""
        if not texts:
            return []

        all_embeddings = []

        # 分批处理
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        f"{self.base_url}/api/embed",
                        json={
                            "model": self.model,
                            "input": batch
                        }
                    )
                    response.raise_for_status()
                    embeddings = response.json()["embeddings"]
                    all_embeddings.extend(embeddings)

                logger.debug(f"✅ 批处理完成: {i}/{len(texts)}")

            except Exception as e:
                logger.error(f"❌ 批处理失败: {e}")
                raise

        return all_embeddings

    async def health_check(self) -> bool:
        """健康检查"""
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                return response.status_code == 200
        except Exception:
            return False


# 全局实例
_ollama_client: Optional[OllamaEmbeddingClient] = None


def get_ollama_client() -> OllamaEmbeddingClient:
    """获取Ollama客户端实例"""
    global _ollama_client
    if _ollama_client is None:
        _ollama_client = OllamaEmbeddingClient()
    return _ollama_client
```

### 步骤3: 修改KnowledgeRetriever

**文件**: `src/retrieval/knowledge_retriever.py`

```python
"""
知识库查询器 - 使用Ollama Embedding
"""

import logging
from typing import List, Dict, Optional
from datetime import datetime
from langchain_core.tools import tool
from pymilvus import Collection, connections

from src.config import config
from src.retrieval.ollama_embedding_client import get_ollama_client

logger = logging.getLogger(__name__)


class KnowledgeRetriever:
    """知识库查询器"""

    def __init__(self):
        """初始化知识库查询器"""
        self.milvus_host = config.MILVUS_HOST
        self.milvus_port = config.MILVUS_PORT
        self.db_name = config.MILVUS_DB_NAME
        self.collection_name = config.MILVUS_COLLECTION_NAME

        # 使用Ollama客户端替代SentenceTransformer
        self.embedding_client = get_ollama_client()

        # 连接Milvus
        self._connect_milvus()

        logger.info("✅ 知识库查询器初始化完成")

    def _connect_milvus(self):
        """连接到Milvus"""
        try:
            connections.connect(
                alias="default",
                host=self.milvus_host,
                port=self.milvus_port
            )
            logger.info(f"✅ 已连接Milvus ({self.milvus_host}:{self.milvus_port})")
        except Exception as e:
            logger.error(f"❌ 连接Milvus失败: {e}")
            raise

    async def retrieve_knowledge(
        self,
        query: str,
        top_k: int = None,
        similarity_threshold: float = None,
        filters: Optional[Dict] = None
    ) -> str:
        """从知识库中检索相关内容"""
        top_k = top_k or config.RETRIEVAL_TOP_K
        similarity_threshold = similarity_threshold or config.RETRIEVAL_SIMILARITY_THRESHOLD

        logger.info(f"📚 查询知识库: {query}")

        try:
            # 1. 将查询文本向量化 (现在是异步的)
            query_embedding = await self._embed_text(query)

            # 2. 在Milvus中执行向量搜索
            search_results = self._search_milvus(
                embedding=query_embedding,
                top_k=top_k,
                similarity_threshold=similarity_threshold
            )

            if not search_results:
                logger.warning(f"⚠️ 未找到相关资料")
                return "未找到相关资料。请尝试其他查询词。"

            # 3. 格式化结果
            formatted = self._format_results(search_results)

            logger.info(f"✅ 找到 {len(search_results)} 条相关资料")
            return formatted

        except Exception as e:
            logger.error(f"❌ 检索失败: {e}")
            raise

    async def _embed_text(self, text: str) -> List[float]:
        """使用Ollama向量化文本"""
        embedding = await self.embedding_client.embed_single(text)

        # 验证向量维度
        if len(embedding) != config.MILVUS_VECTOR_DIM:
            raise ValueError(
                f"向量维度不匹配: 期望{config.MILVUS_VECTOR_DIM}, "
                f"得到{len(embedding)}"
            )

        return embedding

    def _search_milvus(
        self,
        embedding: List[float],
        top_k: int = 10,
        similarity_threshold: float = 0.5
    ) -> List[Dict]:
        """在Milvus中执行向量相似度搜索"""
        try:
            collection = Collection(self.collection_name)
            collection.load()

            # 执行搜索
            results = collection.search(
                data=[embedding],
                anns_field="embedding",
                param={"metric_type": "L2", "params": {"nprobe": 10}},
                limit=top_k,
                output_fields=["note_id", "content", "metadata", "created_at"]
            )

            # 处理结果
            processed_results = []
            for hits in results:
                for hit in hits:
                    # L2距离转换为相似度
                    distance = hit.distance
                    similarity_score = 1 / (1 + distance)

                    if similarity_score >= similarity_threshold:
                        processed_results.append({
                            "note_id": hit.entity.get("note_id"),
                            "content": hit.entity.get("content"),
                            "similarity_score": similarity_score,
                            "metadata": hit.entity.get("metadata", {}),
                            "created_at": hit.entity.get("created_at")
                        })

            return processed_results

        except Exception as e:
            logger.error(f"❌ Milvus搜索失败: {e}")
            raise

    def _format_results(self, results: List[Dict]) -> str:
        """将搜索结果格式化"""
        if not results:
            return "未找到相关资料。"

        formatted = "## 📚 相关的董事长思想资料：\n\n"

        for i, result in enumerate(results, 1):
            formatted += f"### 资料 {i}\n"
            formatted += f"**相关度**：{result['similarity_score']:.1%}\n"

            if result.get('created_at'):
                formatted += f"**日期**：{result['created_at']}\n"

            if result.get('metadata'):
                metadata = result['metadata']
                if metadata.get('tags'):
                    formatted += f"**标签**：{', '.join(metadata['tags'])}\n"

            formatted += f"\n{result['content']}\n\n"
            formatted += "---\n\n"

        return formatted

    @tool
    def query_tool(self, query: str, top_k: int = 5) -> str:
        """LangChain Tool: 查询内部知识库"""
        import asyncio
        return asyncio.run(self.retrieve_knowledge(query, top_k=top_k))


# 全局实例
_retriever_instance: Optional[KnowledgeRetriever] = None


def get_retriever() -> KnowledgeRetriever:
    """获取或创建知识库检索器实例"""
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = KnowledgeRetriever()
    return _retriever_instance
```

### 步骤4: 修改DataSyncEngine

**文件**: `src/sync_service/sync_engine.py`

关键改动:

```python
# 1. 导入
from src.retrieval.ollama_embedding_client import get_ollama_client

# 2. 修改初始化
def __init__(self, retriever: KnowledgeRetriever):
    """..."""
    self.embedding_client = get_ollama_client()

# 3. 修改Milvus schema
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="note_id", dtype=DataType.VARCHAR, max_length=256),
    FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR,
                dim=config.MILVUS_VECTOR_DIM),  # 使用配置的维度
    FieldSchema(name="metadata", dtype=DataType.VARCHAR, max_length=65535),
    FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=100),
    FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=100),
]

# 4. 修改embedding调用
async def sync_once(self, full_sync: bool = False):
    # ...

    # 使用批量embedding提升性能
    texts = [note['content'] for note in notes]
    embeddings = await self.embedding_client.embed_batch(texts, batch_size=32)

    for note, embedding in zip(notes, embeddings):
        # 验证向量维度
        if len(embedding) != config.MILVUS_VECTOR_DIM:
            logger.error(f"维度不匹配: {len(embedding)} != {config.MILVUS_VECTOR_DIM}")
            raise ValueError("Vector dimension mismatch")

        processed_items.append({
            "note_id": note.get('id'),
            "content": note.get('content'),
            "embedding": embedding,
            "metadata": note.get('metadata', {}),
            "created_at": note.get('created_at'),
            "updated_at": datetime.utcnow().isoformat(),
        })
```

### 步骤5: 修改API网关

**文件**: `src/api/gateway.py`

```python
import asyncio

# 修改路由为async
@app.get("/api/knowledge/search")
async def search_knowledge(
    query: str = Query(..., description="搜索查询"),
    top_k: int = Query(10, description="返回结果数", ge=1, le=50),
):
    """搜索知识库"""
    try:
        logger.info(f"📚 搜索知识库: {query}")
        retriever = get_retriever()
        result = await retriever.retrieve_knowledge(query, top_k=top_k)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"搜索失败: {e}")
        raise HTTPException(status_code=500, detail=f"搜索失败: {str(e)}")

# 增强的健康检查
@app.get("/api/health")
async def api_health_check():
    """详细的健康检查"""
    try:
        from src.retrieval.ollama_embedding_client import get_ollama_client

        ollama_client = get_ollama_client()
        ollama_health = await ollama_client.health_check()

        return {
            "status": "healthy",
            "services": {
                "api": "✅ running",
                "milvus": "✅ connected",
                "ollama": "✅ connected" if ollama_health else "⚠️ degraded",
                "retriever": "✅ ready"
            },
            "embedding": {
                "model": config.MODEL_EMBEDDING,
                "vector_dimension": config.MILVUS_VECTOR_DIM
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return {
            "status": "degraded",
            "error": str(e)
        }
```

### 步骤6: 修改requirements.txt

```txt
# 删除
# sentence-transformers==2.2.2

# 保留现有的依赖
httpx==0.25.2
pymilvus==2.3.4
# ... 其他依赖 ...
```

### 步骤7: 修改docker-compose.yml

```yaml
version: '3.8'

services:
  # ... 现有服务 ...

  # 新增: Ollama服务
  ollama:
    image: ollama/ollama:latest
    container_name: chairman_ollama
    ports:
      - "11434:11434"
    volumes:
      - ./data/ollama:/root/.ollama
    networks:
      - chairman_network
    environment:
      OLLAMA_MODELS: /root/.ollama/models
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    command: serve

  # 修改: chairman_api服务
  chairman_api:
    # ... 现有配置 ...
    depends_on:
      milvus:
        condition: service_healthy
      redis:
        condition: service_healthy
      open_notebook:
        condition: service_healthy
      ollama:  # 新增依赖
        condition: service_healthy
    environment:
      # 现有环境变量
      # ...
      # 新增Ollama配置
      OLLAMA_HOST=ollama
      OLLAMA_PORT=11434
      MODEL_EMBEDDING=nomic-embed-text
      # 修改向量维度
      MILVUS_VECTOR_DIM=768
```

---

## 数据迁移

### 创建迁移脚本

**文件**: `scripts/migrate_embeddings.py` (新建)

```python
"""
向量数据迁移脚本 - 从384维迁移到768维
"""

import asyncio
import logging
from typing import List
from pymilvus import Collection, connections
from src.config import config
from src.retrieval.ollama_embedding_client import get_ollama_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def migrate_embeddings(
    old_collection_name: str = "chairman_thoughts",
    new_collection_name: str = "chairman_thoughts_v2"
):
    """
    迁移向量数据到新维度

    步骤:
    1. 从旧集合读取数据
    2. 使用新embedding模型重新向量化
    3. 写入新集合
    4. 验证数据完整性
    """

    # 连接Milvus
    connections.connect(
        alias="default",
        host=config.MILVUS_HOST,
        port=config.MILVUS_PORT
    )

    # 获取embedding客户端
    embedding_client = get_ollama_client()

    # 读取旧集合的数据
    old_collection = Collection(old_collection_name)
    old_collection.load()

    # 查询所有数据
    logger.info(f"读取集合 {old_collection_name}...")
    results = old_collection.query(
        expr="id >= 0",
        output_fields=["note_id", "content", "metadata", "created_at"]
    )

    logger.info(f"找到 {len(results)} 条记录")

    # 批量重新向量化
    logger.info("重新生成向量...")
    texts = [r["content"] for r in results]
    new_embeddings = await embedding_client.embed_batch(
        texts,
        batch_size=32
    )

    # 创建新集合
    logger.info(f"创建新集合 {new_collection_name}...")
    from pymilvus import FieldSchema, CollectionSchema, DataType

    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="note_id", dtype=DataType.VARCHAR, max_length=256),
        FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
        FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=768),
        FieldSchema(name="metadata", dtype=DataType.VARCHAR, max_length=65535),
        FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=100),
        FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=100),
    ]

    schema = CollectionSchema(fields, description="Chairman Agent Knowledge Base V2")
    new_collection = Collection(name=new_collection_name, schema=schema)
    new_collection.create_index(
        field_name="embedding",
        index_params={"metric_type": "L2"}
    )

    # 插入新数据
    logger.info(f"插入数据到 {new_collection_name}...")
    data_to_insert = {
        "note_id": [r["note_id"] for r in results],
        "content": [r["content"] for r in results],
        "embedding": new_embeddings,
        "metadata": [str(r.get("metadata", {})) for r in results],
        "created_at": [r.get("created_at", "") for r in results],
        "updated_at": [str(datetime.utcnow().isoformat()) for r in results],
    }

    new_collection.insert(data_to_insert)
    new_collection.flush()

    # 验证数据
    logger.info("验证数据完整性...")
    old_count = old_collection.num_entities
    new_count = new_collection.num_entities

    if old_count == new_count:
        logger.info(f"✅ 迁移成功! {new_count} 条记录")
        return True
    else:
        logger.error(f"❌ 数据不匹配: 旧{old_count} vs 新{new_count}")
        return False


if __name__ == "__main__":
    success = asyncio.run(migrate_embeddings())
    exit(0 if success else 1)
```

**运行迁移**:

```bash
# 1. 停止应用
docker-compose stop chairman_api

# 2. 运行迁移脚本
python scripts/migrate_embeddings.py

# 3. 验证新集合
docker-compose exec milvus python -c "
from pymilvus import Collection
c = Collection('chairman_thoughts_v2')
c.load()
print(f'总数: {c.num_entities}')
"

# 4. 更新应用配置使用新集合
# 修改 src/config.py:
# MILVUS_COLLECTION_NAME = "chairman_thoughts_v2"

# 5. 重启应用
docker-compose up -d
```

---

## 测试和验证

### 单元测试

**文件**: `tests/test_ollama_embedding.py` (新建)

```python
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from src.retrieval.ollama_embedding_client import OllamaEmbeddingClient
from src.config import config


@pytest.fixture
def embedding_client():
    """创建embedding客户端"""
    with patch('src.retrieval.ollama_embedding_client.httpx'):
        client = OllamaEmbeddingClient()
        return client


@pytest.mark.asyncio
async def test_embed_single(embedding_client):
    """测试单条embedding"""
    with patch.object(embedding_client, '_embed_sync') as mock:
        mock.return_value = [0.1] * config.MILVUS_VECTOR_DIM

        result = await embedding_client.embed_single("test")

        assert len(result) == config.MILVUS_VECTOR_DIM
        assert all(isinstance(x, float) for x in result)


@pytest.mark.asyncio
async def test_embed_batch(embedding_client):
    """测试批量embedding"""
    texts = ["text1", "text2", "text3"]

    with patch('src.retrieval.ollama_embedding_client.httpx') as mock_http:
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "embeddings": [[0.1] * config.MILVUS_VECTOR_DIM] * 3
        }
        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response

        with patch.object(embedding_client, '_embed_batch') as batch_mock:
            batch_mock.return_value = [[0.1] * config.MILVUS_VECTOR_DIM] * 3

            results = await embedding_client.embed_batch(texts)

            assert len(results) == 3
            assert all(len(r) == config.MILVUS_VECTOR_DIM for r in results)


def test_vector_dimension_validation(embedding_client):
    """测试向量维度验证"""
    with pytest.raises(ValueError) as exc_info:
        # 模拟维度不匹配
        embedding_client.MILVUS_VECTOR_DIM = 384
        embedding_client._verify_vector_dimension()

    assert "维度不匹配" in str(exc_info.value)
```

### 集成测试

**运行集成测试**:

```bash
# 确保所有服务运行
docker-compose up -d

# 等待服务启动
sleep 30

# 运行测试
pytest tests/test_integration.py -v

# 验证embedding质量
python tests/benchmark_embeddings.py
```

---

## 故障排除

### 常见问题

#### 问题1: Ollama连接失败

```
错误: "无法连接Ollama服务"

解决:
1. 检查Ollama是否运行: curl http://localhost:11434/api/tags
2. 检查防火墙/网络配置
3. 检查OLLAMA_HOST配置正确
```

#### 问题2: 向量维度不匹配

```
错误: "向量维度不匹配: 期望768, 得到384"

解决:
1. 确认MODEL_EMBEDDING配置正确
2. 检查EMBEDDING_MODEL_DIMS中是否有该模型
3. 重新启动Ollama拉取正确的模型: ollama pull nomic-embed-text
```

#### 问题3: 内存不足

```
症状: Ollama进程被杀死

解决:
1. 增加系统内存
2. 使用更小的模型: all-minilm:l6-v2 (46MB)
3. 配置Ollama限制: OLLAMA_MAX_LOADED_MODELS=1
```

---

## 性能优化

### 批处理配置

```python
# 根据硬件调整批大小
BATCH_SIZES = {
    "cpu_only": 8,
    "gpu_2gb": 16,
    "gpu_6gb": 32,
    "gpu_12gb": 64,
    "gpu_24gb": 128
}
```

### 缓存策略

```python
# 实现embedding缓存
from functools import lru_cache

@lru_cache(maxsize=10000)
async def cached_embed(text: str):
    return await embedding_client.embed_single(text)
```

---

**更新日期**: 2025-11-23
**状态**: 准备就绪
