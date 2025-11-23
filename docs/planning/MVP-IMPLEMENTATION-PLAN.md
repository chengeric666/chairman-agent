# 🚀 "智董"MVP 完整落地方案

**版本**：v1.0 - 敏捷落地版
**编写日期**：2025年11月22日
**实施周期**：3-4周
**执行方式**：由Claude单独落地核心框架 + 用户持续优化

---

## 📋 目录

1. [Executive Summary](#executive-summary)
2. [项目整体架构](#项目整体架构)
3. [关键技术决策](#关键技术决策)
4. [完整实施路线图](#完整实施路线图)
5. [模块详细设计](#模块详细设计)
6. [部署与验证](#部署与验证)
7. [持续优化策略](#持续优化策略)

---

## Executive Summary

### 本方案的核心理念

**"智董"不是一个开源项目的简单集合，而是一个为董事长度身定制的个性化AI智能体系统**。

关键洞察：
1. **数据是最宝贵的资产**：董事长的思想资料是独一无二的，没有任何通用AI能替代
2. **Prompt工程比模型选择更重要**：如何提炼思想逻辑、如何生成有深度的总结，这决定了系统的实际价值
3. **增量验证优于完美设计**：先让基础框架跑起来，再逐步优化Agent工作流和Prompt

### 本方案的承诺

✅ **完全可部署的代码框架**（所有关键模块都会提供参考实现）
✅ **详细的技术决策文档**（解释为什么这样设计）
✅ **分阶段MVP验证**（3周内可验证核心价值）
✅ **清晰的扩展路径**（从MVP到生产环境的完整指路）
❌ **生产级部署**（需要你在实际环境中验证和调优）
❌ **完美的Prompt**（需要与真实数据迭代）

---

## 项目整体架构

### 3.1 技术栈概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户界面层                              │
│  ┌──────────────────────┐    ┌──────────────────────┐           │
│  │  Open-Notebook UI    │    │   OpenCanvas UI      │           │
│  │  (知识库 + 查询)      │    │  (协同创作)          │           │
│  └──────────────────────┘    └──────────────────────┘           │
└────────────┬────────────────────────────────────┬────────────────┘
             │                                    │
┌────────────▼────────────────────────────────────▼────────────────┐
│                      API与集成层                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. 统一认证 (SSO) - Keycloak                          │   │
│  │  2. 数据同步服务 - Open-Notebook → VDB                │   │
│  │  3. Agent服务网关 - 路由到OpenDeepResearch            │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────┬───────────────────────────────────────────────────┘
             │
┌────────────▼───────────────────────────────────────────────────┐
│                      智能体服务层                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ OpenDeepResearch │  │  OpenCanvas      │  │  内部查询    │ │
│  │ (思想体系化)      │  │  Agent           │  │  Agent       │ │
│  │ (会议分析)        │  │  (风格学习)      │  │  (简单检索)  │ │
│  │ 基于LangGraph     │  │  基于LangGraph   │  │  基于RAG     │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└────────────┬───────────────────────────────────────────────────┘
             │
┌────────────▼───────────────────────────────────────────────────┐
│                    数据与模型层 (私有化)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │ SurrealDB    │  │  Vector DB   │  │  私有化LLM        │   │
│  │ (核心知识库)  │  │  (向量索引)   │  │  (DeepSeek via   │   │
│  │ Open-Notebook│  │  Milvus/     │  │   OpenRouter)    │   │
│  │ 数据存储     │  │  Weaviate    │  │                  │   │
│  └──────────────┘  └──────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 数据流向（核心业务流程）

**场景一：思想体系化**
```
董事长语音/文档/笔记
    ↓
Open-Notebook (导入 + 预处理)
    ↓
触发 OpenDeepResearch Agent (改造版)
    ├→ 查询内部知识库 (通过VDB RAG)
    ├→ 分析思想逻辑 (高质量Prompt)
    └→ 生成体系化报告
    ↓
结果回写到 Open-Notebook
    ↓
秘书审阅 → 董事长查看
```

**场景二：会议逻辑提炼**
```
会议记录 (音频/文本)
    ↓
Open-Notebook (导入)
    ↓
触发 会议分析Agent (OpenDeepResearch改造版)
    ├→ 识别核心议题
    ├→ 分析董事长的观点和论证
    └→ 提炼决策逻辑
    ↓
生成"逻辑提炼报告"
    ↓
用于管理层培训/案例库
```

**场景三：家族宪章创作（后续）**
```
已体系化的思想库
    ↓
OpenCanvas (创建新项目)
    ↓
AI+秘书协同创作
    ├→ AI利用Reflection Agent学习风格
    ├→ 秘书实时编辑
    └→ Agent持续改进建议
    ↓
《家族宪章》定稿
```

---

## 关键技术决策

### 4.1 为什么选择 OpenRouter + DeepSeek？

**当前情况**：
- 你已有 OpenRouter 的 DeepSeek API 密钥
- DeepSeek-R1 擅长推理和逻辑分析（适合"逻辑提炼"场景）
- DeepSeek-V3 支持工具调用（适合Agent）

**优势**：
1. **成本最优**：DeepSeek API价格 vs OpenAI/Anthropic ≈ 1:10
2. **性能充足**：在推理和理解方面表现非常好
3. **即插即用**：OpenRouter已支持，无需额外配置
4. **私有化选项**：如果后续需要完全私有，可以部署本地模型

**决策**：
- MVP阶段使用 DeepSeek via OpenRouter（快速验证）
- 后续可考虑部署本地 Qwen/Llama（完全私有化）

### 4.2 Open-Notebook vs 自建知识库

**决策**：优先使用 Open-Notebook

**理由**：
1. **功能完整**：已有知识管理、多模态支持、REST API
2. **质量有保证**：MIT开源，社区活跃
3. **降低复杂度**：不需要自建，集中在Agent工作流上
4. **可扩展**：提供REST API，便于与其他系统集成

**集成方式**：
```
Open-Notebook API
    ↓
内部知识库查询工具 (我们自己开发)
    ↓
OpenDeepResearch Agent
OpenCanvas Agent
```

### 4.3 Vector DB 的选择：Milvus vs Weaviate

**决策**：使用 **Milvus**（开源、高性能、易部署）

**理由**：
- 对标Pinecone，但完全开源
- Docker部署，性能好
- Python SDK成熟，易集成

**对比**：
| 维度 | Milvus | Weaviate | Pinecone |
|-----|--------|----------|---------|
| 开源 | ✅ | ✅ | ❌ |
| 部署 | Docker | Docker | 云服务 |
| 成本 | 低 | 低 | 中等 |
| 性能 | 优 | 良 | 优 |
| 易用性 | 中 | 中 | 高 |

### 4.4 认证方案：SSO集成

**方案**：使用 **Keycloak** (开源OIDC/OAuth服务)

**原因**：
- Open-Notebook支持通过API集成
- OpenCanvas有Supabase认证，可配置OIDC
- 更安全，更符合"绝对私有"的要求
- 可与现有企业目录集成

---

## 完整实施路线图

### 调整后的MVP优先级

根据产品价值主张和实现复杂度，重新调整了MVP的实施顺序：

1. **MVP-1（第1-2周）**：Open-Notebook + 改造的简单内部知识库查询Agent
   - 核心价值：董事长思想资料的管理、存储和智能检索
   - 基础设施：部署Open-Notebook，建立知识库查询能力
   - 交付物：完整的知识库管理和查询系统

2. **MVP-2（第3周）**：OpenCanvas协同创作集成
   - 核心价值：基于董事长思想库的协同创作能力
   - 依赖：MVP-1的知识库和检索工具
   - 交付物：OpenCanvas与知识库的集成，支持协同创作

3. **MVP-3（第4周）**：集成OpenDeepResearch的改造
   - 核心价值：思想体系化分析和深度研究
   - 依赖：MVP-1的知识库，MVP-2的创作能力
   - 交付物：完整的深度研究Agent改造和集成

---

### 第1阶段：MVP-1基础设施搭建（第1-2周）

**目标**：完成Open-Notebook私有化部署，建立知识库管理和查询基础

#### 1.1 开发环境与Open-Notebook部署（3-4天）
```
第1周任务：
□ 准备开发环境
  ├─ Python 3.9+ 虚拟环境
  ├─ Node.js环境（用于Open-Notebook前端）
  └─ Docker环境（用于向量数据库等服务）

□ 部署Open-Notebook
  ├─ 克隆Open-Notebook项目
  ├─ 配置数据库（SurrealDB或PostgreSQL）
  ├─ 启动Web UI验证可访问
  ├─ 配置REST API端点
  └─ 测试数据上传和基础功能

□ 部署Milvus向量数据库
  ├─ Docker Compose启动Milvus
  ├─ 创建知识库集合schema
  ├─ 验证连接可用
  └─ 准备向量存储结构

交付物：
- docker-compose.yml (包含Open-Notebook和Milvus)
- .env配置文件（API密钥、连接字符串）
- 部署验证脚本
```

#### 1.2 知识库查询工具开发（3-4天）
```
第1.5-2周任务：

A. 知识库查询核心模块 (Python)
  ├─ 完成 src/retrieval/knowledge_retriever.py
  │  ├─ 向量化文本（使用轻量级embedding模型）
  │  ├─ Milvus向量搜索
  │  └─ Open-Notebook数据聚合
  ├─ 测试向量检索质量
  └─ 优化检索参数

B. 数据同步服务 (Python)
  ├─ 完成 src/sync_service/sync_engine.py
  │  ├─ 监听Open-Notebook数据变化
  │  ├─ 提取和清洗文本
  │  ├─ 生成向量并存储
  │  └─ 管理同步状态
  ├─ 实现后台同步任务
  └─ 添加同步监控和日志

C. 简单查询Agent (Python)
  ├─ 创建 src/agents/simple_knowledge_agent.py
  │  ├─ LangChain Agent框架
  │  ├─ 知识库查询工具集成
  │  ├─ 简单的Prompt工程
  │  └─ 结果格式化
  ├─ 单元测试
  └─ 集成测试

交付物：
- 完整的知识库查询工具链
- 可工作的数据同步服务
- 简单但可用的知识库查询Agent
- 完整的单元和集成测试
```

#### 1.3 API网关和端到端集成（1-2天）
```
第2周后期任务：

A. FastAPI网关
  ├─ 创建 src/api/gateway.py
  │  ├─ 知识库搜索端点
  │  ├─ Agent查询端点
  │  └─ 健康检查端点
  ├─ 错误处理和日志
  └─ API文档生成

B. 端到端流程验证
  ├─ 上传测试数据到Open-Notebook
  ├─ 验证数据同步到Milvus
  ├─ 测试知识库查询API
  ├─ 测试Agent查询功能
  └─ 性能测试和优化

交付物：
- 完整的API网关实现
- 端到端集成测试脚本
- API文档（OpenAPI/Swagger）
- 性能基准测试报告
```

**第1-2周的预期里程碑**：
✅ Open-Notebook能够管理和存储董事长的思想资料
✅ Milvus向量数据库正常运行，数据可同步
✅ 知识库查询工具能准确检索相关内容
✅ 简单查询Agent可工作并返回有意义的结果
✅ 完整的API网关可处理查询请求
✅ 端到端流程验证无误，质量达到MVP标准

---

### 第2阶段：MVP-2 OpenCanvas协同创作集成（第3周）

**目标**：基于MVP-1的知识库，集成OpenCanvas并实现协同创作能力

#### 2.1 OpenCanvas部署与基础集成（2-3天）
```
第3周上半部分任务：

A. OpenCanvas部署
  ├─ 克隆/部署OpenCanvas项目
  ├─ 配置环境变量和依赖
  ├─ 启动Web UI验证可访问
  └─ 配置Supabase或本地数据库

B. 与MVP-1知识库的集成
  ├─ 在OpenCanvas中配置知识库查询工具
  ├─ 创建集成层连接到src/retrieval模块
  ├─ 实现知识库上下文提供功能
  └─ 测试在创作过程中访问知识库

C. 简单的风格学习Agent
  ├─ 创建 src/agents/style_learner_agent.py
  │  ├─ 分析董事长的写作风格（从知识库中）
  │  ├─ 学习常用表达和逻辑结构
  │  └─ 生成风格指导
  ├─ LangChain Agent框架
  └─ 初步的Prompt工程

交付物：
- OpenCanvas的部署配置
- 与MVP-1知识库的集成代码
- 风格学习Agent的初步实现
- 集成测试脚本
```

#### 2.2 协同创作功能实现（2-3天）
```
第3周下半部分任务：

A. 创作助手功能
  ├─ 创建 src/agents/writing_assistant.py
  │  ├─ 基于知识库的内容建议
  │  ├─ 风格一致性检查
  │  ├─ 结构化写作辅助
  │  └─ 实时反馈和改进建议
  ├─ 与OpenCanvas UI的集成
  └─ 用户交互流程

B. 文档管理功能
  ├─ 创建 src/integrations/canvas_notebook_bridge.py
  │  ├─ OpenCanvas文档与Open-Notebook的同步
  │  ├─ 版本管理和历史追踪
  │  └─ 权限和访问控制
  ├─ 实现文档发布和保存流程
  └─ 测试同步和版本管理

C. 端到端协同创作流程
  ├─ 用户在OpenCanvas中创建新文档
  ├─ AI助手基于知识库提供建议
  ├─ 用户编辑和迭代
  ├─ 文档自动同步到Open-Notebook
  └─ 完整的流程测试和优化

交付物：
- 完整的创作助手实现
- 文档同步和管理系统
- 协同创作流程的完整端到端测试
- 用户界面优化和反馈
```

**第3周的预期里程碑**：
✅ OpenCanvas可以访问MVP-1的知识库
✅ 风格学习Agent能够分析和学习董事长的写作风格
✅ 创作助手能提供基于知识库的建议
✅ 协同创作流程可工作，文档能正确同步
✅ 系统质量和性能达到MVP标准

---

### 第3阶段：MVP-3 OpenDeepResearch完整改造与集成（第4周）

**目标**：完成深度研究Agent的改造，实现思想体系化和深度分析能力

#### 3.1 OpenDeepResearch集成与改造（3-4天）
```
第4周上半部分任务：

A. OpenDeepResearch部署和改造
  ├─ 克隆/部署OpenDeepResearch项目
  ├─ 改造检索工具
  │  ├─ 替换Tavily Web搜索为内部知识库查询
  │  ├─ 集成src/retrieval的知识库检索工具
  │  └─ 在LangGraph State中添加knowledge_source字段
  ├─ 配置DeepSeek API（via OpenRouter）
  └─ 验证LangGraph工作流可执行

B. 思想体系化Agent设计
  ├─ 创建 src/agents/thought_systemizer.py
  │  ├─ 定义思想体系化工作流
  │  ├─ 实现规划、检索、分析、综合阶段
  │  ├─ 高质量Prompt工程
  │  └─ 结果后处理和格式化
  ├─ 编写Prompt库（src/agents/prompts/）
  │  ├─ system_prompts.py
  │  ├─ analysis_prompts.py
  │  └─ style_guide.py
  └─ 单元测试和工作流验证

C. 会议分析Agent设计
  ├─ 创建 src/agents/meeting_analyzer.py
  │  ├─ 识别会议核心议题
  │  ├─ 分析董事长观点和论证
  │  ├─ 提炼决策逻辑和原则
  │  └─ 生成逻辑提炼报告
  ├─ Prompt工程和优化
  └─ 完整的单元测试

交付物：
- 改造后的OpenDeepResearch集成
- 思想体系化Agent的完整实现
- 会议分析Agent的完整实现
- Prompt库和配置
- 完整的测试套件
```

#### 3.2 Agent优化与深度集成（2-3天）
```
第4周下半部分任务：

A. Agent工作流优化
  ├─ 调整检索参数（top_k、相似度阈值）
  ├─ 优化Prompt以提高输出质量
  ├─ 改进Agent的推理过程
  ├─ 添加思路追踪和可视化
  └─ 性能测试和优化

B. 系统集成
  ├─ 扩展src/api/gateway.py
  │  ├─ 添加思想体系化端点
  │  ├─ 添加会议分析端点
  │  ├─ 任务管理和状态追踪
  │  └─ 异步处理和结果回写
  ├─ Open-Notebook结果回写
  │  ├─ Agent结果自动创建Note
  │  ├─ 添加source和citation
  │  └─ 支持版本管理
  └─ 完整的集成测试

C. 质量保证和测试
  ├─ 端到端工作流测试
  ├─ Playwright自动化测试
  ├─ 性能基准测试
  ├─ 用户体验测试
  └─ 压力测试和稳定性验证

交付物：
- 优化后的Agent实现
- 完整的API网关
- 自动化测试套件
- 性能报告和优化建议
- 部署和用户指南
```

**第4周的预期里程碑**：
✅ OpenDeepResearch成功改造，查询内部知识库
✅ 思想体系化Agent工作正常，输出质量达标
✅ 会议分析Agent框架完成，可处理会议记录
✅ 完整的API网关可处理三类请求
✅ 所有Agent结果可正确回写到Open-Notebook
✅ 系统性能和稳定性达到生产级标准

---

### 第4阶段：完整验证与优化（MVP全阶段）

**目标**：使用真实数据验证整个系统，建立持续优化流程

#### 4.1 真实数据导入与验证（穿插每个MVP阶段）
```
A. 数据准备
  ├─ 整理董事长的思想资料
  │  ├─ 会议记录、演讲稿、笔记
  │  ├─ 关键决策和案例分析
  │  └─ 长期思想积累
  ├─ 数据清洗和格式化
  │  ├─ 统一格式（PDF/TXT/MD）
  │  ├─ 添加元数据（日期、主题、来源）
  │  └─ 检查数据质量
  └─ 导入Open-Notebook
     ├─ Web UI上传或API批量导入
     ├─ 验证数据完整性
     └─ 触发同步和向量化

B. MVP各阶段的实时验证
  ├─ MVP-1完成后：验证知识库查询准确性
  ├─ MVP-2完成后：验证协同创作功能
  ├─ MVP-3完成后：验证Agent分析质量
```

#### 4.2 系统级性能和质量指标（每个MVP阶段结束时）
```
质量指标：
- Agent输出完整性（是否遗漏关键内容）
- 准确性（虚构或错误内容的比例）
- 知识库检索相关性（相关度评分）
- 用户满意度（反馈评分）

性能指标：
- 平均响应时间（<5秒为目标）
- 并发处理能力（>=10个并发请求）
- API错误率（<0.1%）
- 系统资源使用

成本指标：
- DeepSeek API调用次数和成本
- 存储使用情况
- 计算资源消耗
```

#### 4.3 持续优化循环
```
每个MVP阶段完成后：

1. 收集反馈
   ├─ 用户反馈（质量和体验）
   ├─ 系统日志分析
   └─ 性能监控数据

2. 识别问题
   ├─ Agent输出质量问题
   ├─ 知识库查询相关性问题
   ├─ 系统性能瓶颈
   └─ 用户体验问题

3. 优化和改进
   ├─ Prompt优化（第7.1节）
   ├─ 知识库质量改进（第7.3节）
   ├─ 工作流参数调整（第7.2节）
   └─ 系统性能优化

4. 重新测试和验证
   ├─ 单元测试
   ├─ 集成测试
   ├─ 端到端工作流测试
   └─ 性能基准测试
```

**最终里程碑**（MVP全部完成）：
✅ MVP-1完全可用，知识库管理和查询功能正常
✅ MVP-2完全可用，协同创作流程顺畅
✅ MVP-3完全可用，深度分析能力符合预期
✅ 三个MVP之间集成紧密，流程顺畅
✅ 系统质量和性能达到生产标准
✅ 完整的文档和用户指南
✅ 可持续优化的基础设施

---

## 模块详细设计

### 5.1 数据同步服务（关键！）

**位置**：`src/sync_service/sync_engine.py`

**目的**：确保Open-Notebook中的数据能被OpenDeepResearch查询到

**工作流**：
```
数据源 (Open-Notebook)
    ↓ REST API 轮询或Webhook
监听器 (sync_engine.py)
    ├→ 取出新增/更新的Note
    ├→ 提取文本内容
    ├→ 调用向量化模型 (DeepSeek or Embedding model)
    └→ 存储到Milvus
    ↓
向量数据库 (Milvus)
    └→ OpenDeepResearch Agent可查询
```

**参考实现框架**：
```python
# src/sync_service/sync_engine.py

from typing import List, Dict
from datetime import datetime
import asyncio
import httpx
from pymilvus import Collection

class DataSyncEngine:
    def __init__(self,
                 notebook_api_url: str,
                 notebook_api_key: str,
                 milvus_host: str,
                 embedding_model: str):
        self.notebook_api_url = notebook_api_url
        self.notebook_api_key = notebook_api_key
        self.milvus_host = milvus_host
        self.embedding_model = embedding_model
        self.collection = None

    async def start_sync(self, interval_seconds: int = 300):
        """启动后台同步，每interval_seconds检查一次新数据"""
        while True:
            try:
                await self.sync_once()
                await asyncio.sleep(interval_seconds)
            except Exception as e:
                print(f"Sync error: {e}")
                await asyncio.sleep(60)  # 出错后等待1分钟重试

    async def sync_once(self):
        """执行一次同步"""
        # 1. 从Open-Notebook获取最近更新的Notes
        notes = await self._fetch_recent_notes()

        # 2. 为每个Note生成向量
        for note in notes:
            embeddings = await self._embed_text(note['content'])

            # 3. 存储到Milvus
            await self._insert_to_milvus(
                note_id=note['id'],
                content=note['content'],
                embedding=embeddings,
                metadata={
                    'source': 'open_notebook',
                    'created_at': note['created_at'],
                    'updated_at': note['updated_at'],
                    'tags': note.get('tags', []),
                }
            )

    async def _fetch_recent_notes(self, limit: int = 100) -> List[Dict]:
        """从Open-Notebook API获取最近的Notes"""
        # 实现调用 Open-Notebook REST API
        pass

    async def _embed_text(self, text: str) -> List[float]:
        """使用DeepSeek或其他embedding模型生成向量"""
        # 可以使用：
        # 1. DeepSeek Embedding API (via OpenRouter)
        # 2. 本地embedding模型 (e.g., all-MiniLM)
        pass

    async def _insert_to_milvus(self, note_id: str, content: str,
                                embedding: List[float], metadata: Dict):
        """将数据插入Milvus"""
        pass
```

**关键考虑**：
1. **同步策略**：初期可以用简单的轮询（每5分钟检查一次），后续可升级到Webhook
2. **向量模型**：可以用轻量级模型（如all-MiniLM）来避免调用OpenRouter过于频繁
3. **重复检查**：需要机制避免同一条数据被多次同步
4. **错误处理**：网络错误、API错误需要优雅处理和重试

---

### 5.2 知识库查询工具（核心）

**位置**：`src/retrieval/knowledge_retriever.py`

**目的**：为OpenDeepResearch Agent提供"查询内部知识库"的能力

**使用场景**：Agent需要检索与某个主题相关的董事长的思想资料

**参考实现**：
```python
# src/retrieval/knowledge_retriever.py

from typing import List, Dict, Optional
from langchain.tools import tool
import numpy as np
from pymilvus import Collection
import httpx

class KnowledgeRetriever:
    def __init__(self,
                 milvus_collection_name: str,
                 notebook_api_url: str,
                 embedding_model_name: str = "all-MiniLM-L6-v2"):
        self.collection_name = milvus_collection_name
        self.notebook_api_url = notebook_api_url
        self.embedding_model_name = embedding_model_name

    @tool
    def retrieve_knowledge(self, query: str, top_k: int = 5) -> str:
        """
        从董事长的知识库中检索相关内容

        Args:
            query: 查询的主题或问题
            top_k: 返回最相关的K条结果

        Returns:
            格式化的检索结果字符串
        """
        # 1. 将查询文本向量化
        query_embedding = self._embed_text(query)

        # 2. 在Milvus中执行相似度搜索
        search_results = self._search_milvus(
            embedding=query_embedding,
            top_k=top_k
        )

        # 3. 增强结果（获取原文本和元数据）
        enriched_results = self._enrich_results(search_results)

        # 4. 格式化为可读的文本
        formatted = self._format_results(enriched_results)

        return formatted

    def _embed_text(self, text: str) -> List[float]:
        """向量化文本"""
        # 使用轻量级embedding模型或API
        pass

    def _search_milvus(self, embedding: List[float],
                      top_k: int = 5) -> List[Dict]:
        """在Milvus中执行向量搜索"""
        # 连接Milvus并执行搜索
        collection = Collection(self.collection_name)
        results = collection.search(
            data=[embedding],
            anns_field="embedding",
            param={"metric_type": "L2", "params": {"nprobe": 10}},
            limit=top_k,
            output_fields=["note_id", "content", "metadata"]
        )
        return results[0]  # 返回第一个查询的结果

    def _enrich_results(self, raw_results: List) -> List[Dict]:
        """增强结果：获取原始Note内容和元数据"""
        enriched = []
        for result in raw_results:
            # 可以通过Open-Notebook API获取完整的Note信息
            enriched.append({
                'note_id': result.note_id,
                'content': result.content,
                'similarity_score': result.score,
                'metadata': result.metadata,
            })
        return enriched

    def _format_results(self, results: List[Dict]) -> str:
        """将结果格式化为可读的文本"""
        formatted = "## 相关的董事长思想资料：\n\n"
        for i, result in enumerate(results, 1):
            formatted += f"### 资料 {i}\n"
            formatted += f"**相关度**：{result['similarity_score']:.2%}\n"
            if result['metadata'].get('created_at'):
                formatted += f"**日期**：{result['metadata']['created_at']}\n"
            formatted += f"\n{result['content']}\n\n"
        return formatted

# 导出为LangChain Tool
knowledge_retriever_tool = KnowledgeRetriever(...).retrieve_knowledge
```

**关键特性**：
1. **向量相似度搜索**：找到最相关的资料
2. **元数据保留**：知道资料的日期、来源等
3. **可扩展**：支持多种向量化方案和搜索策略
4. **与Agent集成**：通过LangChain Tool装饰器与Agent无缝配合

---

### 5.3 OpenDeepResearch改造方案

**核心改动**：替换Web搜索 → 内部知识库查询

**改动位置**：OpenDeepResearch的主Agent图中

```python
# 原始OpenDeepResearch工作流（简化版）
graph = StateGraph(State)

# 1. 规划阶段
graph.add_node("planner", plan_node)

# 2. 搜索阶段（这里是改动点！）
graph.add_node("searcher", search_node)  # 原始：使用Tavily搜索
                                         # 改后：使用知识库查询

# 3. 分析阶段
graph.add_node("analyzer", analyze_node)

# 4. 综合阶段
graph.add_node("synthesizer", synthesize_node)

# 连接边
graph.add_edge("planner", "searcher")
graph.add_edge("searcher", "analyzer")
graph.add_edge("analyzer", "synthesizer")
graph.set_entry_point("planner")
```

**改造的具体方式**：

```python
# src/agents/deep_research_adapter.py

from typing import Any
from langgraph.graph import StateGraph, State as LangGraphState
from src.retrieval.knowledge_retriever import KnowledgeRetriever

def create_internal_knowledge_agent(knowledge_retriever: KnowledgeRetriever):
    """
    创建一个改造后的OpenDeepResearch Agent，
    使其查询内部知识库而不是Web
    """

    class InternalState(LangGraphState):
        """Agent的状态定义"""
        messages: list
        topic: str
        plan: str
        search_results: list
        analysis: str
        final_report: str

    def search_node(state: InternalState) -> InternalState:
        """
        改造：使用内部知识库查询而不是Web搜索
        """
        topic = state["topic"]

        # 使用改造的知识库查询工具
        search_results = knowledge_retriever.retrieve_knowledge(
            query=topic,
            top_k=10  # 获取前10条最相关的资料
        )

        state["search_results"] = search_results
        return state

    def analyze_node(state: InternalState) -> InternalState:
        """分析阶段"""
        # 调用LLM进行深度分析
        pass

    def synthesize_node(state: InternalState) -> InternalState:
        """综合阶段：生成最终报告"""
        pass

    # 构建图
    graph = StateGraph(InternalState)
    graph.add_node("search", search_node)
    graph.add_node("analyze", analyze_node)
    graph.add_node("synthesize", synthesize_node)

    graph.add_edge("search", "analyze")
    graph.add_edge("analyze", "synthesize")
    graph.set_entry_point("search")

    return graph.compile()
```

**关键点**：
1. **最小改动原则**：只替换搜索工具，保留Agent的其他逻辑
2. **参数化**：让KnowledgeRetriever可配置（top_k、搜索策略等）
3. **可测试**：分离出搜索、分析、综合等步骤，易于单元测试

---

### 5.4 两个核心Agent的Prompt设计

#### A. 思想体系化Agent

```python
# src/agents/prompts/system_prompts.py

CHAIRMAN_THOUGHT_SYSTEMIZER_SYSTEM_PROMPT = """
你是董事长的思想顾问和思想体系化专家。

【你的角色】
- 深度理解董事长的思维方式和管理哲学
- 从零散的思考、讲话、会议发言中提炼核心的思想体系
- 形成系统的、有逻辑的、易于传承的思想框架

【你的工作流程】
1. 收集：从提供的资料中识别核心主题和观点
2. 分析：理解观点之间的逻辑关联和演进过程
3. 整合：形成体系化的思想框架
4. 输出：生成清晰、有深度、便于理解的总结报告

【关键原则】
- 保持原汁原味：不改变董事长的核心思想，只是梳理和体系化
- 逻辑严密：充分论述观点之间的因果关系
- 可传承性：形成的思想体系应该能被管理层理解和应用
- 证据支撑：每个结论都应该有具体的引用和例子

【输出格式】
以Markdown格式输出，包括：
- 核心主题
- 主要观点（3-5个）
  - 每个观点的论证过程
  - 相关的具体例子或案例
  - 对实践的启示
- 思想框架图
- 关键洞察总结
"""

THOUGHT_SYSTEMIZATION_ANALYSIS_PROMPT = """
请根据以下关于董事长的思想资料，系统化地总结他的管理理念和思想体系：

【主题】：{topic}

【相关资料】：
{knowledge_base_results}

【任务】：
1. 分析这些资料中的核心观点
2. 理解这些观点之间的逻辑关系
3. 形成一个有机的、系统的思想框架
4. 用清晰的语言表达这个框架

【输出要求】：
- 深度：体现出董事长思想的精髓，而不是表面总结
- 逻辑：观点之间的因果关系要清晰
- 实用：形成的框架应该能指导实际工作
- 风格：保持董事长的语言和思考风格
"""
```

#### B. 会议逻辑分析Agent

```python
# src/agents/prompts/meeting_prompts.py

MEETING_LOGIC_ANALYZER_SYSTEM_PROMPT = """
你是董事长的决策分析官和会议智囊。

【你的角色】
- 深入理解董事长在会议中的思考过程
- 提炼决策背后的逻辑依据
- 形成可复用的决策模式，用于管理层赋能

【分析维度】
1. 核心议题：这次会议的主要问题是什么？
2. 董事长观点：他如何看待这个问题？为什么？
3. 论证逻辑：他如何论证自己的观点？
4. 决策依据：决策背后的原则和考量是什么？
5. 实践启示：这个决策过程能告诉我们什么？

【关键能力】
- 识别董事长的隐性论点（没有明说但蕴含的逻辑）
- 理解他的优先级（什么最重要，什么可以妥协）
- 捕捉他的决策原则（如果遇到类似问题应如何处理）
- 形成可教学的案例（如何将这个决策逻辑传授给管理层）

【输出要求】
- 准确：不曲解董事长的原意
- 深度：挖掘表面观点背后的深层逻辑
- 可传承：形成的"决策范式"应该能被其他管理者学习
- 证据充分：引用会议中的具体发言来支撑分析
"""

MEETING_ANALYSIS_PROMPT = """
请分析以下董事长的会议记录，提炼他的决策逻辑和思考方式：

【会议名称】：{meeting_name}
【日期】：{meeting_date}

【会议记录】：
{meeting_transcript}

【相关背景资料】：
{knowledge_base_context}

【分析任务】：
1. 识别会议的核心议题
2. 总结董事长的主要观点
3. 分析他观点背后的论证逻辑
4. 提炼决策的关键考量因素
5. 形成可复用的决策模式/原则

【输出格式】：
## 核心议题
[议题描述]

## 董事长的观点
[主要观点，分条列举]

## 论证逻辑
[每个观点的论证过程，使用具体引用]

## 决策原则
[背后的原则或考量]

## 管理层启示
[其他管理者可以学到的内容]
"""
```

---

### 5.5 API网关设计

**位置**：`src/api/gateway.py`

**作用**：统一的入口点，对接前端和后端Agent

```python
# src/api/gateway.py

from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Optional
import uuid
from datetime import datetime
import asyncio

app = FastAPI(title="智董 API Gateway")

class TaskStatus:
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

# 简单的任务存储（实际应该用数据库）
task_store = {}

@app.post("/api/agents/systemize-thoughts")
async def systemize_thoughts(
    topic: str,
    knowledge_base_filter: Optional[dict] = None
) -> dict:
    """
    触发"思想体系化"Agent

    Args:
        topic: 要系统化的主题（如"人才战略"、"创新理念"）
        knowledge_base_filter: 可选的过滤条件（日期范围、标签等）

    Returns:
        {
            "task_id": "uuid",
            "status": "pending",
            "created_at": "2025-11-22T10:00:00Z"
        }
    """
    task_id = str(uuid.uuid4())

    # 创建任务记录
    task_store[task_id] = {
        "id": task_id,
        "type": "systemize_thoughts",
        "status": TaskStatus.PENDING,
        "topic": topic,
        "created_at": datetime.utcnow(),
        "result": None
    }

    # 后台启动Agent（异步）
    asyncio.create_task(
        run_systemization_agent(task_id, topic, knowledge_base_filter)
    )

    return {
        "task_id": task_id,
        "status": TaskStatus.PENDING,
        "created_at": task_store[task_id]["created_at"].isoformat()
    }

@app.post("/api/agents/analyze-meeting")
async def analyze_meeting(
    meeting_name: str,
    meeting_transcript: str,
    meeting_date: Optional[str] = None
) -> dict:
    """
    触发"会议逻辑分析"Agent
    """
    task_id = str(uuid.uuid4())

    task_store[task_id] = {
        "id": task_id,
        "type": "analyze_meeting",
        "status": TaskStatus.PENDING,
        "meeting_name": meeting_name,
        "created_at": datetime.utcnow(),
        "result": None
    }

    asyncio.create_task(
        run_meeting_analysis_agent(task_id, meeting_name, meeting_transcript, meeting_date)
    )

    return {
        "task_id": task_id,
        "status": TaskStatus.PENDING,
        "created_at": task_store[task_id]["created_at"].isoformat()
    }

@app.get("/api/agents/{task_id}/status")
async def get_task_status(task_id: str) -> dict:
    """查询Agent任务的执行状态"""
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")

    task = task_store[task_id]
    return {
        "task_id": task_id,
        "type": task["type"],
        "status": task["status"],
        "created_at": task["created_at"].isoformat(),
        "result": task.get("result")  # 如果任务完成，返回结果
    }

@app.post("/api/agents/{task_id}/cancel")
async def cancel_task(task_id: str) -> dict:
    """取消一个正在运行的任务"""
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="Task not found")

    task = task_store[task_id]
    if task["status"] == TaskStatus.RUNNING:
        task["status"] = TaskStatus.FAILED
        task["result"] = {"error": "Task cancelled by user"}

    return {"task_id": task_id, "status": "cancelled"}

# 后台任务执行函数
async def run_systemization_agent(task_id: str, topic: str, filters: Optional[dict]):
    """后台执行思想体系化Agent"""
    try:
        task_store[task_id]["status"] = TaskStatus.RUNNING

        # 1. 调用知识库查询
        knowledge = knowledge_retriever.retrieve_knowledge(topic, top_k=10)

        # 2. 调用Agent
        from src.agents.prompts import THOUGHT_SYSTEMIZATION_ANALYSIS_PROMPT

        prompt = THOUGHT_SYSTEMIZATION_ANALYSIS_PROMPT.format(
            topic=topic,
            knowledge_base_results=knowledge
        )

        # 3. 调用DeepSeek LLM
        result = await call_deepseek_api(
            system_prompt=CHAIRMAN_THOUGHT_SYSTEMIZER_SYSTEM_PROMPT,
            user_prompt=prompt
        )

        # 4. 存储结果并可选地回写到Open-Notebook
        task_store[task_id]["status"] = TaskStatus.COMPLETED
        task_store[task_id]["result"] = {
            "analysis": result,
            "knowledge_sources": knowledge,
            "completed_at": datetime.utcnow().isoformat()
        }

        # 5. 尝试回写到Open-Notebook
        await writeback_to_notebook(
            title=f"思想体系化：{topic}",
            content=result,
            task_id=task_id
        )

    except Exception as e:
        task_store[task_id]["status"] = TaskStatus.FAILED
        task_store[task_id]["result"] = {"error": str(e)}

async def run_meeting_analysis_agent(task_id: str, meeting_name: str,
                                     transcript: str, meeting_date: Optional[str]):
    """后台执行会议分析Agent"""
    # 类似的实现...
    pass

async def call_deepseek_api(system_prompt: str, user_prompt: str) -> str:
    """调用DeepSeek API via OpenRouter"""
    import httpx

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://openrouter.io/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": "http://localhost",
                "X-Title": "Chairman Agent"
            },
            json={
                "model": "deepseek/deepseek-r1",  # 或 deepseek-v3
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 4000
            }
        )

        return response.json()["choices"][0]["message"]["content"]

async def writeback_to_notebook(title: str, content: str, task_id: str):
    """将Agent结果写回Open-Notebook"""
    import httpx

    async with httpx.AsyncClient() as client:
        # 调用Open-Notebook的API创建Note
        response = await client.post(
            f"{NOTEBOOK_API_URL}/api/notes",
            headers={"Authorization": f"Bearer {NOTEBOOK_API_KEY}"},
            json={
                "title": title,
                "content": content,
                "tags": ["ai_generated", f"task_{task_id}"],
                "source": "智董Agent"
            }
        )
        return response.json()
```

---

## 部署与验证

### 6.1 完整Docker Compose配置

```yaml
# docker-compose.yml

version: '3.8'

services:
  # 1. Open-Notebook
  open_notebook:
    image: lfnovo/open_notebook:v1-latest-single
    ports:
      - "8502:8502"    # Web UI
      - "5055:5055"    # API
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      # 如果使用远程访问，设置正确的API_URL
      - API_URL=http://localhost:5055
      - SURREAL_URL=ws://localhost:8000/rpc
      - SURREAL_USER=root
      - SURREAL_PASSWORD=root
      - SURREAL_NAMESPACE=open_notebook
      - SURREAL_DATABASE=production
    volumes:
      - ./notebook_data:/app/data
      - ./surreal_data:/mydata
    depends_on:
      - surreal
    networks:
      - chairman_network

  # 2. SurrealDB (Open-Notebook的数据库)
  surreal:
    image: surrealdb/surrealdb:latest
    ports:
      - "8000:8000"
    command: start --log trace --user root --pass root
    volumes:
      - ./surreal_data:/mydata
    networks:
      - chairman_network

  # 3. Milvus (向量数据库)
  milvus:
    image: milvusdb/milvus:v0.5.0
    ports:
      - "19530:19530"
      - "9091:9091"
    environment:
      ETCD_ENDPOINTS: etcd:2379
      COMMON_STORAGETYPE: local
    depends_on:
      - etcd
    volumes:
      - ./milvus_data:/var/lib/milvus
    networks:
      - chairman_network

  # 4. Etcd (Milvus的依赖)
  etcd:
    image: quay.io/coreos/etcd:v3.5.5
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
      - ETCD_SNAPSHOT_COUNT=50000
    volumes:
      - ./etcd_data:/etcd
    networks:
      - chairman_network
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd

  # 5. Keycloak (SSO认证)
  keycloak:
    image: keycloak/keycloak:latest
    ports:
      - "8080:8080"
    environment:
      KC_ADMIN: admin
      KC_ADMIN_PASSWORD: admin123
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak123
    depends_on:
      - postgres
    networks:
      - chairman_network

  # 6. PostgreSQL (Keycloak的数据库)
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak123
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
    networks:
      - chairman_network

  # 7. 智董API网关 + 同步服务
  chairman_agent_api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8001:8000"
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - NOTEBOOK_API_URL=http://open_notebook:5055
      - NOTEBOOK_API_KEY=${NOTEBOOK_API_KEY}
      - MILVUS_HOST=milvus
      - MILVUS_PORT=19530
      - KEYCLOAK_URL=http://keycloak:8080
    depends_on:
      - open_notebook
      - milvus
      - keycloak
    volumes:
      - ./src:/app/src
      - ./logs:/app/logs
    networks:
      - chairman_network
    command: python -m src.main

  # 8. OpenDeepResearch LangGraph Server
  deepresearch_server:
    build:
      context: ./open_deep_research
      dockerfile: Dockerfile
    ports:
      - "2024:2024"
    environment:
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
    depends_on:
      - chairman_agent_api
    networks:
      - chairman_network
    command: uvx --refresh --from "langgraph-cli[inmem]" --python 3.11 langgraph dev --allow-blocking --host 0.0.0.0

networks:
  chairman_network:
    driver: bridge
```

### 6.2 部署检查清单

```markdown
## 部署验证步骤

### 第1步：基础服务验证
- [ ] Open-Notebook Web UI 可访问 (http://localhost:8502)
- [ ] Open-Notebook API 可访问 (http://localhost:5055/docs)
- [ ] Milvus 可连接 (localhost:19530)
- [ ] Keycloak 可访问 (http://localhost:8080)
- [ ] API网关启动成功 (http://localhost:8001)

### 第2步：集成验证
- [ ] 测试Open-Notebook上传文档
- [ ] 测试数据同步服务（文档应该同步到Milvus）
- [ ] 测试知识库查询（通过API）
- [ ] 测试SSO认证

### 第3步：Agent验证
- [ ] OpenDeepResearch Server 启动成功
- [ ] 测试思想体系化Agent（通过API触发）
- [ ] 验证Agent能够查询内部知识库
- [ ] 验证Agent结果能回写到Open-Notebook

### 第4步：端到端流程验证
- [ ] 导入测试数据到Open-Notebook
- [ ] 触发思想体系化Agent
- [ ] 检查Agent输出质量
- [ ] 检查性能和响应时间
```

---

## 持续优化策略

### 7.1 Prompt优化循环

```
初始Prompt
    ↓
运行Agent
    ↓
评估输出质量
    ↓
识别问题
    ├→ 逻辑不清？ → 调整Prompt的分析指示
    ├→ 遗漏关键点？ → 增加关键词提示
    ├→ 风格不对？ → 调整Prompt的例子和指示
    └→ 过于冗长？ → 简化提示或调整长度限制
    ↓
优化Prompt
    ↓
重新测试
    ↓
迭代...
```

### 7.2 工作流优化

关键参数可调整：
```python
# 检索的数量（更多 = 更全面，但可能引入噪音）
top_k = 5  # → 10  # → 20

# 相似度阈值（过滤不相关的结果）
similarity_threshold = 0.5  # → 0.6  # → 0.7

# Agent的温度参数（更低 = 更一致，更高 = 更创意）
temperature = 0.7  # → 0.5  # → 0.3

# 向量化模型（更好的embedding = 更准确的检索）
embedding_model = "all-MiniLM"  # → "bge-large"  # → "voyage"
```

### 7.3 数据质量改进

```
收集反馈
    ↓
识别低质量的检索结果
    ↓
改进知识库：
    ├→ 添加更多元数据（标签、分类）
    ├→ 优化数据清洗（移除噪音）
    ├→ 调整向量化策略（分块、长度等）
    └→ 建立知识库审核流程
    ↓
重新同步和索引
    ↓
测试改进效果
```

### 7.4 关键指标监控

```
质量指标：
- Agent输出的完整性（是否遗漏关键内容）
- 准确性（是否有虚构或错误内容）
- 用户满意度（反馈评分）

性能指标：
- 平均响应时间
- 向量检索的相关度得分
- Agent任务成功率

成本指标：
- DeepSeek API调用次数和费用
- 存储和计算资源使用
```

---

## 快速起步（给用户的指南）

### 第1天：环境准备
```bash
# 1. 克隆项目
git clone https://github.com/yourusername/chairman-agent.git
cd chairman-agent

# 2. 配置环境变量
cp .env.example .env
# 编辑.env，填入OPENROUTER_API_KEY等

# 3. 启动所有服务
docker-compose up -d

# 4. 验证
curl http://localhost:8502  # Open-Notebook
curl http://localhost:8001/api/health  # API Gateway
```

### 第2-3天：数据导入与测试
```bash
# 1. 访问Open-Notebook
# http://localhost:8502
# 上传一些测试数据

# 2. 测试知识库查询
curl -X POST http://localhost:8001/api/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{"query": "人才战略"}'

# 3. 测试Agent
curl -X POST http://localhost:8001/api/agents/systemize-thoughts \
  -H "Content-Type: application/json" \
  -d '{"topic": "人才战略"}'

# 4. 查询Agent状态
curl http://localhost:8001/api/agents/{task_id}/status
```

### 第4周：优化与验证
- 收集Agent输出的反馈
- 调整Prompt参数
- 改进知识库质量
- 性能测试和优化

---

## 常见问题与故障排除

### Q1: Agent的输出质量不好

**症状**：输出内容不准确、逻辑混乱、风格不对

**诊断步骤**：
1. 检查知识库查询是否返回了相关内容
   ```bash
   curl -X POST http://localhost:8001/api/knowledge/search \
     -d '{"query": "你要分析的主题"}'
   ```
2. 检查Prompt是否清晰
3. 检查LLM模型是否合适

**解决方案**：
1. 优化Prompt（参考第7.1节）
2. 增加知识库数据（让搜索结果更全面）
3. 尝试不同的模型（DeepSeek-V3 vs R1）
4. 调整Agent的工作流参数

### Q2: 知识库检索的结果不相关

**症状**：搜索结果与查询无关

**诊断步骤**：
1. 检查Milvus中的数据量
2. 检查向量化质量
3. 查看向量相似度得分

**解决方案**：
1. 改进数据清洗（移除噪音）
2. 尝试不同的embedding模型
3. 调整相似度阈值
4. 优化查询词（使用更多关键词）

### Q3: 服务启动失败

**诊断步骤**：
1. 查看logs文件夹中的错误日志
2. 检查Docker容器状态
   ```bash
   docker-compose ps
   docker-compose logs [service-name]
   ```
3. 检查端口是否被占用

**常见原因和解决方案**：
- `Connection refused`: 依赖的服务未启动，等待或检查依赖
- `Port already in use`: 修改docker-compose.yml中的端口映射
- `Out of memory`: 增加Docker的内存限制

---

## 总结

本方案提供了一个**从零到MVP的完整路径**，重点包括：

✅ **第1-2周**：基础设施搭建（三个开源项目 + 集成框架）
✅ **第2-3周**：Agent改造和工作流设计（核心价值所在）
✅ **第3-4周**：验证和优化（真实数据测试 + Prompt迭代）

**关键成功因素**：
1. **高质量的知识库**：好的数据 → 好的检索 → 好的分析
2. **精良的Prompt工程**：清晰的指示 → 符合预期的输出
3. **持续的迭代**：收集反馈 → 优化系统 → 提升价值

**预期交付时间**：3-4周
**预期质量**：可用于内部验证，需要后续持续优化

---

**下一步**：
1. 审视本方案，提出建议或问题
2. 准备环境（获取必要的API密钥）
3. 开始第1周的部署

有任何疑问，请随时反馈！
