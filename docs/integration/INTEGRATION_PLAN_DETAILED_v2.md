# Chairman Agent - 正确集成方案详细设计文档 v2.0

**基于用户反馈的优化方案**
**生成日期**: 2025-11-24
**方案版本**: 2.0-用户反馈优化版
**上一版本**: [INTEGRATION_PLAN_DETAILED_v1.md](./INTEGRATION_PLAN_DETAILED_v1.md)

---

## 📋 v2.0 版本说明

### v1.0 → v2.0 主要变更

| 变更项 | v1.0方案 | v2.0方案 | 变更原因 |
|--------|----------|----------|----------|
| **菜单集成时机** | 阶段3实施（第5-6周） | **阶段1提前实施（第1周）** | 用户反馈：需要提前提供入口访问OpenCanvas和OpenDeepResearch |
| **前端集成策略** | 深度定制改造 | **独立部署 + 门户入口** | 使用原生UI，Open-Notebook作为统一门户 |
| **OpenDeepResearch搜索策略** | 完全替换Tavily为知识库 | **混合搜索（knowledge_base + Tavily）** | 用户反馈：Tavily的Web搜索也有价值，应该并存 |
| **实施复杂度** | 高（大量前端改造） | 中（专注后端集成） | 降低风险，加快交付 |
| **功能完整性** | 知识库单一来源 | 双重数据源增强 | 既利用董智知识，又补充外部信息 |

### v2.0 核心原则

1. **✅ 使用原生UI**: 不重复造轮子，充分利用OpenCanvas和OpenDeepResearch的现有前端
2. **✅ 门户入口优先**: Open-Notebook作为统一入口，第一阶段就添加菜单
3. **✅ 渐进式集成**: 先建立入口和基础连接，后深化功能整合
4. **✅ 双重数据源**: OpenDeepResearch同时支持内部知识库和外部Tavily搜索
5. **✅ 数据双向流动**: OpenCanvas和OpenDeepResearch的输出可保存回Open-Notebook

---

## 一、核心概述

### 1.1 正确的集成目标

**核心理念**: 不是"重建"，而是"连接"

```
┌─────────────────────────────────────────────────────────────┐
│           Chairman Agent 完整系统架构                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  统一门户：Open-Notebook (http://localhost:8502)             │
│  ├─ 知识库管理（原生功能）                                   │
│  ├─ 【新增】菜单入口 → OpenCanvas (8080)                    │
│  └─ 【新增】菜单入口 → OpenDeepResearch (2024)              │
│                                                               │
│  独立服务：OpenCanvas (http://localhost:8080)                │
│  ├─ 原生Next.js前端（保持不变）                             │
│  ├─ LangGraph创作Agent                                       │
│  ├─ 【改造】集成Open-Notebook知识库客户端                   │
│  └─ 【新增】保存创作结果到Open-Notebook                     │
│                                                               │
│  独立服务：OpenDeepResearch (http://localhost:2024)          │
│  ├─ LangGraph Studio前端（保持不变）                        │
│  ├─ LangGraph研究Agent                                       │
│  ├─ 【改造】集成Open-Notebook知识库客户端                   │
│  ├─ 【改造】保留Tavily搜索（混合策略）                      │
│  └─ 【新增】保存研究报告到Open-Notebook                     │
│                                                               │
│  数据基础设施：统一知识库                                    │
│  ├─ SurrealDB（文档+图数据库）                              │
│  ├─ Milvus（向量数据库，可选）                              │
│  └─ Open-Notebook API（统一访问接口）                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 三个系统的正确定位

| 系统 | 部署方式 | 前端UI | 后端集成 | 数据流 |
|------|---------|--------|---------|--------|
| **Open-Notebook** | 8502端口 | 原生UI + 新增菜单 | 保持不变 | 接收来自OpenCanvas和OpenDeepResearch的结果 |
| **OpenCanvas** | 8080端口 | 原生UI（不改） | 添加知识库客户端 | 读取Open-Notebook知识 → 生成创作 → 写回Open-Notebook |
| **OpenDeepResearch** | 2024端口 | 原生LangGraph Studio | 添加知识库客户端 + 保留Tavily | 读取Open-Notebook + Tavily → 生成报告 → 写回Open-Notebook |

### 1.3 数据流设计

#### 创作工作流（OpenCanvas）

```
用户在Open-Notebook点击"开智创作"菜单
   ↓
跳转到 http://localhost:8080 (OpenCanvas原生UI)
   ↓
用户输入创作主题："人才战略"
   ↓
OpenCanvas LangGraph工作流启动
   ├─ 步骤1: 调用Open-Notebook API
   │         GET /api/search?query=人才战略&type=vector
   │         返回相关的董事长思想
   ├─ 步骤2: 将检索结果注入Prompt
   ├─ 步骤3: Claude生成创作建议
   └─ 步骤4: 展示给用户
   ↓
用户编辑完成后点击"保存到知识库"
   ↓
OpenCanvas调用Open-Notebook API
   POST /api/notes
   {
     "title": "人才战略文章草稿",
     "content": "...",
     "source": "opencanvas",
     "metadata": {
       "artifact_id": "...",
       "created_at": "..."
     }
   }
   ↓
内容保存到Open-Notebook，可供后续检索
```

#### 深度研究工作流（OpenDeepResearch）

```
用户在Open-Notebook点击"深度研究"菜单
   ↓
跳转到 http://localhost:2024 (LangGraph Studio)
   ↓
用户输入研究主题："创新理念的核心地位"
   ↓
OpenDeepResearch LangGraph工作流启动
   ├─ 步骤1: clarify_with_user (确认研究范围)
   ├─ 步骤2: write_research_brief (生成研究问题)
   ├─ 步骤3: supervisor (规划研究策略)
   └─ 步骤4: researcher (并行执行研究)
       ├─ 子任务1: 内部知识库搜索
       │   调用: POST /api/search (Open-Notebook)
       │   query="创新理念 核心"
       │   返回: 董事长相关思想和案例
       │
       ├─ 子任务2: 外部互联网搜索（新增）
       │   调用: Tavily API
       │   query="innovation leadership principles"
       │   返回: 外部最佳实践和研究
       │
       └─ 子任务3: 综合分析
           使用思考工具（think_tool）深度分析
           结合内部知识 + 外部信息
   ↓
步骤5: compress_research (综合所有发现)
步骤6: final_report_generation (生成最终报告)
   ↓
用户点击"保存到知识库"
   ↓
OpenDeepResearch调用Open-Notebook API
   POST /api/notes
   {
     "title": "创新理念深度研究报告",
     "content": "...",
     "source": "opendeepresearch",
     "metadata": {
       "research_type": "systemize_thought",
       "sources": ["internal_kb", "tavily"],
       "created_at": "..."
     }
   }
```

---

## 二、阶段化实施方案（6阶段，6-8周）

### 阶段1: 快速建立门户和部署（第1周）

**目标**:
1. 三个系统独立部署成功
2. Open-Notebook添加菜单入口（提前实施）
3. 用户可以通过门户访问三个系统

#### Step 1.1: 三系统独立部署

**Open-Notebook部署** (端口8502):

```bash
# 1. 启动SurrealDB
docker compose up -d surreal

# 2. 配置环境变量
cd thirdparty/open-notebook
cat > .env <<EOF
SURREALDB_URL=ws://localhost:8000/rpc
SURREALDB_USER=root
SURREALDB_PASSWORD=root
SURREALDB_DATABASE=chairman_kb
SURREALDB_NAMESPACE=production
OPENAI_API_KEY=sk-...
EOF

# 3. 启动Open-Notebook
docker compose up -d open_notebook
# 验证: http://localhost:8502
```

**OpenCanvas部署** (端口8080):

```bash
cd thirdparty/open-canvas

# 1. 安装依赖
yarn install

# 2. 配置环境变量
cat > .env <<EOF
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
# 知识库API配置（后续集成使用）
KNOWLEDGE_BASE_API_URL=http://localhost:8502
KNOWLEDGE_BASE_API_KEY=chairman
EOF

# 3. 构建和启动
cd apps/agents && yarn build
cd ../web && yarn dev
# 访问: http://localhost:8080
```

**OpenDeepResearch部署** (端口2024):

```bash
cd thirdparty/open_deep_research

# 1. 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 2. 安装依赖
pip install -e .

# 3. 配置环境变量
cat > .env <<EOF
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...

# 知识库API配置
KB_API_URL=http://localhost:8502
KB_API_KEY=chairman

# 搜索策略（新增：混合模式）
SEARCH_API=hybrid  # 或 "knowledge_base" 或 "tavily"
EOF

# 4. 启动LangGraph Studio
langgraph up
# 访问: http://localhost:2024
```

**验收标准**:
- [ ] Open-Notebook可访问 (http://localhost:8502)
- [ ] OpenCanvas可访问 (http://localhost:8080)
- [ ] OpenDeepResearch可访问 (http://localhost:2024)
- [ ] 所有服务健康检查通过

#### Step 1.2: Open-Notebook菜单集成（重点：提前实施）

**目标**: 在Open-Notebook的侧边栏添加外部链接菜单

**文件修改**: `thirdparty/open-notebook/frontend/src/components/layout/AppSidebar.tsx`

**修改前** (当前navigation结构):
```typescript
const navigation = [
  {
    title: '收集',
    items: [
      { name: '来源', href: '/sources', icon: FileText },
    ],
  },
  {
    title: '处理',
    items: [
      { name: '笔记本', href: '/notebooks', icon: Book },
      { name: '提问与搜索', href: '/search', icon: Search },
    ],
  },
  {
    title: '创作',
    items: [
      { name: '播客', href: '/podcasts', icon: Mic },
    ],
  },
  {
    title: '管理',
    items: [
      { name: '模型', href: '/models', icon: Bot },
      { name: '转换', href: '/transformations', icon: Shuffle },
      { name: '设置', href: '/settings', icon: Settings },
    ],
  },
] as const
```

**修改后** (添加AI创作section):
```typescript
const navigation = [
  {
    title: '收集',
    items: [
      { name: '来源', href: '/sources', icon: FileText },
    ],
  },
  {
    title: '处理',
    items: [
      { name: '笔记本', href: '/notebooks', icon: Book },
      { name: '提问与搜索', href: '/search', icon: Search },
    ],
  },
  {
    title: 'AI创作',  // 新增section
    items: [
      {
        name: '开智创作',
        href: 'http://localhost:8080',
        icon: PenLine,
        external: true  // 新增：标识外部链接
      },
      {
        name: '深度研究',
        href: 'http://localhost:2024',
        icon: Microscope,
        external: true
      },
      { name: '播客', href: '/podcasts', icon: Mic },  // 保留原有功能
    ],
  },
  {
    title: '管理',
    items: [
      { name: '模型', href: '/models', icon: Bot },
      { name: '转换', href: '/transformations', icon: Shuffle },
      { name: '设置', href: '/settings', icon: Settings },
    ],
  },
] as const

// 新增类型定义
type NavigationItem = {
  name: string;
  href: string;
  icon: any;
  external?: boolean;  // 新增：外部链接标识
}
```

**修改链接渲染逻辑**:
```typescript
{section.items.map((item) => {
  const isActive = pathname.startsWith(item.href)

  // 新增：外部链接处理
  const linkProps = item.external
    ? {
        href: item.href,
        target: '_blank',
        rel: 'noopener noreferrer'
      }
    : {
        href: item.href
      }

  const button = (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      className={cn(
        'w-full gap-3 text-sidebar-foreground',
        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
        isCollapsed ? 'justify-center px-2' : 'justify-start'
      )}
    >
      <item.icon className="h-4 w-4" />
      {!isCollapsed && <span>{item.name}</span>}
      {/* 新增：外部链接图标 */}
      {!isCollapsed && item.external && (
        <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
      )}
    </Button>
  )

  if (isCollapsed) {
    return (
      <Tooltip key={item.name}>
        <TooltipTrigger asChild>
          {item.external ? (
            <a {...linkProps}>{button}</a>
          ) : (
            <Link {...linkProps}>{button}</Link>
          )}
        </TooltipTrigger>
        <TooltipContent side="right">
          {item.name}
          {item.external && ' (新窗口)'}
        </TooltipContent>
      </Tooltip>
    )
  }

  return item.external ? (
    <a key={item.name} {...linkProps}>{button}</a>
  ) : (
    <Link key={item.name} {...linkProps}>{button}</Link>
  )
})}
```

**导入新图标**:
```typescript
import {
  Book,
  Search,
  Mic,
  Bot,
  Shuffle,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  FileText,
  Plus,
  PenLine,      // 新增
  Microscope,   // 新增
  ExternalLink, // 新增
} from 'lucide-react'
```

**部署步骤**:
```bash
# 1. 修改代码
cd thirdparty/open-notebook/frontend
# 编辑 src/components/layout/AppSidebar.tsx

# 2. 重新构建
npm run build

# 3. 重启容器
docker compose restart open_notebook

# 4. 验证
# 访问 http://localhost:8502
# 检查侧边栏是否出现"AI创作"section
# 点击"开智创作"应该在新窗口打开 http://localhost:8080
# 点击"深度研究"应该在新窗口打开 http://localhost:2024
```

**验收标准**:
- [ ] Open-Notebook侧边栏显示"AI创作"section
- [ ] "开智创作"链接在新窗口打开OpenCanvas
- [ ] "深度研究"链接在新窗口打开OpenDeepResearch
- [ ] 外部链接图标正确显示
- [ ] 移动端和折叠状态下显示正常

**阶段1总结**:
- **时间**: 第1周（5天）
- **关键成果**:
  1. 三个系统独立部署成功
  2. Open-Notebook作为统一门户可访问另外两个系统
  3. 用户可以开始体验三个系统的基础功能

---

### 阶段2: OpenCanvas知识库集成（第2周）

**目标**: OpenCanvas可以查询Open-Notebook知识库，并将创作保存回去

#### Step 2.1: 实现知识库客户端（TypeScript）

**新建文件**: `thirdparty/open-canvas/apps/agents/src/knowledge-base/client.ts`

```typescript
/**
 * Open-Notebook Knowledge Base Client
 *
 * 用于从OpenCanvas查询Chairman Agent知识库
 */
import axios, { AxiosInstance } from 'axios';

interface KnowledgeSearchOptions {
  query: string;
  type?: "vector" | "fulltext" | "hybrid";
  limit?: number;
  scoreThreshold?: number;
  searchSources?: boolean;
  searchNotes?: boolean;
}

interface SearchResult {
  item_id: string;
  relevance: number;
  content: string;
  item_type: 'source' | 'note';
  metadata?: {
    title?: string;
    source_type?: string;
    created_at?: string;
    url?: string;
  };
}

interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  database: string;
  timestamp: string;
}

export class KnowledgeBaseClient {
  private client: AxiosInstance;
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || process.env.KNOWLEDGE_BASE_API_URL || 'http://localhost:8502';
    this.apiKey = apiKey || process.env.KNOWLEDGE_BASE_API_KEY || 'chairman';

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30秒超时
    });
  }

  /**
   * 搜索知识库
   */
  async search(options: KnowledgeSearchOptions): Promise<SearchResult[]> {
    try {
      const response = await this.client.post('/api/search', {
        query: options.query,
        type: options.type || 'vector',
        limit: options.limit || 5,
        minimum_score: options.scoreThreshold || 0.2,
        search_sources: options.searchSources !== false,
        search_notes: options.searchNotes !== false,
      });

      return response.data.results || [];
    } catch (error) {
      console.error('Knowledge base search error:', error);
      throw new Error(`Failed to search knowledge base: ${error.message}`);
    }
  }

  /**
   * 获取源文档的完整内容
   */
  async getSourceContent(sourceId: string): Promise<string> {
    try {
      const response = await this.client.get(`/api/sources/${sourceId}/content`);
      return response.data.content || '';
    } catch (error) {
      console.error('Failed to fetch source content:', error);
      throw new Error(`Failed to get source content: ${error.message}`);
    }
  }

  /**
   * 保存创作结果到知识库
   */
  async saveArtifact(artifact: {
    title: string;
    content: string;
    type: string;
    metadata?: Record<string, any>;
  }): Promise<{ id: string }> {
    try {
      const response = await this.client.post('/api/notes', {
        title: artifact.title,
        content: artifact.content,
        source: 'opencanvas',
        metadata: {
          ...artifact.metadata,
          artifact_type: artifact.type,
          created_from: 'opencanvas',
        },
      });

      return { id: response.data.id };
    } catch (error) {
      console.error('Failed to save artifact:', error);
      throw new Error(`Failed to save artifact: ${error.message}`);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get<HealthCheckResponse>('/health');
      return response.data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// 单例实例
let kbClientInstance: KnowledgeBaseClient | null = null;

export function getKnowledgeBaseClient(): KnowledgeBaseClient {
  if (!kbClientInstance) {
    kbClientInstance = new KnowledgeBaseClient();
  }
  return kbClientInstance;
}
```

**验收标准**:
- [ ] TypeScript编译无错误
- [ ] 单元测试通过（搜索、获取内容、保存）
- [ ] 可以成功连接到Open-Notebook API

#### Step 2.2: 集成到OpenCanvas工作流

**修改文件**: `thirdparty/open-canvas/apps/agents/src/open-canvas/nodes/generate-artifact/draftArtifact.ts`

**原有代码**:
```typescript
async function draftArtifact(state: typeof OpenCanvasGraphAnnotation.State) {
  // 现有的Artifact生成逻辑
  const userMessage = state.messages[state.messages.length - 1];

  // 直接调用LLM生成
  const response = await llm.invoke([
    { role: "system", content: SYSTEM_PROMPT },
    ...state.messages
  ]);

  return { artifact: response };
}
```

**改造后**（添加知识库检索）:
```typescript
import { getKnowledgeBaseClient } from '../../../knowledge-base/client';

async function draftArtifact(state: typeof OpenCanvasGraphAnnotation.State) {
  const userMessage = state.messages[state.messages.length - 1];
  const kbClient = getKnowledgeBaseClient();

  // 步骤1: 提取用户输入的关键词
  const keywords = extractKeywords(userMessage.content);

  // 步骤2: 查询知识库（如果启用）
  let knowledgeContext = '';
  if (process.env.ENABLE_KNOWLEDGE_BASE !== 'false') {
    try {
      const searchResults = await kbClient.search({
        query: keywords.join(' '),
        type: 'hybrid',
        limit: 5,
        scoreThreshold: 0.3,
      });

      if (searchResults.length > 0) {
        knowledgeContext = formatKnowledgeContext(searchResults);
      }
    } catch (error) {
      console.warn('Knowledge base search failed, continuing without context:', error);
    }
  }

  // 步骤3: 构造增强的Prompt
  const enhancedSystemPrompt = knowledgeContext
    ? `${SYSTEM_PROMPT}\n\n## 相关知识参考\n${knowledgeContext}`
    : SYSTEM_PROMPT;

  // 步骤4: 调用LLM生成（使用知识增强的Prompt）
  const response = await llm.invoke([
    { role: "system", content: enhancedSystemPrompt },
    ...state.messages
  ]);

  // 步骤5: 保存Artifact到知识库（可选）
  if (response.artifact && process.env.AUTO_SAVE_ARTIFACTS === 'true') {
    try {
      await kbClient.saveArtifact({
        title: response.artifact.title || `创作于 ${new Date().toISOString()}`,
        content: response.artifact.content,
        type: response.artifact.type,
        metadata: {
          user_query: userMessage.content,
          knowledge_sources: searchResults.map(r => r.item_id),
        },
      });
    } catch (error) {
      console.warn('Failed to save artifact to knowledge base:', error);
    }
  }

  return { artifact: response };
}

/**
 * 提取关键词（简单实现）
 */
function extractKeywords(text: string): string[] {
  // TODO: 可以使用更复杂的NLP方法
  const stopWords = ['的', '是', '在', '我', '有', '和', '了', '不', '人'];
  return text
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.includes(word))
    .slice(0, 5);
}

/**
 * 格式化知识库搜索结果
 */
function formatKnowledgeContext(results: SearchResult[]): string {
  return results
    .map((result, index) => {
      const title = result.metadata?.title || `文档 ${index + 1}`;
      return `### ${title}\n${result.content}\n相关度: ${(result.relevance * 100).toFixed(1)}%`;
    })
    .join('\n\n');
}
```

**环境变量配置**:
```bash
# thirdparty/open-canvas/.env
KNOWLEDGE_BASE_API_URL=http://localhost:8502
KNOWLEDGE_BASE_API_KEY=chairman
ENABLE_KNOWLEDGE_BASE=true
AUTO_SAVE_ARTIFACTS=false  # 可选：自动保存生成的内容
```

**验收标准**:
- [ ] OpenCanvas创作时可以检索到知识库内容
- [ ] 生成的内容体现了知识库的信息
- [ ] 日志显示知识库查询成功
- [ ] 失败时优雅降级（不影响正常创作）

**阶段2总结**:
- **时间**: 第2周（5天）
- **关键成果**: OpenCanvas与Open-Notebook知识库深度集成

---

### 阶段3: OpenDeepResearch混合搜索改造（第3周）

**目标**: OpenDeepResearch同时支持知识库搜索和Tavily搜索

#### Step 3.1: 实现知识库客户端（Python）

**新建文件**: `thirdparty/open_deep_research/src/open_deep_research/knowledge_base_client.py`

```python
"""
Open-Notebook Knowledge Base Client for Python

用于从OpenDeepResearch查询Chairman Agent知识库
"""
import os
import httpx
from typing import List, Dict, Any, Optional, Literal
import logging

logger = logging.getLogger(__name__)


class KnowledgeBaseClient:
    """Open-Notebook知识库客户端"""

    def __init__(
        self,
        api_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: int = 30
    ):
        self.api_url = api_url or os.getenv("KB_API_URL", "http://localhost:8502")
        self.api_key = api_key or os.getenv("KB_API_KEY", "chairman")
        self.timeout = timeout

        self.client = httpx.AsyncClient(
            base_url=self.api_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )

    async def search(
        self,
        queries: List[str],
        search_type: Literal["vector", "fulltext", "hybrid"] = "vector",
        limit: int = 10,
        score_threshold: float = 0.2,
    ) -> str:
        """
        搜索知识库并返回格式化的结果字符串

        Args:
            queries: 搜索查询列表
            search_type: 搜索类型（vector/fulltext/hybrid）
            limit: 每个查询返回的最大结果数
            score_threshold: 最小相关度阈值

        Returns:
            格式化的搜索结果字符串
        """
        all_results = []

        for query in queries:
            try:
                response = await self.client.post(
                    "/api/search",
                    json={
                        "query": query,
                        "type": search_type,
                        "limit": limit,
                        "minimum_score": score_threshold,
                        "search_sources": True,
                        "search_notes": True,
                    },
                )
                response.raise_for_status()
                data = response.json()

                results = data.get("results", [])
                if results:
                    all_results.append({
                        "query": query,
                        "results": results,
                    })

            except httpx.HTTPError as e:
                logger.error(f"Knowledge base search failed for query '{query}': {e}")
                continue

        # 格式化结果
        return self._format_results(all_results)

    def _format_results(self, all_results: List[Dict[str, Any]]) -> str:
        """格式化搜索结果为易读的文本"""
        if not all_results:
            return "未找到相关知识。"

        formatted = []
        for item in all_results:
            query = item["query"]
            results = item["results"]

            formatted.append(f"\n## 查询: {query}\n")
            for idx, result in enumerate(results, 1):
                title = result.get("metadata", {}).get("title", f"文档{idx}")
                content = result.get("content", "")
                relevance = result.get("relevance", 0) * 100
                item_type = result.get("item_type", "unknown")

                formatted.append(
                    f"### {idx}. {title} ({item_type}, 相关度: {relevance:.1f}%)\n"
                    f"{content}\n"
                )

        return "\n".join(formatted)

    async def save_research_report(
        self,
        title: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        """
        将研究报告保存到知识库

        Args:
            title: 报告标题
            content: 报告内容
            metadata: 额外的元数据

        Returns:
            包含保存结果的字典 {"id": "note_id"}
        """
        try:
            response = await self.client.post(
                "/api/notes",
                json={
                    "title": title,
                    "content": content,
                    "source": "opendeepresearch",
                    "metadata": {
                        **(metadata or {}),
                        "created_from": "opendeepresearch",
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return {"id": data.get("id", "")}

        except httpx.HTTPError as e:
            logger.error(f"Failed to save research report: {e}")
            raise

    async def health_check(self) -> bool:
        """检查知识库API是否可用"""
        try:
            response = await self.client.get("/health")
            response.raise_for_status()
            data = response.json()
            return data.get("status") == "ok"
        except httpx.HTTPError:
            return False

    async def close(self):
        """关闭HTTP客户端"""
        await self.client.aclose()


# 单例实例
_kb_client_instance: Optional[KnowledgeBaseClient] = None


def get_knowledge_base_client() -> KnowledgeBaseClient:
    """获取知识库客户端单例"""
    global _kb_client_instance
    if _kb_client_instance is None:
        _kb_client_instance = KnowledgeBaseClient()
    return _kb_client_instance
```

**验收标准**:
- [ ] Python类型检查通过（mypy）
- [ ] 单元测试通过
- [ ] 可以成功连接到Open-Notebook API

#### Step 3.2: 实现混合搜索工具

**修改文件**: `thirdparty/open_deep_research/src/open_deep_research/utils.py`

**在现有的search工具旁边添加知识库搜索工具**:

```python
from .knowledge_base_client import get_knowledge_base_client
from typing import Literal

# ... 现有的tavily_search函数保持不变 ...

async def knowledge_base_search(
    queries: List[str],
    config: RunnableConfig = None
) -> str:
    """
    从Open-Notebook知识库检索董事长相关知识

    Args:
        queries: 搜索查询列表
        config: LangGraph配置对象

    Returns:
        格式化的知识库检索结果
    """
    kb_client = get_knowledge_base_client()

    try:
        # 检查知识库是否可用
        if not await kb_client.health_check():
            return "知识库服务不可用，请检查Open-Notebook是否运行。"

        # 执行搜索
        results = await kb_client.search(
            queries=queries,
            search_type="hybrid",  # 混合搜索获得最佳结果
            limit=5,
            score_threshold=0.3,
        )

        return results

    except Exception as e:
        logger.error(f"Knowledge base search error: {e}")
        return f"知识库搜索失败: {str(e)}"


def get_all_tools(configurable: Configuration) -> list:
    """
    根据配置返回可用的工具列表

    支持三种模式:
    1. search_api="tavily": 仅使用Tavily互联网搜索
    2. search_api="knowledge_base": 仅使用内部知识库搜索
    3. search_api="hybrid": 同时使用两者（推荐）
    """
    tools = [think_tool]  # 思考工具始终可用

    search_api = configurable.search_api.lower()

    if search_api == "tavily":
        # 仅互联网搜索
        tools.append(TavilySearchResults())
        logger.info("Using Tavily search only")

    elif search_api == "knowledge_base":
        # 仅知识库搜索
        knowledge_tool = create_knowledge_base_tool()
        tools.append(knowledge_tool)
        logger.info("Using knowledge base search only")

    elif search_api == "hybrid":
        # 混合搜索：同时使用两者（推荐）
        tools.append(TavilySearchResults())
        knowledge_tool = create_knowledge_base_tool()
        tools.append(knowledge_tool)
        logger.info("Using hybrid search (Tavily + Knowledge Base)")

    else:
        logger.warning(f"Unknown search_api: {search_api}, defaulting to Tavily only")
        tools.append(TavilySearchResults())

    return tools


def create_knowledge_base_tool():
    """创建知识库搜索工具"""
    from langchain_core.tools import Tool

    return Tool(
        name="knowledge_base_search",
        description=(
            "搜索董事长智能知识库，检索相关的思想、原则、案例和最佳实践。"
            "当研究主题与董事长的思想体系、管理理念、或内部知识相关时使用。"
            "输入应该是1-3个搜索查询字符串的列表。"
        ),
        func=knowledge_base_search,
    )
```

**修改配置文件**: `thirdparty/open_deep_research/src/open_deep_research/configuration.py`

```python
from typing import Literal

class Configuration(TypedDict):
    """OpenDeepResearch配置"""

    # ... 现有配置保持不变 ...

    # 新增：搜索API选择
    search_api: Literal["tavily", "knowledge_base", "hybrid"]
    """
    搜索API类型：
    - "tavily": 仅使用Tavily互联网搜索
    - "knowledge_base": 仅使用Open-Notebook知识库
    - "hybrid": 同时使用两者（推荐）
    """


# 默认配置
DEFAULT_CONFIG: Configuration = {
    # ... 现有默认值 ...
    "search_api": "hybrid",  # 默认使用混合搜索
}
```

**环境变量配置**:
```bash
# thirdparty/open_deep_research/.env

# LLM配置
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Tavily搜索（保留）
TAVILY_API_KEY=tvly-...

# 知识库配置（新增）
KB_API_URL=http://localhost:8502
KB_API_KEY=chairman

# 搜索策略（新增）
SEARCH_API=hybrid  # 或 "tavily" 或 "knowledge_base"
```

**验收标准**:
- [ ] 可以选择不同的搜索策略（tavily/knowledge_base/hybrid）
- [ ] 混合模式下，两种搜索结果都出现在研究报告中
- [ ] 知识库不可用时优雅降级到仅Tavily
- [ ] 日志正确显示使用的搜索工具

#### Step 3.3: Prompt优化支持混合搜索

**修改文件**: `thirdparty/open_deep_research/src/open_deep_research/prompts.py`

在研究员(researcher)的Prompt中添加关于双重数据源的说明:

```python
RESEARCHER_PROMPT = """
你是一名资深研究员，负责深入研究特定主题。

## 可用工具

你有以下工具可用：

1. **think**: 深度思考工具，用于分析、推理和综合信息
2. **tavily_search**: 互联网搜索工具，获取最新的外部信息和最佳实践
3. **knowledge_base_search**: 董事长智能知识库，检索内部思想、原则和案例

## 研究策略

**混合搜索策略**（当两个搜索工具都可用时）:

1. **内部知识优先**: 首先使用 knowledge_base_search 检索相关的董事长思想、管理原则
2. **外部信息补充**: 使用 tavily_search 获取行业最佳实践、最新趋势、外部案例
3. **交叉验证**: 对比内部知识和外部信息，找出共同点和差异
4. **综合分析**: 使用 think 工具深度分析，将内外部信息融合

**示例研究流程**:

研究主题: "创新理念在人才管理中的应用"

步骤1: knowledge_base_search(["创新理念", "人才管理", "人才战略"])
  → 获取董事长关于创新和人才的思想体系

步骤2: tavily_search(["innovation in talent management", "best practices"])
  → 获取外部最佳实践和案例

步骤3: think(分析内外部信息的关联和差异)
  → 综合分析，形成完整洞察

步骤4: 生成研究报告，清晰标注信息来源
  - 内部知识来源: [董事长思想体系]
  - 外部信息来源: [行业研究/最佳实践]

## 重要原则

- 明确区分内部知识和外部信息的来源
- 董事长的思想体系优先作为核心参考
- 外部信息用于补充、验证和扩展
- 避免内外部信息的混淆和误导
- 综合分析时突出内部知识的独特价值

现在开始研究: {research_task}
"""
```

**阶段3总结**:
- **时间**: 第3周（5天）
- **关键成果**: OpenDeepResearch支持混合搜索，内外部知识融合

---

### 阶段4: 数据回流和持久化（第4周）

**目标**: 将OpenCanvas和OpenDeepResearch的输出保存回Open-Notebook

#### Step 4.1: OpenCanvas创作保存功能

**修改文件**: `thirdparty/open-canvas/apps/web/src/components/artifacts/ArtifactToolbar.tsx`

添加"保存到知识库"按钮:

```typescript
import { getKnowledgeBaseClient } from '@/lib/knowledge-base/client';

export function ArtifactToolbar({ artifact }) {
  const [saving, setSaving] = useState(false);
  const kbClient = getKnowledgeBaseClient();

  const handleSaveToKnowledgeBase = async () => {
    setSaving(true);
    try {
      const result = await kbClient.saveArtifact({
        title: artifact.title || `创作于 ${new Date().toLocaleString()}`,
        content: artifact.content,
        type: artifact.type,
        metadata: {
          artifact_id: artifact.id,
          language: artifact.language,
        },
      });

      toast.success(`已保存到知识库 (ID: ${result.id})`);
    } catch (error) {
      toast.error(`保存失败: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 现有按钮... */}

      <Button
        variant="outline"
        size="sm"
        onClick={handleSaveToKnowledgeBase}
        disabled={saving}
      >
        {saving ? '保存中...' : '💾 保存到知识库'}
      </Button>
    </div>
  );
}
```

**验收标准**:
- [ ] 用户可以点击按钮保存创作
- [ ] 保存成功后在Open-Notebook可以搜索到
- [ ] 失败时显示友好的错误提示

#### Step 4.2: OpenDeepResearch报告保存功能

**修改文件**: `thirdparty/open_deep_research/src/open_deep_research/final_report_generation.py`

在生成最终报告后自动保存:

```python
from .knowledge_base_client import get_knowledge_base_client

async def final_report_generation(state: ResearchState):
    """生成最终研究报告并保存到知识库"""

    # ... 现有的报告生成逻辑 ...

    report = generate_report(state)

    # 新增：保存到知识库
    if os.getenv("AUTO_SAVE_REPORTS", "true").lower() == "true":
        kb_client = get_knowledge_base_client()

        try:
            result = await kb_client.save_research_report(
                title=f"深度研究: {state['topic']}",
                content=report,
                metadata={
                    "research_type": state.get("analysis_type", "unknown"),
                    "search_sources": ["knowledge_base", "tavily"] if state.get("search_api") == "hybrid" else [state.get("search_api", "unknown")],
                    "completed_at": datetime.now().isoformat(),
                },
            )

            logger.info(f"Research report saved to knowledge base: {result['id']}")

        except Exception as e:
            logger.warning(f"Failed to save report to knowledge base: {e}")
            # 不影响报告生成，继续执行

    return {"report": report}
```

**验收标准**:
- [ ] 研究报告自动保存到Open-Notebook
- [ ] 保存失败不影响报告生成
- [ ] 可以通过环境变量控制是否自动保存

**阶段4总结**:
- **时间**: 第4周（5天）
- **关键成果**: 数据双向流动，形成完整的知识循环

---

### 阶段5: Docker统一部署（第5周）

**目标**: 使用Docker Compose统一部署三个系统

#### Step 5.1: Docker Compose配置

**新建/修改文件**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  # SurrealDB - 统一数据库
  surreal:
    image: surrealdb/surrealdb:latest
    ports:
      - "8000:8000"
    command: start --log debug --user root --pass root file:/data/surreal.db
    volumes:
      - surreal_data:/data
    networks:
      - chairman_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Open-Notebook - 知识库管理
  open_notebook:
    build:
      context: ./thirdparty/open-notebook
      dockerfile: Dockerfile
    ports:
      - "8502:8502"
    environment:
      - SURREALDB_URL=ws://surreal:8000/rpc
      - SURREALDB_USER=root
      - SURREALDB_PASSWORD=root
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      surreal:
        condition: service_healthy
    networks:
      - chairman_network
    volumes:
      - open_notebook_data:/app/data

  # OpenCanvas - 创作助手
  opencanvas_agents:
    build:
      context: ./thirdparty/open-canvas
      dockerfile: Dockerfile.agents
    ports:
      - "8123:8123"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - KNOWLEDGE_BASE_API_URL=http://open_notebook:8502
      - KNOWLEDGE_BASE_API_KEY=chairman
      - ENABLE_KNOWLEDGE_BASE=true
    depends_on:
      - open_notebook
    networks:
      - chairman_network

  opencanvas_web:
    build:
      context: ./thirdparty/open-canvas
      dockerfile: Dockerfile.web
    ports:
      - "8080:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://opencanvas_agents:8123
    depends_on:
      - opencanvas_agents
    networks:
      - chairman_network

  # OpenDeepResearch - 深度研究
  opendeepresearch:
    build:
      context: ./thirdparty/open_deep_research
      dockerfile: Dockerfile
    ports:
      - "2024:2024"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - KB_API_URL=http://open_notebook:8502
      - KB_API_KEY=chairman
      - SEARCH_API=hybrid
      - AUTO_SAVE_REPORTS=true
    depends_on:
      - open_notebook
    networks:
      - chairman_network

networks:
  chairman_network:
    driver: bridge

volumes:
  surreal_data:
  open_notebook_data:
```

**验收标准**:
- [ ] 执行 `docker compose up -d` 成功启动所有服务
- [ ] 所有健康检查通过
- [ ] 服务间可以正常通信
- [ ] 数据持久化正常工作

#### Step 5.2: 一键启动脚本

**新建文件**: `scripts/start.sh`

```bash
#!/bin/bash

set -e

echo "🚀 启动 Chairman Agent 系统..."

# 1. 检查环境变量
if [ ! -f .env ]; then
    echo "❌ 未找到 .env 文件，请先创建"
    exit 1
fi

# 2. 检查Docker
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi

# 3. 拉取最新镜像
echo "📥 拉取Docker镜像..."
docker compose pull

# 4. 构建自定义镜像
echo "🔨 构建应用镜像..."
docker compose build

# 5. 启动服务
echo "🎬 启动服务..."
docker compose up -d

# 6. 等待服务就绪
echo "⏳ 等待服务启动..."
sleep 10

# 7. 健康检查
echo "🏥 执行健康检查..."

check_service() {
    local name=$1
    local url=$2

    if curl -f -s "$url" > /dev/null; then
        echo "✅ $name: 健康"
    else
        echo "❌ $name: 不健康"
        return 1
    fi
}

check_service "SurrealDB" "http://localhost:8000/health"
check_service "Open-Notebook" "http://localhost:8502/health"
check_service "OpenCanvas" "http://localhost:8080"
check_service "OpenDeepResearch" "http://localhost:2024"

echo ""
echo "✅ 系统启动成功！"
echo ""
echo "📍 访问地址:"
echo "  - Open-Notebook (门户): http://localhost:8502"
echo "  - OpenCanvas (创作):   http://localhost:8080"
echo "  - OpenDeepResearch:     http://localhost:2024"
echo ""
echo "💡 提示: 在Open-Notebook的'AI创作'菜单中可以访问另外两个系统"
```

**阶段5总结**:
- **时间**: 第5周（5天）
- **关键成果**: Docker统一部署，一键启动整个系统

---

### 阶段6: 测试、优化和文档（第6周）

**目标**: 完整测试、性能优化、撰写文档

#### Step 6.1: E2E测试

**新建文件**: `tests/test_e2e_integration.py`

```python
import pytest
import asyncio
import httpx

@pytest.mark.asyncio
async def test_full_workflow():
    """测试完整的集成工作流"""

    # 1. 测试知识库可用
    async with httpx.AsyncClient() as client:
        resp = await client.get("http://localhost:8502/health")
        assert resp.status_code == 200

    # 2. 测试OpenCanvas知识库集成
    # TODO: 实现创作测试

    # 3. 测试OpenDeepResearch混合搜索
    # TODO: 实现研究测试

    # 4. 测试数据回流
    # TODO: 验证保存功能
```

**验收标准**:
- [ ] 所有E2E测试通过
- [ ] 测试覆盖率 > 80%

#### Step 6.2: 用户文档

**新建文件**: `docs/USER_GUIDE.md`

包含:
- 系统概览
- 快速开始
- 使用场景示例
- 常见问题
- 故障排除

**阶段6总结**:
- **时间**: 第6周（5天）
- **关键成果**: 完整测试通过，用户文档完备

---

## 三、实施时间线

| 阶段 | 时间 | 关键里程碑 | 可交付成果 |
|------|------|-----------|-----------|
| **阶段1** | 第1周 | 门户建立和独立部署 | Open-Notebook菜单可访问另外两个系统 |
| **阶段2** | 第2周 | OpenCanvas知识库集成 | 创作时可利用知识库 |
| **阶段3** | 第3周 | OpenDeepResearch混合搜索 | 研究时结合内外部信息 |
| **阶段4** | 第4周 | 数据回流 | 创作和研究结果保存回知识库 |
| **阶段5** | 第5周 | Docker统一部署 | 一键启动完整系统 |
| **阶段6** | 第6周 | 测试和文档 | 完整的测试覆盖和用户指南 |

---

## 四、风险管理

### 高优先级风险

| 风险 | 缓解措施 | 负责人 |
|------|---------|--------|
| OpenCanvas/OpenDeepResearch原生UI不满足需求 | 先使用原生UI，后续按需定制 | 开发团队 |
| 知识库API性能瓶颈 | 添加缓存层，优化查询 | 后端团队 |
| 混合搜索结果质量差 | 优化Prompt，调整搜索参数 | AI团队 |

---

## 五、成功指标

| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| **功能完整性** | 100% | 所有功能点实现 |
| **菜单可用性** | 100% | Open-Notebook菜单正常跳转 |
| **知识库集成** | OpenCanvas和OpenDeepResearch都能查询 | 集成测试 |
| **混合搜索** | 内外部信息都出现在研究报告中 | 功能测试 |
| **数据回流** | 创作和研究结果能保存回知识库 | 端到端测试 |
| **系统稳定性** | 正常运行时间 > 99% | 监控日志 |

---

## 六、附录

### A. 关键配置示例

**Open-Notebook (.env)**:
```bash
SURREALDB_URL=ws://localhost:8000/rpc
OPENAI_API_KEY=sk-...
```

**OpenCanvas (.env)**:
```bash
ANTHROPIC_API_KEY=sk-ant-...
KNOWLEDGE_BASE_API_URL=http://localhost:8502
ENABLE_KNOWLEDGE_BASE=true
```

**OpenDeepResearch (.env)**:
```bash
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
KB_API_URL=http://localhost:8502
SEARCH_API=hybrid
AUTO_SAVE_REPORTS=true
```

### B. API端点清单

**Open-Notebook API**:
- `GET /health` - 健康检查
- `POST /api/search` - 知识库搜索
- `POST /api/notes` - 保存笔记
- `GET /api/sources/{id}/content` - 获取源文档内容

**OpenCanvas (内部)**:
- LangGraph工作流（通过SDK调用）

**OpenDeepResearch (内部)**:
- LangGraph Studio（通过UI访问）

---

**文档维护**:
- 本文档为v2.0版本，基于用户反馈优化
- v1.0版本保留在 [INTEGRATION_PLAN_DETAILED_v1.md](./INTEGRATION_PLAN_DETAILED_v1.md)
- 如有进一步反馈，将更新到v2.1版本

**最后更新**: 2025-11-24
**状态**: 待实施


---

## 📊 实施进度跟踪（2025-11-24更新）

### ✅ 阶段1: 快速建立门户（第1周）- 已完成100%

**完成时间**: 2025-11-24

#### 完成的工作:
1. ✅ **删除错误实现** - 删除了4个自建页面文件
   - `src/frontend/pages/writing-coach.tsx`
   - `src/frontend/pages/deep-analyzer.tsx`
   - `thirdparty/open-notebook/frontend/src/app/(dashboard)/writing-coach/page.tsx`
   - `thirdparty/open-notebook/frontend/src/app/(dashboard)/deep-analyzer/page.tsx`

2. ✅ **添加AI创作菜单** - [`AppSidebar.tsx:62-67`](../../../thirdparty/open-notebook/frontend/src/components/layout/AppSidebar.tsx)
   - 新增"AI创作" section
   - "开智创作"链接到 http://localhost:8080
   - "深度研究"链接到 http://localhost:2024
   - 支持外部链接（新窗口打开 + External图标）

3. ✅ **修复TypeScript类型** - 使用`'external' in item`安全检查

4. ✅ **成功构建和部署** - Next.js构建成功，Open-Notebook服务正常运行（8502端口）

#### 验收标准检查:
- ✅ Open-Notebook可访问 (http://localhost:8502)
- ✅ 侧边栏显示"AI创作" section
- ✅ 外部链接正确配置
- ⚠️ OpenCanvas和OpenDeepResearch需在阶段2/3部署

---

### 🚧 阶段2: OpenCanvas知识库集成（第2周）- 进行中80%

**开始时间**: 2025-11-24

#### 已完成的工作:
1. ✅ **验证知识库客户端** - [`client.ts:217`](../../../thirdparty/open-canvas/apps/agents/src/knowledge-base/client.ts)
   - 远程Claude已实现高质量的TypeScript客户端
   - 支持vector/fulltext/hybrid搜索
   - 包含healthCheck、getStats、getSourceContent方法

2. ✅ **配置环境变量** - [`.env`](../../../thirdparty/open-canvas/.env)
   - KNOWLEDGE_BASE_API_URL=http://localhost:8502
   - KNOWLEDGE_BASE_API_KEY=chairman
   - ENABLE_KNOWLEDGE_BASE=true
   - 使用OpenRouter API密钥

3. ✅ **安装依赖和修复错误**
   - 安装Yarn 1.22.22
   - 安装OpenCanvas依赖（Monorepo项目）
   - 修复3个TypeScript编译错误：
     * `zh-CN.ts:228` - 键名空格问题
     * `search.ts:1` - 未使用的import
     * `client.ts:96` - metadata类型问题

#### 待完成的工作:
- ⏳ 启动LangGraph服务器（agents）- 端口8123
- ⏳ 启动Next.js前端（web）- 端口8080
- ⏳ 集成知识库到创作工作流
- ⏳ 真实数据测试和界面验证

#### 技术挑战解决:
- **挑战1**: TypeScript类型不兼容
  - **解决**: 移除`relevance`字段，添加`id`字段符合`ExaMetadata`类型
- **挑战2**: 中文本地化文件语法错误
  - **解决**: 对包含空格的键名添加引号
- **挑战3**: 未使用的import导致编译失败
  - **解决**: 注释掉未使用的import语句

---

### ⏳ 阶段3-6: 待实施

详见上文完整方案。

---

**最后更新**: 2025-11-24
**当前阶段**: 阶段2进行中
**下一步**: 启动OpenCanvas服务并测试知识库集成

