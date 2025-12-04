# 智董 Chairman Agent 文档中心

**项目**: Chairman Agent (智董)
**文档版本**: 2.0
**最后更新**: 2025-11-29
**状态**: ✅ 生产就绪

---

## 系统架构总览

> **查看完整架构图**: [chairman-agent-tech-architecture-v5.svg](./architecture/chairman-agent-tech-architecture-v5.svg)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Chairman Agent 技术架构 v5                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│   用户层        Web浏览器 / 移动端                                                │
│       ↓                                                                           │
│   前端应用      Open-Notebook(8502) │ OpenCanvas │ Agent-Chat-UI │ Deep Research  │
│       ↓                                                                           │
│   认证服务      Zitadel (OIDC/OAuth2.0)                                          │
│       ↓                                                                           │
│   API网关       FastAPI + LangServe (5055/8001)                                  │
│       ↓                                                                           │
│   后端服务      知识库Agent │ 写作Agent │ 深度研究Agent │ 知识图谱                 │
│       ↓                                                                           │
│   AI/LLM层      OpenRouter(Grok) │ Ollama(本地) │ LangSmith(可观测)               │
│       ↓                                                                           │
│   数据存储      SurrealDB(8000) │ Milvus(19530) │ Redis(6379)                    │
│       ↓                                                                           │
│   基础设施      Docker Compose │ Volume Mounts │ 网络隔离                         │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 服务端口速查

| 服务 | 端口 | 用途 |
|------|------|------|
| **Open-Notebook UI** | 8502 | 知识库Web界面（统一入口） |
| **Open-Notebook API** | 5055 | 知识库REST API |
| **Chairman API网关** | 8001 | 统一API入口 |
| **SurrealDB** | 8000 | 数据库HTTP/WebSocket |
| **Milvus** | 19530 | 向量数据库 |
| **Redis** | 6379 | 缓存存储 |

---

## 文档体系导航

### 核心文档 (必读)

| 文档 | 路径 | 核心内容 | 优先级 |
|------|------|----------|--------|
| **项目入口** | [../CLAUDE.md](../CLAUDE.md) | 项目概述、快速开始、服务端口、技术栈、开发规范 | ⭐⭐⭐⭐⭐ |
| **部署指南** | [implementation/DEPLOYMENT_GUIDE.md](implementation/DEPLOYMENT_GUIDE.md) | Docker Compose部署、OCR功能、前端更新、服务管理 | ⭐⭐⭐⭐⭐ |
| **MVP实施计划** | [planning/MVP-IMPLEMENTATION-PLAN.md](planning/MVP-IMPLEMENTATION-PLAN.md) | 3个MVP详细规划、技术架构、1500+源码分析、实施路线图 | ⭐⭐⭐⭐⭐ |

---

### 📐 架构文档 (`architecture/`)

技术架构图和系统设计文档。

| 文件 | 说明 | 版本 |
|------|------|------|
| [chairman-agent-tech-architecture-v5.svg](architecture/chairman-agent-tech-architecture-v5.svg) | **最新版**完整技术架构图（8层架构 + 组件关系 + 业务流） | v5.2 |
| [chairman-agent-tech-architecture-v4.svg](architecture/chairman-agent-tech-architecture-v4.svg) | v4架构图（存档） | v4 |
| [chairman-agent-tech-architecture-v3.svg](architecture/chairman-agent-tech-architecture-v3.svg) | v3架构图（存档） | v3 |
| [open-notebook-tech-architecture.svg](architecture/open-notebook-tech-architecture.svg) | Open-Notebook独立架构图 | - |

---

### 📋 规划文档 (`planning/`)

项目规划、实施路线图、功能设计文档。

| 文档 | 核心内容摘要 |
|------|--------------|
| [MVP-IMPLEMENTATION-PLAN.md](planning/MVP-IMPLEMENTATION-PLAN.md) | **"智董"MVP完整落地方案** - 基于1500+源码文件深度分析的v2.0版本。包含3个MVP规划：MVP-1知识库管理、MVP-2协同创作、MVP-3深度研究。6-8周实施周期，精确到文件名和行号的改造点。 |
| [INTEGRATION_PLAN_DETAILED.md](planning/INTEGRATION_PLAN_DETAILED.md) | **详细集成方案v2.0** - 8000+行详细设计。核心理念"不是重建而是连接"。包含OpenCanvas、OpenDeepResearch、Open-Notebook三个项目的数据流设计、API集成、前端门户方案。 |
| [AGENT_CHAT_UI_PLAN.md](planning/AGENT_CHAT_UI_PLAN.md) | **Deep Research本地Web UI方案** - 摆脱LangSmith云端依赖，使用Agent Chat UI(LangChain官方)实现类Claude聊天界面，100%本地运行。 |
| [AGENT_CHAT_UI_UX_OPTIMIZATION.md](planning/AGENT_CHAT_UI_UX_OPTIMIZATION.md) | Agent Chat UI用户体验优化方案 |
| [AGENT_CHAT_UI_UX_OPTIMIZATION_v2.md](planning/AGENT_CHAT_UI_UX_OPTIMIZATION_v2.md) | UX优化方案v2版本 |
| [NEXTAUTH_ZITADEL_INTEGRATION_PLAN.md](planning/NEXTAUTH_ZITADEL_INTEGRATION_PLAN.md) | NextAuth与Zitadel身份认证集成方案 |
| [OPEN_NOTEBOOK_MULTIUSER_PLAN.md](planning/OPEN_NOTEBOOK_MULTIUSER_PLAN.md) | Open-Notebook多用户支持方案 |
| [INSIGHT_OPTIMIZATION_PLAN.md](planning/INSIGHT_OPTIMIZATION_PLAN.md) | Insight功能优化计划 |
| [HTML-PREVIEW-FIX-PLAN.md](planning/HTML-PREVIEW-FIX-PLAN.md) | HTML预览功能修复方案 |

---

### 🛠️ 实施文档 (`implementation/`)

部署指南、开发实践、问题排查。

| 文档 | 核心内容摘要 |
|------|--------------|
| [DEPLOYMENT_GUIDE.md](implementation/DEPLOYMENT_GUIDE.md) | **部署指南SSOT** - Docker Compose服务架构、环境要求（8GB内存）、基础服务部署、OCR功能部署（docker cp推荐方案）、4种部署策略对比、热更新流程、常见问题解答。 |
| [DEVELOPMENT_PRACTICES.md](implementation/DEVELOPMENT_PRACTICES.md) | **开发实践指南SSOT** - 代码修改工作流（批量/手动）、Docker热更新最佳实践、前端/后端部署流程、版本管理策略。 |
| [TROUBLESHOOTING.md](implementation/TROUBLESHOOTING.md) | **问题排查指南SSOT** - OCR"无可用内容"问题、Docker部署问题、API调用问题、性能优化建议。包含完整诊断命令和解决方案。 |
| [MODEL_CONFIGURATION_GUIDE.md](implementation/MODEL_CONFIGURATION_GUIDE.md) | **模型配置指南** - LLM模型配置架构、配置优先级（数据库>环境变量>代码默认值）、Open Notebook双重配置机制、修改脚本使用说明。 |

---

### 🔍 分析文档 (`analysis/`)

技术调研、源码分析、竞品研究。

| 文档 | 核心内容摘要 |
|------|--------------|
| [OPEN_NOTEBOOK_CHAT_ANALYSIS.md](analysis/OPEN_NOTEBOOK_CHAT_ANALYSIS.md) | **Open-Notebook对话机制深度分析** - 三种对话方式详解：Source Chat（单源深度理解）、Notebook Chat（多源可控上下文）、Ask（全局向量搜索）。数据流分析、代码实现、优化建议。 |
| [OPEN_DEEP_RESEARCH_ANALYSIS.md](analysis/OPEN_DEEP_RESEARCH_ANALYSIS.md) | OpenDeepResearch架构分析 |
| [GOOGLE_NOTEBOOKLM_ANALYSIS.md](analysis/GOOGLE_NOTEBOOKLM_ANALYSIS.md) | Google NotebookLM竞品分析 |

---

### 📚 参考文档 (`reference/`)

深度技术参考、源码分析总结。

| 文档 | 核心内容摘要 |
|------|--------------|
| [DEEP_ANALYSIS_SUMMARY.md](reference/DEEP_ANALYSIS_SUMMARY.md) | **深度源码分析总结** - 对三个开源项目（OpenCanvas/OpenDeepResearch/Open-Notebook）1500+文件的源码级分析。关键发现：接口兼容性高、改造点精确到文件行号、技术可行性5/5。每个项目的真实架构和关键改造点。 |

---

### 🔄 迁移文档 (`migration/`)

技术迁移方案、Embedding优化。

| 文档 | 核心内容摘要 |
|------|--------------|
| [MIGRATION_EXECUTIVE_SUMMARY.md](migration/MIGRATION_EXECUTIVE_SUMMARY.md) | **Ollama Embedding迁移执行摘要** - 从SentenceTransformers切换到Ollama的可行性分析（8/10高度可行）。推荐nomic-embed-text，搜索质量提升7-9%，总工作量6-12小时。 |
| [ANALYSIS_OLLAMA_EMBEDDING_MIGRATION.md](migration/ANALYSIS_OLLAMA_EMBEDDING_MIGRATION.md) | Ollama Embedding迁移详细分析 |
| [OLLAMA_MIGRATION_IMPLEMENTATION_GUIDE.md](migration/OLLAMA_MIGRATION_IMPLEMENTATION_GUIDE.md) | Ollama迁移实施指南 |
| [OLLAMA_QUICK_REFERENCE.md](migration/OLLAMA_QUICK_REFERENCE.md) | Ollama快速参考卡 |

---

### 🎨 设计文档 (`design/`)

UI/UX设计系统、品牌规范。

| 文档 | 核心内容摘要 |
|------|--------------|
| [TURINGFLOW_DESIGN_SYSTEM.md](design/TURINGFLOW_DESIGN_SYSTEM.md) | **TuringFlow设计系统** - 品牌名"董智"，"环流"主题设计理念。完整颜色系统（Cyan/Blue/Indigo/Purple渐变）、字体系统（Inter主字体）、7种有机曲线SVG模板、动画系统、UI组件库。面向高管用户的专业高端风格。 |

---

### 🐛 故障排除 (`troubleshooting/`)

特定问题的解决方案记录。

| 文档 | 核心内容摘要 |
|------|--------------|
| [OPENROUTER_401_FIX.md](troubleshooting/OPENROUTER_401_FIX.md) | **OpenRouter 401错误解决** - 问题：请求被错误发送到platform.openai.com。根因：initChatModel忽略configuration中的baseUrl。解决方案：直接实例化ChatOpenAI并传入配置参数。 |

---

### 📊 报告文档 (`reports/`)

进度报告、冲突分析、修改记录。

| 文档 | 核心内容摘要 |
|------|--------------|
| [WEEK1_COMPLETION_REPORT.md](reports/WEEK1_COMPLETION_REPORT.md) | 第一周完成报告 |
| [CONFLICT_ANALYSIS.md](reports/CONFLICT_ANALYSIS.md) | 代码冲突分析报告 |
| [LOCAL_MODIFICATIONS.md](reports/LOCAL_MODIFICATIONS.md) | 本地修改记录 |
| [CONVERSATION_SUMMARY.md](reports/CONVERSATION_SUMMARY.md) | 对话总结 |

---

### 🔌 第三方项目 (`thirdparty/`)

集成的开源项目说明文档。

| 文档 | 核心内容摘要 |
|------|--------------|
| [open-notebook-readme.md](thirdparty/open-notebook-readme.md) | **Open-Notebook** - 知识库管理系统。FastAPI + SurrealDB + Next.js，87个API端点，内置全文搜索（BM25）和向量搜索，完整内容处理流程。 |
| [open-canvas-readme.md](thirdparty/open-canvas-readme.md) | **OpenCanvas** - 协同创作助手。TypeScript/Next.js Monorepo，LangGraph服务器，Reflection Agent学习用户风格，流式响应UI。 |
| [open-deepresearch-readme.md](thirdparty/open-deepresearch-readme.md) | **OpenDeepResearch** - 深度研究Agent。分层Agent体系（Supervisor + Researcher + Compression），支持多种搜索API，异步并行处理。 |

---

### 📁 资源文件 (`assets/`)

品牌资源、参考资料。

| 资源 | 说明 |
|------|------|
| [Turingflow-blue-logo.png](assets/Turingflow-blue-logo.png) | TuringFlow品牌Logo（蓝色剑鱼） |
| `pdfs/` | PDF参考文档目录 |
| `html canvas/` | HTML Canvas相关资料 |

---

### 🗄️ 归档文档 (`archive/`)

历史版本文档，仅供参考。

| 目录 | 说明 |
|------|------|
| `archive/2025-11-25/` | 2025-11-25归档的过时文档（部署策略分析、OCR问题分析等） |

---

## 快速开始指南

### 新手入门路径

```
1. 阅读 ../CLAUDE.md                           → 项目概览
2. 阅读 planning/MVP-IMPLEMENTATION-PLAN.md    → 理解MVP规划
3. 阅读 implementation/DEPLOYMENT_GUIDE.md     → 部署项目
4. 查看 architecture/...-v5.svg                → 理解系统架构
```

### 开发者路径

```
1. 阅读 reference/DEEP_ANALYSIS_SUMMARY.md     → 理解三个开源项目
2. 阅读 planning/INTEGRATION_PLAN_DETAILED.md  → 了解集成架构
3. 阅读 design/TURINGFLOW_DESIGN_SYSTEM.md     → 学习设计系统
4. 阅读 implementation/DEVELOPMENT_PRACTICES.md → 开发工作流
```

### 运维人员路径

```
1. 阅读 implementation/DEPLOYMENT_GUIDE.md     → 部署指南
2. 阅读 implementation/TROUBLESHOOTING.md      → 问题排查
3. 阅读 migration/OLLAMA_MIGRATION_...         → 迁移指南
```

---

## 文档维护规范

### 添加新文档

按以下分类添加：

| 类型 | 目录 |
|------|------|
| 技术架构图 | `architecture/` |
| 项目规划、功能设计 | `planning/` |
| 部署、开发实践 | `implementation/` |
| 技术分析、源码研究 | `analysis/` |
| 技术参考 | `reference/` |
| 迁移方案 | `migration/` |
| UI/UX设计 | `design/` |
| 问题解决记录 | `troubleshooting/` |
| 进度报告 | `reports/` |
| 第三方项目说明 | `thirdparty/` |
| 品牌资源 | `assets/` |
| 过时文档 | `archive/YYYY-MM-DD/` |

### 更新文档索引

添加新文档后，请更新本文件 (`docs/README.md`)。

---

## 相关链接

| 资源 | 路径 |
|------|------|
| **项目根目录** | [../](../) |
| **项目入口文档** | [../CLAUDE.md](../CLAUDE.md) |
| **第三方项目源码** | `../thirdparty/` |
| **数据目录** | `../data/` |
| **部署脚本** | `../scripts/` |
| **Docker配置** | `../docker-compose.yml` |

---

**维护者**: Claude Code
**最后更新**: 2025-11-29
