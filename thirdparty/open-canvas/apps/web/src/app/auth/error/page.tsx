"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "服务器配置错误，请联系管理员",
    AccessDenied: "访问被拒绝",
    Verification: "验证链接已过期或已使用",
    OAuthSignin: "OAuth 登录错误",
    OAuthCallback: "OAuth 回调错误",
    OAuthCreateAccount: "创建账户失败",
    EmailCreateAccount: "邮箱创建账户失败",
    Callback: "回调处理错误",
    OAuthAccountNotLinked: "该邮箱已关联其他登录方式",
    EmailSignin: "邮箱登录失败",
    CredentialsSignin: "登录凭证错误",
    SessionRequired: "需要登录才能访问",
    Default: "发生未知错误",
  };

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <main className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">登录错误</h1>
        <p className="text-gray-600 mb-4">{message}</p>
        {error && (
          <p className="text-sm text-gray-400 mb-4">错误代码: {error}</p>
        )}
        <a
          href="/auth/login"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          重新登录
        </a>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
