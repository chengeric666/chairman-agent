# Open-Notebook 多用户改造方案

## 🎯 目标

为 Open-Notebook 实现完整的多用户数据隔离，集成 NextAuth + Zitadel OIDC 认证。

---

## ✅ 用户确认的决策

| 决策项 | 选择 |
|--------|------|
| **实施范围** | 仅 Open-Notebook（OpenCanvas 已在改造中） |
| **Zitadel 部署** | 自托管 Docker |
| **数据迁移** | 现有数据归属默认管理员用户 |
| **预估周期** | 2-3 周 |

---

## 📊 现状分析

### 技术架构概览

| 组件 | 技术栈 | 说明 |
|------|--------|------|
| **后端** | FastAPI (Python) | 17个路由文件，4816行代码 |
| **前端** | Next.js 15 + Zustand | 认证状态存储在 LocalStorage |
| **数据库** | SurrealDB | NoSQL + 关系特性，支持行级安全 |
| **当前认证** | 单一密码 | 环境变量 `OPEN_NOTEBOOK_PASSWORD` |

### 需要用户过滤的路由（12个）

| 路由文件 | 优先级 | 核心端点 |
|---------|--------|----------|
| `notebooks.py` | 🔴 高 | GET/POST/PUT/DELETE /notebooks |
| `notes.py` | 🔴 高 | GET/POST/PUT/DELETE /notes |
| `sources.py` | 🔴 高 | GET/POST /sources, /sources/upload |
| `chat.py` | 🔴 高 | POST/GET /chat/sessions |
| `source_chat.py` | 🔴 高 | POST /source-chat/sessions |
| `search.py` | 🟡 中 | POST /search, /ask |
| `transformations.py` | 🟡 中 | GET/POST /transformations |
| `embedding.py` | 🟡 中 | POST /embedding/search |
| `insights.py` | 🟡 中 | GET /insights |
| `context.py` | 🟡 中 | GET /context |
| `podcasts.py` | 🟡 中 | GET/POST /podcasts |
| `embedding_rebuild.py` | 🟢 低 | POST /embeddings/rebuild |

### 系统级路由（无需用户过滤）

- `config.py` - 系统配置
- `models.py` - 模型配置（全局共享）
- `auth.py` - 认证状态
- `settings.py` - 可选按用户分离

---

## 🔧 技术方案

### 改造策略：基类过滤 + 路由验证

**方案 C（ORM级别）+ 方案 B（路由级别）组合**

```
┌─────────────────────────────────────────────────────────────┐
│                      请求流程                                │
├─────────────────────────────────────────────────────────────┤
│  1. JWT 中间件 → 验证 token，提取 user_id                    │
│  2. 依赖注入 → get_current_user() 返回用户对象               │
│  3. 路由处理 → 传递 user_id 到业务逻辑                       │
│  4. ObjectModel → 自动添加 WHERE owner_id=$user_id           │
│  5. Repository → 创建时自动设置 owner_id                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 文件修改清单

### 第一阶段：认证系统（3-4 天）

#### 新建文件

| 文件 | 说明 |
|------|------|
| `api/dependencies.py` | `get_current_user()` 依赖函数 |
| `open_notebook/domain/user.py` | User 模型定义 |
| `migrations/10_multiuser.surrealql` | 添加 user 表和 owner_id 字段 |

#### 修改文件

| 文件 | 修改内容 | 行数估算 |
|------|----------|----------|
| `api/auth.py` | 重写：JWT 验证 + OIDC 集成 | ~150 行 |
| `api/routers/auth.py` | 扩展：/register, /login, /callback, /me | ~200 行 |
| `api/main.py` | 注册新中间件和路由 | ~20 行 |

#### 认证中间件实现

```python
# api/auth.py
from jose import jwt, JWTError
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class JWTAuthMiddleware(BaseHTTPMiddleware):
    """JWT 认证中间件，从 token 提取 user_id 注入请求上下文"""

    def __init__(self, app, excluded_paths: list = None):
        super().__init__(app)
        self.excluded_paths = excluded_paths or [
            "/", "/health", "/docs", "/openapi.json",
            "/api/auth/login", "/api/auth/callback", "/api/config"
        ]

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.excluded_paths:
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Missing token"})

        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.state.user_id = payload.get("sub")
            request.state.user_email = payload.get("email")
        except JWTError:
            return JSONResponse(status_code=401, content={"detail": "Invalid token"})

        return await call_next(request)
```

#### 用户依赖注入

```python
# api/dependencies.py
from fastapi import Request, HTTPException, Depends

async def get_current_user(request: Request) -> str:
    """从请求上下文获取当前用户 ID"""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id

async def get_current_user_optional(request: Request) -> str | None:
    """可选的用户认证，用于公开 + 私有混合端点"""
    return getattr(request.state, "user_id", None)
```

---

### 第二阶段：数据库迁移（2-3 天）

#### 迁移脚本

```sql
-- migrations/10_multiuser.surrealql

-- ============================================
-- 1. 创建用户表
-- ============================================
DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD external_id ON user TYPE string;      -- Zitadel 用户 ID
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

-- Notebook
DEFINE FIELD owner_id ON notebook TYPE option<record<user>>;
DEFINE INDEX notebook_owner ON notebook COLUMNS owner_id;

-- Source
DEFINE FIELD owner_id ON source TYPE option<record<user>>;
DEFINE INDEX source_owner ON source COLUMNS owner_id;

-- Note
DEFINE FIELD owner_id ON note TYPE option<record<user>>;
DEFINE INDEX note_owner ON note COLUMNS owner_id;

-- Chat Session
DEFINE FIELD owner_id ON chat_session TYPE option<record<user>>;
DEFINE INDEX chat_session_owner ON chat_session COLUMNS owner_id;

-- Source Embedding
DEFINE FIELD owner_id ON source_embedding TYPE option<record<user>>;
DEFINE INDEX source_embedding_owner ON source_embedding COLUMNS owner_id;

-- Source Insight
DEFINE FIELD owner_id ON source_insight TYPE option<record<user>>;
DEFINE INDEX source_insight_owner ON source_insight COLUMNS owner_id;

-- Transformation (用户自定义转换)
DEFINE FIELD owner_id ON transformation TYPE option<record<user>>;

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
UPDATE notebook SET owner_id = user:admin WHERE owner_id IS NONE;
UPDATE source SET owner_id = user:admin WHERE owner_id IS NONE;
UPDATE note SET owner_id = user:admin WHERE owner_id IS NONE;
UPDATE chat_session SET owner_id = user:admin WHERE owner_id IS NONE;
UPDATE source_embedding SET owner_id = user:admin WHERE owner_id IS NONE;
UPDATE source_insight SET owner_id = user:admin WHERE owner_id IS NONE;
```

#### User 模型

```python
# open_notebook/domain/user.py
from typing import Optional
from pydantic import BaseModel
from open_notebook.domain.base import ObjectModel

class User(ObjectModel):
    table_name = "user"

    external_id: str                    # Zitadel 用户 ID
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None

    @classmethod
    async def get_by_external_id(cls, external_id: str) -> Optional["User"]:
        """通过 Zitadel ID 查找用户"""
        from open_notebook.database.repository import repo_query
        result = await repo_query(
            "SELECT * FROM user WHERE external_id = $external_id",
            {"external_id": external_id}
        )
        if result:
            return cls(**result[0])
        return None

    @classmethod
    async def get_or_create(cls, external_id: str, email: str, name: str = None) -> "User":
        """获取或创建用户（首次登录时自动创建）"""
        user = await cls.get_by_external_id(external_id)
        if not user:
            user = cls(external_id=external_id, email=email, name=name)
            await user.save()
        return user
```

---

### 第三阶段：基类改造（2 天）

#### ObjectModel 基类修改

```python
# open_notebook/domain/base.py (修改)

class ObjectModel(BaseModel):
    id: Optional[str] = None
    owner_id: Optional[str] = None  # 新增：所有者 ID
    created: Optional[datetime] = None
    updated: Optional[datetime] = None

    @classmethod
    async def get_all(
        cls,
        order_by: str = None,
        user_id: str = None,      # 新增：必须传入
        include_shared: bool = False
    ) -> List[T]:
        """获取用户的所有记录"""
        table_name = cls.get_table_name()

        # 系统表不需要用户过滤
        if table_name in ["transformation", "model_config"]:
            query = f"SELECT * FROM {table_name}"
        else:
            if not user_id:
                raise InvalidInputError("user_id is required for data access")
            query = f"SELECT * FROM {table_name} WHERE owner_id = $user_id"

        if order_by:
            query += f" ORDER BY {order_by}"

        result = await repo_query(query, {"user_id": user_id})
        return [cls(**item) for item in result]

    @classmethod
    async def get(cls, id: str, user_id: str = None) -> Optional[T]:
        """获取单条记录，验证所有权"""
        result = await repo_query(
            "SELECT * FROM $id",
            {"id": ensure_record_id(id)}
        )
        if not result:
            return None

        obj = cls(**result[0])

        # 验证所有权（系统表除外）
        table_name = cls.get_table_name()
        if table_name not in ["transformation", "model_config"]:
            if user_id and obj.owner_id and obj.owner_id != user_id:
                raise PermissionDeniedError(f"Access denied to {id}")

        return obj

    async def save(self, user_id: str = None) -> None:
        """保存记录，自动设置 owner_id"""
        data = self.model_dump(exclude_none=True, exclude={"id"})
        table_name = self.get_table_name()

        # 新建时设置 owner_id
        if self.id is None and user_id:
            data["owner_id"] = user_id
            data["created"] = datetime.now()

        data["updated"] = datetime.now()

        if self.id is None:
            result = await repo_create(table_name, data)
            self.id = result.get("id")
        else:
            await repo_update(table_name, self.id, data)

    async def delete(self, user_id: str = None) -> bool:
        """删除记录，验证所有权"""
        if user_id and self.owner_id and self.owner_id != user_id:
            raise PermissionDeniedError(f"Cannot delete: access denied")
        return await repo_delete(self.id)
```

#### Repository 层辅助函数

```python
# open_notebook/database/repository.py (新增)

async def verify_ownership(record_id: str, user_id: str) -> bool:
    """验证记录所有权"""
    result = await repo_query(
        "SELECT owner_id FROM $id",
        {"id": ensure_record_id(record_id)}
    )
    if not result:
        return False
    return result[0].get("owner_id") == user_id

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

```python
# api/routers/notebooks.py (改造示例)

from fastapi import APIRouter, Depends, HTTPException
from api.dependencies import get_current_user

router = APIRouter(prefix="/api/notebooks", tags=["notebooks"])

@router.get("")
async def get_notebooks(user_id: str = Depends(get_current_user)):
    """获取用户的所有笔记本"""
    notebooks = await Notebook.get_all(
        order_by="updated DESC",
        user_id=user_id  # 新增：传入用户 ID
    )
    return [nb.model_dump() for nb in notebooks]

@router.get("/{notebook_id}")
async def get_notebook(notebook_id: str, user_id: str = Depends(get_current_user)):
    """获取单个笔记本"""
    notebook = await Notebook.get(notebook_id, user_id=user_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return notebook.model_dump()

@router.post("")
async def create_notebook(
    notebook_data: NotebookCreate,
    user_id: str = Depends(get_current_user)
):
    """创建笔记本"""
    notebook = Notebook(**notebook_data.model_dump())
    await notebook.save(user_id=user_id)  # 新增：传入用户 ID
    return notebook.model_dump()

@router.put("/{notebook_id}")
async def update_notebook(
    notebook_id: str,
    notebook_data: NotebookUpdate,
    user_id: str = Depends(get_current_user)
):
    """更新笔记本"""
    notebook = await Notebook.get(notebook_id, user_id=user_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")

    for key, value in notebook_data.model_dump(exclude_unset=True).items():
        setattr(notebook, key, value)
    await notebook.save()
    return notebook.model_dump()

@router.delete("/{notebook_id}")
async def delete_notebook(notebook_id: str, user_id: str = Depends(get_current_user)):
    """删除笔记本"""
    notebook = await Notebook.get(notebook_id, user_id=user_id)
    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook not found")
    await notebook.delete(user_id=user_id)
    return {"success": True}
```

#### 需要改造的路由文件

| 文件 | 改动要点 | 估算行数 |
|------|----------|----------|
| `notebooks.py` | 所有端点添加 user_id 依赖 | +50 行 |
| `notes.py` | 所有端点添加 user_id 依赖 | +40 行 |
| `sources.py` | 所有端点添加 user_id 依赖，上传时设置 owner | +80 行 |
| `chat.py` | 会话创建/查询添加 user_id | +50 行 |
| `source_chat.py` | 来源聊天添加 user_id | +40 行 |
| `search.py` | 搜索结果按用户过滤 | +20 行 |
| `transformations.py` | 用户自定义转换隔离 | +30 行 |
| `embedding.py` | 向量搜索按用户过滤 | +20 行 |
| `embedding_rebuild.py` | 重建时验证所有权 | +20 行 |
| `insights.py` | 洞察按用户过滤 | +20 行 |
| `context.py` | 上下文按用户过滤 | +20 行 |
| `podcasts.py` | 播客数据按用户过滤 | +40 行 |

---

### 第五阶段：前端改造（2-3 天）

#### 认证存储改造

```typescript
// frontend/src/lib/stores/auth-store.ts

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null           // JWT token
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: () => Promise<void>      // 重定向到 Zitadel
  logout: () => Promise<void>
  handleCallback: (code: string) => Promise<void>
  refreshToken: () => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async () => {
        // 重定向到 Zitadel 登录页面
        const authUrl = `${ZITADEL_ISSUER}/oauth/v2/authorize?` +
          `client_id=${ZITADEL_CLIENT_ID}&` +
          `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
          `response_type=code&` +
          `scope=openid profile email`
        window.location.href = authUrl
      },

      handleCallback: async (code: string) => {
        set({ isLoading: true })
        try {
          // 用授权码换取 token
          const response = await fetch('/api/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          })
          const data = await response.json()
          set({
            user: data.user,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ error: error.message, isLoading: false })
        }
      },

      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        set({ user: null, token: null, isAuthenticated: false })
        window.location.href = '/login'
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
)
```

#### API 客户端改造

```typescript
// frontend/src/lib/api/client.ts

apiClient.interceptors.request.use(async (config) => {
  const { token } = useAuthStore.getState()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 响应处理：尝试刷新 token
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const { refreshToken, logout } = useAuthStore.getState()
      try {
        await refreshToken()
        // 重试原请求
        return apiClient.request(error.config)
      } catch {
        await logout()
      }
    }
    return Promise.reject(error)
  }
)
```

#### 新建登录页面

```typescript
// frontend/src/app/(auth)/login/page.tsx

'use client'

import { useAuthStore } from '@/lib/stores/auth-store'

export default function LoginPage() {
  const { login, isLoading, error } = useAuthStore()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">登录 Open-Notebook</h2>
          <p className="mt-2 text-gray-600">使用企业账号登录</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded">
            {error}
          </div>
        )}

        <button
          onClick={login}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          {isLoading ? '正在登录...' : '使用 Zitadel 登录'}
        </button>
      </div>
    </div>
  )
}
```

---

## 📋 Zitadel 配置

### Docker Compose 服务

```yaml
# 添加到 docker-compose.yml

zitadel:
  image: ghcr.io/zitadel/zitadel:latest
  container_name: chairman_zitadel
  command: 'start-from-init --masterkeyFromEnv --tlsMode disabled'
  environment:
    - ZITADEL_MASTERKEY=MasterkeyNeedsToHave32Characters
    - ZITADEL_DATABASE_POSTGRES_HOST=zitadel_db
    - ZITADEL_DATABASE_POSTGRES_PORT=5432
    - ZITADEL_DATABASE_POSTGRES_DATABASE=zitadel
    - ZITADEL_DATABASE_POSTGRES_USER=zitadel
    - ZITADEL_DATABASE_POSTGRES_PASSWORD=zitadel
    - ZITADEL_DATABASE_POSTGRES_SSL_MODE=disable
    - ZITADEL_EXTERNALSECURE=false
    - ZITADEL_EXTERNALPORT=8085
    - ZITADEL_EXTERNALDOMAIN=localhost
    - ZITADEL_FIRSTINSTANCE_ORG_HUMAN_USERNAME=admin
    - ZITADEL_FIRSTINSTANCE_ORG_HUMAN_PASSWORD=Admin123!
  ports:
    - "8085:8080"
  depends_on:
    zitadel_db:
      condition: service_healthy
  networks:
    - chairman_network

zitadel_db:
  image: postgres:16-alpine
  container_name: chairman_zitadel_db
  environment:
    - POSTGRES_USER=zitadel
    - POSTGRES_PASSWORD=zitadel
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

### 环境变量

```env
# .env
ZITADEL_ISSUER=http://localhost:8085
ZITADEL_CLIENT_ID=<创建应用后获取>
ZITADEL_CLIENT_SECRET=<创建应用后获取>
JWT_SECRET_KEY=<openssl rand -base64 32>

# Open-Notebook 服务
open_notebook:
  environment:
    - AUTH_PROVIDER=zitadel
    - ZITADEL_ISSUER=http://zitadel:8080
    - ZITADEL_CLIENT_ID=${ZITADEL_CLIENT_ID}
    - ZITADEL_CLIENT_SECRET=${ZITADEL_CLIENT_SECRET}
    - JWT_SECRET_KEY=${JWT_SECRET_KEY}
```

---

## 📅 实施计划

| 阶段 | 任务 | 时间 | 交付物 |
|------|------|------|--------|
| **阶段 0** | Zitadel 部署 | 1 天 | 运行的认证服务 |
| **阶段 1** | 认证系统 | 3-4 天 | JWT 中间件、依赖注入、auth 路由 |
| **阶段 2** | 数据库迁移 | 2-3 天 | user 表、owner_id 字段、迁移脚本 |
| **阶段 3** | 基类改造 | 2 天 | ObjectModel 用户过滤 |
| **阶段 4** | API 改造 | 4-5 天 | 12 个路由文件改造 |
| **阶段 5** | 前端改造 | 2-3 天 | 登录页面、用户状态管理 |
| **阶段 6** | 测试集成 | 2 天 | E2E 测试、文档 |

**总计**：2-3 周

---

## ⚠️ 风险与应对

| 风险 | 概率 | 影响 | 应对方案 |
|------|------|------|----------|
| 数据迁移失败 | 低 | 高 | 备份数据，测试迁移脚本 |
| API 改造遗漏 | 中 | 高 | 代码审查，单元测试覆盖 |
| 认证流程复杂 | 中 | 中 | 分步实施，保留密码认证过渡期 |
| 性能下降 | 低 | 中 | 添加索引，优化查询 |
| 前后端不一致 | 中 | 中 | 统一接口规范，联调测试 |

---

## 🧪 验证检查点

### 阶段 1 完成标准
- [ ] Zitadel 登录成功返回 JWT
- [ ] JWT 中间件正确提取 user_id
- [ ] `/api/auth/me` 返回当前用户信息

### 阶段 2 完成标准
- [ ] user 表创建成功
- [ ] 所有核心表有 owner_id 字段
- [ ] 现有数据归属 admin 用户

### 阶段 3 完成标准
- [ ] `Notebook.get_all(user_id=x)` 只返回用户 x 的数据
- [ ] `Notebook.get(id, user_id=y)` 非所有者返回 403

### 阶段 4 完成标准
- [ ] 所有 12 个路由文件改造完成
- [ ] 单元测试覆盖用户隔离场景

### 阶段 5 完成标准
- [ ] 前端登录流程正常
- [ ] API 请求自动携带 token
- [ ] 401 时自动跳转登录页

---

---

## 🚀 部署策略

### 部署架构

改造后的部署架构：

```
                    ┌─────────────────┐
                    │   Nginx/Caddy   │
                    │   (反向代理)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Open-Notebook │   │   Zitadel     │   │  OpenCanvas   │
│   :8502/:5055  │   │    :8085      │   │    :8080      │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│   SurrealDB   │   │  PostgreSQL   │
│    :8000      │   │  (Zitadel)    │
└───────────────┘   └───────────────┘
```

### 首次部署流程

```bash
# 1. 备份现有数据
./scripts/backup_surreal.sh

# 2. 启动 Zitadel 服务
docker compose up -d zitadel_db zitadel
# 等待 Zitadel 初始化完成（约 2-3 分钟）

# 3. 配置 Zitadel
# 访问 http://localhost:8085，使用 admin/Admin123! 登录
# 创建项目和应用，获取 Client ID/Secret

# 4. 更新环境变量
cp .env.example .env
# 编辑 .env 添加 Zitadel 配置

# 5. 运行数据库迁移
docker exec chairman_open_notebook python -m open_notebook.database.migrate

# 6. 重启 Open-Notebook 服务
docker compose up -d open_notebook

# 7. 验证部署
curl http://localhost:5055/api/auth/status
```

### 滚动升级策略

```
阶段 1：准备期（保持兼容）
├── 部署 Zitadel，但不强制认证
├── 老用户继续使用密码登录
├── 新用户可以注册 Zitadel 账号
└── 两种认证方式并存

阶段 2：迁移期（推动迁移）
├── 通知用户创建 Zitadel 账号
├── 提供密码→账号迁移工具
├── 设置密码认证废弃日期
└── 监控迁移进度

阶段 3：切换期（完成迁移）
├── 禁用密码认证
├── 强制所有用户使用 Zitadel
├── 清理临时兼容代码
└── 发布正式版本
```

---

## 🔄 未来升级策略

### 问题：官方版本升级的挑战

改造后，我们的代码与官方 Open-Notebook 产生分叉，主要改动：

| 改动类型 | 文件数 | 合并难度 |
|---------|--------|---------|
| 认证系统 | 3 | 低（独立模块） |
| 基类 ObjectModel | 1 | 中（核心改动） |
| API 路由 | 12 | 高（每个都有改动） |
| 数据库迁移 | 1 | 低（追加迁移） |
| 前端认证 | 3 | 中（状态管理） |

### 解决方案：模块化改造 + 补丁管理

#### 方案 A：Git 分支管理（推荐）

```bash
# 维护结构
open-notebook/
├── upstream/          # 官方上游代码（只读）
├── chairman/          # 我们的改造分支
└── patches/           # 改造补丁文件
    ├── 001-auth-middleware.patch
    ├── 002-base-model-owner.patch
    ├── 003-router-user-filter.patch
    └── 004-frontend-auth.patch
```

**升级流程：**

```bash
# 1. 获取官方更新
cd thirdparty/open-notebook
git fetch upstream
git log upstream/main --oneline -10  # 查看更新内容

# 2. 创建升级分支
git checkout -b upgrade/v1.3.0 chairman/main

# 3. 合并官方更新
git merge upstream/main
# 解决冲突（主要在路由文件）

# 4. 重新应用补丁（如果需要）
git apply patches/001-auth-middleware.patch

# 5. 运行测试
pytest tests/

# 6. 合并到主分支
git checkout chairman/main
git merge upgrade/v1.3.0
```

#### 方案 B：抽象层隔离

将多用户改动封装为独立模块，减少与官方代码的耦合：

```python
# open_notebook_extensions/multiuser/__init__.py
"""
多用户扩展模块 - 与官方代码解耦
"""

from .middleware import JWTAuthMiddleware
from .dependencies import get_current_user
from .filters import apply_user_filter
from .models import User

# 在 api/main.py 中：
from open_notebook_extensions.multiuser import setup_multiuser
setup_multiuser(app)  # 一行代码启用多用户
```

**目录结构：**

```
thirdparty/open-notebook/
├── open_notebook/              # 官方代码（尽量不改）
├── open_notebook_extensions/   # 我们的扩展（独立目录）
│   └── multiuser/
│       ├── __init__.py
│       ├── middleware.py       # JWT 认证中间件
│       ├── dependencies.py     # FastAPI 依赖
│       ├── filters.py          # 数据过滤器
│       ├── models.py           # User 模型
│       └── patches/            # 必要的补丁
│           └── base_model.py   # ObjectModel 扩展
├── api/
│   └── main.py                 # 只添加一行 setup_multiuser(app)
└── migrations/
    └── 10_multiuser.surrealql  # 独立迁移文件
```

### 升级检查清单

每次官方版本升级时：

```markdown
## 升级检查清单：Open-Notebook v1.x.x → v1.y.y

### 1. 变更分析
- [ ] 查看 CHANGELOG.md
- [ ] 检查 api/routers/ 是否有新路由
- [ ] 检查 open_notebook/domain/base.py 是否有变化
- [ ] 检查数据库迁移是否有冲突

### 2. 代码合并
- [ ] 合并官方更新到 chairman 分支
- [ ] 解决冲突文件列表：
  - [ ] api/auth.py
  - [ ] open_notebook/domain/base.py
  - [ ] api/routers/*.py (如有新端点)

### 3. 功能验证
- [ ] 认证流程正常
- [ ] 数据隔离有效
- [ ] 新功能可用
- [ ] 性能无退化

### 4. 部署
- [ ] 运行新迁移
- [ ] 更新 Docker 镜像
- [ ] 滚动重启服务
```

### 长期维护建议

| 策略 | 说明 | 优先级 |
|------|------|--------|
| **最小化改动** | 只改必要文件，使用扩展而非修改 | 🔴 高 |
| **补丁文档化** | 每个改动都有对应的 .patch 文件和说明 | 🔴 高 |
| **自动化测试** | 升级后自动运行测试套件 | 🟡 中 |
| **版本锁定** | 锁定官方版本，定期评估升级 | 🟡 中 |
| **上游贡献** | 考虑将多用户功能贡献回官方 | 🟢 低 |

---

## 🔙 回滚策略

### 数据库回滚

```sql
-- migrations/10_multiuser_down.surrealql

-- 1. 移除 owner_id 字段（保留数据）
REMOVE FIELD owner_id ON notebook;
REMOVE FIELD owner_id ON source;
REMOVE FIELD owner_id ON note;
REMOVE FIELD owner_id ON chat_session;
REMOVE FIELD owner_id ON source_embedding;
REMOVE FIELD owner_id ON source_insight;

-- 2. 移除索引
REMOVE INDEX notebook_owner ON notebook;
REMOVE INDEX source_owner ON source;
-- ...

-- 3. 保留 user 表（不删除用户数据）
-- 如需完全回滚：
-- REMOVE TABLE user;
```

### 服务回滚

```bash
# 1. 切换回旧版本代码
git checkout tags/v1.0.0-single-user

# 2. 恢复旧环境变量
cp .env.backup .env
# 移除 Zitadel 相关配置

# 3. 运行回滚迁移
docker exec chairman_open_notebook python -c "
from open_notebook.database.migrate import run_down_migration
run_down_migration('10_multiuser')
"

# 4. 重启服务
docker compose up -d open_notebook

# 5. 验证回滚
curl http://localhost:5055/api/notebooks
# 应该返回所有数据（无用户过滤）
```

### 灾难恢复

```bash
# 完整数据恢复流程
# 1. 停止服务
docker compose down

# 2. 恢复 SurrealDB 数据
cp -r ./backups/surreal_20241127/ ./data/surreal/

# 3. 恢复代码版本
git checkout <recovery-commit>

# 4. 重启服务
docker compose up -d
```

---

## 📦 Docker 镜像策略

### 自定义镜像构建

```dockerfile
# Dockerfile.multiuser
FROM lfnovo/open_notebook:v1-latest-single

# 复制多用户扩展
COPY open_notebook_extensions/ /app/open_notebook_extensions/

# 复制迁移文件
COPY migrations/10_multiuser.surrealql /app/migrations/

# 安装额外依赖
RUN pip install python-jose httpx

# 设置环境变量
ENV AUTH_PROVIDER=zitadel
```

### 镜像版本管理

```yaml
# docker-compose.yml
open_notebook:
  # 开发环境：使用本地构建
  build:
    context: ./thirdparty/open-notebook
    dockerfile: Dockerfile.multiuser
  image: chairman/open-notebook:multiuser-v1.0.0

  # 生产环境：使用私有仓库镜像
  # image: registry.example.com/chairman/open-notebook:multiuser-v1.0.0
```

### 版本标签规范

```
chairman/open-notebook:multiuser-v1.0.0
                       │        │ │
                       │        │ └── 补丁版本
                       │        └──── 次版本（官方版本对应）
                       └───────────── 前缀标识多用户版本
```

---

## 🔗 参考资源

- [Zitadel Docker 部署](https://zitadel.com/docs/self-hosting/deploy/compose)
- [FastAPI OAuth2](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
- [python-jose JWT](https://python-jose.readthedocs.io/)
- [SurrealDB 行级安全](https://surrealdb.com/docs/surrealdb/security/row-level-security)
- [Git 补丁管理](https://git-scm.com/docs/git-format-patch)
