# src/agents/writing_coach.py
# MVP-2: OpenCanvas协同创作助手 - 高质量的写作指导Agent

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from src.langchain_openrouter import ChatOpenRouter

from src.config import config
from src.retrieval.knowledge_retriever import get_retriever
from src.agents.prompts import (
    WRITING_ASSISTANT_SYSTEM_PROMPT,
    WRITING_SUGGESTION_PROMPT,
    STYLE_LEARNING_PROMPT,
    get_task_prompt
)

logger = logging.getLogger(__name__)


class WritingCoachAgent:
    """高级写作指导Agent - MVP-2的核心

    功能：
    1. 基于董事长思想库的创作建议
    2. 风格学习和指导
    3. 内容质量评估和优化
    4. 创作过程中的实时反馈
    5. 结构化的写作指导
    """

    def __init__(self):
        """初始化写作指导Agent"""
        self.retriever = get_retriever()

        # 使用高性能的LLM进行创作指导
        self.llm = ChatOpenRouter(
            openrouter_api_key=config.OPENROUTER_API_KEY,
            model=config.MODEL_CHAT,  # 使用对话模型以获得更好的创作反馈
            temperature=0.7,  # 稍高的温度用于创意建议
            max_tokens=config.LLM_MAX_TOKENS
        )

        logger.info("✅ WritingCoachAgent初始化完成")

    def suggest_content(self,
                       topic: str,
                       purpose: str,
                       current_content: str,
                       audience: Optional[str] = None) -> Dict[str, Any]:
        """为创作内容提供建议

        Args:
            topic: 创作主题
            purpose: 创作目的
            current_content: 当前的创作内容
            audience: 目标受众

        Returns:
            创作建议
        """
        logger.info(f"📝 为'{topic}'提供创作建议")

        try:
            # 从知识库检索相关思想
            relevant_thoughts = self.retriever.retrieve_knowledge(topic, top_k=8)

            # 构建建议提示词
            prompt = WRITING_SUGGESTION_PROMPT.format(
                topic=topic,
                purpose=purpose,
                audience=audience or "内部管理层",
                current_content=current_content,
                relevant_thoughts=relevant_thoughts
            )

            # 调用LLM获得建议
            result = self.llm.invoke(prompt)

            logger.info(f"✅ 创作建议完成: {topic}")

            return {
                "status": "success",
                "topic": topic,
                "suggestions": result.content,
                "relevant_thoughts": relevant_thoughts,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ 创作建议失败: {e}")
            return {
                "status": "failed",
                "topic": topic,
                "error": str(e)
            }

    def analyze_style(self, writing_samples: List[str]) -> Dict[str, Any]:
        """分析董事长的写作风格

        Args:
            writing_samples: 写作样本列表

        Returns:
            风格分析结果
        """
        logger.info("🎨 分析写作风格")

        try:
            # 组织样本
            samples_text = "\n\n---\n\n".join(writing_samples)

            # 使用风格学习Prompt
            prompt = STYLE_LEARNING_PROMPT.format(
                writing_samples=samples_text
            )

            result = self.llm.invoke(prompt)

            return {
                "status": "success",
                "style_analysis": result.content,
                "sample_count": len(writing_samples),
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ 风格分析失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def evaluate_draft(self,
                      topic: str,
                      draft: str,
                      revision_round: int = 1) -> Dict[str, Any]:
        """评估初稿质量

        Args:
            topic: 内容主题
            draft: 初稿内容
            revision_round: 修订轮次

        Returns:
            质量评估结果
        """
        logger.info(f"📊 评估初稿质量 (第{revision_round}轮修订)")

        try:
            # 获取相关思想
            relevant_thoughts = self.retriever.retrieve_knowledge(topic, top_k=5)

            # 构建评估提示词
            evaluation_prompt = f"""
请对以下内容进行全面的质量评估，并提供具体的改进建议。

【主题】：{topic}

【当前初稿】：
{draft}

【相关参考思想】：
{relevant_thoughts}

【评估维度】
1. **观点准确度**：观点是否准确反映了董事长的思想？
2. **逻辑严密性**：论述的逻辑是否严密清晰？
3. **风格一致性**：表达风格是否符合董事长的特点？
4. **深度充分度**：思想的挖掘是否充分？
5. **表达清晰度**：表述是否清晰有力？

【改进建议】
请提供具体的改进方向和修改建议。

【修订优先级】
请指出最需要改进的方面。
"""

            result = self.llm.invoke(evaluation_prompt)

            return {
                "status": "success",
                "topic": topic,
                "revision_round": revision_round,
                "evaluation": result.content,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ 初稿评估失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def suggest_structure(self, topic: str, purpose: str) -> Dict[str, Any]:
        """为创作建议最优的内容结构

        Args:
            topic: 主题
            purpose: 创作目的

        Returns:
            结构建议
        """
        logger.info(f"🏗️ 为'{topic}'建议内容结构")

        try:
            # 获取相关思想
            knowledge = self.retriever.retrieve_knowledge(topic, top_k=5)

            structure_prompt = f"""
请为以下主题的创作建议一个清晰、有说服力的内容结构。

【主题】：{topic}
【创作目的】：{purpose}

【相关思想参考】：
{knowledge}

【结构建议要求】
1. 清晰的逻辑层次（通常3-5个层级）
2. 每个层级的核心内容和关键论点
3. 信息之间的逻辑关联
4. 是否符合董事长的思维方式

【输出格式】
请以清晰的树状结构呈现：
```
## 第一部分：[标题]
概述：[简要说明]
关键点：
- 观点1
- 观点2
- ...

### 第一部分第一小节：[标题]
...

## 第二部分：[标题]
...
```
"""

            result = self.llm.invoke(structure_prompt)

            return {
                "status": "success",
                "topic": topic,
                "structure": result.content,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ 结构建议失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def generate_opening(self,
                        topic: str,
                        context: str) -> Dict[str, Any]:
        """生成高质量的开篇

        Args:
            topic: 创作主题
            context: 创作背景和上下文

        Returns:
            开篇建议
        """
        logger.info(f"✨ 为'{topic}'生成开篇")

        try:
            knowledge = self.retriever.retrieve_knowledge(topic, top_k=3)

            opening_prompt = f"""
请为以下主题生成一个高质量的开篇，体现董事长的思维方式和表达风格。

【主题】：{topic}
【背景】：{context}

【相关思想】：
{knowledge}

【开篇要求】
1. 开门见山，直击主题
2. 体现董事长的思维特点
3. 引发读者的思考和兴趣
4. 为后续论述奠定基础
5. 通常100-200字

【输出】
直接提供开篇文本。
"""

            result = self.llm.invoke(opening_prompt)

            return {
                "status": "success",
                "topic": topic,
                "opening": result.content,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"❌ 开篇生成失败: {e}")
            return {
                "status": "failed",
                "error": str(e)
            }

    def batch_suggest(self, topics_with_drafts: List[Dict[str, str]]) -> Dict[str, Any]:
        """批量为多个创作提供建议

        Args:
            topics_with_drafts: 主题-初稿对列表

        Returns:
            批量建议结果
        """
        logger.info(f"📋 处理{len(topics_with_drafts)}个创作建议")

        results = []
        for item in topics_with_drafts:
            topic = item.get("topic", "")
            draft = item.get("draft", "")
            purpose = item.get("purpose", "")

            result = self.suggest_content(topic, purpose, draft)
            results.append(result)

        return {
            "status": "success",
            "total": len(topics_with_drafts),
            "results": results,
            "timestamp": datetime.utcnow().isoformat()
        }


# 全局实例
_writing_coach_instance: Optional[WritingCoachAgent] = None


def get_writing_coach() -> WritingCoachAgent:
    """获取写作指导Agent实例"""
    global _writing_coach_instance

    if _writing_coach_instance is None:
        _writing_coach_instance = WritingCoachAgent()

    return _writing_coach_instance
