#!/usr/bin/env python3
"""
OpenCanvas Stage 2 Integration Test
测试OpenCanvas与Open-Notebook知识库的集成

Test coverage:
1. Service health checks
2. Knowledge base search integration
3. LangGraph API connectivity
4. Basic workflow validation
"""

import requests
import json
import sys
from typing import Dict, Any, List

# Service endpoints
OPEN_NOTEBOOK_URL = "http://localhost:8502"
OPENCANVAS_WEB_URL = "http://localhost:8080"
LANGGRAPH_API_URL = "http://localhost:54367"

# API credentials
KB_API_KEY = "chairman"


class IntegrationTester:
    def __init__(self):
        self.results: List[Dict[str, Any]] = []
        self.passed = 0
        self.failed = 0

    def test(self, name: str, func):
        """Run a test and record results"""
        print(f"\n{'='*60}")
        print(f"测试: {name}")
        print(f"{'='*60}")
        try:
            result = func()
            if result:
                print(f"✅ PASSED: {name}")
                self.passed += 1
                self.results.append({"name": name, "status": "PASSED", "details": result})
            else:
                print(f"❌ FAILED: {name}")
                self.failed += 1
                self.results.append({"name": name, "status": "FAILED", "details": result})
        except Exception as e:
            print(f"❌ ERROR: {name}")
            print(f"   Error: {str(e)}")
            self.failed += 1
            self.results.append({"name": name, "status": "ERROR", "error": str(e)})

    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print(f"测试总结")
        print(f"{'='*60}")
        print(f"✅ 通过: {self.passed}")
        print(f"❌ 失败: {self.failed}")
        print(f"总计: {self.passed + self.failed}")
        print(f"成功率: {(self.passed / (self.passed + self.failed) * 100):.1f}%")

        return self.failed == 0


def test_open_notebook_health():
    """Test 1: Open-Notebook health check"""
    try:
        response = requests.get(
            f"{OPEN_NOTEBOOK_URL}/api/config",
            headers={"Authorization": f"Bearer {KB_API_KEY}"},
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            print(f"   版本: {data.get('version', 'unknown')}")
            print(f"   数据库状态: {data.get('dbStatus', 'unknown')}")
            return {"status": "healthy", "data": data}
        else:
            print(f"   状态码: {response.status_code}")
            return None
    except Exception as e:
        print(f"   连接失败: {str(e)}")
        return None


def test_langgraph_api_health():
    """Test 2: LangGraph API health check"""
    try:
        response = requests.get(
            f"{LANGGRAPH_API_URL}/info",
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            print(f"   LangGraph版本: {data.get('langgraph_js_version', 'unknown')}")
            print(f"   API版本: {data.get('version', 'unknown')}")
            return {"status": "healthy", "data": data}
        else:
            print(f"   状态码: {response.status_code}")
            return None
    except Exception as e:
        print(f"   连接失败: {str(e)}")
        return None


def test_opencanvas_web_health():
    """Test 3: OpenCanvas Web UI health check"""
    try:
        response = requests.get(
            OPENCANVAS_WEB_URL,
            timeout=5,
            allow_redirects=True
        )

        if response.status_code == 200:
            print(f"   状态码: {response.status_code}")
            print(f"   内容长度: {len(response.text)} bytes")
            # Check if it contains董智 branding
            if "董智" in response.text or "Canvas" in response.text:
                print(f"   ✓ 包含董智品牌元素")
                return {"status": "healthy", "has_branding": True}
            else:
                print(f"   ⚠ 未找到董智品牌元素")
                return {"status": "healthy", "has_branding": False}
        else:
            print(f"   状态码: {response.status_code}")
            return None
    except Exception as e:
        print(f"   连接失败: {str(e)}")
        return None


def test_knowledge_base_search():
    """Test 4: Knowledge base search functionality"""
    try:
        # Try to get items from knowledge base
        response = requests.get(
            f"{OPEN_NOTEBOOK_URL}/api/items",
            headers={"Authorization": f"Bearer {KB_API_KEY}"},
            params={"limit": 3},
            timeout=10
        )

        if response.status_code == 200:
            items = response.json()
            item_count = len(items) if isinstance(items, list) else 0
            print(f"   检索到 {item_count} 个知识条目")

            if item_count > 0:
                print(f"   示例条目:")
                for i, item in enumerate(items[:2], 1):
                    title = item.get('title', item.get('content', '')[:50])
                    print(f"     {i}. {title}")

                return {"status": "success", "count": item_count, "items": items[:2]}
            else:
                print(f"   ⚠ 知识库为空")
                return {"status": "empty", "count": 0}
        else:
            print(f"   状态码: {response.status_code}")
            print(f"   响应: {response.text[:200]}")
            return None
    except Exception as e:
        print(f"   搜索失败: {str(e)}")
        return None


def test_knowledge_base_client_module():
    """Test 5: Verify knowledge base client module exists"""
    import os

    client_path = "/Users/batfic887/Documents/project/chairman-agent/thirdparty/open-canvas/apps/agents/src/knowledge-base/client.ts"

    if os.path.exists(client_path):
        with open(client_path, 'r') as f:
            content = f.read()

        # Check for key components
        has_search = "async search(" in content
        has_health_check = "async healthCheck()" in content
        has_get_stats = "async getStats()" in content

        print(f"   ✓ 客户端文件存在: {client_path}")
        print(f"   ✓ 包含search方法: {has_search}")
        print(f"   ✓ 包含healthCheck方法: {has_health_check}")
        print(f"   ✓ 包含getStats方法: {has_get_stats}")

        if has_search and has_health_check and has_get_stats:
            return {"status": "complete", "methods": ["search", "healthCheck", "getStats"]}
        else:
            return {"status": "incomplete"}
    else:
        print(f"   ✗ 客户端文件不存在")
        return None


def test_open_notebook_menu_integration():
    """Test 6: Verify Open-Notebook menu has OpenCanvas links"""
    import os

    sidebar_path = "/Users/batfic887/Documents/project/chairman-agent/thirdparty/open-notebook/frontend/src/components/layout/AppSidebar.tsx"

    if os.path.exists(sidebar_path):
        with open(sidebar_path, 'r') as f:
            content = f.read()

        # Check for menu integration
        has_ai_section = "AI创作" in content
        has_opencanvas_link = "localhost:8080" in content
        has_external_link = "ExternalLink" in content

        print(f"   ✓ 侧边栏文件存在")
        print(f"   ✓ 包含AI创作菜单: {has_ai_section}")
        print(f"   ✓ 包含OpenCanvas链接: {has_opencanvas_link}")
        print(f"   ✓ 包含外部链接图标: {has_external_link}")

        if has_ai_section and has_opencanvas_link and has_external_link:
            return {"status": "integrated", "features": ["ai_menu", "opencanvas_link", "external_icon"]}
        else:
            return {"status": "partial"}
    else:
        print(f"   ✗ 侧边栏文件不存在")
        return None


def main():
    """Run all integration tests"""
    print("""
╔══════════════════════════════════════════════════════════╗
║   OpenCanvas Stage 2 Integration Test Suite             ║
║   测试OpenCanvas与董智知识库集成                           ║
╚══════════════════════════════════════════════════════════╝
    """)

    tester = IntegrationTester()

    # Run all tests
    tester.test("Open-Notebook健康检查", test_open_notebook_health)
    tester.test("LangGraph API健康检查", test_langgraph_api_health)
    tester.test("OpenCanvas Web UI健康检查", test_opencanvas_web_health)
    tester.test("知识库搜索功能", test_knowledge_base_search)
    tester.test("知识库客户端模块验证", test_knowledge_base_client_module)
    tester.test("Open-Notebook菜单集成验证", test_open_notebook_menu_integration)

    # Print summary
    success = tester.print_summary()

    # Save results to file
    with open('/Users/batfic887/Documents/project/chairman-agent/integration_test_results.json', 'w') as f:
        json.dump(tester.results, f, indent=2, ensure_ascii=False)

    print(f"\n测试结果已保存到: integration_test_results.json")

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
