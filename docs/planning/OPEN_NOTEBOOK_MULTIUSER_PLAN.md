# Open-Notebook 多用户改造方案（修订版）

> **修订说明**: 本方案基于对 Open-Notebook 和 OpenCanvas 代码库的深度调研，所有技术决策均有代码事实支撑。

## 🎯 目标

为 Open-Notebook 实现完整的多用户数据隔离，集成 Zitadel OIDC 认证。

---

## ✅ 用户确认的决策

| 决策项 | 选择 |
|--------|------|
| **实施范围** | 仅 Open-Notebook（OpenCanvas 已在改造中） |
| **Zitadel 部署** | 自托管 Docker |
| **数据迁移** | 现有数据归属默认管理员用户 |
| **预估周期** | 2-3 周 |

---

## 📊 深度调研发现（基于代码事实）

### 1. 当前架构的关键问题

| 问题 | 代码位置 | 影响 | 优先级 |
|------|----------|------|--------|
| **聊天消息不持久化** | `api/routers/chat.py` 使用 LangGraph 内存状态 | 应用重启消息丢失 | 🔴 P0 |
| **无数据库连接池** | `open_notebook/database/repository.py:db_connection()` | 高并发瓶颈 | 🟡 P1 |
| **无用户隔离** | 所有 `repo_query` 调用无 WHERE owner_id | 数据泄露 | 🔴 P0 |
| **搜索函数无用户过滤** | `migrations/4.surrealql` 中的 fn::text_search | 搜索泄露 | 🔴 P0 |
| **密码明文存储** | `frontend/src/lib/stores/auth-store.ts` | 安全风险 | 🟡 P1 |

### 2. 数据流架构（验证后）

```
┌─────────────────────────────────────────────────────────────┐
│                      实际数据流                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  前端 (React + Zustand)                                     │
│  ├─ auth-store.ts: token = 密码明文                         │
│  ├─ API Client: Authorization: Bearer {密码}                │
│  └─ React Query: 5分钟缓存                                  │
│                                                             │
│  API层 (FastAPI)                                            │
│  ├─ PasswordAuthMiddleware: 对比 OPEN_NOTEBOOK_PASSWORD     │
│  ├─ 路由: 直接调用 Domain 方法                              │
│  └─ ⚠️ 无用户上下文注入                                     │
│                                                             │
│  Domain层 (ObjectModel)                                     │
│  ├─ get_all(): SELECT * FROM table (无过滤!)                │
│  ├─ get(id): SELECT * FROM $id (无权限检查!)                │
│  └─ save(): repo_create/repo_update                         │
│                                                             │
│  Repository层                                               │
│  ├─ db_connection(): 每次新建连接                           │
│  ├─ repo_query(): 执行原始 SurrealQL                        │
│  └─ ⚠️ 无连接池                                             │
│                                                             │
│  SurrealDB                                                  │
│  ├─ 9个迁移文件，版本追踪在 _sbl_migrations                 │
│  ├─ 所有表无 owner_id 字段                                  │
│  └─ fn::text_search/vector_search 无用户过滤                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. 聊天消息存储的真相

**代码事实** (`api/routers/chat.py:execute_chat`):

```python
# 聊天消息存储在 LangGraph 内存状态中
thread_state = chat_graph.get_state(
    config=RunnableConfig(configurable={"thread_id": session_id})
)
messages = thread_state.values["messages"]

# ⚠️ 应用重启后 messages 丢失！
# ⚠️ chat_session 表只存储 id, title, model_override
# ⚠️ 没有 chat_message 表！
```

**影响**:
- Docker 容器重启 → 所有聊天历史丢失
- 无法跨设备访问聊天历史
- 无法按内容搜索历史消息

### 4. 搜索函数分析

**代码事实** (`migrations/4.surrealql`):

```surrealql
-- fn::text_search 没有 owner_id 参数！
DEFINE FUNCTION fn::text_search(
    $query_text: string,
    $match_count: int,
    $sources: bool,
    $show_notes: bool
) {
    -- 搜索所有 source，无用户过滤
    let $source_title_search = IF $sources {(
        SELECT id, title, ... FROM source WHERE title @1@ $query_text
        -- ⚠️ 缺少: AND owner_id = $user_id
    )}
    -- ...
}
```

**需要修改**: 所有搜索函数都需要添加 `$user_id` 参数

### 5. OpenCanvas 多用户实现（可借鉴）

| 机制 | OpenCanvas 实现 | Open-Notebook 需要 |
|------|----------------|-------------------|
| **认证** | NextAuth Session | JWT + Zitadel OIDC |
| **用户注入** | API 代理层 `config.configurable.supabase_user_id` | 中间件注入 `request.state.user_id` |
| **Thread 隔离** | `metadata.supabase_user_id` 搜索过滤 | SQL `WHERE owner_id = $user_id` |
| **Store 隔离** | 命名空间 `["type", userId]` | 不适用（无 LangGraph Store） |
| **权限检查** | LangGraph 原生 | 每个路由手动检查 |

---

## 🔧 修订后的技术方案

### 改造策略：分层隔离

```
┌─────────────────────────────────────────────────────────────┐
│                      目标架构                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. JWT 中间件                                              │
│     ├─ 验证 token (来自 Zitadel)                            │
│     ├─ 解析 user_id                                         │
│     └─ 注入 request.state.user_id                           │
│                                                             │
│  2. 依赖注入                                                │
│     ├─ get_current_user() → user_id                         │
│     └─ 所有路由强制使用                                     │
│                                                             │
│  3. Repository 层过滤                                       │
│     ├─ repo_query_filtered(query, user_id) [新增]           │
│     └─ 自动添加 WHERE owner_id = $user_id                   │
│                                                             │
│  4. 搜索函数重写                                            │
│     ├─ fn::text_search_v2($query, $user_id, ...)            │
│     └─ fn::vector_search_v2($query, $user_id, ...)          │
│                                                             │
│  5. 数据库迁移                                              │
│     ├─ 添加 owner_id 字段                                   │
│     ├─ 创建索引                                             │
│     └─ 迁移现有数据                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 文件修改清单（修订版）

### 第一阶段：认证系统（3-4 天）

#### 新建文件

| 文件 | 说明 | 行数估算 |
|------|------|----------|
| `api/dependencies.py` | 用户依赖注入 | ~50 行 |
| `open_notebook/domain/user.py` | User 模型 | ~80 行 |
| `migrations/10_multiuser.surrealql` | 多用户迁移 | ~100 行 |
| `migrations/10_multiuser_down.surrealql` | 回滚脚本 | ~30 行 |

#### 修改文件

| 文件 | 修改内容 | 关键代码位置 |
|------|----------|--------------|
| `api/auth.py` | 重写为 JWT 验证 | 第 10-67 行 `PasswordAuthMiddleware` |
| `api/routers/auth.py` | 添加 OIDC 回调 | 第 13-24 行 |
| `api/main.py` | 注册新中间件 | 第 82-84 行 |
| `open_notebook/database/async_migrate.py` | 添加迁移 10 | 第 91-123 行 |

#### 认证中间件实现（基于代码分析）

```python
# api/auth.py - 替换现有 PasswordAuthMiddleware

from jose import jwt, JWTError
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import httpx

class ZitadelAuthMiddleware(BaseHTTPMiddleware):
    """
    Zitadel OIDC 认证中间件

    工作流程:
    1. 检查 Authorization header
    2. 验证 JWT token (使用 Zitadel 公钥)
    3. 提取 user_id (sub claim)
    4. 注入到 request.state.user_id
    """

    def __init__(self, app, excluded_paths: list = None):
        super().__init__(app)
        self.excluded_paths = excluded_paths or [
            "/", "/health", "/docs", "/openapi.json", "/redoc",
            "/api/auth/status", "/api/auth/callback", "/api/config"
        ]
        self.zitadel_issuer = os.environ.get("ZITADEL_ISSUER")
        self._jwks_client = None

    async def get_jwks_client(self):
        """延迟初始化 JWKS 客户端"""
        if not self._jwks_client:
            jwks_url = f"{self.zitadel_issuer}/.well-known/jwks.json"
            self._jwks_client = jwt.PyJWKClient(jwks_url)
        return self._jwks_client

    async def dispatch(self, request: Request, call_next):
        # 排除路径
        if request.url.path in self.excluded_paths:
            return await call_next(request)

        # OPTIONS 请求直接通过
        if request.method == "OPTIONS":
            return await call_next(request)

        # 获取 Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid authorization header"}
            )

        token = auth_header.split(" ")[1]

        try:
            # 验证 JWT
            jwks_client = await self.get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)

            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=os.environ.get("ZITADEL_CLIENT_ID"),
                issuer=self.zitadel_issuer
            )

            # 注入用户信息到请求上下文
            request.state.user_id = payload.get("sub")
            request.state.user_email = payload.get("email")
            request.state.user_name = payload.get("name")

        except JWTError as e:
            return JSONResponse(
                status_code=401,
                content={"detail": f"Invalid token: {str(e)}"}
            )

        return await call_next(request)
```

#### 用户依赖注入

```python
# api/dependencies.py

from fastapi import Request, HTTPException, Depends
from typing import Optional

async def get_current_user(request: Request) -> str:
    """
    从请求上下文获取当前用户 ID

    使用方式:
        @router.get("/notebooks")
        async def get_notebooks(user_id: str = Depends(get_current_user)):
            ...
    """
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
    return user_id

async def get_current_user_optional(request: Request) -> Optional[str]:
    """可选的用户认证（用于公开 API）"""
    return getattr(request.state, "user_id", None)

async def get_user_info(request: Request) -> dict:
    """获取完整用户信息"""
    return {
        "user_id": getattr(request.state, "user_id", None),
        "email": getattr(request.state, "user_email", None),
        "name": getattr(request.state, "user_name", None),
    }
```

---

### 第二阶段：数据库迁移（2-3 天）

#### 完整迁移脚本

```sql
-- migrations/10_multiuser.surrealql
-- 多用户支持迁移

-- ============================================
-- 1. 创建用户表
-- ============================================
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD external_id ON user TYPE string;      -- Zitadel sub claim
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD name ON user TYPE option<string>;
DEFINE FIELD avatar ON user TYPE option<string>;
DEFINE FIELD created ON user TYPE datetime DEFAULT time::now();
DEFINE FIELD updated ON user TYPE datetime DEFAULT time::now();

DEFINE INDEX user_external_id ON user COLUMNS external_id UNIQUE;
DEFINE INDEX user_email ON user COLUMNS email UNIQUE;

-- ============================================
-- 2. 为核心表添加 owner_id 字段
-- ============================================

-- notebook 表
DEFINE FIELD IF NOT EXISTS owner_id ON TABLE notebook TYPE option<string>;
DEFINE INDEX IF NOT EXISTS idx_notebook_owner ON TABLE notebook COLUMNS owner_id;
DEFINE INDEX IF NOT EXISTS idx_notebook_owner_updated ON TABLE notebook COLUMNS (owner_id, updated DESC);

-- source 表
DEFINE FIELD IF NOT EXISTS owner_id ON TABLE source TYPE option<string>;
DEFINE INDEX IF NOT EXISTS idx_source_owner ON TABLE source COLUMNS owner_id;

-- note 表
DEFINE FIELD IF NOT EXISTS owner_id ON TABLE note TYPE option<string>;
DEFINE INDEX IF NOT EXISTS idx_note_owner ON TABLE note COLUMNS owner_id;

-- chat_session 表
DEFINE FIELD IF NOT EXISTS owner_id ON TABLE chat_session TYPE option<string>;
DEFINE INDEX IF NOT EXISTS idx_chat_session_owner ON TABLE chat_session COLUMNS owner_id;

-- source_embedding 表（继承 source 的 owner_id）
DEFINE FIELD IF NOT EXISTS owner_id ON TABLE source_embedding TYPE option<string>;
DEFINE INDEX IF NOT EXISTS idx_source_embedding_owner ON TABLE source_embedding COLUMNS owner_id;

-- source_insight 表（继承 source 的 owner_id）
DEFINE FIELD IF NOT EXISTS owner_id ON TABLE source_insight TYPE option<string>;
DEFINE INDEX IF NOT EXISTS idx_source_insight_owner ON TABLE source_insight COLUMNS owner_id;

-- transformation 表（用户自定义转换）
DEFINE FIELD IF NOT EXISTS owner_id ON TABLE transformation TYPE option<string>;

-- ============================================
-- 3. 创建默认管理员用户
-- ============================================
CREATE user:admin CONTENT {
    external_id: "admin",
    email: "admin@chairman.local",
    name: "系统管理员",
    created: time::now(),
    updated: time::now()
};

-- ============================================
-- 4. 迁移现有数据归属管理员
-- ============================================
UPDATE notebook SET owner_id = "admin" WHERE owner_id IS NONE;
UPDATE source SET owner_id = "admin" WHERE owner_id IS NONE;
UPDATE note SET owner_id = "admin" WHERE owner_id IS NONE;
UPDATE chat_session SET owner_id = "admin" WHERE owner_id IS NONE;

-- 同步 source_embedding 和 source_insight 的 owner_id
UPDATE source_embedding SET owner_id = (SELECT owner_id FROM source WHERE id = $parent.source)[0].owner_id;
UPDATE source_insight SET owner_id = (SELECT owner_id FROM source WHERE id = $parent.source)[0].owner_id;

-- ============================================
-- 5. 重新定义搜索函数（添加用户过滤）
-- ============================================

-- 文本搜索函数 V2
DEFINE FUNCTION OVERWRITE fn::text_search(
    $query_text: string,
    $match_count: int,
    $sources: bool,
    $show_notes: bool,
    $user_id: option<string>  -- 新增参数
) {
    -- source.title 搜索（添加 owner_id 过滤）
    let $source_title_search = IF $sources {(
        SELECT id, title, search::highlight('`', '`', 1) as content,
        id as parent_id, math::max(search::score(1)) AS relevance
        FROM source
        WHERE title @1@ $query_text
          AND ($user_id IS NONE OR owner_id = $user_id)  -- 用户过滤
        GROUP BY id
    )} ELSE { [] };

    -- source_embedding.content 搜索
    let $source_embedding_search = IF $sources {(
        SELECT source.id as id, source.title as title,
        search::highlight('`', '`', 1) as content, source.id as parent_id,
        math::max(search::score(1)) AS relevance
        FROM source_embedding
        WHERE content @1@ $query_text
          AND ($user_id IS NONE OR owner_id = $user_id)  -- 用户过滤
        GROUP BY id
    )} ELSE { [] };

    -- source.full_text 搜索
    let $source_full_search = IF $sources {(
        SELECT id, title, search::highlight('`', '`', 1) as content,
        id as parent_id, math::max(search::score(1)) AS relevance
        FROM source
        WHERE full_text @1@ $query_text
          AND ($user_id IS NONE OR owner_id = $user_id)  -- 用户过滤
        GROUP BY id
    )} ELSE { [] };

    -- source_insight.content 搜索
    let $source_insight_search = IF $sources {(
        SELECT id, insight_type + " - " + (source.title OR '') as title,
        search::highlight('`', '`', 1) as content, id as parent_id,
        math::max(search::score(1)) AS relevance
        FROM source_insight
        WHERE content @1@ $query_text
          AND ($user_id IS NONE OR owner_id = $user_id)  -- 用户过滤
        GROUP BY id
    )} ELSE { [] };

    -- note.title 搜索
    let $note_title_search = IF $show_notes {(
        SELECT id, title, search::highlight('`', '`', 1) as content,
        id as parent_id, math::max(search::score(1)) AS relevance
        FROM note
        WHERE title @1@ $query_text
          AND ($user_id IS NONE OR owner_id = $user_id)  -- 用户过滤
        GROUP BY id
    )} ELSE { [] };

    -- note.content 搜索
    let $note_content_search = IF $show_notes {(
        SELECT id, title, search::highlight('`', '`', 1) as content,
        id as parent_id, math::max(search::score(1)) AS relevance
        FROM note
        WHERE content @1@ $query_text
          AND ($user_id IS NONE OR owner_id = $user_id)  -- 用户过滤
        GROUP BY id
    )} ELSE { [] };

    -- 合并结果
    let $source_chunk_results = array::union($source_embedding_search, $source_full_search);
    let $source_asset_results = array::union($source_title_search, $source_insight_search);
    let $source_results = array::union($source_chunk_results, $source_asset_results);
    let $note_results = array::union($note_title_search, $note_content_search);
    let $final_results = array::union($source_results, $note_results);

    RETURN (
        SELECT id, parent_id, title, math::max(relevance) as relevance
        FROM $final_results
        WHERE id is not None
        GROUP BY id, parent_id, title
        ORDER BY relevance DESC
        LIMIT $match_count
    );
};

-- 向量搜索函数 V2
DEFINE FUNCTION OVERWRITE fn::vector_search(
    $query: array<float>,
    $match_count: int,
    $sources: bool,
    $show_notes: bool,
    $min_similarity: float,
    $user_id: option<string>  -- 新增参数
) {
    -- source_embedding 向量搜索
    let $source_embedding_search = IF $sources {(
        SELECT source.id as id, source.title as title, content,
        source.id as parent_id, vector::similarity::cosine(embedding, $query) as similarity
        FROM source_embedding
        WHERE embedding != none
          AND array::len(embedding) = array::len($query)
          AND vector::similarity::cosine(embedding, $query) >= $min_similarity
          AND ($user_id IS NONE OR owner_id = $user_id)  -- 用户过滤
        ORDER BY similarity DESC LIMIT $match_count
    )} ELSE { [] };

    -- source_insight 向量搜索
    let $source_insight_search = IF $sources {(
        SELECT id, insight_type + ' - ' + (source.title OR '') as title, content,
        source.id as parent_id, vector::similarity::cosine(embedding, $query) as similarity
        FROM source_insight
        WHERE embedding != none
          AND array::len(embedding) = array::len($query)
          AND vector::similarity::cosine(embedding, $query) >= $min_similarity
          AND ($user_id IS NONE OR owner_id = $user_id)  -- 用户过滤
        ORDER BY similarity DESC LIMIT $match_count
    )} ELSE { [] };

    -- note 向量搜索
    let $note_content_search = IF $show_notes {(
        SELECT id, title, content, id as parent_id,
        vector::similarity::cosine(embedding, $query) as similarity
        FROM note
        WHERE embedding != none
          AND array::len(embedding) = array::len($query)
          AND vector::similarity::cosine(embedding, $query) >= $min_similarity
          AND ($user_id IS NONE OR owner_id = $user_id)  -- 用户过滤
        ORDER BY similarity DESC LIMIT $match_count
    )} ELSE { [] };

    -- 合并结果
    let $all_results = array::union(
        array::union($source_embedding_search, $source_insight_search),
        $note_content_search
    );

    RETURN (
        SELECT id, parent_id, title, math::max(similarity) as similarity,
        array::flatten(content) as matches
        FROM $all_results
        WHERE id is not None
        GROUP BY id, parent_id, title
        ORDER BY similarity DESC
        LIMIT $match_count
    );
};
```

#### 回滚脚本

```sql
-- migrations/10_multiuser_down.surrealql

-- 1. 移除字段
REMOVE FIELD owner_id ON TABLE notebook;
REMOVE FIELD owner_id ON TABLE source;
REMOVE FIELD owner_id ON TABLE note;
REMOVE FIELD owner_id ON TABLE chat_session;
REMOVE FIELD owner_id ON TABLE source_embedding;
REMOVE FIELD owner_id ON TABLE source_insight;
REMOVE FIELD owner_id ON TABLE transformation;

-- 2. 移除索引
REMOVE INDEX idx_notebook_owner ON TABLE notebook;
REMOVE INDEX idx_notebook_owner_updated ON TABLE notebook;
REMOVE INDEX idx_source_owner ON TABLE source;
REMOVE INDEX idx_note_owner ON TABLE note;
REMOVE INDEX idx_chat_session_owner ON TABLE chat_session;
REMOVE INDEX idx_source_embedding_owner ON TABLE source_embedding;
REMOVE INDEX idx_source_insight_owner ON TABLE source_insight;

-- 3. 恢复原始搜索函数（从 migrations/9.surrealql 复制）
-- ... 省略，需要完整复制原始函数定义 ...

-- 4. 删除用户表（可选，保留则保存用户注册数据）
-- REMOVE TABLE user;
```

---

### 第三阶段：基类和 Repository 改造（2 天）

#### ObjectModel 基类修改

**代码位置**: `open_notebook/domain/base.py`

```python
# open_notebook/domain/base.py

class ObjectModel(BaseModel):
    id: Optional[str] = None
    owner_id: Optional[str] = None  # 新增
    created: Optional[datetime] = None
    updated: Optional[datetime] = None

    @classmethod
    async def get_all(
        cls,
        order_by: str = None,
        user_id: str = None,  # 新增：必须传入
    ) -> List["ObjectModel"]:
        """
        获取用户的所有记录

        注意：系统表（transformation, model_config）不需要用户过滤
        """
        table_name = cls.table_name

        # 系统表不过滤
        system_tables = ["transformation", "model_config", "episode_profile", "speaker_profile"]

        if table_name in system_tables:
            # 系统表返回所有（或者只返回 owner_id = NULL 的公共记录）
            base_query = f"SELECT * FROM {table_name}"
        else:
            # 用户表必须过滤
            if not user_id:
                raise InvalidInputError(f"user_id is required for {table_name}")
            base_query = f"SELECT * FROM {table_name} WHERE owner_id = $user_id"

        if order_by:
            query = f"{base_query} ORDER BY {order_by}"
        else:
            query = base_query

        result = await repo_query(query, {"user_id": user_id})
        return [cls(**parse_record_ids(item)) for item in result] if result else []

    @classmethod
    async def get(cls, id: str, user_id: str = None) -> Optional["ObjectModel"]:
        """
        获取单条记录，验证所有权

        参数:
            id: 记录 ID
            user_id: 当前用户 ID（用于权限验证）
        """
        result = await repo_query(
            "SELECT * FROM $id",
            {"id": ensure_record_id(id)}
        )

        if not result:
            return None

        obj = cls(**parse_record_ids(result[0]))

        # 验证所有权（系统表除外）
        system_tables = ["transformation", "model_config", "episode_profile", "speaker_profile"]
        if cls.table_name not in system_tables:
            if user_id and obj.owner_id and obj.owner_id != user_id:
                # 返回 None 而非抛异常（安全考虑：不暴露记录是否存在）
                return None

        return obj

    async def save(self, user_id: str = None) -> None:
        """
        保存记录，新建时自动设置 owner_id
        """
        data = self._prepare_save_data()
        table_name = self.table_name

        # 新建时设置 owner_id
        if self.id is None:
            if user_id:
                data["owner_id"] = user_id
            data["created"] = datetime.now()

        data["updated"] = datetime.now()

        if self.id is None:
            repo_result = await repo_create(table_name, data)
            self.id = repo_result.get("id")
        else:
            await repo_update(table_name, self.id, data)

    async def delete(self, user_id: str = None) -> bool:
        """
        删除记录，验证所有权
        """
        # 权限检查
        if user_id and self.owner_id and self.owner_id != user_id:
            raise PermissionDeniedError("Cannot delete: not owner")

        return await repo_delete(self.id)
```

#### Repository 层辅助函数

**代码位置**: `open_notebook/database/repository.py`

```python
# open_notebook/database/repository.py - 新增函数

async def repo_query_filtered(
    query_str: str,
    user_id: str,
    vars: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    执行带用户过滤的查询

    自动在 WHERE 子句中添加 owner_id = $user_id
    """
    if vars is None:
        vars = {}
    vars["user_id"] = user_id

    # 简单处理：如果查询已经有 WHERE，添加 AND；否则添加 WHERE
    if "WHERE" in query_str.upper():
        filtered_query = query_str.replace("WHERE", "WHERE owner_id = $user_id AND")
    else:
        # 在 FROM 子句后添加 WHERE
        # 这是简化处理，复杂查询需要更精细的解析
        filtered_query = query_str + " WHERE owner_id = $user_id"

    return await repo_query(filtered_query, vars)


async def verify_ownership(record_id: str, user_id: str) -> bool:
    """验证记录所有权"""
    result = await repo_query(
        "SELECT owner_id FROM $id",
        {"id": ensure_record_id(record_id)}
    )
    if not result:
        return False
    owner = result[0].get("owner_id")
    return owner is None or owner == user_id  # None 表示公共记录


async def batch_verify_ownership(record_ids: List[str], user_id: str) -> bool:
    """批量验证所有权"""
    for rid in record_ids:
        if not await verify_ownership(rid, user_id):
            return False
    return True
```

---

### 第四阶段：API 路由改造（4-5 天）

#### 路由改造模式

**代码位置**: `api/routers/notebooks.py` (示例)

```python
# api/routers/notebooks.py - 改造后

from fastapi import APIRouter, Depends, HTTPException, Query
from api.dependencies import get_current_user
from open_notebook.domain.notebook import Notebook

router = APIRouter(prefix="/api/notebooks", tags=["notebooks"])


@router.get("", response_model=List[NotebookResponse])
async def get_notebooks(
    archived: Optional[bool] = Query(None),
    order_by: str = Query("updated desc"),
    user_id: str = Depends(get_current_user)  # 新增
):
    """获取当前用户的所有笔记本"""

    # 构建查询（添加 owner_id 过滤）
    base_query = "SELECT *, count(<-reference.in) as source_count, count(<-artifact.in) as note_count FROM notebook"
    conditions = ["owner_id = $user_id"]

    if archived is not None:
        conditions.append(f"archived = {str(archived).lower()}")

    query = f"{base_query} WHERE {' AND '.join(conditions)} ORDER BY {order_by}"

    result = await repo_query(query, {"user_id": user_id})
    return result


@router.get("/{notebook_id}", response_model=NotebookDetailResponse)
async def get_notebook(
    notebook_id: str,
    user_id: str = Depends(get_current_user)  # 新增
):
    """获取单个笔记本（验证所有权）"""

    notebook = await Notebook.get(notebook_id, user_id=user_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    # 获取关联的 sources 和 notes
    sources = await notebook.get_sources()
    notes = await notebook.get_notes()

    return NotebookDetailResponse(
        **notebook.model_dump(),
        sources=[s.model_dump() for s in sources],
        notes=[n.model_dump() for n in notes]
    )


@router.post("", response_model=NotebookResponse)
async def create_notebook(
    notebook_data: NotebookCreate,
    user_id: str = Depends(get_current_user)  # 新增
):
    """创建笔记本（自动绑定当前用户）"""

    notebook = Notebook(
        name=notebook_data.name,
        description=notebook_data.description or ""
    )
    await notebook.save(user_id=user_id)  # 传入 user_id

    return NotebookResponse(**notebook.model_dump(), source_count=0, note_count=0)


@router.put("/{notebook_id}", response_model=NotebookResponse)
async def update_notebook(
    notebook_id: str,
    notebook_data: NotebookUpdate,
    user_id: str = Depends(get_current_user)  # 新增
):
    """更新笔记本（验证所有权）"""

    notebook = await Notebook.get(notebook_id, user_id=user_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    # 更新字段
    for key, value in notebook_data.model_dump(exclude_unset=True).items():
        setattr(notebook, key, value)

    await notebook.save()
    return NotebookResponse(**notebook.model_dump())


@router.delete("/{notebook_id}")
async def delete_notebook(
    notebook_id: str,
    user_id: str = Depends(get_current_user)  # 新增
):
    """删除笔记本（验证所有权）"""

    notebook = await Notebook.get(notebook_id, user_id=user_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    await notebook.delete(user_id=user_id)
    return {"success": True, "message": f"Notebook {notebook_id} deleted"}
```

#### 搜索路由改造

**代码位置**: `api/routers/search.py`

```python
# api/routers/search.py - 改造后

@router.post("/search")
async def search(
    request: SearchRequest,
    user_id: str = Depends(get_current_user)  # 新增
):
    """文本搜索（添加用户过滤）"""

    # 调用修改后的搜索函数
    results = await repo_query(
        """
        SELECT * FROM fn::text_search($query_text, $match_count, $sources, $show_notes, $user_id)
        """,
        {
            "query_text": request.query,
            "match_count": request.limit or 10,
            "sources": request.include_sources,
            "show_notes": request.include_notes,
            "user_id": user_id  # 新增
        }
    )

    return SearchResponse(results=results)


@router.post("/ask")
async def ask(
    request: AskRequest,
    user_id: str = Depends(get_current_user)  # 新增
):
    """RAG 问答（添加用户过滤）"""

    # 向量搜索（带用户过滤）
    vector_results = await vector_search(
        request.query,
        match_count=10,
        sources=True,
        notes=True,
        user_id=user_id  # 新增
    )

    # 构建上下文并调用 LLM
    context = build_context(vector_results)
    answer = await llm.generate(request.query, context)

    return AskResponse(answer=answer, sources=vector_results)
```

#### 需要改造的路由文件清单

| 文件 | 端点数 | 关键改动 |
|------|--------|----------|
| `notebooks.py` | 5 | 所有端点添加 user_id，查询添加 owner_id 过滤 |
| `sources.py` | 8 | 上传时设置 owner_id，同步到 embedding/insight |
| `notes.py` | 5 | 创建时设置 owner_id |
| `chat.py` | 6 | 会话和消息按 user_id 过滤 |
| `source_chat.py` | 3 | 来源聊天按 user_id 过滤 |
| `search.py` | 2 | 搜索函数传入 user_id 参数 |
| `embedding.py` | 2 | 向量搜索按 user_id 过滤 |
| `insights.py` | 2 | 洞察按 user_id 过滤 |
| `context.py` | 1 | 上下文构建按 user_id 过滤 |
| `transformations.py` | 4 | 用户自定义转换隔离（可选） |
| `podcasts.py` | 5 | Podcast 数据按 user_id 过滤 |

---

### 第五阶段：前端改造（2-3 天）

#### 认证存储改造

**代码位置**: `frontend/src/lib/stores/auth-store.ts`

```typescript
// frontend/src/lib/stores/auth-store.ts - 改造后

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  authRequired: boolean
}

interface AuthActions {
  login: () => void                              // 重定向到 Zitadel
  handleCallback: (code: string) => Promise<void> // 处理 OIDC 回调
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

const ZITADEL_CONFIG = {
  issuer: process.env.NEXT_PUBLIC_ZITADEL_ISSUER || '',
  clientId: process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID || '',
  redirectUri: `${window.location.origin}/auth/callback`,
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      authRequired: true,

      login: () => {
        // 构建 Zitadel 授权 URL
        const params = new URLSearchParams({
          client_id: ZITADEL_CONFIG.clientId,
          redirect_uri: ZITADEL_CONFIG.redirectUri,
          response_type: 'code',
          scope: 'openid profile email',
          state: crypto.randomUUID(),
        })

        window.location.href = `${ZITADEL_CONFIG.issuer}/oauth/v2/authorize?${params}`
      },

      handleCallback: async (code: string) => {
        set({ isLoading: true, error: null })

        try {
          // 用授权码换取 token
          const apiUrl = await getApiUrl()
          const response = await fetch(`${apiUrl}/api/auth/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirect_uri: ZITADEL_CONFIG.redirectUri })
          })

          if (!response.ok) {
            throw new Error('Failed to exchange code for token')
          }

          const data = await response.json()

          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          })

        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      },

      logout: async () => {
        const { token } = get()

        if (token) {
          try {
            const apiUrl = await getApiUrl()
            await fetch(`${apiUrl}/api/auth/logout`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            })
          } catch (e) {
            console.error('Logout failed:', e)
          }
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })

        // 重定向到 Zitadel 登出
        window.location.href = `${ZITADEL_CONFIG.issuer}/oidc/v1/end_session`
      },

      refreshToken: async () => {
        // TODO: 实现 token 刷新
        // Zitadel 支持 refresh_token grant
      },

      checkAuth: async () => {
        const { token, isAuthenticated } = get()

        if (!token) {
          return false
        }

        try {
          const apiUrl = await getApiUrl()
          const response = await fetch(`${apiUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })

          if (response.ok) {
            const user = await response.json()
            set({ user, isAuthenticated: true })
            return true
          } else {
            set({ user: null, token: null, isAuthenticated: false })
            return false
          }
        } catch (e) {
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

#### API 客户端改造

**代码位置**: `frontend/src/lib/api/client.ts`

```typescript
// frontend/src/lib/api/client.ts - 改造后

import axios from 'axios'
import { useAuthStore } from '../stores/auth-store'

const apiClient = axios.create({
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// 请求拦截器：注入 JWT token
apiClient.interceptors.request.use(
  async (config) => {
    const { token } = useAuthStore.getState()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：处理 401 和 token 刷新
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const { refreshToken, logout } = useAuthStore.getState()

      try {
        await refreshToken()

        // 获取新 token 并重试
        const { token } = useAuthStore.getState()
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)

      } catch (refreshError) {
        // 刷新失败，登出
        await logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
```

---

## 📋 Zitadel 配置（Docker 自托管）

### Docker Compose 服务

```yaml
# 添加到 docker-compose.yml

zitadel:
  image: ghcr.io/zitadel/zitadel:latest
  container_name: chairman_zitadel
  command: 'start-from-init --masterkeyFromEnv --tlsMode disabled'
  environment:
    - ZITADEL_MASTERKEY=${ZITADEL_MASTERKEY:-MustBe32CharactersLongForSecurity!}
    - ZITADEL_DATABASE_POSTGRES_HOST=zitadel_db
    - ZITADEL_DATABASE_POSTGRES_PORT=5432
    - ZITADEL_DATABASE_POSTGRES_DATABASE=zitadel
    - ZITADEL_DATABASE_POSTGRES_USER=zitadel
    - ZITADEL_DATABASE_POSTGRES_PASSWORD=${ZITADEL_DB_PASSWORD:-zitadel}
    - ZITADEL_DATABASE_POSTGRES_SSL_MODE=disable
    - ZITADEL_EXTERNALSECURE=false
    - ZITADEL_EXTERNALPORT=8085
    - ZITADEL_EXTERNALDOMAIN=localhost
    - ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME=admin
    - ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORD=${ZITADEL_ADMIN_PASSWORD:-Admin123!}
  ports:
    - "8085:8080"
  depends_on:
    zitadel_db:
      condition: service_healthy
  networks:
    - chairman_network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/healthz"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 60s

zitadel_db:
  image: postgres:16-alpine
  container_name: chairman_zitadel_db
  environment:
    - POSTGRES_USER=zitadel
    - POSTGRES_PASSWORD=${ZITADEL_DB_PASSWORD:-zitadel}
    - POSTGRES_DB=zitadel
  volumes:
    - ./data/zitadel_db:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U zitadel -d zitadel"]
    interval: 5s
    timeout: 5s
    retries: 5
  networks:
    - chairman_network
```

### 环境变量配置

```env
# .env

# Zitadel 配置
ZITADEL_MASTERKEY=MustBe32CharactersLongForSecurity!
ZITADEL_DB_PASSWORD=secure_password_here
ZITADEL_ADMIN_PASSWORD=Admin123!
ZITADEL_ISSUER=http://localhost:8085
ZITADEL_CLIENT_ID=<创建应用后获取>
ZITADEL_CLIENT_SECRET=<创建应用后获取>

# Open-Notebook 环境变量
open_notebook:
  environment:
    - AUTH_PROVIDER=zitadel
    - ZITADEL_ISSUER=http://zitadel:8080
    - ZITADEL_CLIENT_ID=${ZITADEL_CLIENT_ID}
    - ZITADEL_CLIENT_SECRET=${ZITADEL_CLIENT_SECRET}

# 前端环境变量
frontend:
  environment:
    - NEXT_PUBLIC_ZITADEL_ISSUER=http://localhost:8085
    - NEXT_PUBLIC_ZITADEL_CLIENT_ID=${ZITADEL_CLIENT_ID}
```

### Zitadel 应用配置步骤

1. 启动 Zitadel: `docker compose up -d zitadel_db zitadel`
2. 等待初始化完成（约 2-3 分钟）
3. 访问 `http://localhost:8085`
4. 使用 `admin / Admin123!` 登录
5. 创建项目 "Chairman Agent"
6. 创建 Web 应用:
   - **名称**: Open-Notebook
   - **回调 URL**: `http://localhost:8502/auth/callback`
   - **登出 URL**: `http://localhost:8502/login`
7. 记录 Client ID 和 Client Secret

---

## 📅 实施计划（修订版 v2.0）

| 阶段 | 任务 | 时间 | 交付物 |
|------|------|------|--------|
| **阶段 0** | Zitadel 部署和配置 | 1 天 | 运行的认证服务 |
| **阶段 1** | 认证中间件和依赖注入 | 2 天 | JWT 验证 + user_id 注入 + 用户自动创建 |
| **阶段 2** | 数据库迁移 | 2 天 | user 表 + owner_id 字段 + 搜索函数 |
| **阶段 2.5** | **LangGraph 用户隔离** | 1-2 天 | 多租户 thread_id + 会话所有权验证 |
| **阶段 3** | 基类和 Repository 改造 | 2 天 | ObjectModel 用户过滤 |
| **阶段 4** | API 路由改造 | 4 天 | 12 个路由文件 |
| **阶段 5** | 前端改造 | 2 天 | Zitadel 登录 + token 管理 |
| **阶段 6** | 测试和文档 | 2 天 | E2E 测试 + 部署文档 |
| **阶段 6.5** | **审计日志系统** | 0.5-1 天 | audit_log 表 + 日志记录函数 |

**总计**: 约 17-19 天（3-3.5 周）

> **v2.0 更新说明**：
> - 新增阶段 2.5：LangGraph thread_id 用户隔离（审视发现的高风险遗漏）
> - 新增阶段 6.5：审计日志系统（多用户环境必需）
> - 阶段 1 增加：首次登录用户自动创建

---

## ⚠️ 风险和注意事项

### 已识别的技术债务

| 问题 | 影响 | 建议 |
|------|------|------|
| **聊天消息不持久化** | 重启丢失历史 | 单独项目解决，添加 chat_message 表 |
| **无数据库连接池** | 高并发瓶颈 | 考虑使用 `aioodbc` 或 SurrealDB 连接池 |
| **LangGraph 状态隔离** | 无用户隔离 | 需要研究 LangGraph 的 thread_id 设计 |

### 迁移风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 搜索函数重定义失败 | 低 | 高 | 测试环境验证，保留旧函数 |
| 现有数据迁移不完整 | 中 | 高 | 迁移后验证脚本 |
| 关联表 owner_id 不同步 | 中 | 中 | 触发器自动同步 |
| 性能下降 | 低 | 中 | 添加复合索引 |

### 向后兼容性

- ✅ owner_id 为 OPTIONAL，默认 NULL
- ✅ 系统表不过滤
- ✅ 搜索函数 user_id 参数为 OPTIONAL
- ✅ 可随时回滚（提供 down 迁移）

---

## 🧪 验证检查点

### 阶段 1 完成标准
- [ ] Zitadel 登录返回有效 JWT
- [ ] JWT 中间件正确解析 user_id
- [ ] `/api/auth/me` 返回当前用户信息
- [ ] 无效 token 返回 401

### 阶段 2 完成标准
- [ ] user 表创建成功
- [ ] 所有核心表有 owner_id 字段和索引
- [ ] 现有数据归属 "admin" 用户
- [ ] 搜索函数接受 user_id 参数

### 阶段 3 完成标准
- [ ] `Notebook.get_all(user_id=x)` 只返回用户 x 的数据
- [ ] `Notebook.get(id, user_id=y)` 非所有者返回 None
- [ ] `notebook.save(user_id=x)` 自动设置 owner_id

### 阶段 4 完成标准
- [ ] 所有 12 个路由文件改造完成
- [ ] 用户 A 无法访问用户 B 的数据
- [ ] 搜索结果按用户隔离

### 阶段 5 完成标准
- [ ] 前端 Zitadel 登录流程正常
- [ ] API 请求自动携带 JWT
- [ ] 401 时自动跳转登录页

---

## 🔗 参考资源

- [Zitadel Docker 部署](https://zitadel.com/docs/self-hosting/deploy/compose)
- [Zitadel OIDC 配置](https://zitadel.com/docs/guides/integrate/login/oidc)
- [FastAPI OAuth2](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [python-jose JWT](https://python-jose.readthedocs.io/)
- [SurrealDB DEFINE FUNCTION](https://surrealdb.com/docs/surrealql/statements/define/function)

---

## 🔄 完整交互流程图（改造前 vs 改造后）

> **v2.0 新增**：基于深度代码审视补充的完整系统交互对比图

### 改造前：当前系统架构（无多用户支持）

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        改造前：Open-Notebook 系统架构                             │
│                           ⚠️ 单用户模式，无数据隔离                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                          前端层 (React + Zustand)                        │  │
│   ├─────────────────────────────────────────────────────────────────────────┤  │
│   │   auth-store.ts                    api-client.ts                        │  │
│   │   ┌─────────────────┐              ┌─────────────────────────┐         │  │
│   │   │ token = 密码明文 │              │ Authorization: Bearer   │         │  │
│   │   │ (无 user_id)    │──────────────▶│ {OPEN_NOTEBOOK_PASSWORD}│         │  │
│   │   └─────────────────┘              └───────────┬─────────────┘         │  │
│   └────────────────────────────────────────────────│────────────────────────┘  │
│                                                    ▼                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                           API 层 (FastAPI)                               │  │
│   ├─────────────────────────────────────────────────────────────────────────┤  │
│   │   PasswordAuthMiddleware                                                │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐  │  │
│   │   │ if token == OPEN_NOTEBOOK_PASSWORD: pass  # ⚠️ 无用户信息        │  │  │
│   │   └─────────────────────────────────────────────────────────────────┘  │  │
│   │   路由处理器 (无用户上下文)                                              │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐  │  │
│   │   │ @router.get("/notebooks")                                       │  │  │
│   │   │ async def get_notebooks():  # ⚠️ 无 user_id 参数               │  │  │
│   │   │     return await Notebook.get_all()  # 返回所有数据             │  │  │
│   │   └─────────────────────────────────────────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                    ▼                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                         Domain 层 (ObjectModel)                          │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐  │  │
│   │   │ def get_all(): query = f"SELECT * FROM {table}"  # ⚠️ 无 WHERE  │  │  │
│   │   │ def get(id): SELECT * FROM {id}  # ⚠️ 无权限检查                │  │  │
│   │   └─────────────────────────────────────────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                    ▼                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                          数据库层 (SurrealDB)                            │  │
│   │   数据表: { id, name, ... } ⚠️ 无 owner_id 字段                         │  │
│   │   搜索函数: fn::text_search($query, ...) ⚠️ 无 $user_id 参数            │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                        LangGraph 层 (聊天状态)                           │  │
│   │   thread_id = session_id  # ⚠️ 无用户前缀，知道ID即可访问               │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 改造后：目标系统架构（完整多用户支持）

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        改造后：Open-Notebook 系统架构                             │
│                           ✅ 多用户模式，完整数据隔离                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                          前端层 (React + Zustand)                        │  │
│   │   auth-store.ts (改造后)               api-client.ts (改造后)            │  │
│   │   ┌──────────────────────┐            ┌─────────────────────────┐      │  │
│   │   │ user: { id, email }  │            │ Authorization: Bearer   │      │  │
│   │   │ token: JWT           │────────────▶│ {JWT_ACCESS_TOKEN}     │      │  │
│   │   │ refreshToken: ...    │            │ 401 → refreshToken()   │      │  │
│   │   └──────────────────────┘            └───────────┬─────────────┘      │  │
│   │   登录流程: → Zitadel → code → token → 存储                            │  │
│   └───────────────────────────────────────────────────│─────────────────────┘  │
│                                                       ▼                        │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                           API 层 (FastAPI)                               │  │
│   │   ZitadelAuthMiddleware (新)                                            │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐  │  │
│   │   │ 1. 验证 JWT (JWKS 公钥)                                          │  │  │
│   │   │ 2. 调用 ensure_user_exists() 确保用户记录存在                    │  │  │
│   │   │ 3. request.state.user_id = sub  ✅                              │  │  │
│   │   └─────────────────────────────────────────────────────────────────┘  │  │
│   │   依赖注入: get_current_user() → user_id                               │  │
│   │   路由处理器 (改造后)                                                    │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐  │  │
│   │   │ @router.get("/notebooks")                                       │  │  │
│   │   │ async def get_notebooks(user_id = Depends(get_current_user)):   │  │  │
│   │   │     return await Notebook.get_all(user_id=user_id)  ✅          │  │  │
│   │   └─────────────────────────────────────────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                    ▼                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                         Domain 层 (ObjectModel)                          │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐  │  │
│   │   │ owner_id: Optional[str]  # ✅ 新增字段                          │  │  │
│   │   │ def get_all(user_id): WHERE owner_id = $user_id  ✅             │  │  │
│   │   │ def get(id, user_id): 验证 owner_id == user_id  ✅              │  │  │
│   │   │ def save(user_id): 新建时设置 owner_id  ✅                       │  │  │
│   │   └─────────────────────────────────────────────────────────────────┘  │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                    ▼                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                          数据库层 (SurrealDB)                            │  │
│   │   user 表: { id, external_id, email, name }  ✅ 新增                    │  │
│   │   数据表: { ..., owner_id } + INDEX  ✅ 新增字段和索引                  │  │
│   │   搜索函数: fn::text_search($query, ..., $user_id)  ✅ 新增参数         │  │
│   │   audit_log 表: { action, user_id, resource_id, timestamp }  ✅ 新增   │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                        LangGraph 层 (改造后)                             │  │
│   │   thread_id = f"user_{user_id}:session_{session_id}"  ✅ 多租户隔离     │  │
│   │   执行前验证: session.owner_id == current_user_id  ✅                   │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 权限检查点矩阵对比

| 检查点 | 改造前 | 改造后 | 实现方式 |
|--------|--------|--------|----------|
| 前端 Token 存储 | ⚠️ 密码明文 | ✅ JWT + Refresh | Zustand persist |
| API 中间件认证 | ⚠️ 密码对比 | ✅ JWT 验证 | JWKS + RS256 |
| 用户自动创建 | ❌ 无 | ✅ 首次登录创建 | ensure_user_exists() |
| 路由级用户注入 | ❌ 无 | ✅ Depends() | get_current_user |
| Domain 层所有权 | ❌ 无 | ✅ owner_id 验证 | ObjectModel |
| 数据库行级过滤 | ❌ 无 | ✅ WHERE owner_id | 所有查询 |
| 搜索函数用户过滤 | ❌ 无 | ✅ $user_id 参数 | fn::text/vector_search |
| LangGraph 隔离 | ❌ 无 | ✅ tenant thread_id | user_prefix |
| 审计日志 | ❌ 无 | ✅ 操作记录 | audit_log 表 |

---

## 📋 API 端点权限改造矩阵

### notebooks.py

| 端点 | 方法 | 改造前 | 改造后 | 权限检查 |
|------|------|--------|--------|----------|
| /notebooks | GET | 返回所有 | WHERE owner_id=$user | ✅ 依赖注入 + 查询过滤 |
| /notebooks/{id} | GET | 直接返回 | 验证 owner_id | ✅ Domain 层所有权检查 |
| /notebooks | POST | 直接创建 | 设置 owner_id | ✅ save(user_id) |
| /notebooks/{id} | PUT | 直接更新 | 验证后更新 | ✅ get() + save() |
| /notebooks/{id} | DELETE | 直接删除 | 验证后删除 | ✅ delete(user_id) |

### sources.py

| 端点 | 方法 | 改造前 | 改造后 | 权限检查 |
|------|------|--------|--------|----------|
| /sources | GET | 返回所有 | WHERE owner_id=$user | ✅ 查询过滤 |
| /sources/{id} | GET | 直接返回 | 验证 owner_id | ✅ 所有权检查 |
| /sources | POST | 直接创建 | 设置 owner_id | ✅ save(user_id) |
| /sources/upload | POST | 无用户绑定 | 绑定 owner_id | ✅ 上传时设置 |
| /sources/{id}/vectorize | POST | 无权限 | 验证后执行 | ✅ 异步任务带 user_id |
| /sources/{id}/insights | POST | 无权限 | 验证后执行 | ✅ 异步任务带 user_id |

### chat.py（重点改造）

| 端点 | 方法 | 改造前 | 改造后 | 权限检查 |
|------|------|--------|--------|----------|
| /chat/sessions | GET | 返回所有 | WHERE owner_id=$user | ✅ 查询过滤 |
| /chat/sessions | POST | 直接创建 | 设置 owner_id | ✅ save(user_id) |
| /chat/sessions/{id} | GET | 直接返回 | 验证 owner_id | ✅ 所有权检查 |
| /chat/sessions/{id} | DELETE | 直接删除 | 验证后删除 | ✅ 清理 LangGraph 状态 |
| /chat | POST | thread_id=sess_id | thread_id=user:sess | ✅ **多租户 thread_id** |
| /chat/history/{id} | GET | 无权限 | 验证 session 所有权 | ✅ 所有权检查 |

### search.py

| 端点 | 方法 | 改造前 | 改造后 | 权限检查 |
|------|------|--------|--------|----------|
| /search | POST | 搜索全库 | fn::text_search + user | ✅ 搜索函数带 user_id |
| /search/vector | POST | 搜索全库 | fn::vector_search + user | ✅ 搜索函数带 user_id |
| /ask | POST | RAG 全库 | 上下文只含用户数据 | ✅ 向量搜索 + 用户过滤 |

### auth.py（新增）

| 端点 | 方法 | 说明 | 权限 |
|------|------|------|------|
| /auth/callback | POST | OIDC code → token | 🔓 公开 |
| /auth/refresh | POST | refresh → new token | 🔒 需要 refresh_token |
| /auth/me | GET | 返回当前用户信息 | 🔒 需要 JWT |
| /auth/logout | POST | 注销 token | 🔒 需要 JWT |

---

## 🆕 新增实现代码（v2.0 补充）

### 阶段 2.5：LangGraph 多租户 thread_id

**文件**: `api/routers/chat.py`

```python
def create_tenant_thread_id(user_id: str, session_id: str) -> str:
    """创建多租户 thread_id，确保不同用户的聊天状态隔离"""
    return f"user_{user_id}:session_{session_id}"


@router.post("/chat")
async def execute_chat(
    request: ChatRequest,
    user_id: str = Depends(get_current_user)
):
    """执行聊天（带用户隔离）"""
    # 1. 获取会话并验证所有权
    session = await ChatSession.get(request.session_id, user_id=user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # 2. 构建多租户 thread_id
    thread_id = create_tenant_thread_id(user_id, request.session_id)

    # 3. 执行聊天
    result = chat_graph.invoke(
        input={"messages": [HumanMessage(content=request.message)]},
        config=RunnableConfig(configurable={"thread_id": thread_id})
    )

    # 4. 审计日志
    await log_audit("CHAT_MESSAGE", user_id, request.session_id)

    return result
```

### 阶段 1：首次登录用户自动创建

**文件**: `api/auth.py`

```python
async def ensure_user_exists(external_id: str, email: str, name: str) -> str:
    """
    确保用户记录存在，首次登录时自动创建

    参数:
        external_id: Zitadel sub claim
        email: 用户邮箱
        name: 用户显示名

    返回:
        用户 ID
    """
    # 检查用户是否已存在
    result = await repo_query(
        "SELECT * FROM user WHERE external_id = $ext_id",
        {"ext_id": external_id}
    )

    if result:
        # 更新最后登录时间
        await repo_update("user", result[0]["id"], {"updated": datetime.now()})
        return result[0]["id"]

    # 创建新用户
    user = await repo_create("user", {
        "external_id": external_id,
        "email": email,
        "name": name,
        "created": datetime.now(),
        "updated": datetime.now()
    })

    return user["id"]
```

### 阶段 6.5：审计日志系统

**文件**: `migrations/11_audit_log.surrealql`

```sql
-- 审计日志表
DEFINE TABLE audit_log SCHEMAFULL;

DEFINE FIELD action ON audit_log TYPE string;           -- 操作类型: NOTEBOOK_CREATE, SOURCE_DELETE, CHAT_MESSAGE
DEFINE FIELD user_id ON audit_log TYPE string;          -- 操作用户
DEFINE FIELD resource_id ON audit_log TYPE option<string>;  -- 操作资源 ID
DEFINE FIELD metadata ON audit_log TYPE option<object>; -- 额外元数据
DEFINE FIELD ip_address ON audit_log TYPE option<string>;
DEFINE FIELD timestamp ON audit_log TYPE datetime DEFAULT time::now();

-- 索引
DEFINE INDEX idx_audit_user ON audit_log COLUMNS user_id;
DEFINE INDEX idx_audit_time ON audit_log COLUMNS timestamp DESC;
DEFINE INDEX idx_audit_action ON audit_log COLUMNS action;
```

**文件**: `open_notebook/audit/logger.py`

```python
from datetime import datetime
from open_notebook.database.repository import repo_create

# 审计操作类型常量
class AuditAction:
    # Notebook 操作
    NOTEBOOK_CREATE = "NOTEBOOK_CREATE"
    NOTEBOOK_UPDATE = "NOTEBOOK_UPDATE"
    NOTEBOOK_DELETE = "NOTEBOOK_DELETE"
    NOTEBOOK_LIST = "NOTEBOOK_LIST"

    # Source 操作
    SOURCE_UPLOAD = "SOURCE_UPLOAD"
    SOURCE_DELETE = "SOURCE_DELETE"
    SOURCE_VECTORIZE = "SOURCE_VECTORIZE"

    # Chat 操作
    CHAT_SESSION_CREATE = "CHAT_SESSION_CREATE"
    CHAT_MESSAGE = "CHAT_MESSAGE"

    # 搜索操作
    SEARCH_TEXT = "SEARCH_TEXT"
    SEARCH_VECTOR = "SEARCH_VECTOR"
    SEARCH_RAG = "SEARCH_RAG"


async def log_audit(
    action: str,
    user_id: str,
    resource_id: str = None,
    metadata: dict = None,
    ip_address: str = None
) -> None:
    """
    记录审计日志

    示例:
        await log_audit(AuditAction.NOTEBOOK_CREATE, user_id, notebook.id)
        await log_audit(AuditAction.SEARCH_RAG, user_id, metadata={"query": query})
    """
    await repo_create("audit_log", {
        "action": action,
        "user_id": user_id,
        "resource_id": resource_id,
        "metadata": metadata,
        "ip_address": ip_address,
        "timestamp": datetime.now()
    })
```

---

## 🔍 审视发现的风险项

### 高风险（已在 v2.0 中解决）

| 风险项 | 问题描述 | 解决方案 | 阶段 |
|--------|----------|----------|------|
| LangGraph 无隔离 | thread_id 直接使用 session_id，任何人知道 ID 即可访问 | 多租户 thread_id + 会话所有权验证 | 阶段 2.5 |
| 异步任务无用户上下文 | embedding 生成等任务只传 source_id | 异步任务参数增加 user_id | 阶段 4 |

### 中高风险（计划处理）

| 风险项 | 问题描述 | 解决方案 | 阶段 |
|--------|----------|----------|------|
| 首次登录无用户创建 | user 表存在但无自动创建逻辑 | ensure_user_exists() | 阶段 1 |
| 无审计日志 | 多用户环境无法追溯操作 | audit_log 表 + 日志函数 | 阶段 6.5 |

### 延后处理（后续迭代）

| 风险项 | 问题描述 | 处理建议 |
|--------|----------|----------|
| 级联删除不完整 | 删除 notebook/source 时关联数据未清理 | 使用软删除标记，后续迭代实现 |
| 无 API 限流 | 高频请求可能影响服务 | 后续迭代添加 |

---

**文档版本**: 2.0（深度调研后修订 + 完整审视补充）
**更新日期**: 2025-11-27
**审核状态**: 基于代码事实验证 + 交互流程审视确认
