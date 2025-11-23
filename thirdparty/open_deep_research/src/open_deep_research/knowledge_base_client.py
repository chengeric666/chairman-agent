"""
知识库API客户端 - OpenDeepResearch Python实现
用于从Open-Notebook知识库检索信息
"""

import asyncio
import httpx
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)


class KnowledgeBaseClient:
    """知识库客户端 - 用于从董智知识库检索信息"""

    def __init__(
        self,
        api_url: str = "http://localhost:5055",
        api_key: str = "chairman",
        timeout: int = 30,
    ):
        """
        初始化知识库客户端

        Args:
            api_url: 知识库API地址
            api_key: API密钥
            timeout: 请求超时时间(秒)
        """
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """获取异步HTTP客户端"""
        if self._client is None:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            self._client = httpx.AsyncClient(
                base_url=self.api_url,
                headers=headers,
                timeout=self.timeout,
            )
        return self._client

    async def close(self):
        """关闭连接"""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def health_check(self) -> bool:
        """
        健康检查 - 验证知识库连接

        Returns:
            如果连接正常返回True
        """
        try:
            client = await self._get_client()
            response = await client.get("/api/config")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"知识库健康检查失败: {e}")
            return False

    async def search(
        self,
        queries: List[str],
        search_type: str = "vector",
        limit: int = 10,
        **kwargs,
    ) -> str:
        """
        从知识库搜索相关内容

        Args:
            queries: 查询列表
            search_type: 搜索类型 (vector/fulltext/hybrid)
            limit: 返回结果数量限制
            **kwargs: 其他参数

        Returns:
            格式化的搜索结果字符串
        """
        try:
            client = await self._get_client()

            # 并行执行所有查询
            tasks = [
                self._search_single(client, query, search_type, limit)
                for query in queries
            ]
            results_list = await asyncio.gather(*tasks, return_exceptions=True)

            # 合并结果并去重
            all_results = []
            seen_titles = set()

            for results in results_list:
                if isinstance(results, list):
                    for result in results:
                        title = result.get("title", "")
                        if title not in seen_titles:
                            all_results.append(result)
                            seen_titles.add(title)

            # 格式化为字符串
            return self._format_results(all_results, queries)

        except Exception as e:
            logger.error(f"知识库搜索失败: {e}")
            return f"知识库搜索失败: {str(e)}"

    async def _search_single(
        self,
        client: httpx.AsyncClient,
        query: str,
        search_type: str,
        limit: int,
    ) -> List[Dict[str, Any]]:
        """执行单个查询"""
        try:
            params = {
                "q": query,
                "limit": limit,
                "type": search_type,
            }
            response = await client.get("/api/search", params=params)
            response.raise_for_status()

            data = response.json()
            if data.get("results"):
                return data["results"]
            return []

        except Exception as e:
            logger.error(f"单个查询失败 ({query}): {e}")
            return []

    def _format_results(
        self, results: List[Dict[str, Any]], queries: List[str]
    ) -> str:
        """格式化搜索结果为字符串"""
        if not results:
            return f"未找到与以下查询相关的内容: {', '.join(queries)}"

        output = []
        output.append(f"# 知识库搜索结果\n\n原始查询: {', '.join(queries)}\n")
        output.append(f"共找到 {len(results)} 条相关内容:\n")

        for i, result in enumerate(results, 1):
            output.append(f"\n## 结果 {i}\n")
            output.append(f"**标题**: {result.get('title', '未知标题')}\n")

            if result.get("content"):
                content = result["content"]
                if len(content) > 500:
                    content = content[:500] + "..."
                output.append(f"**内容**: {content}\n")

            if result.get("author"):
                output.append(f"**作者**: {result['author']}\n")

            if result.get("created_at"):
                output.append(f"**日期**: {result['created_at']}\n")

            if result.get("source_id"):
                output.append(f"**来源ID**: {result['source_id']}\n")

            if result.get("score") or result.get("relevance"):
                score = result.get("score") or result.get("relevance")
                output.append(f"**相关性**: {score}\n")

        return "".join(output)

    async def get_document(self, doc_id: str) -> Dict[str, Any]:
        """
        获取单个文档内容

        Args:
            doc_id: 文档ID

        Returns:
            文档数据
        """
        try:
            client = await self._get_client()
            response = await client.get(f"/api/items/{doc_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"获取文档失败: {e}")
            return {}

    async def get_stats(self) -> Dict[str, Any]:
        """
        获取知识库统计信息

        Returns:
            统计数据
        """
        try:
            client = await self._get_client()
            response = await client.get("/api/stats")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"获取统计信息失败: {e}")
            return {}


# 全局客户端实例
_kb_client: Optional[KnowledgeBaseClient] = None


def get_knowledge_base_client(
    api_url: Optional[str] = None,
    api_key: Optional[str] = None,
) -> KnowledgeBaseClient:
    """
    获取或创建知识库客户端实例

    Args:
        api_url: 可选的API地址
        api_key: 可选的API密钥

    Returns:
        知识库客户端实例
    """
    global _kb_client

    if _kb_client is None:
        import os

        api_url = api_url or os.environ.get("KB_API_URL", "http://localhost:5055")
        api_key = api_key or os.environ.get("KB_API_KEY", "chairman")
        _kb_client = KnowledgeBaseClient(api_url, api_key)

    return _kb_client
