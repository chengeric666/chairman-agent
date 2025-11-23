# src/retrieval/ollama_embedding_client.py
# Ollama本地embedding服务客户端

import asyncio
import logging
import httpx
from typing import List, Optional
from src.config import config

logger = logging.getLogger(__name__)


class OllamaEmbeddingClient:
    """
    Ollama embedding服务客户端

    功能：
    1. 调用Ollama HTTP API进行文本embedding
    2. 支持单个和批量embedding
    3. 自动重试和超时控制
    4. 服务健康检查
    """

    def __init__(
        self,
        base_url: str = None,
        model: str = None,
        timeout: int = None
    ):
        """初始化Ollama客户端"""
        self.base_url = base_url or config.OLLAMA_BASE_URL
        self.model = model or config.OLLAMA_EMBED_MODEL
        self.timeout = timeout or config.OLLAMA_TIMEOUT
        self.embed_endpoint = f"{self.base_url}/api/embed"
        self.health_endpoint = f"{self.base_url}/api/version"

        logger.info(f"✅ Ollama客户端初始化: {self.base_url}, 模型: {self.model}")

    async def health_check(self) -> bool:
        """
        检查Ollama服务是否可用

        返回:
            bool: 服务是否健康
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.health_endpoint)
                if response.status_code == 200:
                    logger.info("✅ Ollama服务健康检查通过")
                    return True
        except Exception as e:
            logger.error(f"❌ Ollama服务健康检查失败: {e}")
        return False

    async def embed_single(
        self,
        text: str,
        retries: int = 3
    ) -> Optional[List[float]]:
        """
        对单个文本进行embedding

        参数:
            text: 待embedding的文本
            retries: 重试次数

        返回:
            embedding向量，失败返回None
        """
        if not text or not text.strip():
            logger.warning("⚠️ 输入文本为空")
            return None

        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    payload = {
                        "model": self.model,
                        "prompt": text.strip()
                    }

                    response = await client.post(
                        self.embed_endpoint,
                        json=payload
                    )

                    if response.status_code == 200:
                        data = response.json()
                        embedding = data.get("embedding")

                        if embedding:
                            logger.debug(f"✅ 文本embedding成功: {len(embedding)}维")
                            return embedding
                        else:
                            logger.error("❌ 返回的embedding为空")

                    else:
                        logger.error(f"❌ Ollama API返回错误 (状态码{response.status_code}): {response.text}")

            except asyncio.TimeoutError:
                logger.warning(f"⏱️ 请求超时 (尝试 {attempt + 1}/{retries})")
                if attempt < retries - 1:
                    await asyncio.sleep(2 ** attempt)  # 指数退避

            except Exception as e:
                logger.error(f"❌ Embedding请求异常 (尝试 {attempt + 1}/{retries}): {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(2 ** attempt)

        logger.error(f"❌ 文本embedding失败（已重试{retries}次）")
        return None

    async def embed_batch(
        self,
        texts: List[str],
        retries: int = 3
    ) -> Optional[List[List[float]]]:
        """
        对多个文本进行批量embedding

        参数:
            texts: 文本列表
            retries: 重试次数

        返回:
            embedding向量列表，失败返回None
        """
        if not texts:
            logger.warning("⚠️ 输入文本列表为空")
            return []

        embeddings = []
        failed_count = 0

        # 串行处理以避免并发问题
        for idx, text in enumerate(texts):
            embedding = await self.embed_single(text, retries=1)

            if embedding:
                embeddings.append(embedding)
            else:
                failed_count += 1
                logger.warning(f"⚠️ 第{idx + 1}个文本embedding失败")

        if failed_count > 0:
            logger.warning(f"⚠️ 批量embedding完成，其中{failed_count}个失败")
        else:
            logger.info(f"✅ 批量embedding完成: {len(embeddings)}个")

        return embeddings if embeddings else None

    # 同步包装器（用于兼容现有代码）
    def embed_single_sync(self, text: str) -> Optional[List[float]]:
        """
        同步版本的embed_single
        用于在同步上下文中调用Ollama API
        """
        if not text or not text.strip():
            logger.warning("⚠️ 输入文本为空")
            return None

        for attempt in range(3):  # 重试3次
            try:
                # 使用同步客户端发送请求
                with httpx.Client(timeout=self.timeout) as client:
                    payload = {
                        "model": self.model,
                        "prompt": text.strip()
                    }

                    response = client.post(
                        self.embed_endpoint,
                        json=payload
                    )

                    if response.status_code == 200:
                        data = response.json()
                        embedding = data.get("embedding")

                        if embedding:
                            logger.debug(f"✅ 文本embedding成功: {len(embedding)}维")
                            return embedding
                        else:
                            logger.error("❌ 返回的embedding为空")

                    else:
                        logger.error(f"❌ Ollama API返回错误 (状态码{response.status_code}): {response.text}")

            except Exception as e:
                logger.warning(f"⚠️ Embedding请求异常 (尝试 {attempt + 1}/3): {e}")
                if attempt < 2:
                    import time
                    time.sleep(2 ** attempt)  # 指数退避

        logger.error("❌ 文本embedding失败（已重试3次）")
        return None


# 全局客户端实例
_embedding_client: Optional[OllamaEmbeddingClient] = None


def get_ollama_client() -> OllamaEmbeddingClient:
    """
    获取或创建Ollama客户端实例（单例模式）

    返回:
        OllamaEmbeddingClient实例
    """
    global _embedding_client

    if _embedding_client is None:
        _embedding_client = OllamaEmbeddingClient()

    return _embedding_client


async def test_ollama_connection():
    """测试Ollama连接"""
    client = get_ollama_client()

    # 健康检查
    is_healthy = await client.health_check()
    if not is_healthy:
        logger.error("❌ Ollama服务不可用")
        return False

    # 测试单个embedding
    test_text = "这是一个测试文本"
    embedding = await client.embed_single(test_text)

    if embedding:
        logger.info(f"✅ Ollama测试通过，向量维度: {len(embedding)}")
        return True
    else:
        logger.error("❌ Ollama embedding测试失败")
        return False


if __name__ == "__main__":
    # 命令行测试
    import logging
    logging.basicConfig(level=logging.INFO)

    async def main():
        result = await test_ollama_connection()
        if result:
            print("✅ Ollama连接测试成功")
        else:
            print("❌ Ollama连接测试失败")

    asyncio.run(main())
