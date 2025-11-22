# src/services/agent_service.py
# Agent服务层 - Agent调用和管理

import logging
import asyncio
import uuid
from typing import Dict, Optional, Any
from datetime import datetime

from src.agents.simple_knowledge_agent import get_simple_knowledge_agent
from src.models import TaskStatus_Model, TaskStatus, AgentType

logger = logging.getLogger(__name__)

# 任务存储（生产环境应使用数据库）
_task_store: Dict[str, Dict[str, Any]] = {}


class AgentService:
    """Agent服务"""

    def __init__(self):
        self.agents = {}
        self._initialize_agents()

    def _initialize_agents(self):
        """初始化Agent"""
        try:
            self.agents[AgentType.SIMPLE_KNOWLEDGE] = get_simple_knowledge_agent()
            logger.info("✅ Agent初始化完成")
        except Exception as e:
            logger.error(f"❌ Agent初始化失败: {e}")

    def query(self, topic: str, agent_type: AgentType = AgentType.SIMPLE_KNOWLEDGE) -> str:
        """执行Agent查询"""
        logger.info(f"执行Agent查询: {topic} (type={agent_type})")

        if agent_type not in self.agents:
            return f"不支持的Agent类型: {agent_type}"

        agent = self.agents[agent_type]

        try:
            result = agent.query(topic)
            logger.info(f"✅ Agent查询完成")
            return result
        except Exception as e:
            logger.error(f"❌ Agent查询失败: {e}")
            return f"Agent查询失败: {str(e)}"

    def create_task(self, topic: str, agent_type: AgentType = AgentType.SIMPLE_KNOWLEDGE) -> str:
        """创建异步任务"""
        task_id = str(uuid.uuid4())

        _task_store[task_id] = {
            "id": task_id,
            "type": agent_type.value,
            "status": TaskStatus.PENDING,
            "topic": topic,
            "created_at": datetime.utcnow().isoformat(),
            "result": None,
            "error": None
        }

        logger.info(f"创建任务: {task_id}")

        # 异步执行（为了MVP简单起见，这里同步执行）
        self._execute_task(task_id)

        return task_id

    def _execute_task(self, task_id: str):
        """执行任务"""
        try:
            task = _task_store[task_id]
            task["status"] = TaskStatus.RUNNING

            # 查询Agent
            topic = task["topic"]
            agent_type = AgentType(task["type"])

            result = self.query(topic, agent_type)

            task["status"] = TaskStatus.COMPLETED
            task["result"] = result

            logger.info(f"✅ 任务完成: {task_id}")

        except Exception as e:
            task["status"] = TaskStatus.FAILED
            task["error"] = str(e)
            logger.error(f"❌ 任务失败: {task_id} - {e}")

    def get_task_status(self, task_id: str) -> Optional[Dict]:
        """获取任务状态"""
        if task_id not in _task_store:
            return None

        return _task_store[task_id]

    def cancel_task(self, task_id: str) -> bool:
        """取消任务"""
        if task_id not in _task_store:
            return False

        task = _task_store[task_id]

        if task["status"] == TaskStatus.RUNNING:
            task["status"] = TaskStatus.CANCELLED
            logger.info(f"取消任务: {task_id}")
            return True

        return False

    def get_all_tasks(self) -> Dict[str, Dict]:
        """获取所有任务"""
        return _task_store.copy()

    def clear_completed_tasks(self) -> int:
        """清除已完成的任务"""
        completed = [
            task_id for task_id, task in _task_store.items()
            if task["status"] in [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED]
        ]

        for task_id in completed:
            del _task_store[task_id]

        logger.info(f"清除{len(completed)}个已完成的任务")
        return len(completed)


# 全局服务实例
_agent_service: Optional[AgentService] = None


def get_agent_service() -> AgentService:
    """获取Agent服务实例"""
    global _agent_service

    if _agent_service is None:
        _agent_service = AgentService()

    return _agent_service
