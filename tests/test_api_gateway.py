# tests/test_api_gateway.py
# API网关端点测试

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
from src.api.gateway import app

client = TestClient(app)


class TestHealthCheck:
    """健康检查端点测试"""

    def test_health_check(self):
        """测试基础健康检查"""
        response = client.get("/health")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_api_health_check(self):
        """测试API健康检查"""
        with patch('src.api.gateway.get_retriever_instance'):
            response = client.get("/api/health")
            assert response.status_code == 200

            data = response.json()
            assert data["status"] == "healthy"


class TestKnowledgeSearch:
    """知识库搜索端点测试"""

    def test_search_with_query(self):
        """测试带有查询的搜索"""
        with patch('src.api.gateway.get_retriever_instance') as mock_get:
            mock_retriever = Mock()
            mock_retriever.retrieve_knowledge.return_value = "Sample result"
            mock_get.return_value = mock_retriever

            response = client.get("/api/knowledge/search?query=test")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["query"] == "test"

    def test_search_missing_query(self):
        """测试缺少查询参数"""
        response = client.get("/api/knowledge/search")
        assert response.status_code in [400, 422]  # Bad Request或Unprocessable Entity

    def test_search_with_parameters(self):
        """测试带有多个参数的搜索"""
        with patch('src.api.gateway.get_retriever_instance') as mock_get:
            mock_retriever = Mock()
            mock_retriever.retrieve_knowledge.return_value = "Sample result"
            mock_get.return_value = mock_retriever

            response = client.get(
                "/api/knowledge/search?query=test&top_k=5&similarity_threshold=0.6"
            )

            assert response.status_code == 200
            mock_retriever.retrieve_knowledge.assert_called_once()


class TestAgentQuery:
    """Agent查询端点测试"""

    def test_agent_query(self):
        """测试Agent查询"""
        with patch('src.api.gateway.get_agent_instance') as mock_get:
            mock_agent = Mock()
            mock_agent.query.return_value = {"result": "test"}
            mock_get.return_value = mock_agent

            response = client.post("/api/agents/query?topic=test")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "accepted"
            assert "task_id" in data

    def test_agent_query_missing_topic(self):
        """测试缺少主题参数"""
        response = client.post("/api/agents/query")
        assert response.status_code in [400, 422]

    def test_get_task_status(self):
        """测试获取任务状态"""
        # 首先创建一个任务
        with patch('src.api.gateway.get_agent_instance') as mock_get:
            mock_agent = Mock()
            mock_agent.query.return_value = {"result": "test"}
            mock_get.return_value = mock_agent

            # 创建任务
            response = client.post("/api/agents/query?topic=test")
            task_id = response.json()["task_id"]

            # 查询任务状态
            response = client.get(f"/api/agents/{task_id}/status")
            assert response.status_code == 200

            data = response.json()
            assert data["task_id"] == task_id
            assert "status" in data

    def test_cancel_task(self):
        """测试取消任务"""
        with patch('src.api.gateway.get_agent_instance') as mock_get:
            mock_agent = Mock()
            mock_agent.query.return_value = {"result": "test"}
            mock_get.return_value = mock_agent

            # 创建任务
            response = client.post("/api/agents/query?topic=test")
            task_id = response.json()["task_id"]

            # 取消任务
            response = client.post(f"/api/agents/{task_id}/cancel")
            assert response.status_code == 200

            data = response.json()
            assert data["task_id"] == task_id


class TestBatchSearch:
    """批量搜索端点测试"""

    def test_batch_search(self):
        """测试批量查询"""
        with patch('src.api.gateway.get_retriever_instance') as mock_get:
            mock_retriever = Mock()
            mock_retriever.retrieve_knowledge.return_value = "Sample result"
            mock_get.return_value = mock_retriever

            response = client.post(
                "/api/batch/search",
                json={"queries": ["test1", "test2", "test3"]}
            )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert data["count"] == 3

    def test_batch_search_empty(self):
        """测试空的批量查询"""
        response = client.post("/api/batch/search", json={})
        assert response.status_code == 400


class TestInfoEndpoint:
    """信息端点测试"""

    def test_api_info(self):
        """测试获取API信息"""
        response = client.get("/api/info")
        assert response.status_code == 200

        data = response.json()
        assert "name" in data
        assert "version" in data
        assert "endpoints" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
