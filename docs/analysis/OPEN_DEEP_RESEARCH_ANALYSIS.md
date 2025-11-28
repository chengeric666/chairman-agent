# Open DeepResearch 深度分析报告

**分析时间**：2025-11-28
**分析版本**：基于 langchain-ai/open_deep_research
**分析目的**：深入理解系统架构，为智董项目集成提供参考

---

## 一、核心功能概述

Open DeepResearch 是一个**自主深度研究 Agent 系统**，主要功能：

| 功能 | 说明 |
|------|------|
| **分层研究架构** | 监督者-研究员的多层级结构 |
| **并行研究** | 最多 5 个研究单元同时工作 |
| **多源数据** | 知识库 + 网络搜索 + MCP工具 |
| **智能报告** | 自动生成结构化深度分析报告 |

### 1.1 主要用例

- 复杂问题的深度研究和分析
- 多领域信息的并行采集和整合
- 结构化研究报告的自动生成
- 知识库内容的智能检索和应用

---

## 二、端到端业务流程

### 2.1 完整流程图

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    用户提问 → 深度报告 完整流程                        ║
╚═══════════════════════════════════════════════════════════════════════╝

 用户提问                    STAGE 1: 澄清阶段
    │                    ┌─────────────────────┐
    ▼                    │ clarify_with_user() │
 ───────────────────────►│ • 分析用户需求        │
                         │ • 判断是否需要澄清    │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
              需要澄清?                         信息充足
           ┌─────────────┐                  ┌─────────────┐
           │ 向用户提问   │                  │ 继续下一步   │
           └─────────────┘                  └──────┬──────┘
                                                   │
                         STAGE 2: 研究规划         ▼
                    ┌─────────────────────────────────┐
                    │    write_research_brief()       │
                    │ • 转换为研究计划                 │
                    │ • 生成详细研究问题               │
                    └──────────────┬──────────────────┘
                                   │
                         STAGE 3: 监督执行          ▼
                    ┌─────────────────────────────────┐
                    │         supervisor()            │
                    │ • 分解为多个研究任务             │
                    │ • 调用 ConductResearch 工具     │
                    └──────────────┬──────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
              ┌──────────┐  ┌──────────┐  ┌──────────┐
              │研究员 #1 │  │研究员 #2 │  │研究员 #N │  (并行执行)
              │          │  │          │  │          │
              │• 知识库  │  │• 网络搜索│  │• MCP工具 │
              │• 搜索    │  │• Tavily  │  │          │
              └────┬─────┘  └────┬─────┘  └────┬─────┘
                   │             │             │
                   └──────────┬──┴──────────┬──┘
                              ▼             ▼
                    ┌─────────────────────────────────┐
                    │      compress_research()        │
                    │ • 综合所有研究发现               │
                    │ • 提取关键信息                   │
                    └──────────────┬──────────────────┘
                                   │
                         STAGE 4: 报告生成          ▼
                    ┌─────────────────────────────────┐
                    │   final_report_generation()     │
                    │ • 收集所有发现                   │
                    │ • 生成结构化报告                 │
                    └──────────────┬──────────────────┘
                                   │
                                   ▼
                         ┌─────────────────┐
                         │   最终报告输出   │
                         │  (Markdown格式) │
                         └─────────────────┘
```

### 2.2 各阶段详细说明

| 阶段 | 节点 | 功能 | 输入 | 输出 |
|------|------|------|------|------|
| **澄清** | clarify_with_user | 判断是否需要用户确认 | messages | 澄清问题或确认消息 |
| **澄清** | write_research_brief | 生成研究计划 | 确认后的messages | research_brief, supervisor_messages |
| **监督** | supervisor | 规划研究任务分解 | supervisor_messages | tool_calls (ConductResearch/ResearchComplete) |
| **监督** | supervisor_tools | 执行研究任务 | tool_calls | 研究结果+原始笔记 |
| **研究** | researcher | 执行单个研究 | research_topic | tool_calls (搜索/MCP工具) |
| **研究** | researcher_tools | 执行搜索和工具 | tool_calls | 搜索结果 |
| **研究** | compress_research | 压缩研究发现 | 所有messages | compressed_research |
| **报告** | final_report_generation | 生成最终报告 | 所有findings | final_report |

---

## 三、数据流程与状态管理

### 3.1 State 层次结构

```
┌─────────────────────────────────────────────────────────────┐
│                    State 层次结构                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AgentState (主状态)                                        │
│  ├─ messages          # 用户对话历史                        │
│  ├─ supervisor_messages  # 监督者消息                       │
│  ├─ research_brief    # 研究计划                           │
│  ├─ raw_notes         # 原始笔记                           │
│  ├─ notes             # 处理后笔记                          │
│  └─ final_report      # 最终报告                           │
│      │                                                      │
│      ├── SupervisorState (监督者子状态)                     │
│      │   ├─ research_iterations  # 迭代计数                 │
│      │   └─ ...                                             │
│      │                                                      │
│      └── ResearcherState (研究员子状态，并行多个)           │
│          ├─ researcher_messages  # 研究员消息               │
│          ├─ research_topic       # 研究主题                 │
│          ├─ tool_call_iterations # 工具调用计数             │
│          └─ compressed_research  # 压缩后的研究结果         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 状态定义代码

```python
# 位置: src/open_deep_research/state.py

AgentInputState (入口状态)
└─ messages: List[MessageLikeRepresentation]

AgentState (主Agent状态)
├─ messages: List[MessageLikeRepresentation]        # 用户消息对话
├─ supervisor_messages: List (override_reducer)    # 监督者消息
├─ research_brief: Optional[str]                    # 研究计划
├─ raw_notes: List[str] (override_reducer)         # 原始笔记
├─ notes: List[str] (override_reducer)             # 处理后的笔记
└─ final_report: str                               # 最终报告
```

### 3.3 数据存储位置

```
.langgraph_api/
├── .langgraphjs_api.checkpointer.json  # 会话状态快照 (主要存储)
├── .langgraphjs_api.store.json         # 用户数据存储
└── .langgraphjs_ops.json               # 操作日志
```

### 3.4 Override Reducer 模式

```python
def override_reducer(current_value, new_value):
    if isinstance(new_value, dict) and new_value.get("type") == "override":
        return new_value.get("value", new_value)  # 完全覆盖
    else:
        return operator.add(current_value, new_value)  # 追加
```

**使用场景**：
- `supervisor_messages`: override_reducer → 完整覆盖监督者上下文
- `raw_notes` / `notes`: override_reducer → 可追加或完全重置
- `researcher_messages`: operator.add → 始终追加消息历史

---

## 四、LangGraph 图结构

### 4.1 图配置文件

```json
// langgraph.json
{
    "graphs": {
      "Deep Researcher": "./src/open_deep_research/deep_researcher.py:deep_researcher"
    },
    "python_version": "3.11",
    "env": "./.env",
    "auth": {
      "path": "./src/security/auth.py:auth"
    }
}
```

### 4.2 图结构详解

```
┌─────────────────────────────────────────────────────────────┐
│                    Main Graph                               │
│                                                             │
│  START ──► clarify_with_user ──┬──► write_research_brief   │
│                                │         │                  │
│                                └──► END  │                  │
│                                          ▼                  │
│                              research_supervisor            │
│                                    (子图)                   │
│                                          │                  │
│                                          ▼                  │
│                            final_report_generation          │
│                                          │                  │
│                                          ▼                  │
│                                        END                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Supervisor Subgraph (监督者子图)               │
│                                                             │
│  START ──► supervisor ──► supervisor_tools ──┬──► END      │
│                  ▲              │             │              │
│                  └──────────────┘ (循环)     │              │
│                                              │              │
│         工具: ConductResearch ──────────────►│              │
│                    │                         │              │
│                    ▼                         │              │
│         并行调用 researcher_subgraph         │              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               Researcher Subgraph (研究员子图)              │
│                                                             │
│  START ──► researcher ──► researcher_tools ──┬──► END      │
│                 ▲              │              │              │
│                 └──────────────┘ (循环)      │              │
│                                              ▼              │
│                                    compress_research        │
│                                              │              │
│                                              ▼              │
│                                            END              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 核心工具与结构化输出

```
┌─────────────────────────────────────┐
│        Structured Outputs           │
├─────────────────────────────────────┤
│ ✓ ClarifyWithUser                   │
│   - need_clarification: bool        │
│   - question: str                   │
│   - verification: str               │
│                                     │
│ ✓ ResearchQuestion                  │
│   - research_brief: str             │
│                                     │
│ ✓ ConductResearch (Tool)            │
│   - research_topic: str             │
│                                     │
│ ✓ ResearchComplete (Tool)           │
│   - 无参数 (信号类)                │
│                                     │
│ ✓ Summary                           │
│   - summary: str                    │
│   - key_excerpts: str               │
└─────────────────────────────────────┘
```

### 4.4 工具链与搜索策略

```
Tool Registry
├─ 核心工具
│  ├─ think_tool (所有Agent可用)
│  └─ ResearchComplete (信号)
│
└─ 搜索工具 (根据SearchAPI配置)
   ├─ knowledge_base_search (董智知识库)
   │  ├─ 向量搜索 (语义相似度)
   │  ├─ 全文搜索 (关键词匹配)
   │  └─ 混合搜索 (向量+全文)
   │
   ├─ tavily_search (网络搜索)
   │  ├─ Tavily API调用
   │  ├─ 内容总结
   │  └─ URL去重
   │
   ├─ native_web_search (OpenAI/Anthropic)
   │  └─ 模型内置搜索
   │
   └─ MCP工具 (第三方集成)
      ├─ 来自MCP服务器
      ├─ 动态加载
      └─ 认证处理
```

---

## 五、账号管理与认证

### 5.1 认证架构

```python
# 位置: src/security/auth.py

认证流程:
①  HTTP请求 → Authorization Header (Bearer Token)
    ↓
②  @auth.authenticate 装饰器
    ├─ 验证Bearer Token格式
    ├─ 调用Supabase验证JWT
    └─ 返回user.identity (用户ID)
    ↓
③  return {"identity": user.id}
```

### 5.2 认证流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    认证流程                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HTTP请求 ──► Authorization: Bearer <JWT>                   │
│                          │                                  │
│                          ▼                                  │
│              ┌─────────────────────┐                        │
│              │ @auth.authenticate  │                        │
│              │ (Supabase JWT验证)  │                        │
│              └──────────┬──────────┘                        │
│                         │                                   │
│                         ▼                                   │
│              返回 {"identity": user.id}                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 认证配置

**环境变量**：
```
SUPABASE_URL = "https://xxx.supabase.co"
SUPABASE_KEY = "eyJxxxxx"
```

**JWT验证**：
- 通过Supabase进行JWT解码和验证
- 提取user.id作为身份标识
- 异步执行避免阻塞 (asyncio.to_thread)

---

## 六、多用户数据隔离

### 6.1 隔离机制

```
┌─────────────────────────────────────────────────────────────┐
│                  多用户数据隔离机制                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Level 1: Thread隔离 (会话)                                 │
│  ├─ 创建时: metadata["owner"] = user.id                     │
│  ├─ 读取时: filter: {owner: user.id}                        │
│  └─ 删除时: owner验证                                       │
│                                                             │
│  Level 2: Assistant隔离 (助手)                              │
│  ├─ 创建时: metadata["owner"] = user.id                     │
│  └─ 列表时: 仅返回该用户的助手                              │
│                                                             │
│  Level 3: Store隔离 (数据存储)                              │
│  ├─ 命名空间: (user.id, key) 分离                           │
│  └─ 访问时: 验证 namespace[0] == user.id                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 隔离层次详解

```
Level 1: 认证层 (Authentication)
├─ JWT Token验证 (Supabase)
├─ user.identity提取
└─ 非认证请求直接拒绝(401)

Level 2: 资源所有权 (Resource Ownership)
├─ Thread隔离
│  ├─ 创建时绑定: metadata["owner"] = user.id
│  ├─ 读取时过滤: filter["owner"] = user.id
│  └─ 删除时验证: owner检查
│
├─ Assistant隔离
│  ├─ 创建时绑定: metadata["owner"] = user.id
│  ├─ 读取时过滤: filter["owner"] = user.id
│  └─ 列表时过滤: 仅返回user的Assistant
│
└─ Store隔离
   ├─ 命名空间: (user.id, key) 分离
   ├─ 访问控制: namespace[0] == user.id验证
   └─ MCP tokens: 按user.id存储

Level 3: 数据访问 (Data Access)
├─ 知识库搜索时包含user上下文
├─ MCP工具调用包含user身份
└─ 搜索结果过滤(知识库API可选实现)
```

### 6.3 Thread/会话管理流程

```
┌──────────────────────────────────────┐
│        Thread管理流程                │
├──────────────────────────────────────┤
│                                      │
│ 创建Thread:                          │
│ POST /threads                        │
│ ├─ auth检查 ✓                        │
│ ├─ metadata["owner"] = user.id       │
│ └─ 返回thread_id                     │
│                                      │
│ 创建Run:                             │
│ POST /threads/{id}/runs              │
│ ├─ auth检查 ✓                        │
│ ├─ 验证thread所有权 ✓                │
│ ├─ config["metadata"]["owner"] = uid │
│ └─ 执行graph                         │
│                                      │
│ 读取Messages:                        │
│ GET /threads/{id}/messages           │
│ ├─ auth检查 ✓                        │
│ ├─ filter: {"owner": user.id} ✓      │
│ └─ 返回该user的messages             │
│                                      │
│ 删除Thread:                          │
│ DELETE /threads/{id}                 │
│ ├─ auth检查 ✓                        │
│ ├─ owner == user.id验证 ✓            │
│ └─ 删除关联的所有数据                │
│                                      │
└──────────────────────────────────────┘
```

---

## 七、配置系统

### 7.1 Configuration 类（核心配置）

```python
# 位置: src/open_deep_research/configuration.py

Configuration (Pydantic BaseModel)

通用配置:
├─ max_structured_output_retries: int = 3
│  └─ 结构化输出重试次数
├─ allow_clarification: bool = True
│  └─ 是否允许用户澄清
└─ max_concurrent_research_units: int = 5
   └─ 最大并发研究任务数

研究行为:
├─ search_api: SearchAPI = "knowledge_base"  ← 默认改为知识库
│  ├─ 知识库 (KNOWLEDGE_BASE)
│  ├─ Tavily网络搜索 (TAVILY)
│  ├─ OpenAI原生搜索 (OPENAI)
│  ├─ Anthropic原生搜索 (ANTHROPIC)
│  └─ 无搜索 (NONE)
│
├─ max_researcher_iterations: int = 6
│  └─ 监督者最大迭代次数
│
└─ max_react_tool_calls: int = 10
   └─ 研究员最大工具调用数

模型配置 (4个模型):
├─ research_model: "openai:gpt-4.1"
│  └─ 主要研究和监督模型
├─ compression_model: "openai:gpt-4.1"
│  └─ 压缩研究发现
├─ summarization_model: "openai:gpt-4.1-mini"
│  └─ 总结搜索结果
└─ final_report_model: "openai:gpt-4.1"
   └─ 生成最终报告

知识库配置 (董智Open-Notebook):
├─ knowledge_base_url: str = "http://localhost:5055"
│  └─ API服务地址
├─ knowledge_base_api_key: str = "chairman"
│  └─ 认证密钥
├─ knowledge_base_search_limit: int = 10
│  └─ 每次搜索返回的结果数
└─ knowledge_base_search_type: str = "vector"
   ├─ "vector" (向量/语义搜索)
   ├─ "fulltext" (全文/关键词搜索)
   └─ "hybrid" (混合搜索)
```

### 7.2 配置加载优先级

```
优先级:
① 环境变量 (os.environ.get(FIELD_NAME.upper()))
② RunnableConfig中的configurable字段
③ 类定义中的默认值
```

---

## 八、知识库集成

### 8.1 知识库客户端架构

```
KnowledgeBaseClient
├─ 配置
│  ├─ api_url: "http://localhost:5055" (董智Open-Notebook)
│  ├─ api_key: "chairman"
│  └─ timeout: 30秒
│
├─ 搜索方法
│  ├─ search() - 异步并行查询
│  │  ├─ 输入: queries (列表)
│  │  ├─ 参数: search_type, limit
│  │  └─ 返回: 格式化结果字符串
│  │
│  ├─ _search_single() - 单个查询
│  │  ├─ API端点: /api/search
│  │  ├─ 参数: q, type, limit
│  │  └─ 返回: List[Dict] (结果列表)
│  │
│  ├─ get_document() - 获取单个文档
│  ├─ get_stats() - 知识库统计
│  └─ health_check() - 连接验证
│
└─ 结果格式化
   ├─ 标题 (title)
   ├─ 内容 (500字符预览)
   ├─ 作者 (author)
   ├─ 创建日期 (created_at)
   ├─ 来源ID (source_id)
   └─ 相关性评分 (score/relevance)
```

---

## 九、性能与限制

### 9.1 并发限制

| 参数 | 默认值 | 说明 |
|------|--------|------|
| max_concurrent_research_units | 5 | 同时执行最多5个研究任务 |
| max_researcher_iterations | 6 | 监督者最多循环6次 |
| max_react_tool_calls | 10 | 单个研究员最多调用10次工具 |
| max_structured_output_retries | 3 | 结构化输出重试3次 |

### 9.2 Token管理

- 知识库搜索结果: 预处理截断至配置长度
- Tavily搜索结果: 自动总结和去重
- 报告生成失败: 递进式截断findings (每次减少10%)
- 超时保护: 总结操作60秒超时

### 9.3 错误处理

- Token限制: 自动检测(OpenAI/Anthropic/Gemini)并重试
- MCP工具失败: 包装错误处理，提取user-friendly消息
- 知识库连接失败: 返回错误提示和诊断建议
- 研究超时: 直接结束研究进入报告生成

---

## 十、关键文件清单

| 文件 | 路径 | 主要功能 |
|------|------|----------|
| **deep_researcher.py** | src/open_deep_research/ | LangGraph完整实现，包含4个阶段和2个子图 |
| **state.py** | src/open_deep_research/ | 状态定义，包括AgentState、SupervisorState、ResearcherState |
| **configuration.py** | src/open_deep_research/ | 配置管理，知识库和MCP集成配置 |
| **utils.py** | src/open_deep_research/ | 工具函数：搜索、MCP、token管理、认证 |
| **knowledge_base_client.py** | src/open_deep_research/ | 知识库API客户端实现 |
| **auth.py** | src/security/ | Supabase认证和多用户隔离 |
| **prompts.py** | src/open_deep_research/ | 系统提示词模板 |
| **langgraph.json** | 根目录 | LangGraph图配置 |

---

## 十一、服务访问地址

| 服务 | 地址 |
|------|------|
| **API** | http://127.0.0.1:2024 |
| **Studio UI** | https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024 |
| **API 文档** | http://127.0.0.1:2024/docs |

---

## 十二、智董集成要点

### 12.1 已完成的改造

- 默认搜索源: Tavily → 知识库 (KNOWLEDGE_BASE)
- 知识库配置: api_url=http://localhost:5055, api_key=chairman
- 用户认证: 支持 Supabase JWT 验证
- 多用户隔离: Thread/Assistant/Store 三层隔离

### 12.2 典型使用场景

```
①  董事长提问 (中文)
    ↓
②  澄清阶段: 确认信息充足
    ↓
③  研究规划: 生成详细研究问题
    ↓
④  并行研究:
    ├─ 查询董智知识库 (公司文件、战略、案例)
    ├─ 补充网络搜索 (行业动态、竞对信息)
    └─ MCP工具集成 (数据分析、报表生成)
    ↓
⑤  综合报告: 生成结构化的深度分析报告
    ↓
⑥  返回结果 (markdown格式)
```

---

## 总结

Open DeepResearch 是一个**架构清晰、功能完整、可扩展性强**的深度研究Agent框架：

- **分层设计**：澄清→规划→监督→研究→压缩→报告，每个环节清晰独立
- **并行处理**：支持5个并发研究单元，提高研究效率
- **多源融合**：知识库优先，支持网络搜索和MCP工具补充
- **多用户隔离**：通过JWT和资源过滤实现完整的租户隔离
- **灵活配置**：UI可配置所有核心参数，支持即插即用
- **智董定制**：已改造为知识库优先，完全适配董智知识库访问

---

**维护者**: Claude Code
**最后更新**: 2025-11-28
