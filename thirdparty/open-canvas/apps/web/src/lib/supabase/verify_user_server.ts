// NextAuth 服务端验证 - 替换原 Supabase 认证
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
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

/**
 * 验证用户认证（服务端）
 * 使用 NextAuth 获取当前会话
 */
export async function verifyUserAuthenticated(): Promise<{
  session: Session;
  user: User;
} | null> {
  const nextAuthSession = await auth();

  if (!nextAuthSession?.user) {
    return null;
  }

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
