# src/agents/thought_systemizer.py
# 思想体系化Agent - MVP-3的核心

import logging
from typing import Optional, Dict, Any
from langchain_openrouter import ChatOpenRouter

from src.config import config
from src.retrieval.knowledge_retriever import get_retriever
from src.agents.prompts import THOUGHT_ANALYSIS_PROMPT, CHAIRMAN_KNOWLEDGE_ADVISOR_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class ThoughtSystemizerAgent:
    """思想体系化Agent

    功能：
    1. 从零散的思想资料中提炼体系
    2. 分析思想之间的逻辑关系
    3. 形成可传承的思想框架
    4. 生成体系化报告
    """

    def __init__(self):
        """初始化思想体系化Agent"""
        self.retriever = get_retriever()

        self.llm = ChatOpenRouter(
            openrouter_api_key=config.OPENROUTER_API_KEY,
            model=config.MODEL_REASONING,  # 使用推理模型以获得深度分析
            temperature=0.5,  # 降低温度以获得更一致的输出
            max_tokens=config.LLM_MAX_TOKENS
        )

        logger.info("✅ ThoughtSystemizerAgent初始化完成")

    def systemize(self, topic: str) -> Dict[str, Any]:
        """体系化思想

        Args:
            topic: 要体系化的主题

        Returns:
            体系化的思想报告
        """
        logger.info(f"体系化思想: {topic}")

        try:
            # 从知识库检索相关资料
            knowledge = self.retriever.retrieve_knowledge(topic, top_k=10)

            # 构建提示词
            prompt = THOUGHT_ANALYSIS_PROMPT.format(
                topic=topic,
                knowledge_base_context=knowledge
            )

            # 调用LLM进行深度分析
            result = self.llm.invoke(prompt)

            logger.info(f"✅ 思想体系化完成: {topic}")

            return {
                "status": "success",
                "topic": topic,
                "analysis": result.content,
                "sources": knowledge
            }

        except Exception as e:
            logger.error(f"❌ 思想体系化失败: {e}")
            return {
                "status": "failed",
                "topic": topic,
                "error": str(e)
            }

    def analyze_principles(self, topic: str) -> Dict[str, Any]:
        """分析思想原则

        Args:
            topic: 要分析的主题

        Returns:
            原则分析结果
        """
        logger.info(f"分析思想原则: {topic}")

        try:
            # 获取相关思想
            knowledge = self.retriever.retrieve_knowledge(topic, top_k=15)

            prompt = f"""
请深入分析董事长关于"{topic}"的思想中包含的核心原则。

【相关资料】：
{knowledge}

【分析框架】：
1. 最核心的原则是什么？
2. 这些原则如何相互支撑？
3. 原则背后的哲学基础是什么？
4. 这些原则的实践应用是什么？
5. 如何将这些原则传递给下一代？

请提供深度的、有说服力的分析。
"""

            result = self.llm.invoke(prompt)

            return {
                "status": "success",
                "topic": topic,
                "principles": result.content
            }

        except Exception as e:
            logger.error(f"❌ 原则分析失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def identify_connections(self, topic1: str, topic2: str) -> Dict[str, Any]:
        """识别两个思想之间的关联

        Args:
            topic1: 第一个主题
            topic2: 第二个主题

        Returns:
            关联分析结果
        """
        logger.info(f"识别思想关联: {topic1} <-> {topic2}")

        try:
            # 获取两个主题的资料
            knowledge1 = self.retriever.retrieve_knowledge(topic1, top_k=5)
            knowledge2 = self.retriever.retrieve_knowledge(topic2, top_k=5)

            prompt = f"""
请分析董事长关于"{topic1}"和"{topic2}"的思想之间的关联。

【{topic1}的思想】：
{knowledge1}

【{topic2}的思想】：
{knowledge2}

【分析要点】：
1. 这两个思想之间有什么共同点？
2. 它们如何相互支持或补充？
3. 在应用中如何协同发挥作用？
4. 它们背后是否有统一的哲学基础？

请提供深度的相关性分析。
"""

            result = self.llm.invoke(prompt)

            return {
                "status": "success",
                "topics": [topic1, topic2],
                "connections": result.content
            }

        except Exception as e:
            logger.error(f"❌ 关联分析失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }


# 全局实例
_thought_systemizer_instance: Optional[ThoughtSystemizerAgent] = None


def get_thought_systemizer() -> ThoughtSystemizerAgent:
    """获取思想体系化Agent实例"""
    global _thought_systemizer_instance

    if _thought_systemizer_instance is None:
        _thought_systemizer_instance = ThoughtSystemizerAgent()

    return _thought_systemizer_instance
