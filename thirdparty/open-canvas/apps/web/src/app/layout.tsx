import type { Metadata } from "next";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";

// 使用系统字体代替Google Fonts，避免网络依赖
// 字体栈参考Open-Notebook配置，使用系统原生字体
export const metadata: Metadata = {
  title: "董智 - 创作助手与深度分析平台",
  description: "董智：结合创作协助、深度分析和知识库的智能助手平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-screen">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', 'Microsoft YaHei', 'SimHei', sans-serif;
          }
        ` }} />
      </head>
      <body className="min-h-full">
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
