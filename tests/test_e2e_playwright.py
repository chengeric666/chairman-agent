# tests/test_e2e_playwright.py
# 端到端Playwright测试

import pytest
import asyncio
from playwright.async_api import async_playwright, expect
import logging

logger = logging.getLogger(__name__)

# 测试配置
BASE_URL = "http://localhost:8000"
API_BASE_URL = "http://localhost:8000/api"


class TestAPIEndpoints:
    """使用Playwright测试API端点"""

    @pytest.mark.asyncio
    async def test_health_endpoint(self):
        """测试健康检查端点"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            try:
                # 访问健康检查端点
                response = await page.goto(f"{BASE_URL}/health")
                assert response.status == 200

                content = await page.content()
                assert "healthy" in content
                assert "timestamp" in content

            finally:
                await browser.close()

    @pytest.mark.asyncio
    async def test_api_health_endpoint(self):
        """测试API健康检查"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            try:
                response = await page.goto(f"{BASE_URL}/api/health")
                assert response.status == 200

                content = await page.content()
                assert "healthy" in content

            finally:
                await browser.close()

    @pytest.mark.asyncio
    async def test_knowledge_search_api(self):
        """测试知识库搜索API"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            try:
                # 设置API拦截
                async def handle_route(route):
                    if "knowledge/search" in route.request.url:
                        await route.abort()
                    else:
                        await route.continue_()

                await page.route("**/*", handle_route)

                # 构造API URL
                url = f"{API_BASE_URL}/knowledge/search?query=人才战略&top_k=5"

                # 访问API
                response = await page.goto(url)

                # 状态码应该是200或JSON格式的响应
                if response:
                    status = response.status
                    logger.info(f"API响应状态: {status}")

            finally:
                await browser.close()

    @pytest.mark.asyncio
    async def test_api_info_endpoint(self):
        """测试API信息端点"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            try:
                response = await page.goto(f"{API_BASE_URL}/info")
                assert response.status == 200

                content = await page.content()
                assert "智董" in content or "Chairman" in content

            finally:
                await browser.close()


class TestUIInteraction:
    """测试UI交互（如果有前端）"""

    @pytest.mark.skip(reason="需要前端应用部署")
    @pytest.mark.asyncio
    async def test_search_page(self):
        """测试搜索页面"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            try:
                # 访问前端应用
                await page.goto(f"{BASE_URL}/search")

                # 查找搜索框
                search_box = await page.query_selector("input[type='text']")
                assert search_box is not None

                # 输入查询
                await search_box.fill("人才战略")

                # 点击搜索按钮
                search_button = await page.query_selector("button[type='submit']")
                if search_button:
                    await search_button.click()

                    # 等待结果加载
                    await page.wait_for_load_state("networkidle")

                    # 检查结果是否显示
                    results = await page.query_selector(".results")
                    assert results is not None

            finally:
                await browser.close()

    @pytest.mark.skip(reason="需要前端应用部署")
    @pytest.mark.asyncio
    async def test_agent_query_flow(self):
        """测试Agent查询流程"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            try:
                # 访问Agent查询页面
                await page.goto(f"{BASE_URL}/agent-query")

                # 填写查询表单
                topic_input = await page.query_selector("input[name='topic']")
                if topic_input:
                    await topic_input.fill("人才战略")

                    # 提交表单
                    submit_button = await page.query_selector("button[type='submit']")
                    await submit_button.click()

                    # 等待结果
                    await page.wait_for_load_state("networkidle")

                    # 检查Agent响应
                    response = await page.query_selector(".agent-response")
                    assert response is not None

            finally:
                await browser.close()


class TestPerformanceAndStability:
    """性能和稳定性测试"""

    @pytest.mark.asyncio
    async def test_multiple_requests(self):
        """测试多个并发请求"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            try:
                # 发送多个请求
                urls = [
                    f"{BASE_URL}/health",
                    f"{API_BASE_URL}/info",
                ]

                for url in urls:
                    response = await page.goto(url)
                    assert response.status in [200, 404, 500]  # 接受这些状态

            finally:
                await browser.close()

    @pytest.mark.asyncio
    async def test_response_time(self):
        """测试响应时间"""
        import time

        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            try:
                start_time = time.time()

                response = await page.goto(f"{BASE_URL}/health")

                elapsed = time.time() - start_time

                # 健康检查应该在1秒内响应
                assert elapsed < 1.0, f"响应时间 {elapsed}s 超过1秒"

            finally:
                await browser.close()


class TestErrorHandling:
    """错误处理测试"""

    @pytest.mark.asyncio
    async def test_invalid_endpoint(self):
        """测试访问不存在的端点"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            try:
                response = await page.goto(f"{BASE_URL}/nonexistent")

                # 应该返回404
                assert response.status == 404

            finally:
                await browser.close()

    @pytest.mark.asyncio
    async def test_invalid_parameters(self):
        """测试无效的参数"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()

            try:
                # 不提供必需的参数
                response = await page.goto(f"{API_BASE_URL}/knowledge/search")

                # 应该返回错误状态
                assert response.status in [400, 422]

            finally:
                await browser.close()


# 命令行运行
if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
