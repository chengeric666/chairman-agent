# 智董项目文档中心

**项目**: Chairman Agent (智董)
**文档版本**: 1.0
**最后更新**: 2025-11-23

---

## 📚 文档导航

### 🎨 设计文档 (`design/`)

| 文档 | 描述 | 状态 |
|-----|------|------|
| [TURINGFLOW_DESIGN_SYSTEM.md](design/TURINGFLOW_DESIGN_SYSTEM.md) | TuringFlow 完整设计系统 - 颜色、字体、组件、动画 | ✅ 完成 |

**设计系统包含**:
- 核心设计原则（环流主题、沉浸式体验、专业高端）
- 完整颜色系统（Cyan/Blue/Indigo/Purple 渐变色系）
- 字体系统（Inter 主字体）
- 7种有机曲线SVG模板
- 动画系统（淡入、脉冲、有机漂浮）
- UI组件库（按钮、输入框、卡片、徽章等）

---

### 📋 规划文档 (`planning/`)

| 文档 | 描述 | 状态 |
|-----|------|------|
| [MVP-IMPLEMENTATION-PLAN.md](planning/MVP-IMPLEMENTATION-PLAN.md) | MVP完整实施计划 - 3个MVP的详细规划 | ✅ 完成 |
| [IMPLEMENTATION_ROADMAP.md](planning/IMPLEMENTATION_ROADMAP.md) | 实施路线图 | ✅ 完成 |

**核心MVP**:
- MVP-1: Open-Notebook + 知识库查询Agent
- MVP-2: OpenCanvas 协同创作集成
- MVP-3: OpenDeepResearch 改造与集成

---

### 🔗 集成文档 (`integration/`)

| 文档 | 描述 | 状态 |
|-----|------|------|
| [INTEGRATION_PLAN_DETAILED.md](integration/INTEGRATION_PLAN_DETAILED.md) | 详细集成计划 - 三个开源项目的集成方案 | ✅ 完成 |
| [DEEP_ANALYSIS_SUMMARY.md](integration/DEEP_ANALYSIS_SUMMARY.md) | 深度分析摘要 | ✅ 完成 |

**集成项目**:
- Open-Notebook (知识库管理)
- OpenCanvas (协同创作)
- OpenDeepResearch (深度研究)

---

### 🔄 迁移文档 (`migration/`)

| 文档 | 描述 | 状态 |
|-----|------|------|
| [ANALYSIS_OLLAMA_EMBEDDING_MIGRATION.md](migration/ANALYSIS_OLLAMA_EMBEDDING_MIGRATION.md) | Ollama Embedding 迁移分析 | ✅ 完成 |
| [MIGRATION_EXECUTIVE_SUMMARY.md](migration/MIGRATION_EXECUTIVE_SUMMARY.md) | 迁移执行摘要 | ✅ 完成 |
| [OLLAMA_MIGRATION_IMPLEMENTATION_GUIDE.md](migration/OLLAMA_MIGRATION_IMPLEMENTATION_GUIDE.md) | Ollama 迁移实施指南 | ✅ 完成 |
| [OLLAMA_QUICK_REFERENCE.md](migration/OLLAMA_QUICK_REFERENCE.md) | Ollama 快速参考 | ✅ 完成 |

**迁移内容**:
- OpenAI Embeddings → Ollama 本地 Embeddings
- 成本优化和性能提升

---

### 📊 报告文档 (`reports/`)

| 文档 | 描述 | 状态 |
|-----|------|------|
| [WEEK1_COMPLETION_REPORT.md](reports/WEEK1_COMPLETION_REPORT.md) | 第一周完成报告 | ✅ 完成 |
| [CONFLICT_ANALYSIS.md](reports/CONFLICT_ANALYSIS.md) | 冲突分析报告 | ✅ 完成 |
| [LOCAL_MODIFICATIONS.md](reports/LOCAL_MODIFICATIONS.md) | 本地修改记录 | ✅ 完成 |

---

### 🛠️ 实施文档 (`implementation/`)

| 文档 | 描述 | 状态 |
|-----|------|------|
| [DEPLOYMENT_GUIDE.md](implementation/DEPLOYMENT_GUIDE.md) | 部署指南 - Docker Compose 部署流程 | ✅ 完成 |
| [FRONTEND_DOCKER_DEPLOYMENT_BEST_PRACTICES.md](implementation/FRONTEND_DOCKER_DEPLOYMENT_BEST_PRACTICES.md) | 前端Docker部署最佳实践 - 详细工作流程和故障排查 | ✅ 完成 |
| [QUICK_REFERENCE_FRONTEND_DEPLOYMENT.md](implementation/QUICK_REFERENCE_FRONTEND_DEPLOYMENT.md) | 前端部署快速参考 - 5步标准流程速查 | ✅ 完成 |

**实践指南包含**:
- 代码修改最佳实践（Task工具 vs 手动Edit）
- Docker容器内热更新流程
- 构建和部署标准步骤
- 常见问题和解决方案
- 性能优化技巧

---

### 🔌 第三方项目说明 (`thirdparty/`)

| 文档 | 描述 | 状态 |
|-----|------|------|
| [open-notebook-readme.md](thirdparty/open-notebook-readme.md) | Open-Notebook 项目说明 | ✅ 完成 |
| [open-canvas-readme.md](thirdparty/open-canvas-readme.md) | OpenCanvas 项目说明 | ✅ 完成 |
| [open-deepresearch-readme.md](thirdparty/open-deepresearch-readme.md) | OpenDeepResearch 项目说明 | ✅ 完成 |

---

### 🎯 资源文件 (`assets/`)

| 文件/目录 | 描述 | 用途 |
|-----|------|------|
| [Turingflow-blue-logo.png](assets/Turingflow-blue-logo.png) | TuringFlow 品牌 Logo (蓝色剑鱼) | 品牌标识 |
| `pdfs/` | PDF文档资源 | 项目需求文档、参考资料 |

---

## 🚀 快速开始

### 新手入门
1. 阅读 [../README.md](../README.md) - 项目概览
2. 阅读 [planning/MVP-IMPLEMENTATION-PLAN.md](planning/MVP-IMPLEMENTATION-PLAN.md) - 了解MVP规划
3. 阅读 [implementation/DEPLOYMENT_GUIDE.md](implementation/DEPLOYMENT_GUIDE.md) - 部署项目

### 开发者
1. 阅读 [design/TURINGFLOW_DESIGN_SYSTEM.md](design/TURINGFLOW_DESIGN_SYSTEM.md) - 学习设计系统
2. 使用 `/.claude/skills/turing-ui.md` - 应用设计系统
3. 阅读 [integration/INTEGRATION_PLAN_DETAILED.md](integration/INTEGRATION_PLAN_DETAILED.md) - 了解集成架构

### 运维人员
1. 阅读 [implementation/DEPLOYMENT_GUIDE.md](implementation/DEPLOYMENT_GUIDE.md) - 部署指南
2. 阅读 [migration/OLLAMA_MIGRATION_IMPLEMENTATION_GUIDE.md](migration/OLLAMA_MIGRATION_IMPLEMENTATION_GUIDE.md) - Ollama配置

---

## 📝 文档维护

### 添加新文档
请按照以下分类添加文档：
- **设计相关** → `design/`
- **规划相关** → `planning/`
- **集成相关** → `integration/`
- **迁移相关** → `migration/`
- **报告相关** → `reports/`
- **实施相关** → `implementation/`
- **第三方说明** → `thirdparty/`
- **资源文件** → `assets/`

### 更新文档索引
添加新文档后，请更新本文件 (`docs/README.md`)。

---

## 🔗 相关链接

- **项目根目录**: [../](../)
- **源代码**: `../src/`
- **第三方项目**: `../thirdparty/`
- **数据目录**: `../data/`
- **Claude Skills**: `../.claude/skills/`

---

**维护者**: Claude (Anthropic)
**最后更新**: 2025-11-23
