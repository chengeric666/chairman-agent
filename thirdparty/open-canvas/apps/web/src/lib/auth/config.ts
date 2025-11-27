import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  debug: process.env.NODE_ENV === "development",
  providers: [
    {
      id: "zitadel",
      name: "Zitadel",
      type: "oidc",
      issuer: process.env.ZITADEL_ISSUER,
      clientId: process.env.ZITADEL_CLIENT_ID!,
      clientSecret: process.env.ZITADEL_CLIENT_SECRET!,
      authorization: { params: { scope: "openid profile email" } },
      // Zitadel 返回的 profile 字段映射
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username || profile.email,
          email: profile.email,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log("[NextAuth] JWT callback - profile:", JSON.stringify(profile, null, 2));
      if (account && profile) {
        token.id = profile.sub || token.sub;
        token.email = (profile.email as string) || token.email;
        token.name =
          (profile.name as string) ||
          (profile.preferred_username as string) ||
          (profile.email as string) ||
          "User";
      }
      return token;
    },
    async session({ session, token }) {
      console.log("[NextAuth] Session callback - token:", JSON.stringify(token, null, 2));
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string) || "";
        session.user.email = (token.email as string) || "";
        session.user.name = (token.name as string) || "User";
      }
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
