# src/agents/writing_assistant.py
# 创作助手Agent - MVP-2的核心

import logging
from typing import Optional, Dict, Any
from langchain_core.tools import tool
from langchain_openrouter import ChatOpenRouter

from src.config import config
from src.retrieval.knowledge_retriever import get_retriever

logger = logging.getLogger(__name__)


class WritingAssistantAgent:
    """创作协助Agent

    功能：
    1. 基于董事长思想库的创作建议
    2. 风格学习和一致性检查
    3. 内容优化建议
    """

    def __init__(self):
        """初始化创作助手"""
        self.retriever = get_retriever()

        self.llm = ChatOpenRouter(
            openrouter_api_key=config.OPENROUTER_API_KEY,
            model=config.MODEL_TOOLCALL,
            temperature=config.LLM_TEMPERATURE,
            max_tokens=config.LLM_MAX_TOKENS
        )

        logger.info("✅ WritingAssistantAgent初始化完成")

    def suggest_content(self, topic: str, current_content: str) -> Dict[str, Any]:
        """提供创作建议

        Args:
            topic: 创作主题
            current_content: 当前的创作内容

        Returns:
            创作建议字典
        """
        logger.info(f"提供创作建议: {topic}")

        try:
            # 从知识库获取相关思想
            related_thoughts = self.retriever.retrieve_knowledge(topic, top_k=5)

            # 构建建议提示词
            prompt = f"""
作为董事长的创作协助，请为以下创作提供建议：

【主题】：{topic}

【当前内容】：
{current_content}

【相关思想】：
{related_thoughts}

请从以下方面提供建议：
1. 内容完整性：是否遗漏了关键观点？
2. 逻辑连贯：论述顺序是否合理？
3. 深度充足：是否充分挖掘了思想的内涵？
4. 风格一致：是否符合董事长的表达风格？
5. 实用性：是否容易理解和应用？
"""

            # 调用LLM获取建议
            result = self.llm.invoke(prompt)

            return {
                "status": "success",
                "topic": topic,
                "suggestions": result.content,
                "related_thoughts": related_thoughts
            }

        except Exception as e:
            logger.error(f"提供建议失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def check_style_consistency(self, content: str) -> Dict[str, Any]:
        """检查风格一致性

        Args:
            content: 要检查的内容

        Returns:
            风格检查结果
        """
        logger.info("检查风格一致性")

        try:
            # 获取董事长的写作样本（从知识库中抽取）
            style_analysis = self.retriever.retrieve_knowledge("写作风格样本", top_k=3)

            prompt = f"""
请分析以下内容是否符合董事长的写作风格：

【内容】：
{content}

【风格参考】：
{style_analysis}

请评估：
1. 词汇选择是否一致？
2. 句式结构是否相似？
3. 逻辑表达方式是否相同？
4. 整体风调是否匹配？

提供改进建议。
"""

            result = self.llm.invoke(prompt)

            return {
                "status": "success",
                "analysis": result.content,
                "consistency_score": 0.8  # 示例评分
            }

        except Exception as e:
            logger.error(f"风格检查失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def optimize_content(self, content: str) -> Dict[str, Any]:
        """优化内容

        Args:
            content: 要优化的内容

        Returns:
            优化后的内容和说明
        """
        logger.info("优化内容")

        try:
            prompt = f"""
请优化以下内容，使其更加清晰、有深度、更符合董事长的思想：

【原内容】：
{content}

请提供：
1. 优化后的内容
2. 主要改进点
3. 改进的理由
"""

            result = self.llm.invoke(prompt)

            return {
                "status": "success",
                "optimized_content": result.content
            }

        except Exception as e:
            logger.error(f"内容优化失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }


# 全局实例
_writing_assistant_instance: Optional[WritingAssistantAgent] = None


def get_writing_assistant() -> WritingAssistantAgent:
    """获取创作助手实例"""
    global _writing_assistant_instance

    if _writing_assistant_instance is None:
        _writing_assistant_instance = WritingAssistantAgent()

    return _writing_assistant_instance
