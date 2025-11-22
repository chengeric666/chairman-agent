# src/services/knowledge_service.py
# 知识库服务层 - 业务逻辑

import logging
from typing import List, Dict, Optional
from src.retrieval.knowledge_retriever import get_retriever
from src.models import KnowledgeSearchRequest, SearchResult

logger = logging.getLogger(__name__)


class KnowledgeService:
    """知识库服务"""

    def __init__(self):
        self.retriever = get_retriever()

    def search(self, request: KnowledgeSearchRequest) -> str:
        """搜索知识库"""
        logger.info(f"知识库搜索: {request.query}")

        try:
            result = self.retriever.retrieve_knowledge(
                query=request.query,
                top_k=request.top_k,
                similarity_threshold=request.similarity_threshold
            )

            logger.info(f"搜索完成: {request.query}")
            return result

        except Exception as e:
            logger.error(f"知识库搜索失败: {e}")
            raise

    def batch_search(self, queries: List[str]) -> Dict[str, str]:
        """批量搜索"""
        logger.info(f"批量搜索: {len(queries)}个查询")

        results = {}
        for query in queries:
            try:
                result = self.retriever.retrieve_knowledge(query, top_k=5)
                results[query] = result
            except Exception as e:
                logger.error(f"查询失败: {query} - {e}")
                results[query] = f"查询失败: {str(e)}"

        return results

    def get_statistics(self) -> Dict:
        """获取统计信息"""
        try:
            from pymilvus import Collection
            from src.config import config

            collection = Collection(config.MILVUS_COLLECTION_NAME)
            collection.load()

            stats = {
                "total_documents": collection.num_entities,
                "vector_dimension": config.MILVUS_VECTOR_DIM,
                "embedding_model": config.MODEL_EMBEDDING,
                "collection_name": config.MILVUS_COLLECTION_NAME
            }

            return stats

        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {
                "error": str(e),
                "total_documents": 0
            }


# 全局服务实例
_knowledge_service: Optional[KnowledgeService] = None


def get_knowledge_service() -> KnowledgeService:
    """获取知识库服务实例"""
    global _knowledge_service

    if _knowledge_service is None:
        _knowledge_service = KnowledgeService()

    return _knowledge_service
