# tests/test_knowledge_retriever.py
# 知识库检索器单元测试

import pytest
import logging
from unittest.mock import Mock, patch, MagicMock
from src.retrieval.knowledge_retriever import KnowledgeRetriever

logger = logging.getLogger(__name__)


@pytest.fixture
def mock_retriever():
    """创建模拟的检索器实例"""
    with patch('src.retrieval.knowledge_retriever.connections'):
        with patch('src.retrieval.knowledge_retriever.SentenceTransformer'):
            retriever = KnowledgeRetriever()
            return retriever


class TestKnowledgeRetriever:
    """知识库检索器测试类"""

    def test_initialization(self, mock_retriever):
        """测试检索器初始化"""
        assert mock_retriever is not None
        assert mock_retriever.milvus_host == "localhost"
        assert mock_retriever.milvus_port == 19530

    def test_embed_text(self, mock_retriever):
        """测试文本向量化"""
        mock_retriever.embedding_model.encode = Mock(
            return_value=__import__('numpy').array([0.1, 0.2, 0.3])
        )

        result = mock_retriever._embed_text("test query")

        assert isinstance(result, list)
        assert len(result) > 0

    def test_format_results(self, mock_retriever):
        """测试结果格式化"""
        mock_results = [
            {
                "note_id": "note1",
                "content": "Sample content",
                "similarity_score": 0.95,
                "metadata": {"tags": ["test"]},
                "created_at": "2024-01-01"
            }
        ]

        formatted = mock_retriever._format_results(mock_results)

        assert "相关的董事长思想资料" in formatted
        assert "Sample content" in formatted
        assert "95" in formatted  # 相似度百分比

    def test_format_results_empty(self, mock_retriever):
        """测试空结果格式化"""
        result = mock_retriever._format_results([])
        assert "未找到相关资料" in result


class TestKnowledgeRetrieverIntegration:
    """知识库检索器集成测试"""

    @pytest.mark.skip(reason="需要实际的Milvus连接")
    def test_retrieve_knowledge_real(self):
        """测试真实的知识库查询（跳过，需要Milvus）"""
        from src.retrieval.knowledge_retriever import get_retriever

        retriever = get_retriever()
        result = retriever.retrieve_knowledge("人才战略")

        assert isinstance(result, str)
        assert len(result) > 0
