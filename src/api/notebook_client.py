"""
Open-Notebook API客户端

用于与Open-Notebook知识库进行通信的HTTP客户端
"""

import logging
import httpx
import asyncio
from typing import Optional, List, Dict, Any
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


class NotebookClient:
    """Open-Notebook API客户端"""

    def __init__(self, api_url: str, api_key: Optional[str] = None, timeout: int = 30):
        """
        初始化客户端

        Args:
            api_url: Open-Notebook API的基础URL (例如: http://localhost:5055)
            api_key: 可选的API密钥
            timeout: 请求超时时间（秒）
        """
        self.api_url = api_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.client = None

    async def _get_client(self) -> httpx.AsyncClient:
        """获取HTTP客户端"""
        if self.client is None:
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"

            self.client = httpx.AsyncClient(
                base_url=self.api_url,
                headers=headers,
                timeout=self.timeout,
            )
        return self.client

    async def close(self):
        """关闭客户端连接"""
        if self.client:
            await self.client.aclose()
            self.client = None

    async def __aenter__(self):
        """上下文管理器进入"""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器退出"""
        await self.close()

    async def health_check(self) -> bool:
        """
        检查API是否可用

        Returns:
            True如果API可用，否则False
        """
        try:
            client = await self._get_client()
            response = await client.get("/api/config")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False

    async def search(
        self,
        query: str,
        top_k: int = 10,
        **kwargs
    ) -> Dict[str, Any]:
        """
        搜索知识库

        Args:
            query: 搜索查询文本
            top_k: 返回的最大结果数
            **kwargs: 其他查询参数

        Returns:
            包含搜索结果的字典
        """
        try:
            client = await self._get_client()
            params = {
                "q": query,
                "limit": top_k,
                **kwargs
            }

            response = await client.get(
                "/api/search",
                params=params
            )
            response.raise_for_status()

            return response.json()
        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise

    async def get_document(self, doc_id: str) -> Dict[str, Any]:
        """
        获取单个文档

        Args:
            doc_id: 文档ID

        Returns:
            文档内容
        """
        try:
            client = await self._get_client()
            response = await client.get(f"/api/items/{doc_id}")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Get document failed: {e}")
            raise

    async def list_documents(
        self,
        skip: int = 0,
        limit: int = 10,
        **kwargs
    ) -> Dict[str, Any]:
        """
        列出知识库中的文档

        Args:
            skip: 跳过的文档数
            limit: 返回的最大文档数
            **kwargs: 其他查询参数

        Returns:
            文档列表
        """
        try:
            client = await self._get_client()
            params = {
                "skip": skip,
                "limit": limit,
                **kwargs
            }

            response = await client.get(
                "/api/items",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"List documents failed: {e}")
            raise

    async def create_document(
        self,
        title: str,
        content: str,
        **metadata
    ) -> Dict[str, Any]:
        """
        创建新文档

        Args:
            title: 文档标题
            content: 文档内容
            **metadata: 其他元数据

        Returns:
            创建的文档信息
        """
        try:
            client = await self._get_client()
            payload = {
                "title": title,
                "content": content,
                **metadata
            }

            response = await client.post(
                "/api/items",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Create document failed: {e}")
            raise

    async def update_document(
        self,
        doc_id: str,
        **updates
    ) -> Dict[str, Any]:
        """
        更新文档

        Args:
            doc_id: 文档ID
            **updates: 要更新的字段

        Returns:
            更新后的文档信息
        """
        try:
            client = await self._get_client()
            response = await client.put(
                f"/api/items/{doc_id}",
                json=updates
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Update document failed: {e}")
            raise

    async def delete_document(self, doc_id: str) -> bool:
        """
        删除文档

        Args:
            doc_id: 文档ID

        Returns:
            True如果删除成功
        """
        try:
            client = await self._get_client()
            response = await client.delete(f"/api/items/{doc_id}")
            response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"Delete document failed: {e}")
            raise

    async def chat(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        与知识库进行对话

        Args:
            message: 用户消息
            conversation_id: 对话ID（如果有的话）
            **kwargs: 其他参数

        Returns:
            AI回应
        """
        try:
            client = await self._get_client()
            payload = {
                "message": message,
                **kwargs
            }
            if conversation_id:
                payload["conversation_id"] = conversation_id

            response = await client.post(
                "/api/chat",
                json=payload
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Chat failed: {e}")
            raise

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
            logger.error(f"Get stats failed: {e}")
            raise


# 全局客户端实例
_notebook_client: Optional[NotebookClient] = None


def get_notebook_client(
    api_url: Optional[str] = None,
    api_key: Optional[str] = None
) -> NotebookClient:
    """
    获取或创建NotebookClient实例

    Args:
        api_url: 可选的API URL（如果不指定则从config读取）
        api_key: 可选的API密钥

    Returns:
        NotebookClient实例
    """
    global _notebook_client

    if _notebook_client is None:
        from src.config import config
        api_url = api_url or config.NOTEBOOK_API_URL
        api_key = api_key or config.NOTEBOOK_API_KEY

        _notebook_client = NotebookClient(
            api_url=api_url,
            api_key=api_key
        )

    return _notebook_client
