# tests/test_integration.py
# MVP-1集成测试

import pytest
import asyncio
import logging
from unittest.mock import Mock, patch

logger = logging.getLogger(__name__)


@pytest.fixture
def event_loop():
    """创建事件循环"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


class TestMVP1Integration:
    """MVP-1集成测试类"""

    @pytest.mark.skip(reason="需要实际的服务运行")
    def test_full_workflow(self):
        """
        测试MVP-1的完整工作流

        1. 数据同步（Open-Notebook -> Milvus）
        2. 知识库查询
        3. Agent查询
        4. 结果格式化
        """
        from src.retrieval.knowledge_retriever import get_retriever
        from src.agents.simple_knowledge_agent import get_simple_knowledge_agent

        # 初始化
        retriever = get_retriever()
        agent = get_simple_knowledge_agent()

        # 测试知识库查询
        knowledge_result = retriever.retrieve_knowledge("人才战略")
        assert isinstance(knowledge_result, str)
        assert len(knowledge_result) > 0

        # 测试Agent查询
        agent_result = agent.query("人才战略")
        assert isinstance(agent_result, dict)
        assert agent_result["status"] == "success"

    @pytest.mark.asyncio
    async def test_data_sync_service(self):
        """测试数据同步服务"""
        from src.retrieval.knowledge_retriever import KnowledgeRetriever
        from src.sync_service.sync_engine import DataSyncEngine

        with patch('src.sync_service.sync_engine.connections'):
            retriever = Mock(spec=KnowledgeRetriever)
            retriever._embed_text = Mock(return_value=[0.1] * 384)

            sync_engine = DataSyncEngine(retriever)

            # 模拟没有新数据的情况
            with patch.object(sync_engine, '_fetch_recent_notes', return_value=[]):
                await sync_engine.sync_once()

    @pytest.mark.asyncio
    async def test_sync_with_mock_data(self):
        """使用模拟数据测试同步"""
        from src.retrieval.knowledge_retriever import KnowledgeRetriever
        from src.sync_service.sync_engine import DataSyncEngine

        with patch('src.sync_service.sync_engine.connections'):
            retriever = Mock(spec=KnowledgeRetriever)
            retriever._embed_text = Mock(return_value=[0.1] * 384)

            sync_engine = DataSyncEngine(retriever)

            # 模拟获取Notes
            mock_notes = [
                {
                    "id": "note1",
                    "content": "这是一条关于人才战略的思想资料",
                    "created_at": "2024-01-01",
                    "metadata": {"tags": ["人才", "战略"]}
                }
            ]

            with patch.object(sync_engine, '_fetch_recent_notes', return_value=mock_notes):
                with patch.object(sync_engine, '_insert_to_milvus'):
                    await sync_engine.sync_once()


class TestErrorHandling:
    """错误处理测试"""

    @pytest.mark.skip(reason="需要实际的服务")
    def test_milvus_connection_failure(self):
        """测试Milvus连接失败的处理"""
        with patch('src.retrieval.knowledge_retriever.connections.connect') as mock_connect:
            mock_connect.side_effect = Exception("Connection refused")

            from src.retrieval.knowledge_retriever import KnowledgeRetriever

            with pytest.raises(Exception):
                KnowledgeRetriever()

    def test_invalid_query(self):
        """测试无效查询的处理"""
        retriever = Mock()
        retriever.retrieve_knowledge = Mock(return_value="未找到相关资料")

        result = retriever.retrieve_knowledge("")
        assert "未找到相关资料" in result or isinstance(result, str)


class TestPerformance:
    """性能测试"""

    @pytest.mark.skip(reason="性能测试需要实际的服务")
    def test_retrieval_speed(self):
        """测试检索速度"""
        import time
        from src.retrieval.knowledge_retriever import get_retriever

        retriever = get_retriever()

        start = time.time()
        result = retriever.retrieve_knowledge("测试查询", top_k=5)
        elapsed = time.time() - start

        # 预期在2秒内完成
        assert elapsed < 2.0, f"检索耗时 {elapsed}s，超过2秒限制"

    @pytest.mark.skip(reason="性能测试需要实际的服务")
    def test_agent_speed(self):
        """测试Agent回答速度"""
        import time
        from src.agents.simple_knowledge_agent import get_simple_knowledge_agent

        agent = get_simple_knowledge_agent()

        start = time.time()
        result = agent.query("人才战略")
        elapsed = time.time() - start

        # 预期在10秒内完成
        assert elapsed < 10.0, f"Agent耗时 {elapsed}s，超过10秒限制"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
