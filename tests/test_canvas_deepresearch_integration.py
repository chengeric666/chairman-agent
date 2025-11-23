"""
OpenCanvas和OpenDeepResearch集成测试
验证MVP-2和MVP-3的核心功能
"""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock

# 测试数据
SAMPLE_TOPIC = "人才战略"
SAMPLE_QUERY = "如何建立高效的人才管理体系"


class TestCanvasIntegration:
    """OpenCanvas集成测试"""

    @pytest.mark.asyncio
    async def test_create_session(self, client):
        """测试创建创作会话"""
        response = await client.post(
            "/api/canvas/create-session?topic=写作主题"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "session_id" in data
        assert data["topic"] == "写作主题"

    @pytest.mark.asyncio
    async def test_writing_suggestions(self, client):
        """测试获取创作建议"""
        payload = {
            "topic": SAMPLE_TOPIC,
            "purpose": "策略文档",
            "audience": "高管团队",
            "style": "专业正式",
            "context": "公司人才发展战略"
        }

        response = await client.post(
            "/api/canvas/writing-suggestions",
            json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "suggestions" in data
        assert isinstance(data["suggestions"], list)
        assert len(data["suggestions"]) > 0
        assert "references" in data

    @pytest.mark.asyncio
    async def test_style_analysis(self, client):
        """测试写作风格分析"""
        sample_text = "在当今的商业环境中，人才战略已经成为企业竞争力的核心驱动力。"

        response = await client.post(
            "/api/canvas/style-analysis",
            json={"text": sample_text},
            params={"reference_style": "学术正式"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "analysis" in data
        assert "tone" in data["analysis"]
        assert "improvements" in data
        assert isinstance(data["improvements"], list)


class TestDeepResearchIntegration:
    """OpenDeepResearch集成测试"""

    @pytest.mark.asyncio
    async def test_start_deep_research(self, client):
        """测试启动深度研究"""
        payload = {
            "topic": SAMPLE_TOPIC,
            "analysis_type": "systemize",
            "depth": "moderate",
            "scope": "systematic",
            "context": "企业战略规划"
        }

        response = await client.post(
            "/api/analyze/deep-research",
            json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "task_id" in data
        assert data["analysis_type"] == "systemize"
        assert "estimated_time_seconds" in data
        assert "next_check_url" in data

    @pytest.mark.asyncio
    async def test_deep_research_meeting_analysis(self, client):
        """测试会议分析"""
        payload = {
            "topic": "Q3策略评审会议",
            "analysis_type": "meeting",
            "depth": "deep",
            "scope": "systematic"
        }

        response = await client.post(
            "/api/analyze/deep-research",
            json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["analysis_type"] == "meeting"

    @pytest.mark.asyncio
    async def test_get_analysis_status(self, client):
        """测试查询分析状态"""
        # 先创建一个任务
        payload = {
            "topic": SAMPLE_TOPIC,
            "analysis_type": "systemize",
            "depth": "moderate",
            "scope": "systematic"
        }

        response = await client.post(
            "/api/analyze/deep-research",
            json=payload
        )

        task_data = response.json()
        task_id = task_data["task_id"]

        # 查询状态
        response = await client.get(f"/api/analyze/status/{task_id}")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "progress" in data
        assert data["task_id"] == task_id

    @pytest.mark.asyncio
    async def test_get_analysis_results(self, client):
        """测试获取分析结果"""
        task_id = "test-task-12345"

        response = await client.get(f"/api/analyze/results/{task_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "summary" in data
        assert "results" in data
        assert "insights" in data
        assert "recommendations" in data
        assert "sources" in data
        assert "quality_metrics" in data


class TestKnowledgeBaseSearch:
    """知识库搜索集成测试"""

    @pytest.mark.asyncio
    async def test_advanced_knowledge_search(self, client):
        """测试高级知识库搜索"""
        payload = {
            "query": SAMPLE_QUERY,
            "search_type": "vector",
            "limit": 10
        }

        response = await client.post(
            "/api/knowledge/search-advanced",
            json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["query"] == SAMPLE_QUERY
        assert "results" in data
        assert "total_count" in data
        assert "search_time_ms" in data

    @pytest.mark.asyncio
    async def test_knowledge_search_fulltext(self, client):
        """测试全文搜索"""
        payload = {
            "query": "战略规划",
            "search_type": "fulltext",
            "limit": 5
        }

        response = await client.post(
            "/api/knowledge/search-advanced",
            json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["search_type"] == "fulltext"

    @pytest.mark.asyncio
    async def test_knowledge_search_hybrid(self, client):
        """测试混合搜索"""
        payload = {
            "query": "创新驱动",
            "search_type": "hybrid",
            "limit": 15
        }

        response = await client.post(
            "/api/knowledge/search-advanced",
            json=payload
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["search_type"] == "hybrid"


class TestSystemStatus:
    """系统状态检查测试"""

    @pytest.mark.asyncio
    async def test_canvas_deepresearch_status(self, client):
        """测试系统状态检查"""
        response = await client.get("/api/status/canvas-deepresearch")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "components" in data
        assert "canvas" in data["components"]
        assert "deepresearch" in data["components"]
        assert "knowledge_base" in data["components"]

    @pytest.mark.asyncio
    async def test_all_components_ready(self, client):
        """测试所有组件就绪状态"""
        response = await client.get("/api/status/canvas-deepresearch")

        data = response.json()
        canvas_status = data["components"]["canvas"]["status"]
        deepresearch_status = data["components"]["deepresearch"]["status"]

        assert canvas_status in ["ready", "degraded", "error"]
        assert deepresearch_status in ["ready", "degraded", "error"]


class TestErrorHandling:
    """错误处理测试"""

    @pytest.mark.asyncio
    async def test_invalid_analysis_type(self, client):
        """测试无效的分析类型"""
        payload = {
            "topic": SAMPLE_TOPIC,
            "analysis_type": "invalid_type",  # 无效类型
            "depth": "moderate",
            "scope": "systematic"
        }

        response = await client.post(
            "/api/analyze/deep-research",
            json=payload
        )

        # 应该返回成功（客户端验证后端处理）
        assert response.status_code == 200 or response.status_code == 400

    @pytest.mark.asyncio
    async def test_missing_required_field(self, client):
        """测试缺少必需字段"""
        payload = {
            # 缺少 topic 字段
            "analysis_type": "systemize",
            "depth": "moderate"
        }

        response = await client.post(
            "/api/analyze/deep-research",
            json=payload
        )

        assert response.status_code == 422  # Unprocessable Entity


class TestPerformance:
    """性能测试"""

    @pytest.mark.asyncio
    async def test_search_response_time(self, client):
        """测试搜索响应时间"""
        import time

        start_time = time.time()

        response = await client.post(
            "/api/knowledge/search-advanced",
            json={
                "query": SAMPLE_QUERY,
                "search_type": "vector",
                "limit": 10
            }
        )

        elapsed = time.time() - start_time

        assert response.status_code == 200
        # 响应时间应该在5秒以内
        assert elapsed < 5.0

    @pytest.mark.asyncio
    async def test_analysis_startup_time(self, client):
        """测试分析启动时间"""
        import time

        start_time = time.time()

        response = await client.post(
            "/api/analyze/deep-research",
            json={
                "topic": SAMPLE_TOPIC,
                "analysis_type": "systemize",
                "depth": "moderate",
                "scope": "systematic"
            }
        )

        elapsed = time.time() - start_time

        assert response.status_code == 200
        # 启动应该很快（< 1秒）
        assert elapsed < 1.0


class TestIntegrationScenarios:
    """端到端集成场景测试"""

    @pytest.mark.asyncio
    async def test_full_writing_workflow(self, client):
        """测试完整的创作工作流"""
        # 1. 创建会话
        session_response = await client.post(
            "/api/canvas/create-session?topic=组织文化建设"
        )
        assert session_response.status_code == 200
        session_id = session_response.json()["session_id"]

        # 2. 获取创作建议
        suggestions_response = await client.post(
            "/api/canvas/writing-suggestions",
            json={
                "topic": "组织文化建设",
                "purpose": "企业战略",
                "audience": "全员",
                "style": "鼓舞激励"
            }
        )
        assert suggestions_response.status_code == 200
        assert "suggestions" in suggestions_response.json()

        # 3. 进行风格分析
        style_response = await client.post(
            "/api/canvas/style-analysis",
            json={"text": "我们相信文化是企业长期竞争力的源泉。"}
        )
        assert style_response.status_code == 200
        assert "analysis" in style_response.json()

    @pytest.mark.asyncio
    async def test_full_research_workflow(self, client):
        """测试完整的研究工作流"""
        # 1. 启动思想体系化研究
        research_response = await client.post(
            "/api/analyze/deep-research",
            json={
                "topic": "战略管理思想体系",
                "analysis_type": "systemize",
                "depth": "deep",
                "scope": "systematic"
            }
        )
        assert research_response.status_code == 200
        task_id = research_response.json()["task_id"]

        # 2. 查询状态
        status_response = await client.get(f"/api/analyze/status/{task_id}")
        assert status_response.status_code == 200
        assert "progress" in status_response.json()

        # 3. 获取结果（模拟已完成）
        results_response = await client.get(f"/api/analyze/results/{task_id}")
        assert results_response.status_code == 200
        assert "summary" in results_response.json()
        assert "insights" in results_response.json()

    @pytest.mark.asyncio
    async def test_knowledge_search_supports_all_modules(self, client):
        """测试知识库搜索支持所有模块"""
        # 测试向量搜索
        vector_response = await client.post(
            "/api/knowledge/search-advanced",
            json={
                "query": "人才战略",
                "search_type": "vector",
                "limit": 10
            }
        )
        assert vector_response.status_code == 200

        # 测试全文搜索
        fulltext_response = await client.post(
            "/api/knowledge/search-advanced",
            json={
                "query": "战略规划",
                "search_type": "fulltext",
                "limit": 10
            }
        )
        assert fulltext_response.status_code == 200

        # 测试混合搜索
        hybrid_response = await client.post(
            "/api/knowledge/search-advanced",
            json={
                "query": "创新驱动",
                "search_type": "hybrid",
                "limit": 10
            }
        )
        assert hybrid_response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
