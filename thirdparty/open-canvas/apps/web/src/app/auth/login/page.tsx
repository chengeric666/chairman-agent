"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    // 直接跳转到 Zitadel 登录
    signIn("zitadel", { callbackUrl: "/" });
  }, []);

  return (
    <main className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">正在跳转到登录页面...</p>
        <p className="text-gray-400 text-sm mt-2">Redirecting to Zitadel...</p>
      </div>
    </main>
  );
}
