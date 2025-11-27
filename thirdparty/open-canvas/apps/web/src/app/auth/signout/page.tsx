"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

// Zitadel OIDC end_session endpoint for federated logout
const ZITADEL_END_SESSION_URL = "https://zitadel.aotsea.com/oidc/v1/end_session";
const ZITADEL_CLIENT_ID = process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID || "348526968934825987";

export default function Page() {
  useEffect(() => {
    const performFederatedLogout = async () => {
      // 1. Clear NextAuth session first (don't redirect)
      await signOut({ redirect: false });

      // 2. Redirect to Zitadel's end_session endpoint for federated logout
      // Note: post_logout_redirect_uri needs to be registered in Zitadel app config
      const endSessionUrl = new URL(ZITADEL_END_SESSION_URL);
      endSessionUrl.searchParams.set("client_id", ZITADEL_CLIENT_ID);

      // Set post_logout_redirect_uri to redirect back to login page after logout
      endSessionUrl.searchParams.set("post_logout_redirect_uri", `${window.location.origin}/auth/login`);

      // Redirect to Zitadel to terminate SSO session
      window.location.href = endSessionUrl.toString();
    };

    performFederatedLogout();
  }, []);

  return (
    <main className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">正在退出登录...</p>
        <p className="text-gray-400 text-sm mt-2">Signing out...</p>
      </div>
    </main>
  );
}
