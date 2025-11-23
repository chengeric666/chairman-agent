# src/retrieval/knowledge_retriever.py
# 内部知识库查询工具 - 为Agent提供"查询董事长思想"的能力

from typing import List, Dict, Optional
import logging
from datetime import datetime
import numpy as np
from langchain_core.tools import tool
from pymilvus import Collection, connections

from src.config import config
from src.retrieval.ollama_embedding_client import get_ollama_client

logger = logging.getLogger(__name__)


class KnowledgeRetriever:
    """
    知识库查询器

    功能：
    1. 将查询文本向量化
    2. 在Milvus中执行向量相似度搜索
    3. 返回最相关的董事长思想资料
    4. 支持元数据过滤（日期、标签等）
    """

    def __init__(self):
        """初始化知识库查询器"""
        self.milvus_host = config.MILVUS_HOST
        self.milvus_port = config.MILVUS_PORT
        self.db_name = config.MILVUS_DB_NAME
        self.collection_name = config.MILVUS_COLLECTION_NAME

        # Ollama embedding客户端（HTTP调用，避免本地模型加载）
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

    def retrieve_knowledge(
        self,
        query: str,
        top_k: int = None,
        similarity_threshold: float = None,
        filters: Optional[Dict] = None
    ) -> str:
        """
        从董事长的知识库中检索相关内容

        Args:
            query: 查询的主题或问题
            top_k: 返回最相关的K条结果（默认使用配置值）
            similarity_threshold: 相似度阈值（默认使用配置值）
            filters: 可选的过滤条件 (例如: {"date_range": ["2024-01-01", "2024-12-31"]})

        Returns:
            格式化的检索结果字符串
        """
        top_k = top_k or config.RETRIEVAL_TOP_K
        similarity_threshold = similarity_threshold or config.RETRIEVAL_SIMILARITY_THRESHOLD

        logger.info(f"📚 查询知识库: {query}")

        try:
            # 1. 将查询文本向量化
            query_embedding = self._embed_text(query)

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

    def _embed_text(self, text: str) -> List[float]:
        """
        使用Ollama远程服务向量化文本

        Args:
            text: 要向量化的文本

        Returns:
            向量（浮点数列表）
        """
        try:
            # 使用同步包装器调用Ollama embedding API
            embedding = self.embedding_client.embed_single_sync(text)

            if embedding is None:
                raise ValueError("Ollama embedding返回None，服务可能不可用")

            return embedding
        except Exception as e:
            logger.error(f"❌ 向量化失败: {e}")
            raise

    def _search_milvus(
        self,
        embedding: List[float],
        top_k: int = 10,
        similarity_threshold: float = 0.5
    ) -> List[Dict]:
        """
        在Milvus中执行向量相似度搜索

        Args:
            embedding: 查询向量
            top_k: 返回最相关的K条结果
            similarity_threshold: 相似度阈值

        Returns:
            搜索结果列表
        """
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
                    # 计算相似度分数（注意L2距离需要转换）
                    distance = hit.distance
                    similarity_score = 1 / (1 + distance)  # 简单的距离-相似度转换

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
        """
        将搜索结果格式化为可读的文本

        Args:
            results: 搜索结果列表

        Returns:
            格式化的文本
        """
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

    # LangChain Tool装饰器 - 用于Agent集成
    @tool
    def query_tool(self, query: str, top_k: int = 5) -> str:
        """
        LangChain Tool: 查询内部知识库

        这个工具可以被OpenDeepResearch Agent直接使用

        Args:
            query: 查询的主题
            top_k: 返回的结果数量

        Returns:
            格式化的知识库搜索结果
        """
        return self.retrieve_knowledge(query, top_k=top_k)


# 全局实例
_retriever_instance: Optional[KnowledgeRetriever] = None


def get_retriever() -> KnowledgeRetriever:
    """获取或创建知识库检索器实例"""
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = KnowledgeRetriever()
    return _retriever_instance
