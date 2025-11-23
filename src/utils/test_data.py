# src/utils/test_data.py
# 测试数据生成器 - 用于开发和演示

from typing import List, Dict
from datetime import datetime, timedelta
import random


class TestDataGenerator:
    """测试数据生成器"""

    @staticmethod
    def generate_sample_notes() -> List[Dict]:
        """生成示例笔记"""
        notes = [
            {
                "id": "note_001",
                "content": """人才战略是企业发展的核心。我们需要建立完善的人才选拔、培养、激励机制。

关键原则：
1. 选人优于培人 - 选对人比后期培养更重要
2. 激励要有梯度 - 不同层级不同激励方式
3. 留用核心人才 - 通过股权、事业平台等方式留住关键人物
4. 持续学习 - 建立学习型组织文化

我认为人才的最大价值体现在他们的成长潜力。一个聪慧、勤奋、正直的年轻人，
经过正确的培养，能创造远超预期的价值。但这需要我们投入大量的时间和精力。""",
                "created_at": (datetime.utcnow() - timedelta(days=30)).isoformat(),
                "metadata": {"tags": ["人才", "战略", "管理"], "category": "管理哲学"}
            },
            {
                "id": "note_002",
                "content": """关于创新的思考：创新不是为了创新而创新，而是要解决实际的商业问题。

真正的创新应该具备以下特征：
1. 解决真实问题 - 面向市场需求
2. 有可行性 - 不是天马行空的想法
3. 能产生价值 - 带来经济效益或战略价值
4. 可持续 - 不是一次性的成功

我见过很多企业投入大量资源进行技术创新，但最后发现市场没有需求。
真正成功的创新，往往是那些看似简单、但能真正改变用户体验的东西。""",
                "created_at": (datetime.utcnow() - timedelta(days=60)).isoformat(),
                "metadata": {"tags": ["创新", "商业", "战略"], "category": "管理思想"}
            },
            {
                "id": "note_003",
                "content": """关于财务管理的几点体会：

财务不只是会计记账，而是企业价值创造的重要手段。我们需要：

1. 建立科学的预算制度 - 让每个部门都清楚资金的来源和用途
2. 加强成本控制 - 在不影响质量的前提下降低成本
3. 提高资本效率 - 同样的投入，创造更多的价值
4. 风险管理 - 提前识别和应对财务风险

一个企业的财务状况，直接反映了管理的水平。良好的财务管理，
不仅能帮助企业度过危机，还能支撑长期的可持续发展。""",
                "created_at": (datetime.utcnow() - timedelta(days=90)).isoformat(),
                "metadata": {"tags": ["财务", "管理", "成本"], "category": "财务管理"}
            },
            {
                "id": "note_004",
                "content": """会议记录 - 2025年Q1战略规划会议

讨论内容：新年度的战略重点

我的观点：
1. 今年要重点关注市场竞争加剧的挑战
2. 利用我们的成本优势和质量优势来竞争
3. 加大研发投入，为未来储备竞争力
4. 加强团队建设，这是一切的基础

最后决定：按照提议的方向推进，各部门制定具体实施计划。""",
                "created_at": (datetime.utcnow() - timedelta(days=10)).isoformat(),
                "metadata": {"tags": ["会议", "战略", "决策"], "category": "会议记录"}
            },
        ]
        return notes

    @staticmethod
    def generate_sample_queries() -> List[str]:
        """生成示例查询"""
        queries = [
            "人才管理的关键要素有哪些？",
            "如何建立创新文化？",
            "成本控制的最佳实践是什么？",
            "在竞争中如何保持优势？",
            "如何激励员工的积极性？",
            "财务管理对企业发展的影响？",
            "怎样培养下一代领导者？",
            "企业文化对经营的重要性？",
        ]
        return queries

    @staticmethod
    def generate_sample_topics() -> List[str]:
        """生成示例主题"""
        topics = [
            "人才战略",
            "创新管理",
            "财务管理",
            "成本控制",
            "团队建设",
            "文化建设",
            "竞争战略",
            "市场营销"
        ]
        return topics

    @staticmethod
    def generate_mock_embeddings(dimension: int = 768, count: int = 5):
        """
        生成模拟向量

        注：dimension=768对应Ollama的nomic-embed-text模型
        """
        embeddings = []
        for _ in range(count):
            # 生成随机向量（应该用真实的embedding模型）
            embedding = [random.random() for _ in range(dimension)]
            # 归一化
            norm = sum(x ** 2 for x in embedding) ** 0.5
            embedding = [x / (norm + 1e-8) for x in embedding]
            embeddings.append(embedding)
        return embeddings


# ==================== 快速助手函数 ====================

def get_test_notes() -> List[Dict]:
    """获取测试笔记"""
    return TestDataGenerator.generate_sample_notes()


def get_test_queries() -> List[str]:
    """获取测试查询"""
    return TestDataGenerator.generate_sample_queries()


def get_test_topics() -> List[str]:
    """获取测试主题"""
    return TestDataGenerator.generate_sample_topics()


def create_mock_knowledge_base() -> Dict[str, List]:
    """创建模拟知识库"""
    return {
        "notes": get_test_notes(),
        "embeddings": TestDataGenerator.generate_mock_embeddings(count=4),
        "metadata": {
            "total": 4,
            "categories": ["管理哲学", "管理思想", "财务管理", "会议记录"],
            "tags": ["人才", "战略", "管理", "创新", "财务", "成本"]
        }
    }


# 方便在脚本中使用
if __name__ == "__main__":
    # 演示数据生成
    print("=== 测试笔记 ===")
    for note in get_test_notes():
        print(f"\n{note['id']}:")
        print(f"  内容: {note['content'][:100]}...")
        print(f"  标签: {note['metadata']['tags']}")

    print("\n=== 测试查询 ===")
    for query in get_test_queries():
        print(f"  - {query}")

    print("\n=== 测试主题 ===")
    for topic in get_test_topics():
        print(f"  - {topic}")
