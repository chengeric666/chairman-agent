# NextAuth + Zitadel OIDC 认证集成方案

**创建日期**: 2025-11-27
**任务**: 将 OpenCanvas 从 Supabase stub（Mock 模式）迁移到 NextAuth + Zitadel OIDC

**Zitadel 配置**:
- Provider URL: `https://zitadel.aotsea.com/`
- Client ID: `348526968934825987`
- Client Secret: `[已配置]`
- 回调 URL: `http://localhost:8080/api/auth/callback/zitadel`

---

## 一、实施步骤

### 步骤 1: 安装依赖

```bash
cd /Users/batfic887/Documents/project/chairman-agent/thirdparty/open-canvas/apps/web
npm install next-auth@beta
```

### 步骤 2: 创建 NextAuth 配置

**新建文件**: `apps/web/src/lib/auth/config.ts`

```typescript
import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "zitadel",
      name: "Zitadel",
      type: "oidc",
      issuer: process.env.ZITADEL_ISSUER!,
      clientId: process.env.ZITADEL_CLIENT_ID!,
      clientSecret: process.env.ZITADEL_CLIENT_SECRET!,
      authorization: { params: { scope: "openid profile email" } },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.id = profile.sub;
        token.email = profile.email as string;
        token.name = profile.name as string || profile.preferred_username as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/auth");
      const isApiRoute = nextUrl.pathname.startsWith("/api");
      if (isAuthPage || isApiRoute) return true;
      if (!isLoggedIn) return false;
      return true;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: { strategy: "jwt" },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

**新建文件**: `apps/web/src/lib/auth/types.ts`

```typescript
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}
```

### 步骤 3: 创建 NextAuth API 路由

**新建文件**: `apps/web/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth/config";
export const { GET, POST } = handlers;
```

### 步骤 4: 修改 middleware.ts

**文件**: `apps/web/src/middleware.ts`

```typescript
import { auth } from "@/lib/auth/config";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const publicRoutes = ["/auth/login", "/auth/error", "/api/auth"];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isStaticAsset = pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/);

  if (isPublicRoute || isStaticAsset) return;

  if (!isLoggedIn) {
    return Response.redirect(new URL("/auth/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### 步骤 5: 适配 Supabase 兼容层

**修改文件**: `apps/web/src/lib/supabase/client.ts`

```typescript
import { getSession } from "next-auth/react";

export interface User {
  id: string;
  email: string;
  aud: string;
  role: string;
  created_at: string;
  updated_at: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
}

function sessionToUser(session: any): User | null {
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email || "",
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: { name: session.user.name || "User" },
  };
}

export function createSupabaseClient() {
  return {
    auth: {
      getUser: async () => {
        const session = await getSession();
        return { data: { user: sessionToUser(session) }, error: null };
      },
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    },
  };
}
```

**修改文件**: `apps/web/src/lib/supabase/verify_user_server.ts`

```typescript
import { auth } from "@/lib/auth/config";

export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  aud: string;
  role: string;
  created_at: string;
  updated_at: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
}

export async function verifyUserAuthenticated(): Promise<{ session: Session; user: User } | null> {
  const nextAuthSession = await auth();
  if (!nextAuthSession?.user) return null;

  const user: User = {
    id: nextAuthSession.user.id,
    email: nextAuthSession.user.email || "",
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: { name: nextAuthSession.user.name || "User" },
  };

  const session: Session = {
    access_token: "nextauth-session",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "nextauth-refresh",
    user,
  };

  return { session, user };
}
```

### 步骤 6: 修改 UserContext.tsx

**文件**: `apps/web/src/contexts/UserContext.tsx`

```typescript
"use client";

import { useSession } from "next-auth/react";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export interface User {
  id: string;
  email: string;
  aud: string;
  role: string;
  created_at: string;
  updated_at: string;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
}

type UserContentType = {
  getUser: () => Promise<User | undefined>;
  user: User | undefined;
  loading: boolean;
};

const UserContext = createContext<UserContentType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | undefined>();

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email || "",
        aud: "authenticated",
        role: "authenticated",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { name: session.user.name || "User" },
      });
    } else {
      setUser(undefined);
    }
  }, [session]);

  return (
    <UserContext.Provider value={{ getUser: async () => user, user, loading: status === "loading" }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserContext must be used within UserProvider");
  return context;
}
```

### 步骤 7: 修改登录页面（直接跳转 Zitadel）

**文件**: `apps/web/src/app/auth/login/page.tsx`

```typescript
"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    signIn("zitadel", { callbackUrl: "/" });
  }, []);

  return (
    <main className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
        <p>正在跳转到登录页面...</p>
      </div>
    </main>
  );
}
```

### 步骤 8: 添加 SessionProvider

**修改文件**: `apps/web/src/app/page.tsx` - 在最外层包裹 `<SessionProvider>`

### 步骤 9: 配置环境变量

**文件**: `apps/web/.env.local`

```env
# NextAuth
NEXTAUTH_URL=http://localhost:8080
NEXTAUTH_SECRET=<生成的随机密钥>

# Zitadel OIDC
ZITADEL_ISSUER=https://zitadel.aotsea.com/
ZITADEL_CLIENT_ID=348526968934825987
ZITADEL_CLIENT_SECRET=<已配置>
```

---

## 二、文件修改清单

| 操作 | 文件 |
|------|------|
| 新建 | `apps/web/src/lib/auth/config.ts` |
| 新建 | `apps/web/src/lib/auth/types.ts` |
| 新建 | `apps/web/src/app/api/auth/[...nextauth]/route.ts` |
| 修改 | `apps/web/src/lib/supabase/client.ts` |
| 修改 | `apps/web/src/lib/supabase/verify_user_server.ts` |
| 修改 | `apps/web/src/middleware.ts` |
| 修改 | `apps/web/src/contexts/UserContext.tsx` |
| 修改 | `apps/web/src/app/auth/login/page.tsx` |
| 修改 | `apps/web/src/app/page.tsx` |
| 修改 | `apps/web/.env.local` |

---

## 三、后端兼容性

后端代码依赖 `config.configurable.supabase_user_id`，无需修改。

API 代理会自动将 NextAuth 的 `user.id` 注入为 `supabase_user_id`。

---

## 四、回滚策略

设置环境变量 `AUTH_MOCK_MODE=true` 可回退到 Mock 模式。

---

## 五、账号集成的深度意义分析

### 5.1 OpenCanvas 的多用户数据隔离架构

```
┌─────────────────────────────────────────────────────────────┐
│                    三层数据隔离架构                          │
├─────────────────────────────────────────────────────────────┤
│ 第一层：用户认证层                                           │
│ └─ supabase_user_id (UUID) → 每个用户唯一标识               │
│                                                              │
│ 第二层：数据存储层 (LangGraph Store)                        │
│ ├─ Assistants: metadata.user_id = userId                    │
│ ├─ Threads: metadata.supabase_user_id = userId              │
│ ├─ Custom Actions: ["custom_actions", userId]               │
│ └─ Memories: ["memories", assistantId]                      │
│                                                              │
│ 第三层：图执行层                                             │
│ └─ config.configurable.supabase_user_id 传递到后端          │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 当前 Mock 模式的严重问题

**所有用户共享同一个 ID**: `local-user-00000000-0000-0000-0000-000000000000`

| 数据类型 | 问题 |
|---------|------|
| **Assistants** | 所有用户看到同一个 Assistant 列表 |
| **Threads** | 不同用户访问同一个线程历史 |
| **Custom Actions** | 快速操作被所有用户共享 |
| **Memories** | AI 的 Reflections 在不同对话中串扰 |

### 5.3 启用 Zitadel 认证后的效果

| 隔离维度 | Mock 模式 | Zitadel 认证后 |
|---------|----------|---------------|
| 用户身份 | 单一共享 | 每用户唯一 UUID |
| Assistant | ❌ 共享 | ✅ 完全隔离 |
| Thread 历史 | ❌ 共享 | ✅ 完全隔离 |
| Custom Actions | ❌ 共享 | ✅ 完全隔离 |
| Memories | ❌ 共享 | ✅ 完全隔离 |

### 5.4 商业价值

1. **多租户 SaaS**：支持多用户独立使用，数据完全隔离
2. **企业部署**：员工各自拥有独立的 AI 助手和对话历史
3. **审计追溯**：每个操作可追溯到具体用户
4. **安全合规**：满足数据隔离的合规要求

---

**维护者**: Claude Code
**最后更新**: 2025-11-27
