# src/agents/meeting_analyzer.py
# 会议分析Agent - MVP-3的支撑

import logging
from typing import Optional, Dict, Any
from datetime import datetime
from src.langchain_openrouter import ChatOpenRouter

from src.config import config
from src.retrieval.knowledge_retriever import get_retriever
from src.agents.prompts import MEETING_ANALYSIS_PROMPT

logger = logging.getLogger(__name__)


class MeetingAnalyzerAgent:
    """会议分析Agent

    功能：
    1. 分析会议记录中的决策逻辑
    2. 提炼董事长的思考过程
    3. 识别和总结决策原则
    4. 生成可复用的决策范式
    """

    def __init__(self):
        """初始化会议分析Agent"""
        self.retriever = get_retriever()

        self.llm = ChatOpenRouter(
            openrouter_api_key=config.OPENROUTER_API_KEY,
            model=config.MODEL_REASONING,  # 使用推理模型以获得深度分析
            temperature=0.5,
            max_tokens=config.LLM_MAX_TOKENS
        )

        logger.info("✅ MeetingAnalyzerAgent初始化完成")

    def analyze_meeting(self,
                       meeting_name: str,
                       transcript: str,
                       meeting_date: Optional[str] = None) -> Dict[str, Any]:
        """分析会议记录

        Args:
            meeting_name: 会议名称
            transcript: 会议记录/转录文本
            meeting_date: 会议日期

        Returns:
            会议分析结果
        """
        logger.info(f"分析会议: {meeting_name}")

        try:
            # 从会议内容中识别核心主题
            core_topic = self._extract_core_topic(transcript)

            # 获取相关的董事长思想资料
            background_knowledge = self.retriever.retrieve_knowledge(
                core_topic,
                top_k=5
            )

            meeting_date = meeting_date or datetime.now().strftime("%Y-%m-%d")

            # 构建分析提示词
            prompt = MEETING_ANALYSIS_PROMPT.format(
                meeting_name=meeting_name,
                meeting_date=meeting_date,
                core_topic=core_topic,
                meeting_transcript=transcript,
                knowledge_base_context=background_knowledge
            )

            # 调用LLM进行深度分析
            result = self.llm.invoke(prompt)

            logger.info(f"✅ 会议分析完成: {meeting_name}")

            return {
                "status": "success",
                "meeting_name": meeting_name,
                "meeting_date": meeting_date,
                "core_topic": core_topic,
                "analysis": result.content,
                "background_knowledge": background_knowledge
            }

        except Exception as e:
            logger.error(f"❌ 会议分析失败: {e}")
            return {
                "status": "failed",
                "meeting_name": meeting_name,
                "error": str(e)
            }

    def extract_decision_logic(self, transcript: str) -> Dict[str, Any]:
        """提取决策逻辑

        Args:
            transcript: 会议记录

        Returns:
            决策逻辑分析
        """
        logger.info("提取决策逻辑")

        try:
            prompt = f"""
请从以下会议记录中提取董事长的决策逻辑：

【会议记录】：
{transcript}

【提取框架】：
1. 关键决策是什么？
2. 决策前的分析过程是什么？
3. 论证的主要步骤是什么？
4. 最终决策的核心理由是什么？
5. 这个决策反映了什么样的思维方式？
6. 这个决策的长期影响是什么？

请详细提取并分析。
"""

            result = self.llm.invoke(prompt)

            return {
                "status": "success",
                "decision_logic": result.content
            }

        except Exception as e:
            logger.error(f"❌ 决策逻辑提取失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def identify_principles(self, transcript: str) -> Dict[str, Any]:
        """识别会议中的管理原则

        Args:
            transcript: 会议记录

        Returns:
            识别的管理原则
        """
        logger.info("识别会议管理原则")

        try:
            prompt = f"""
请从以下会议记录中识别董事长体现的管理原则：

【会议记录】：
{transcript}

【识别维度】：
1. 战略原则：体现的战略思想是什么？
2. 人才原则：如何对待和激励团队？
3. 创新原则：如何推进创新？
4. 风险原则：如何管理风险？
5. 伦理原则：蕴含的道德和伦理观是什么？

请提炼具体的、可应用的原则。
"""

            result = self.llm.invoke(prompt)

            return {
                "status": "success",
                "principles": result.content
            }

        except Exception as e:
            logger.error(f"❌ 原则识别失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def _extract_core_topic(self, transcript: str) -> str:
        """从会议记录中提取核心主题

        Args:
            transcript: 会议记录

        Returns:
            核心主题
        """
        # 简单的主题提取（可以改进为更复杂的NLP）
        sentences = transcript.split("。")
        if len(sentences) > 0:
            return sentences[0][:50]  # 返回第一句的前50个字符

        return "会议主题"


# 全局实例
_meeting_analyzer_instance: Optional[MeetingAnalyzerAgent] = None


def get_meeting_analyzer() -> MeetingAnalyzerAgent:
    """获取会议分析Agent实例"""
    global _meeting_analyzer_instance

    if _meeting_analyzer_instance is None:
        _meeting_analyzer_instance = MeetingAnalyzerAgent()

    return _meeting_analyzer_instance
