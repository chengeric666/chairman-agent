'use client'

import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { BookMarked, Star } from 'lucide-react'
import type { TemplateProps } from './index'

// 生成标题的 anchor id（与 MarkdownRenderer 保持一致）
function generateHeadingId(children: React.ReactNode): string {
  const text = String(children)
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * ContentCatalogTemplate - 内容目录模板
 *
 * 设计特点：
 * - 表格形式的章节概览
 * - 树形目录结构
 * - 星级重要性标记
 * - 缩进连接线
 */

export function ContentCatalogTemplate({ content }: TemplateProps) {
  return (
    <div className="content-catalog-template space-y-6">
      {/* 内容渲染 - 使用自定义样式（标题区域已由 InsightHeader 处理） */}
      <MarkdownRenderer
        content={content}
        variant="article"
        className={cn(
          'catalog-content',
          // 表格样式增强
          '[&_table]:w-full',
          '[&_table_th]:bg-slate-100 [&_table_th]:dark:bg-slate-900',
          '[&_table_th]:text-slate-700 [&_table_th]:dark:text-slate-300',
          '[&_table_th]:font-semibold [&_table_th]:py-3',
          '[&_table_td]:py-3',
          '[&_table_tr]:border-b [&_table_tr]:border-slate-100 [&_table_tr]:dark:border-slate-800',
          // 列表样式 - 树形目录效果
          '[&_ul]:relative [&_ul]:pl-0',
          '[&_ul_li]:relative [&_ul_li]:pl-6',
          '[&_ul_li]:before:absolute [&_ul_li]:before:left-0 [&_ul_li]:before:top-3',
          '[&_ul_li]:before:w-4 [&_ul_li]:before:h-px',
          '[&_ul_li]:before:bg-slate-300 [&_ul_li]:before:dark:bg-slate-700',
          // 章节标题
          '[&_h3]:text-slate-800 [&_h3]:dark:text-slate-200',
          '[&_h3]:font-semibold [&_h3]:flex [&_h3]:items-center [&_h3]:gap-2',
          // 强调文字
          '[&_strong]:text-slate-700 [&_strong]:dark:text-slate-300',
        )}
        components={{
          // 自定义标题渲染，添加书签图标和 id（支持 TOC 跳转）
          h2: ({ children }) => (
            <h2 id={generateHeadingId(children)} className="text-xl font-semibold mt-6 mb-3 text-slate-800 dark:text-slate-200 scroll-mt-20">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 id={generateHeadingId(children)} className="flex items-center gap-2 text-lg font-semibold mt-6 mb-3 text-slate-800 dark:text-slate-200 scroll-mt-20">
              <BookMarked className="w-4 h-4 text-slate-500" />
              {children}
            </h3>
          ),
          // 自定义列表项，可能包含重要性标记
          li: ({ children }) => {
            // 检查是否包含重要性关键词
            const text = String(children)
            const isImportant = text.includes('重点') || text.includes('关键') || text.includes('核心')

            return (
              <li className="relative pl-6 py-1">
                {/* 连接线 */}
                <span className="absolute left-0 top-3 w-4 h-px bg-slate-300 dark:bg-slate-700" />
                {/* 节点 */}
                <span
                  className={cn(
                    'absolute left-4 top-2.5 w-2 h-2 rounded-full',
                    isImportant
                      ? 'bg-amber-400'
                      : 'bg-slate-400 dark:bg-slate-600'
                  )}
                />
                <span className="pl-4">{children}</span>
                {isImportant && (
                  <Star className="inline-block w-3 h-3 ml-1 text-amber-500 fill-amber-500" />
                )}
              </li>
            )
          },
        }}
      />
    </div>
  )
}
