'use client'

import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import type { TemplateProps } from './index'

/**
 * DefaultTemplate - 默认洞察模板
 *
 * 通用布局，适用于未知类型的洞察
 * 使用 MarkdownRenderer 的 article 变体
 */

export function DefaultTemplate({ content }: TemplateProps) {
  return (
    <div className="default-template">
      <MarkdownRenderer
        content={content}
        variant="article"
        className="insight-content"
      />
    </div>
  )
}
