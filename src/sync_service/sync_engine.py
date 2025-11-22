# src/sync_service/sync_engine.py
# 数据同步服务 - 将Open-Notebook中的数据同步到Milvus

import asyncio
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import httpx
from pymilvus import Collection, connections, CollectionSchema, FieldSchema, DataType

from src.config import config
from src.retrieval.knowledge_retriever import KnowledgeRetriever

logger = logging.getLogger(__name__)


class DataSyncEngine:
    """
    数据同步引擎

    功能：
    1. 从Open-Notebook定期轮询获取最新数据
    2. 对数据进行向量化处理
    3. 将数据同步到Milvus向量数据库
    4. 支持手动触发同步和增量同步
    """

    def __init__(self, retriever: KnowledgeRetriever):
        """
        初始化数据同步引擎

        Args:
            retriever: KnowledgeRetriever实例，用于向量化
        """
        self.retriever = retriever
        self.notebook_api_url = config.NOTEBOOK_API_URL
        self.notebook_api_key = config.NOTEBOOK_API_KEY
        self.http_client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {self.notebook_api_key}"}
        )

        # 记录上次同步的时间
        self.last_sync_time = datetime.utcnow()

        # 初始化Milvus集合
        self._init_milvus_collection()

        logger.info("✅ 数据同步引擎初始化完成")

    def _init_milvus_collection(self):
        """初始化Milvus集合"""
        try:
            connections.connect(
                alias="default",
                host=config.MILVUS_HOST,
                port=config.MILVUS_PORT
            )

            collection_name = config.MILVUS_COLLECTION_NAME

            # 检查集合是否已存在
            from pymilvus import utility
            if utility.has_collection(collection_name):
                logger.info(f"✅ 集合 {collection_name} 已存在")
                return

            # 定义schema
            fields = [
                FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
                FieldSchema(name="note_id", dtype=DataType.VARCHAR, max_length=256),
                FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=65535),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=config.MILVUS_VECTOR_DIM),
                FieldSchema(name="metadata", dtype=DataType.VARCHAR, max_length=65535),
                FieldSchema(name="created_at", dtype=DataType.VARCHAR, max_length=100),
                FieldSchema(name="updated_at", dtype=DataType.VARCHAR, max_length=100),
            ]

            schema = CollectionSchema(fields, description="Chairman Agent Knowledge Base")

            # 创建集合
            collection = Collection(name=collection_name, schema=schema)

            # 创建索引
            collection.create_index(
                field_name="embedding",
                index_params={"metric_type": "L2"}
            )

            logger.info(f"✅ 已创建Milvus集合: {collection_name}")

        except Exception as e:
            logger.error(f"❌ 初始化Milvus集合失败: {e}")
            raise

    async def start_sync_loop(self, interval_seconds: int = None):
        """
        启动后台同步循环

        Args:
            interval_seconds: 同步间隔（秒）
        """
        interval_seconds = interval_seconds or config.SYNC_INTERVAL_SECONDS

        logger.info(f"🔄 启动数据同步循环 (间隔: {interval_seconds}秒)")

        while True:
            try:
                await self.sync_once()
                await asyncio.sleep(interval_seconds)
            except Exception as e:
                logger.error(f"❌ 同步出错: {e}")
                await asyncio.sleep(60)  # 出错后等待1分钟重试

    async def sync_once(self, full_sync: bool = False):
        """
        执行一次同步

        Args:
            full_sync: 是否执行全量同步（默认增量同步）
        """
        logger.info("📤 开始同步数据...")

        try:
            # 1. 从Open-Notebook获取最新的Notes
            if full_sync:
                notes = await self._fetch_all_notes()
            else:
                notes = await self._fetch_recent_notes()

            if not notes:
                logger.info("ℹ️ 没有新的数据需要同步")
                return

            logger.info(f"📋 获取到 {len(notes)} 条记录")

            # 2. 处理和向量化
            processed_items = []
            for note in notes:
                try:
                    # 向量化
                    embedding = self.retriever._embed_text(note['content'])

                    processed_items.append({
                        "note_id": note.get('id'),
                        "content": note.get('content'),
                        "embedding": embedding,
                        "metadata": note.get('metadata', {}),
                        "created_at": note.get('created_at', datetime.utcnow().isoformat()),
                        "updated_at": datetime.utcnow().isoformat(),
                    })
                except Exception as e:
                    logger.warning(f"⚠️ 处理Note失败 {note.get('id')}: {e}")
                    continue

            # 3. 批量插入到Milvus
            if processed_items:
                await self._insert_to_milvus(processed_items)
                logger.info(f"✅ 同步完成: {len(processed_items)} 条记录")

            self.last_sync_time = datetime.utcnow()

        except Exception as e:
            logger.error(f"❌ 同步失败: {e}")
            raise

    async def _fetch_recent_notes(self, limit: int = 100) -> List[Dict]:
        """
        从Open-Notebook API获取最近的Notes（增量同步）

        Args:
            limit: 最多获取数量

        Returns:
            Note列表
        """
        try:
            # 计算上次同步后的时间
            since = (self.last_sync_time - timedelta(minutes=5)).isoformat()

            response = await self.http_client.get(
                f"{self.notebook_api_url}/api/notes",
                params={
                    "limit": limit,
                    "since": since,
                    "sort": "-updated_at"
                }
            )

            if response.status_code == 200:
                return response.json().get('notes', [])
            else:
                logger.warning(f"⚠️ Open-Notebook API返回状态码 {response.status_code}")
                return []

        except Exception as e:
            logger.error(f"❌ 获取最近Notes失败: {e}")
            return []

    async def _fetch_all_notes(self, limit: int = 1000) -> List[Dict]:
        """
        从Open-Notebook API获取所有Notes（全量同步）

        Args:
            limit: 最多获取数量

        Returns:
            Note列表
        """
        try:
            response = await self.http_client.get(
                f"{self.notebook_api_url}/api/notes",
                params={"limit": limit}
            )

            if response.status_code == 200:
                return response.json().get('notes', [])
            else:
                logger.warning(f"⚠️ Open-Notebook API返回状态码 {response.status_code}")
                return []

        except Exception as e:
            logger.error(f"❌ 获取所有Notes失败: {e}")
            return []

    async def _insert_to_milvus(self, items: List[Dict]):
        """
        将数据插入Milvus

        Args:
            items: 要插入的数据项列表
        """
        try:
            collection = Collection(config.MILVUS_COLLECTION_NAME)

            # 准备数据
            data = {
                "note_id": [item["note_id"] for item in items],
                "content": [item["content"] for item in items],
                "embedding": [item["embedding"] for item in items],
                "metadata": [str(item["metadata"]) for item in items],
                "created_at": [item["created_at"] for item in items],
                "updated_at": [item["updated_at"] for item in items],
            }

            # 插入
            collection.insert(data)
            collection.flush()

            logger.info(f"✅ 已插入 {len(items)} 条记录到Milvus")

        except Exception as e:
            logger.error(f"❌ 插入Milvus失败: {e}")
            raise

    async def manual_sync(self, note_ids: Optional[List[str]] = None):
        """
        手动触发同步（可选特定的Note ID）

        Args:
            note_ids: 要同步的Note ID列表（如果为None则同步所有）
        """
        logger.info(f"🔄 手动同步 {len(note_ids) if note_ids else '所有'}条记录...")
        await self.sync_once(full_sync=True if not note_ids else False)

    async def clear_and_resync(self):
        """清空并重新同步所有数据"""
        logger.warning("⚠️ 清空并重新同步所有数据...")

        try:
            # 清空集合
            collection = Collection(config.MILVUS_COLLECTION_NAME)
            collection.delete(expr="id > 0")  # 删除所有记录

            # 重新同步
            await self.sync_once(full_sync=True)

            logger.info("✅ 清空并重新同步完成")

        except Exception as e:
            logger.error(f"❌ 清空并重新同步失败: {e}")
            raise

    async def close(self):
        """关闭同步引擎"""
        await self.http_client.aclose()
        logger.info("✅ 数据同步引擎已关闭")
