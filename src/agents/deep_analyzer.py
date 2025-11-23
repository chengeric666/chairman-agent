# src/agents/deep_analyzer.py
# MVP-3: 深度分析Agent - 思想体系化和会议分析的集成实现

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from src.langchain_openrouter import ChatOpenRouter

from src.config import config
from src.retrieval.knowledge_retriever import get_retriever
from src.agents.prompts import (
    THOUGHT_ANALYSIS_SYSTEM_PROMPT,
    THOUGHT_ANALYSIS_PROMPT,
    MEETING_ANALYSIS_SYSTEM_PROMPT,
    MEETING_ANALYSIS_PROMPT,
)

logger = logging.getLogger(__name__)


class DeepAnalyzerAgent:
    """深度分析Agent - MVP-3的核心

    功能：
    1. 思想体系化分析
    2. 会议决策逻辑提炼
    3. 管理原则识别
    4. 深度研究和洞察
    5. 知识体系化总结
    """

    def __init__(self):
        """初始化深度分析Agent"""
        self.retriever = get_retriever()

        # 使用推理模型进行深度分析
        self.llm = ChatOpenRouter(
            openrouter_api_key=config.OPENROUTER_API_KEY,
            model=config.MODEL_REASONING,  # 使用推理模型
            temperature=0.5,  # 降低温度以获得更精确的分析
            max_tokens=config.LLM_MAX_TOKENS
        )

        logger.info("✅ DeepAnalyzerAgent初始化完成")

    def systemize_thought(self, topic: str, depth_level: str = "high") -> Dict[str, Any]:
        """体系化思想 - MVP-3核心功能

        Args:
            topic: 要体系化的主题
            depth_level: 分析深度（low/medium/high）

        Returns:
            体系化结果
        """
        logger.info(f"🧠 思想体系化分析: {topic} (深度:{depth_level})")

        try:
            # 根据深度级别调整top_k
            top_k_map = {"low": 5, "medium": 10, "high": 15}
            top_k = top_k_map.get(depth_level, 10)

            # 从知识库检索相关资料
            knowledge = self.retriever.retrieve_knowledge(topic, top_k=top_k)

            if not knowledge or knowledge.strip() == "没有找到相关资料":
                return {
                    "status": "insufficient_data",
                    "topic": topic,
                    "message": "知识库中没有足够的相关资料进行体系化分析"
                }

            # 构建分析提示词
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
                "depth_level": depth_level,
                "analysis": result.content,
                "knowledge_sources": knowledge,
                "timestamp": datetime.utcnow().isoformat(),
                "type": "thought_systemization"
            }

        except Exception as e:
            logger.error(f"❌ 思想体系化失败: {e}")
            return {
                "status": "failed",
                "topic": topic,
                "error": str(e)
            }

    def analyze_meeting(self,
                       meeting_name: str,
                       transcript: str,
                       meeting_date: Optional[str] = None,
                       context: Optional[str] = None) -> Dict[str, Any]:
        """深度分析会议记录

        Args:
            meeting_name: 会议名称
            transcript: 会议记录/转录
            meeting_date: 会议日期
            context: 会议背景信息

        Returns:
            会议分析结果
        """
        logger.info(f"📋 分析会议: {meeting_name}")

        try:
            # 从会议内容识别核心主题
            core_topic = self._extract_core_topic(transcript)

            # 获取相关背景知识
            background_knowledge = self.retriever.retrieve_knowledge(
                core_topic,
                top_k=8
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
                "background_knowledge": background_knowledge,
                "timestamp": datetime.utcnow().isoformat(),
                "type": "meeting_analysis"
            }

        except Exception as e:
            logger.error(f"❌ 会议分析失败: {e}")
            return {
                "status": "failed",
                "meeting_name": meeting_name,
                "error": str(e)
            }

    def extract_principles(self, topic: str) -> Dict[str, Any]:
        """提取和系统化管理原则

        Args:
            topic: 主题

        Returns:
            管理原则提取结果
        """
        logger.info(f"📌 提取管理原则: {topic}")

        try:
            knowledge = self.retriever.retrieve_knowledge(topic, top_k=12)

            principles_prompt = f"""
请深入分析董事长关于"{topic}"的思想中包含的核心管理原则。

【相关资料】：
{knowledge}

【分析任务】
1. **最核心的原则**：这个主题最核心的管理原则是什么？
2. **原则的内涵**：这个原则的深层含义和本质是什么？
3. **多维度应用**：这个原则在战略、人才、创新、执行等维度如何应用？
4. **原则之间的关系**：多个原则之间的逻辑关系如何？
5. **哲学基础**：这些原则基于什么样的价值观和世界观？
6. **实践验证**：这些原则在实践中是如何验证的？
7. **传承意义**：对于管理层学习和传承的意义是什么？

【输出格式】
## 核心原则体系
[体系化呈现所有识别的原则]

## 原则的深层含义
[逐个分析每个原则的本质和内涵]

## 应用维度分析
[在不同维度的具体应用]

## 原则的哲学基础
[分析价值观和世界观基础]

## 管理实践启示
[对管理层的具体启示]
"""

            result = self.llm.invoke(principles_prompt)

            return {
                "status": "success",
                "topic": topic,
                "principles": result.content,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ 原则提取失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def identify_connections(self, topics: List[str]) -> Dict[str, Any]:
        """识别多个思想之间的关联和关系

        Args:
            topics: 主题列表

        Returns:
            关联分析结果
        """
        logger.info(f"🔗 识别思想关联: {topics}")

        try:
            # 获取所有主题的资料
            knowledge_map = {}
            for topic in topics:
                knowledge_map[topic] = self.retriever.retrieve_knowledge(topic, top_k=5)

            # 构建关联分析提示词
            topics_str = "、".join(topics)
            knowledge_str = "\n\n".join([
                f"【{topic}的思想】：\n{knowledge_map[topic]}"
                for topic in topics
            ])

            connection_prompt = f"""
请深度分析董事长关于以下主题的思想之间的关联和相互关系。

【主题】：{topics_str}

【相关资料】：
{knowledge_str}

【分析维度】
1. **共同基础**：这些思想基于什么样的共同原则或价值观？
2. **内在逻辑**：它们之间如何相互支持和补充？
3. **演进关系**：这些思想是如何相互演进和深化的？
4. **应用协同**：在实践中如何协同发挥作用？
5. **体系性**：这些思想形成的完整体系是什么样的？
6. **优先级**：在董事长的思想体系中的重要性顺序如何？

【输出格式】
## 思想体系概览
[总体呈现这些思想如何形成有机的整体]

## 逐对关联分析
[分析任意两个主题之间的关联]

## 完整体系框架
[呈现所有主题形成的思想框架]

## 协同应用指南
[如何在实践中协同应用这些思想]
"""

            result = self.llm.invoke(connection_prompt)

            return {
                "status": "success",
                "topics": topics,
                "connections": result.content,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ 关联分析失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def comprehensive_research(self, topic: str, research_questions: Optional[List[str]] = None) -> Dict[str, Any]:
        """进行综合性的深度研究

        Args:
            topic: 研究主题
            research_questions: 研究问题列表

        Returns:
            研究结果
        """
        logger.info(f"🔬 进行综合性深度研究: {topic}")

        try:
            # 获取相关知识
            knowledge = self.retriever.retrieve_knowledge(topic, top_k=20)

            # 默认研究问题
            if not research_questions:
                research_questions = [
                    "董事长关于这个主题的核心观点是什么？",
                    "这个思想的演进过程如何？",
                    "在实践中有哪些成功的应用案例？",
                    "存在的主要挑战和应对方式是什么？",
                    "对未来发展的启示是什么？"
                ]

            # 构建研究提示词
            questions_str = "\n".join([f"{i+1}. {q}" for i, q in enumerate(research_questions)])

            research_prompt = f"""
请对以下主题进行综合性的深度研究，系统回答提出的研究问题。

【研究主题】：{topic}

【研究问题】：
{questions_str}

【参考资料】：
{knowledge}

【研究要求】
1. 系统性：按照逻辑顺序组织答案
2. 深度性：充分挖掘问题的本质
3. 完整性：全面覆盖所有研究问题
4. 证据性：关键论点要有原文引用支撑
5. 启发性：提供有价值的新洞察

【输出格式】
## 研究综述
[对主题的全面认识]

## 逐问解答
### 问题1: [问题]
[深度回答和分析]

### 问题2: [问题]
[深度回答和分析]

...

## 综合启示
[对管理实践的综合启示]

## 延伸思考
[可以进一步研究的相关问题]
"""

            result = self.llm.invoke(research_prompt)

            return {
                "status": "success",
                "topic": topic,
                "research_questions": research_questions,
                "research_result": result.content,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ 深度研究失败: {e}")
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
        sentences = transcript.split("。")
        if len(sentences) > 0:
            # 返回第一句的前50个字符作为主题
            core = sentences[0].strip()
            return core[:100] if len(core) > 100 else core

        return "会议主题"


# 全局实例
_deep_analyzer_instance: Optional[DeepAnalyzerAgent] = None


def get_deep_analyzer() -> DeepAnalyzerAgent:
    """获取深度分析Agent实例"""
    global _deep_analyzer_instance

    if _deep_analyzer_instance is None:
        _deep_analyzer_instance = DeepAnalyzerAgent()

    return _deep_analyzer_instance
