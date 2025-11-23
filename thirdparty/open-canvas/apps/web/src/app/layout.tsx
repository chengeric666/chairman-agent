import type { Metadata } from "next";
import "./globals.css";
import { Inter, Noto_Sans_SC } from "next/font/google";
import { cn } from "@/lib/utils";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const inter = Inter({
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin", "chinese-simplified"],
  weight: ["400", "500", "600", "700"],
});

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
      <body className={cn("min-h-full", notoSansSC.className)}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
