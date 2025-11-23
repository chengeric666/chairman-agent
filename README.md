# 智董 (Chairman Agent) - MVP开发版

**项目名称**: 智董（Chairman Agent）
**版本**: MVP-1.0
**开发状态**: 🚀 积极开发中

## 📖 项目简介

在全球商业环境日益复杂、人工智能技术实现范式跃迁的关键时期，企业最高领导者的战略思想、管理哲学与决策逻辑，构成了组织最核心、最宝贵的无形资产。然而，这些高度依赖于个体的智慧面临着记录零散、提炼困难、传承不易的巨大挑战。

本项目为董事长构建一个高度个性化、私有化、具备深度认知能力的专属智能体（AI Agent）——**"智董"**。该智能体将聚焦三大核心能力：

1. **知识库管理** - 董事长思想资料的集中管理、存储和检索
2. **协同创作** - 基于知识库的内容创作和优化（如编写《家族宪章》）
3. **深度分析** - 思想体系化、会议逻辑提炼和管理智慧萃取

## 🎯 MVP里程碑

### MVP-1（第1-2周）✅ 进行中
**Open-Notebook知识库 + 查询Agent**
- 完成Open-Notebook私有化部署
- 实现知识库向量化和智能检索
- 构建简单查询Agent
- 提供完整的API网关

### MVP-2（第3周）⏳ 待开始
**OpenCanvas协同创作集成**
- 集成OpenCanvas创作工具
- 实现风格学习Agent
- 支持基于知识库的创作建议

### MVP-3（第4周）⏳ 待开始
**OpenDeepResearch深度分析**
- 思想体系化Agent
- 会议逻辑分析Agent
- 完整的深度研究能力

## 🚀 快速开始

### 前置条件
- Docker & Docker Compose
- Python 3.9+
- OpenRouter API密钥（用于DeepSeek）

### 一键启动

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/chairman-agent.git
cd chairman-agent

# 2. 创建.env文件
cp .env.example .env
# 编辑.env，填入OPENROUTER_API_KEY

# 3. 运行快速启动脚本
bash scripts/quickstart.sh

# 4. 验证部署
curl http://localhost:8000/health
```

### 手动启动

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看服务状态
docker-compose ps
```

## 📚 API端点

### 健康检查
```bash
GET /health
GET /api/health
```

### 知识库查询
```bash
GET /api/knowledge/search?query=人才战略&top_k=10
```

### Agent查询
```bash
POST /api/agents/query?topic=人才战略
GET /api/agents/{task_id}/status
POST /api/agents/{task_id}/cancel
```

### 批量查询
```bash
POST /api/batch/search
```

### 系统信息
```bash
GET /api/info
GET /api/stats/knowledge-base
```

## 🏗️ 项目架构

```
智董 (Chairman Agent)
├── 用户界面层
│   ├── Web UI (前端，待实现)
│   └── API网关
├── 智能体服务层
│   ├── 知识库查询Agent
│   ├── 创作助手Agent (MVP-2)
│   └── 深度研究Agent (MVP-3)
├── 数据处理层
│   ├── 知识库检索工具
│   ├── 数据同步服务
│   └── 向量化引擎
└── 存储层
    ├── Open-Notebook (知识库)
    ├── Milvus (向量DB)
    └── Redis (缓存)
```

## 🧪 测试

### 运行单元测试
```bash
pytest tests/test_knowledge_retriever.py -v
pytest tests/test_api_gateway.py -v
```

### 运行集成测试
```bash
pytest tests/test_integration.py -v
```

### 端到端测试（Playwright）
```bash
pytest tests/test_e2e_playwright.py -v
```

### 运行所有测试
```bash
pytest tests/ -v --cov=src
```

## 📋 配置

### 环境变量 (.env)
```bash
# OpenRouter API
OPENROUTER_API_KEY=your_key_here

# Open-Notebook
NOTEBOOK_API_URL=http://localhost:5055
NOTEBOOK_API_KEY=your_key_here

# Milvus
MILVUS_HOST=milvus
MILVUS_PORT=19530

# 应用配置
DEBUG=false
LOG_LEVEL=INFO
API_PORT=8000
```

详见 `.env.example`

## 📖 文档

- [Plan 1 深度集成方案](./INTEGRATION_PLAN_DETAILED.md) - ⭐ **新增** (8000+行详细的Plan 1实施方案)
- [深度源码分析总结](./DEEP_ANALYSIS_SUMMARY.md) - ⭐ **新增** (基于实际源码的可行性论证)
- [MVP实现计划](./MVP-IMPLEMENTATION-PLAN.md) - 详细的4周开发计划
- [开发进度](./claude.md) - 实时的开发进度和检查清单
- [API文档](http://localhost:8000/docs) - Swagger自动生成的文档

## 🔧 技术栈

| 层级 | 技术 | 版本 |
|-----|------|------|
| 后端框架 | FastAPI | 0.104+ |
| Agent框架 | LangChain | 0.1+ |
| LLM | DeepSeek (via OpenRouter) | V3/R1 |
| 向量DB | Milvus | 0.5+ |
| 知识库 | Open-Notebook | Latest |
| 容器化 | Docker Compose | Latest |
| 测试 | Pytest / Playwright | Latest |

## 📈 进度

查看详细进度：[claude.md](./claude.md)

当前整体进度：**40%** (MVP-1基础框架完成，MVP-2和MVP-3待开始)

### 完成的工作 ✅
- ✅ 项目规划和架构设计
- ✅ 开发环境配置
- ✅ MVP-1 基础框架（100%）- 知识库管理和查询基础设施搭建
  - Open-Notebook集成和部署
  - 知识库检索工具开发
  - 数据同步服务
  - 简单查询Agent框架
  - API网关基础实现
- ✅ 高质量Prompt库初步构建（20+个Prompt模板）
- ✅ 完整的API网关框架（15+个端点规划）
- ✅ 测试框架初步搭建
- ✅ **深度源码分析完成**（1500+文件分析）
  - 三个开源项目的源码级理解
  - 精确的改造点定位（8个关键文件）
  - 详细的实施指南编写（8000+行）

### 进行中的工作 🚀
- 🚀 MVP-1 集成测试和验证
- 🚀 深度分析文档评审

### 下一步 ⏳（MVP-2和MVP-3待开始）

**第1周**：
- ⏳ MVP-1完整集成测试
- ⏳ Open-Notebook知识库验证

**第2-4周** (待开始)：
- ⏳ MVP-2：OpenCanvas知识库集成（改造web-search节点）
- ⏳ MVP-3：OpenDeepResearch改造（替换Tavily搜索）
- ⏳ API网关完整实现

**第5-6周** (待开始)：
- ⏳ 前端UI开发
- ⏳ 集成测试和性能优化
- ⏳ 生产环境配置

## 🎓 学习资源

- [OpenRouter文档](https://openrouter.ai/)
- [LangChain文档](https://python.langchain.com/)
- [Milvus文档](https://milvus.io/)
- [Open-Notebook项目](https://github.com/)

## 🤝 贡献

本项目目前为MVP开发阶段，贡献请遵循以下流程：

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -am 'Add feature'`)
4. 推送分支 (`git push origin feature/your-feature`)
5. 创建Pull Request

## 📝 许可证

本项目采用MIT许可证

## 📞 联系

- 项目主分支: `main`
- 开发分支: `claude/plan-chairman-agent-mvp-*`
- 问题跟踪: GitHub Issues

---

## 🔬 最新动态 (2025-11-23)

### ✅ 文档升级：v1.0 → v2.0（基于源码深度分析）

基于对三个开源项目（OpenCanvas、OpenDeepResearch、Open-Notebook）的**本地源码深度分析**（1500+文件），完成了文档升级：

#### 📄 文档升级内容

1. **[MVP-IMPLEMENTATION-PLAN.md](./docs/planning/MVP-IMPLEMENTATION-PLAN.md) - v2.0**
   - ✅ 版本升级：从基于文档假设 → 基于源码验证
   - ✅ **重要更正**：MVP-2/3进度（从"80%完成"→ "未开始"）
   - ✅ 工作量调整：从3-4周 → 6-8周
   - ✅ 技术决策基于源码级验证（而非文档）
   - ✅ 改造文件精确定位（精确到行号）

2. **[INTEGRATION_PLAN_DETAILED.md](./docs/integration/INTEGRATION_PLAN_DETAILED.md) (8000+行)**
   - ✅ 系统架构设计（详细架构图和数据流）
   - ✅ 三个阶段的具体实施步骤（30+个步骤）
   - ✅ 代码改造清单（8个关键文件，精确到行号）
   - ✅ TypeScript和Python改造示例（完整代码）
   - ✅ Docker部署指南和检查清单
   - ✅ 风险分析和缓解方案

3. **[DEEP_ANALYSIS_SUMMARY.md](./docs/integration/DEEP_ANALYSIS_SUMMARY.md)**
   - ✅ 三个项目的源码级分析总结
   - ✅ 接口兼容性验证（源码证据）
   - ✅ 工作量评估依据（基于源码复杂度）
   - ✅ ROI分析（2.5:1 ~ 4:1）
   - ✅ 关键改造清单（优先级划分）

#### 🔍 源码分析统计

| 维度 | 数值 |
|------|------|
| 源代码文件分析 | 1500+ |
| 关键改造文件 | 8个 |
| 具体改造点 | 15+ |
| 实施步骤 | 30+ |
| API端点列表 | 87个 |
| 文档生成 | 8000+ 行 |

#### 🎯 核心发现

| 项目 | 真实情况 | 改造复杂度 |
|------|--------|-----------|
| **OpenCanvas** | LangGraph TypeScript实现，web-search节点相对独立 | ⭐⭐ (中等) |
| **OpenDeepResearch** | 工厂模式设计，SearchAPI枚举扩展性好，异步处理完整 | ⭐⭐⭐ (高) |
| **Open-Notebook** | 完整三层应用，87个API已实现，开箱即用 | ⭐ (低) |

### ⚠️ **重要更正**

本次文档升级**正式更正**之前的进度声明：

- ❌ v1.0声称：MVP-2/3已80%完成，整体进度80%
- ✅ v2.0更正：MVP-2/3**还未开始**，整体进度40%（只有MVP-1基础框架）

这是基于源码深度分析后的**诚实更正**。

### 📚 文档使用指南

1. **快速了解**：[MVP-IMPLEMENTATION-PLAN.md](./docs/planning/MVP-IMPLEMENTATION-PLAN.md) - Executive Summary
2. **深度理解**：[DEEP_ANALYSIS_SUMMARY.md](./docs/integration/DEEP_ANALYSIS_SUMMARY.md)
3. **具体实施**：[INTEGRATION_PLAN_DETAILED.md](./docs/integration/INTEGRATION_PLAN_DETAILED.md)

### 🚀 下一步行动

1. ✅ **立即可做**
   - 评审三份深度分析文档
   - 理解源码级实施方案

2. ⏳ **第1周**
   - MVP-1完整集成测试和验证

3. ⏳ **第2-4周** (待开始)
   - MVP-2和MVP-3的改造实施
   - 参考INTEGRATION_PLAN_DETAILED.md的具体步骤

4. ⏳ **第5-6周** (待开始)
   - 前端开发、测试和优化
   - 生产环境部署准备

---

**最后更新**: 2025-11-23 (v2.0文档升级完成)
**当前分支**: `claude/plan-chairman-agent-mvp-01BedNXy1hezSfwR1z1VeLVJ`
**开发者**: Claude Code (由Anthropic提供的AI开发助手)
