# 文档归档说明

**归档日期**: 2025-11-25
**归档原因**: SSOT（单一事实来源）整理

## 归档背景

在OCR功能开发过程中，产生了多个版本的文档，存在以下问题：
1. 多个版本的同类文档（v1、v2、无版本号）
2. 文档间存在矛盾信息
3. 部分结论已被验证为不准确

## 归档内容

### planning/ - 规划文档
| 文件 | 原因 |
|------|------|
| IMPLEMENTATION_ROADMAP.md | 与主计划重叠，已合并 |
| INTEGRATION_PLAN_DETAILED_v1.md | 被v2取代 |
| INTEGRATION_PLAN_DETAILED_original.md | 重复文件 |

### implementation/ - 实施文档
| 文件 | 原因 |
|------|------|
| DOCKER_DEPLOYMENT_STRATEGY_ANALYSIS.md | 建议扩展镜像（验证为不需要） |
| FRONTEND_DOCKER_DEPLOYMENT_BEST_PRACTICES.md | 说需docker cp（验证为volume mount有效） |
| OCR_DEPLOYMENT_GUIDE_v2.md | 被统一部署指南取代 |
| OCR_PROBLEM_ANALYSIS.md | 有价值内容已提取到TROUBLESHOOTING.md |
| OCR_UNIFIED_DEPLOYMENT.md | 已合并到DEPLOYMENT_GUIDE.md |
| QUICK_REFERENCE_FRONTEND_DEPLOYMENT.md | 已合并 |

### claude_md/ - CLAUDE.md详细任务
| 文件 | 原因 |
|------|------|
| MVP_DETAILED_TASKS.md | 从CLAUDE.md提取的详细任务清单 |

## 当前有效文档（SSOT）

请参考以下文档获取最新准确信息：

| 主题 | SSOT文档 |
|------|----------|
| 项目概述 | `/CLAUDE.md` |
| MVP规划 | `/docs/planning/MVP-IMPLEMENTATION-PLAN.md` |
| 详细设计 | `/docs/planning/INTEGRATION_PLAN_DETAILED.md` |
| 部署指南 | `/docs/implementation/DEPLOYMENT_GUIDE.md` |
| 开发实践 | `/docs/implementation/DEVELOPMENT_PRACTICES.md` |
| 问题排查 | `/docs/implementation/TROUBLESHOOTING.md` |
| 源码分析 | `/docs/reference/DEEP_ANALYSIS_SUMMARY.md` |

## 注意事项

- 归档文档仅供历史参考，不应作为当前工作依据
- 如需查阅历史决策过程，可参考这些归档文档
- 任何新发现应更新到对应的SSOT文档中
