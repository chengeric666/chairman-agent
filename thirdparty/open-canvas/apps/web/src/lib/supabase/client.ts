// NextAuth 兼容层 - 替换原 Supabase client
// 保持 API 兼容性，内部使用 NextAuth

import { getSession } from "next-auth/react";

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

// 将 NextAuth session 转换为 Supabase 兼容的 User 格式
function sessionToUser(session: unknown): User | null {
  const s = session as { user?: { id?: string; email?: string; name?: string } };
  if (!s?.user) return null;

  return {
    id: s.user.id || "",
    email: s.user.email || "",
    aud: "authenticated",
    role: "authenticated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: { name: s.user.name || "User" },
  };
}

// Mock Supabase client 使用 NextAuth session
export function createSupabaseClient() {
  return {
    auth: {
      getUser: async (): Promise<{ data: { user: User | null }; error: null }> => {
        const session = await getSession();
        return {
          data: { user: sessionToUser(session) },
          error: null,
        };
      },
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: null,
      }),
    },
  };
}
