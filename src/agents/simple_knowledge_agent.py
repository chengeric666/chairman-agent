# src/agents/simple_knowledge_agent.py
# 简单知识库查询Agent - MVP-1的基础Agent

import logging
from typing import Optional, Dict, Any
from src.langchain_openrouter import ChatOpenRouter
from langchain_core.messages import HumanMessage, SystemMessage

from src.config import config
from src.retrieval.knowledge_retriever import get_retriever

logger = logging.getLogger(__name__)


class SimpleKnowledgeAgent:
    """
    简单知识库查询Agent

    功能：
    1. 接收用户查询
    2. 使用知识库检索工具查找相关资料
    3. 基于资料生成回答
    4. 返回格式化的结果
    """

    def __init__(self):
        """初始化Agent"""
        self.retriever = get_retriever()

        # 初始化LLM（使用DeepSeek via OpenRouter）
        self.llm = ChatOpenRouter(
            openrouter_api_key=config.OPENROUTER_API_KEY,
            model=config.MODEL_TOOLCALL,  # 使用工具调用模型
            temperature=config.LLM_TEMPERATURE,
            max_tokens=config.LLM_MAX_TOKENS,
            timeout=config.LLM_TIMEOUT
        )

        logger.info("✅ SimpleKnowledgeAgent初始化完成")

    def query_knowledge_base(self, topic: str, top_k: int = 10) -> str:
        """
        查询知识库

        Args:
            topic: 查询的主题
            top_k: 返回的最多结果数

        Returns:
            相关的知识库内容
        """
        logger.info(f"📚 查询知识库: {topic} (top_k={top_k})")

        try:
            result = self.retriever.retrieve_knowledge(
                query=topic,
                top_k=top_k
            )
            return result
        except Exception as e:
            logger.error(f"❌ 知识库查询失败: {e}")
            return f"知识库查询失败: {str(e)}"

    def _create_system_prompt(self) -> str:
        """创建系统Prompt"""
        return """你是一个董事长思想知识库的智能顾问。

【你的职责】
1. 理解用户的查询意图
2. 使用知识库查询工具查找相关的董事长思想资料
3. 基于查询到的资料，生成清晰、准确的回答
4. 确保回答基于董事长的实际思想，不做过度引申

【回答要求】
- 清晰：结构清晰，逻辑分明
- 准确：基于知识库中的内容
- 有深度：体现董事长思想的精髓
- 可应用：提供实用的见解

【工作流程】
1. 首先查询知识库，获取相关资料
2. 理解资料中的核心观点
3. 组织清晰的回答
4. 如果没有找到相关资料，诚实地说明"""

    def query(self, topic: str) -> Dict[str, Any]:
        """
        执行Agent查询 - 简化实现版本

        Args:
            topic: 查询的主题

        Returns:
            查询结果
        """
        logger.info(f"🤖 执行Agent查询: {topic}")

        try:
            # 第一步：查询知识库
            knowledge = self.query_knowledge_base(topic, top_k=10)

            # 第二步：用LLM基于知识库生成高质量回答
            system_prompt = self._create_system_prompt()

            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"基于以下董事长思想资料，请回答我的问题：\n\n{knowledge}\n\n问题：{topic}")
            ]

            # 调用LLM生成回答
            response = self.llm.invoke(messages)
            answer = response.content if hasattr(response, 'content') else str(response)

            logger.info(f"✅ Agent查询完成，生成了 {len(answer)} 字的回答")

            return {
                "status": "success",
                "topic": topic,
                "answer": answer,
                "knowledge_sources": knowledge[:500] + "..." if len(knowledge) > 500 else knowledge
            }

        except Exception as e:
            logger.error(f"❌ Agent执行失败: {e}")

            # 降级方案：直接使用知识库查询结果
            logger.info("🔄 降级为直接知识库查询")

            try:
                knowledge = self.retriever.retrieve_knowledge(topic, top_k=10)

                return {
                    "status": "fallback",
                    "topic": topic,
                    "answer": f"基于董事长的思想资料，以下是相关内容：\n\n{knowledge}",
                    "fallback_reason": str(e)
                }

            except Exception as e2:
                logger.error(f"❌ 降级方案也失败了: {e2}")

                return {
                    "status": "failed",
                    "topic": topic,
                    "error": str(e2)
                }

    def batch_query(self, topics: list) -> Dict[str, Any]:
        """
        批量查询

        Args:
            topics: 查询主题列表

        Returns:
            查询结果字典
        """
        logger.info(f"📚 批量查询 {len(topics)} 个主题")

        results = {}
        for topic in topics:
            results[topic] = self.query(topic)

        return results


# 全局Agent实例
_agent_instance: Optional[SimpleKnowledgeAgent] = None


def get_simple_knowledge_agent() -> SimpleKnowledgeAgent:
    """获取或创建SimpleKnowledgeAgent实例"""
    global _agent_instance

    if _agent_instance is None:
        try:
            _agent_instance = SimpleKnowledgeAgent()
        except Exception as e:
            logger.error(f"❌ Agent初始化失败: {e}")
            raise

    return _agent_instance
