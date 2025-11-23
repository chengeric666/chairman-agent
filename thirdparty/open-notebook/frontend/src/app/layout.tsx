import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { ConnectionGuard } from "@/components/common/ConnectionGuard";
import { themeScript } from "@/lib/theme-script";

export const metadata: Metadata = {
  title: "董智 - 智能知识管理平台",
  description: "图灵环流科技 - 专注隐私的研究与知识管理系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            font-family: ${inter.style.fontFamily}, 'Noto Sans SC', 'Microsoft YaHei', 'SimHei', sans-serif;
          }
        ` }} />
      </head>
      <body>
        <ErrorBoundary>
          <ThemeProvider>
            <QueryProvider>
              <ConnectionGuard>
                {children}
                <Toaster />
              </ConnectionGuard>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
