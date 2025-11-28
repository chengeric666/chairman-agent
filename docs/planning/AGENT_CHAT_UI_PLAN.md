# Deep Research 本地Web UI方案

**文档版本**: 1.0
**创建日期**: 2025-11-28
**状态**: ✅ 已实施

---

## 1. 背景与需求

### 1.1 问题描述

在使用Open Deep Research时，我们发现：

1. **依赖云端UI**: `langgraph dev`命令启动后，自动打开`https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024`
2. **数据流经云端**: 虽然数据最终存储在本地，但UI请求需要经过LangSmith云服务器
3. **界面不完善**: LangSmith Studio界面偏向开发调试，不适合最终用户使用
4. **网络依赖**: 离线环境无法使用图形界面

### 1.2 用户需求

> "web ui当前我最需要的是一个类似claude的chat界面...当前完全依赖langsmith云ui，界面也很半成品...看看能否当我访问http://127.0.0.1:2024，可以有ui界面，用户用于访问的deep research界面，就像open notebook、open canvas有界面一样。"

**核心诉求**:
- 类似Claude的现代聊天界面
- 100%本地运行，无云端依赖
- 数据完全自主可控
- 简洁易用的用户体验

---

## 2. 方案调研

### 2.1 候选方案对比

| 方案 | 技术栈 | 优势 | 劣势 | 评分 |
|------|--------|------|------|------|
| **Agent Chat UI** | Next.js + React | LangChain官方维护，专为LangGraph设计，2k+ stars | 需要Node.js环境 | ⭐⭐⭐⭐⭐ |
| **Chainlit** | Python + Streamlit | Python原生，集成简单 | 界面风格较朴素，定制性有限 | ⭐⭐⭐⭐ |
| **自建UI** | 任意前端框架 | 完全可控 | 开发成本高，需要自己实现WebSocket等 | ⭐⭐⭐ |
| **LangSmith Studio** | 云服务 | 功能强大，调试完善 | 依赖云端，非开源 | ⭐⭐ |

### 2.2 Agent Chat UI 详细分析

**项目信息**:
- 仓库: https://github.com/langchain-ai/agent-chat-ui
- Stars: 2,000+
- 维护者: LangChain官方团队
- 许可证: MIT

**核心特性**:
1. **LangGraph原生支持**: 专门为LangGraph服务器设计，支持`messages`状态键
2. **现代UI设计**: 类似ChatGPT/Claude的对话界面
3. **实时流式输出**: 支持SSE流式响应
4. **Artifact渲染**: 支持在侧边栏显示生成的文档/代码
5. **消息控制**: 可隐藏内部工具调用消息
6. **本地优先**: 默认连接localhost，无需API密钥

**技术架构**:
```
┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  LangGraph API  │
│  localhost:3030 │     │  localhost:2024 │
└─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │  Deep Research  │
        │               │    图执行器      │
        │               └─────────────────┘
        │                       │
        ▼                       ▼
   浏览器渲染              外部服务调用
```

### 2.3 方案选择理由

选择 **Agent Chat UI** 作为最终方案，理由如下：

1. **官方维护**: LangChain团队维护，与LangGraph深度集成
2. **开箱即用**: 配置简单，只需设置两个环境变量
3. **界面美观**: 现代化设计，符合用户"类似Claude"的需求
4. **社区活跃**: 2k+ stars，持续更新
5. **MIT许可**: 完全开源，可自由修改
6. **本地优先**: 默认配置就是连接本地服务

---

## 3. 实施方案

### 3.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     你的电脑 (100% 本地)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │   浏览器访问      │         │   Agent Chat UI        │   │
│  │                 │────────▶│   (Next.js)            │   │
│  │                 │         │   localhost:3030       │   │
│  └─────────────────┘         └───────────┬─────────────┘   │
│                                          │                  │
│                                          │ API调用          │
│                                          ▼                  │
│                              ┌─────────────────────────┐   │
│                              │   LangGraph API服务器    │   │
│                              │   localhost:2024        │   │
│                              │   ├── Deep Researcher   │   │
│                              │   ├── configuration.py  │   │
│                              │   └── prompts.py        │   │
│                              └───────────┬─────────────┘   │
│                                          │                  │
│          ┌───────────────────────────────┼──────────────┐  │
│          │                               │              │  │
│          ▼                               ▼              ▼  │
│  ┌───────────────┐           ┌───────────────┐  ┌──────────┐│
│  │ .langgraph_api│           │  知识库API    │  │ OpenRouter││
│  │ (本地数据)     │           │ localhost:5055│  │  (外部)   ││
│  └───────────────┘           └───────────────┘  └──────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 目录结构

```
chairman-agent/
└── thirdparty/
    ├── agent-chat-ui/              # 新增：聊天UI
    │   ├── .env                    # 环境配置
    │   ├── src/                    # 源代码
    │   ├── package.json            # 依赖配置
    │   └── ...
    └── open_deep_research/         # 原有：Deep Research后端
        ├── .env                    # 后端配置
        ├── src/
        │   └── open_deep_research/
        │       ├── deep_researcher.py
        │       ├── configuration.py
        │       └── prompts.py
        └── ...
```

### 3.3 配置文件

**agent-chat-ui/.env**:
```bash
# LangGraph Configuration for Deep Research
# 连接到本地运行的 LangGraph 服务器
NEXT_PUBLIC_API_URL=http://localhost:2024

# Assistant/Graph ID - 使用 Deep Researcher 图
NEXT_PUBLIC_ASSISTANT_ID=Deep Researcher

# 本地开发不需要 LangSmith API Key
# LANGSMITH_API_KEY=
```

### 3.4 启动流程

```bash
# 步骤1: 启动LangGraph API服务器
cd thirdparty/open_deep_research
source .env && .venv/bin/langgraph dev --port 2024

# 步骤2: 启动聊天UI (新终端)
cd thirdparty/agent-chat-ui
pnpm dev  # 默认端口3030

# 步骤3: 访问
open http://localhost:3030
```

---

## 4. 技术细节

### 4.1 数据流分析

**之前 (LangSmith Studio)**:
```
浏览器 ──▶ smith.langchain.com ──▶ localhost:2024 ──▶ OpenRouter
   │              ↑                      │
   │         云端UI托管                 本地API
   │              │
   └──────────────┘
        数据返回
```

**现在 (Agent Chat UI)**:
```
浏览器 ──▶ localhost:3030 ──▶ localhost:2024 ──▶ OpenRouter
   │            │                    │
   │       本地UI服务             本地API
   │            │
   └────────────┘
      完全本地
```

### 4.2 API兼容性

Agent Chat UI通过以下API与LangGraph通信：

| 端点 | 方法 | 用途 |
|------|------|------|
| `/threads` | POST | 创建新对话线程 |
| `/threads/{id}/runs` | POST | 提交研究请求 |
| `/threads/{id}/runs/{id}/stream` | GET | 流式获取响应 |
| `/threads/{id}/state` | GET | 获取对话状态 |
| `/assistants` | GET | 获取可用的图列表 |

### 4.3 自定义扩展点

如果需要定制UI，可以修改以下文件：

| 文件 | 用途 | 定制场景 |
|------|------|----------|
| `src/app/page.tsx` | 主页面 | 添加欢迎语、品牌定制 |
| `src/components/` | UI组件 | 修改消息样式、添加功能 |
| `src/providers/Stream.tsx` | 流处理 | 自定义认证、头部 |
| `tailwind.config.js` | 样式主题 | 颜色、字体定制 |

---

## 5. 对比总结

### 5.1 Before vs After

| 维度 | 之前 (LangSmith) | 现在 (Agent Chat UI) |
|------|------------------|---------------------|
| **UI来源** | 云端托管 | 本地localhost:3030 |
| **数据传输** | 经过云服务器 | 完全本地 |
| **网络依赖** | 必须在线 | 可离线使用 |
| **费用** | 可能有使用限制 | 完全免费 |
| **界面风格** | 开发调试风格 | 用户友好的聊天界面 |
| **可定制性** | 无法修改 | 完全开源可定制 |
| **数据安全** | 数据经过第三方 | 数据不离开本地 |

### 5.2 优势总结

1. **隐私保护**: 研究数据、对话记录完全保留在本地
2. **零成本**: 无云服务费用，无使用限制
3. **高可用**: 不依赖外部服务器可用性
4. **可定制**: 可根据需求修改UI
5. **简洁界面**: 类似Claude的现代聊天体验

---

## 6. 相关资源

### 6.1 架构图

- `docs/diagrams/local-chat-ui-architecture.svg` - 本地UI架构图
- `docs/diagrams/langgraph-architecture.svg` - LangGraph架构详解
- `docs/diagrams/langfuse-vs-langsmith.svg` - 可观测性平台对比

### 6.2 参考链接

- [Agent Chat UI GitHub](https://github.com/langchain-ai/agent-chat-ui)
- [LangGraph文档](https://langchain-ai.github.io/langgraph/)
- [LangGraph API参考](https://langchain-ai.github.io/langgraph/cloud/reference/api/api_ref/)

### 6.3 相关文档

- `docs/planning/MVP-IMPLEMENTATION-PLAN.md` - MVP整体规划
- `docs/planning/INTEGRATION_PLAN_DETAILED.md` - 详细集成方案

---

## 7. 后续优化方向

### 7.1 短期 (可选)

- [ ] 添加中文界面支持
- [ ] 自定义Logo和品牌
- [ ] 添加研究历史侧边栏

### 7.2 中期 (可选)

- [ ] 集成Langfuse进行追踪分析
- [ ] 添加用户认证 (与Zitadel集成)
- [ ] 支持多图切换

### 7.3 长期 (可选)

- [ ] 开发专属Deep Research UI
- [ ] 添加可视化报告导出
- [ ] 移动端适配

---

**文档维护者**: Claude Code
**最后更新**: 2025-11-28
