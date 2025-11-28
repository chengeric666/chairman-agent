'use client'

import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { cn } from '@/lib/utils'
import type { TemplateProps } from './index'

/**
 * PaperAnalysisTemplate - 论文分析模板
 *
 * 设计特点：
 * - 学术风格的章节分隔
 * - 引用块使用特殊样式
 * - 强调数据和案例区块
 */

export function PaperAnalysisTemplate({ content }: TemplateProps) {
  return (
    <div
      className={cn(
        'paper-analysis-template',
        // 学术风格基础
        'font-serif',
      )}
      style={{
        fontFamily: '"Noto Serif SC", "Source Serif Pro", Georgia, serif',
      }}
    >
      {/* 装饰性顶部边框 */}
      <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full mb-8" />

      <MarkdownRenderer
        content={content}
        variant="article"
        className={cn(
          'paper-content',
          // 增强引用块样式
          '[&_blockquote]:border-l-4 [&_blockquote]:border-blue-400',
          '[&_blockquote]:bg-blue-50/50 [&_blockquote]:dark:bg-blue-950/30',
          '[&_blockquote]:py-3 [&_blockquote]:px-4 [&_blockquote]:rounded-r-lg',
          // 表格标题强调
          '[&_table_th]:bg-blue-50 [&_table_th]:dark:bg-blue-950/50',
          // 章节标题样式
          '[&_h2]:border-b [&_h2]:border-blue-200 [&_h2]:dark:border-blue-900',
          '[&_h2]:pb-2 [&_h2]:mb-4',
          // 数字序号强调
          '[&_strong]:text-blue-700 [&_strong]:dark:text-blue-400',
        )}
      />

      {/* 底部装饰 */}
      <div className="mt-12 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400/50" />
        <div className="w-16 h-px bg-blue-300/50" />
        <div className="w-2 h-2 rounded-full bg-blue-400/50" />
      </div>
    </div>
  )
}
