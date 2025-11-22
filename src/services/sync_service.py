# src/services/sync_service.py
# 数据同步服务 - 管理Open-Notebook到Milvus的数据同步

import logging
import asyncio
from typing import Optional
from datetime import datetime

from src.sync_service.sync_engine import DataSyncEngine
from src.retrieval.knowledge_retriever import get_retriever

logger = logging.getLogger(__name__)


class SyncService:
    """数据同步服务"""

    def __init__(self):
        self.retriever = get_retriever()
        self.sync_engine = DataSyncEngine(self.retriever)
        self.last_sync_time: Optional[datetime] = None
        self.sync_count = 0

    async def start_sync_loop(self, interval_seconds: int = 300):
        """启动同步循环"""
        logger.info(f"启动同步循环 (间隔: {interval_seconds}秒)")

        try:
            await self.sync_engine.start_sync_loop(interval_seconds)
        except Exception as e:
            logger.error(f"同步循环错误: {e}")

    async def sync_once(self, full_sync: bool = False) -> Dict:
        """执行一次同步"""
        logger.info(f"执行同步 (full_sync={full_sync})")

        try:
            await self.sync_engine.sync_once(full_sync=full_sync)

            self.sync_count += 1
            self.last_sync_time = datetime.utcnow()

            return {
                "status": "success",
                "sync_count": self.sync_count,
                "last_sync_time": self.last_sync_time.isoformat()
            }

        except Exception as e:
            logger.error(f"同步失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    async def manual_sync(self, note_ids: Optional[list] = None) -> Dict:
        """手动同步"""
        logger.info(f"手动同步: {len(note_ids) if note_ids else '所有'}条记录")

        try:
            await self.sync_engine.manual_sync(note_ids)

            self.sync_count += 1
            self.last_sync_time = datetime.utcnow()

            return {
                "status": "success",
                "sync_count": self.sync_count,
                "last_sync_time": self.last_sync_time.isoformat()
            }

        except Exception as e:
            logger.error(f"手动同步失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    async def clear_and_resync(self) -> Dict:
        """清空并重新同步"""
        logger.warning("清空并重新同步所有数据")

        try:
            await self.sync_engine.clear_and_resync()

            self.sync_count += 1
            self.last_sync_time = datetime.utcnow()

            return {
                "status": "success",
                "sync_count": self.sync_count,
                "last_sync_time": self.last_sync_time.isoformat(),
                "message": "已清空并重新同步所有数据"
            }

        except Exception as e:
            logger.error(f"清空重新同步失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def get_sync_status(self) -> Dict:
        """获取同步状态"""
        return {
            "last_sync_time": self.last_sync_time.isoformat() if self.last_sync_time else None,
            "sync_count": self.sync_count,
            "status": "running"
        }

    async def close(self):
        """关闭同步服务"""
        await self.sync_engine.close()
        logger.info("同步服务已关闭")


# 全局服务实例
_sync_service: Optional[SyncService] = None


def get_sync_service() -> SyncService:
    """获取同步服务实例"""
    global _sync_service

    if _sync_service is None:
        _sync_service = SyncService()

    return _sync_service


# 类型导入
from typing import Dict
