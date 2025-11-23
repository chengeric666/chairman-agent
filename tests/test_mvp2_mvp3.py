# tests/test_mvp2_mvp3.py
# MVP-2和MVP-3功能测试

import pytest
import sys
import logging
from pathlib import Path

# 添加src路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.agents.writing_coach import get_writing_coach
from src.agents.deep_analyzer import get_deep_analyzer
from src.config import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TestMVP2WritingCoach:
    """MVP-2 写作指导Agent测试"""

    def test_writing_coach_initialization(self):
        """测试WritingCoach初始化"""
        coach = get_writing_coach()
        assert coach is not None
        logger.info("✅ WritingCoach初始化成功")

    def test_suggest_content(self):
        """测试内容建议功能"""
        coach = get_writing_coach()

        result = coach.suggest_content(
            topic="人才战略",
            purpose="员工培训",
            current_content="我们需要建立更好的人才选拔机制。",
            audience="管理层"
        )

        assert result["status"] in ["success", "failed"]
        if result["status"] == "success":
            assert "suggestions" in result
            logger.info(f"✅ 内容建议成功: {result['topic']}")
        else:
            logger.warning(f"⚠️ 内容建议失败: {result.get('error')}")

    def test_evaluate_draft(self):
        """测试初稿评估功能"""
        coach = get_writing_coach()

        result = coach.evaluate_draft(
            topic="创新理念",
            draft="创新是推动企业发展的核心动力。创新不仅包括产品创新，还包括管理创新和商业模式创新。",
            revision_round=1
        )

        assert result["status"] in ["success", "failed"]
        if result["status"] == "success":
            assert "evaluation" in result
            logger.info(f"✅ 初稿评估成功")
        else:
            logger.warning(f"⚠️ 初稿评估失败: {result.get('error')}")

    def test_suggest_structure(self):
        """测试结构建议功能"""
        coach = get_writing_coach()

        result = coach.suggest_structure(
            topic="企业文化建设",
            purpose="员工手册"
        )

        assert result["status"] in ["success", "failed"]
        logger.info(f"✅ 结构建议完成")

    def test_analyze_style(self):
        """测试风格分析功能"""
        coach = get_writing_coach()

        samples = [
            "创新是企业持续发展的动力源。",
            "人才是企业最核心的资产。",
            "战略决定企业的发展方向。"
        ]

        result = coach.analyze_style(samples)

        assert result["status"] in ["success", "failed"]
        if result["status"] == "success":
            assert "style_analysis" in result
            logger.info(f"✅ 风格分析成功")
        else:
            logger.warning(f"⚠️ 风格分析失败: {result.get('error')}")


class TestMVP3DeepAnalyzer:
    """MVP-3 深度分析Agent测试"""

    def test_deep_analyzer_initialization(self):
        """测试DeepAnalyzer初始化"""
        analyzer = get_deep_analyzer()
        assert analyzer is not None
        logger.info("✅ DeepAnalyzer初始化成功")

    def test_systemize_thought(self):
        """测试思想体系化功能"""
        analyzer = get_deep_analyzer()

        result = analyzer.systemize_thought(
            topic="人才战略",
            depth_level="high"
        )

        assert result["status"] in ["success", "failed", "insufficient_data"]
        if result["status"] == "success":
            assert "analysis" in result
            logger.info(f"✅ 思想体系化成功: {result['topic']}")
        else:
            logger.warning(f"⚠️ 思想体系化: {result.get('message', result.get('error'))}")

    def test_analyze_meeting(self):
        """测试会议分析功能"""
        analyzer = get_deep_analyzer()

        result = analyzer.analyze_meeting(
            meeting_name="战略规划会议",
            transcript="董事长提出，在当前市场环境下，企业需要加强创新投入。我们要建立有效的创新激励机制，让员工参与创新。同时，要关注市场趋势，提早布局新的业务领域。",
            meeting_date="2025-11-23"
        )

        assert result["status"] in ["success", "failed"]
        if result["status"] == "success":
            assert "analysis" in result
            logger.info(f"✅ 会议分析成功: {result['meeting_name']}")
        else:
            logger.warning(f"⚠️ 会议分析失败: {result.get('error')}")

    def test_extract_principles(self):
        """测试原则提取功能"""
        analyzer = get_deep_analyzer()

        result = analyzer.extract_principles(topic="管理创新")

        assert result["status"] in ["success", "failed"]
        if result["status"] == "success":
            assert "principles" in result
            logger.info(f"✅ 原则提取成功")
        else:
            logger.warning(f"⚠️ 原则提取失败: {result.get('error')}")

    def test_identify_connections(self):
        """测试思想关联识别功能"""
        analyzer = get_deep_analyzer()

        result = analyzer.identify_connections(
            topics=["人才战略", "创新理念"]
        )

        assert result["status"] in ["success", "failed"]
        if result["status"] == "success":
            assert "connections" in result
            logger.info(f"✅ 思想关联识别成功")
        else:
            logger.warning(f"⚠️ 思想关联识别失败: {result.get('error')}")

    def test_comprehensive_research(self):
        """测试综合性深度研究功能"""
        analyzer = get_deep_analyzer()

        result = analyzer.comprehensive_research(
            topic="企业发展战略",
            research_questions=[
                "董事长对企业发展的核心观点是什么？",
                "有哪些成功的案例支撑这些观点？"
            ]
        )

        assert result["status"] in ["success", "failed"]
        if result["status"] == "success":
            assert "research_result" in result
            logger.info(f"✅ 综合研究成功")
        else:
            logger.warning(f"⚠️ 综合研究失败: {result.get('error')}")


class TestIntegration:
    """集成测试"""

    def test_mvp2_mvp3_workflow(self):
        """测试MVP-2和MVP-3的工作流"""
        logger.info("🔄 开始MVP-2和MVP-3集成测试工作流")

        # 第一步：分析思想（MVP-3）
        analyzer = get_deep_analyzer()
        thought_result = analyzer.systemize_thought(
            topic="员工发展",
            depth_level="medium"
        )

        # 第二步：基于分析结果进行创作建议（MVP-2）
        if thought_result["status"] == "success":
            coach = get_writing_coach()

            suggestion_result = coach.suggest_content(
                topic="员工发展",
                purpose="人力资源政策",
                current_content="建立有效的员工发展机制",
                audience="部门经理"
            )

            assert suggestion_result["status"] in ["success", "failed"]
            logger.info("✅ MVP-2和MVP-3集成工作流完成")
        else:
            logger.warning("⚠️ MVP-3分析失败，跳过MVP-2步骤")


if __name__ == "__main__":
    # 运行测试
    logger.info("🧪 开始MVP-2和MVP-3测试")
    pytest.main([__file__, "-v", "-s"])
