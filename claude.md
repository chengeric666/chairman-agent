# 智董 Chairman Agent

**项目名称**：Chairman Agent (智董)
**更新时间**：2025-11-25
**状态**：MVP开发完成，部署优化中

---

## 项目概述

智董是一个基于AI的智能助理系统，为董事长提供个性化的知识管理和分析能力。

### 核心组件

| 组件 | 说明 | 状态 |
|------|------|------|
| **Open-Notebook** | 知识库管理、文档存储 | ✅ 已部署 |
| **OpenCanvas** | 协同创作助手 | ✅ 已集成 |
| **OpenDeepResearch** | 深度分析、思想体系化 | ✅ 已集成 |

---

## 当前进度

```
MVP-1: 知识库管理与查询          [##########] 100% ✅
MVP-2: OpenCanvas协同创作        [##########] 100% ✅
MVP-3: OpenDeepResearch改造       [##########] 100% ✅
前端开发与测试                    [##########] 100% ✅
部署与优化                        [########--]  80% 🚀
```

**整体完成度**: 96%

---

## 快速开始

```bash
# 启动所有服务
docker compose up -d

# 部署OCR功能
./scripts/deploy_ocr.sh

# 访问Web界面
open http://localhost:8502
```

---

## 📚 文档导航 (SSOT)

### 核心文档

| 主题 | 文档 | 说明 |
|------|------|------|
| **部署指南** | `docs/implementation/DEPLOYMENT_GUIDE.md` | 服务部署、OCR、前端更新 |
| **开发实践** | `docs/implementation/DEVELOPMENT_PRACTICES.md` | 代码修改、热更新、脚本模板 |
| **问题排查** | `docs/implementation/TROUBLESHOOTING.md` | 常见问题、诊断命令 |
| **MVP规划** | `docs/planning/MVP-IMPLEMENTATION-PLAN.md` | 完整规划、路线图 |
| **详细设计** | `docs/planning/INTEGRATION_PLAN_DETAILED.md` | 集成方案（8000+行） |
| **源码分析** | `docs/reference/DEEP_ANALYSIS_SUMMARY.md` | 三个开源项目分析 |

### 归档文档

历史文档已归档至 `docs/archive/2025-11-25/`，包含：
- 过时的部署策略分析文档
- 被取代的版本文档
- 历史问题分析报告

---

## 服务端口汇总

| 服务 | 地址 | 说明 |
|------|------|------|
| **Open-Notebook UI** | http://localhost:8502 | 知识库Web界面 |
| **Open-Notebook API** | http://localhost:5055/api | 知识库REST API |
| **Chairman API网关** | http://localhost:8001 | 统一API入口 |
| **SurrealDB HTTP** | http://localhost:8000 | 数据库HTTP接口 |
| **SurrealDB WebSocket** | ws://localhost:8000/rpc | 数据库WebSocket连接 |
| **Milvus** | http://localhost:19530 | 向量数据库 |
| **Redis** | redis://localhost:6379 | 缓存存储 |

---

## 技术栈

| 层级 | 技术 | 版本 | 状态 |
|------|------|------|------|
| **知识库** | Open-Notebook | Latest | ✅ 已部署 |
| **数据库** | SurrealDB | Latest | ✅ 已部署 |
| **向量库** | Milvus | v0.5.0 | ✅ 已部署 |
| **创作工具** | OpenCanvas | Latest | ✅ 已集成 |
| **深度研究** | OpenDeepResearch | Latest | ✅ 已集成 |
| **LLM** | Grok via OpenRouter | Latest | ✅ 已配置 |
| **后端框架** | FastAPI | Latest | ✅ 运行中 |
| **Agent框架** | LangChain + LangGraph | Latest | ✅ 运行中 |
| **前端** | Next.js 15 | 15.4.7 | ✅ 运行中 |
| **容器化** | Docker Compose | v2 | ✅ 已配置 |
| **OCR** | PaddleOCR | 2.8.0+ | ✅ 已验证 |

---

## 常用命令

```bash
# 服务管理
docker compose ps                    # 查看服务状态
docker compose logs -f open_notebook # 查看日志
docker compose restart open_notebook # 重启服务

# 进入容器
docker exec -it chairman_open_notebook sh

# 部署OCR
./scripts/deploy_ocr.sh

# 前端构建
docker exec chairman_open_notebook sh -c "cd /app/frontend && npm run build"
```

---

## 开发统计

| 指标 | 数值 |
|------|------|
| **代码行数** | ~8000行 (Python + TypeScript + 文档) |
| **文件数量** | 45+个 |
| **Agent数量** | 6个 |
| **测试用例** | 70+个 |
| **Prompt模板** | 20+个 |
| **API端点** | 15+个 |

---

## 技术决策记录

### 1. MVP顺序调整
- **原**：MVP-1基础设施 → MVP-2Agent改造 → MVP-3验证
- **新**：MVP-1知识库 → MVP-2创作 → MVP-3深度分析
- **理由**：从用户价值出发，优先完成最核心的功能

### 2. Grok选择
- **优势**：性能强劲、通过OpenRouter接入、即插即用
- **备选**：DeepSeek、本地模型（后续可迁移）

### 3. 部署策略
- **热更新**：99%日常开发使用
- **扩展镜像**：依赖变更时使用
- **理由**：分层思维，基础设施层和开发迭代层分离

### 4. OCR方案
- **选择**：PaddleOCR（官方镜像已包含）
- **配置**：DPI=72（性能与质量平衡）
- **部署**：docker cp（无需重建镜像）

---

## 最近更新

### 2025-11-25
- ✅ OCR功能验证完成（图像PDF提取成功：31,402字符）
- ✅ 文档SSOT整理完成（归档6个过时文档）
- ✅ 部署脚本 `scripts/deploy_ocr.sh` 创建

### 2025-11-24
- ✅ OpenRouter 401错误修复
- ✅ 前端中文化完成

### 2025-11-23
- ✅ MVP-2/MVP-3核心功能完成
- ✅ E2E测试套件完成（40+测试用例）
- ✅ 深度源码分析完成（1500+文件）

---

## 风险与应对

| 风险 | 概率 | 影响 | 应对方案 |
|------|------|------|----------|
| Agent输出质量不达标 | 中 | 高 | Prompt优化测试 |
| 知识库检索相关性差 | 中 | 中 | 优化embedding策略 |
| 集成复杂度超预期 | 低 | 高 | 保持模块化 |
| 性能瓶颈 | 低 | 中 | 性能压测提前识别 |

---

## 开发规范

### Git仓库

- **远程仓库**: `claude/plan-chairman-agent-mvp-01BedNXy1hezSfwR1z1VeLVJ`
- **提交要求**: 开发完成后必须提交到上述仓库

### 交互规范

- 请一直用中文交互
- 使用ultrathink模式进行深度分析
- 重要决策前先分析利弊

### 代码规范

- 遵循SSOT原则，文档集中管理
- 代码修改后使用热更新部署
- 提交前确保功能测试通过
- 保持代码风格一致（Python: PEP8, TypeScript: ESLint）

### 提交流程

```bash
# 1. 检查修改
git status
git diff

# 2. 添加并提交
git add .
git commit -m "feat/fix/docs: 简要描述"

# 3. 推送到远程
git push origin main
```

---

**维护者**: Claude Code
**最后更新**: 2025-11-25
