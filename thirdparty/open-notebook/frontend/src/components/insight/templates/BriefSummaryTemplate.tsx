'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import {
  Sparkles,
  Target,
  Zap,
  BarChart3,
  CheckSquare,
  Quote,
} from 'lucide-react'
import type { TemplateProps } from './index'

/**
 * BriefSummaryTemplate - 简明摘要模板
 *
 * 设计特点：
 * - 紧凑双列布局
 * - 速览高亮卡片
 * - 数据表格突出
 * - 行动要点清单
 */

interface SummaryPart {
  id: string
  title: string
  icon: typeof Sparkles
  content: string
  highlight?: boolean
}

// 解析摘要各部分
function parseSummaryParts(content: string): SummaryPart[] {
  const parts: SummaryPart[] = []

  const partConfigs = [
    { pattern: /##\s*文档速览([\s\S]*?)(?=##|$)/i, title: '文档速览', icon: Sparkles, highlight: true },
    { pattern: /##\s*核心要点([\s\S]*?)(?=##|$)/i, title: '核心要点', icon: Target },
    { pattern: /###?\s*关键发现([\s\S]*?)(?=###|##|$)/i, title: '关键发现', icon: Zap },
    { pattern: /##\s*关键数据([\s\S]*?)(?=##|$)/i, title: '关键数据', icon: BarChart3 },
    { pattern: /##\s*行动要点([\s\S]*?)(?=##|$)/i, title: '行动要点', icon: CheckSquare },
    { pattern: /##\s*一句话总结([\s\S]*?)(?=##|$)/i, title: '一句话总结', icon: Quote, highlight: true },
  ]

  partConfigs.forEach((config, index) => {
    const match = content.match(config.pattern)
    if (match && match[1].trim()) {
      parts.push({
        id: `part-${index}`,
        title: config.title,
        icon: config.icon,
        content: match[1].trim(),
        highlight: config.highlight,
      })
    }
  })

  return parts
}

export function BriefSummaryTemplate({ content }: TemplateProps) {
  const parts = useMemo(() => parseSummaryParts(content), [content])

  // 如果无法解析，回退到默认渲染
  if (parts.length === 0) {
    return (
      <div className="brief-summary-template">
        <MarkdownRenderer content={content} variant="article" />
      </div>
    )
  }

  // 分离高亮部分和普通部分
  const highlightParts = parts.filter(p => p.highlight)
  const regularParts = parts.filter(p => !p.highlight)

  return (
    <div className="brief-summary-template space-y-8 max-w-6xl">
      {/* 高亮区域 - 速览和总结 */}
      {highlightParts.length > 0 && (
        <div className="space-y-4">
          {highlightParts.map((part) => {
            const Icon = part.icon
            return (
              <div
                key={part.id}
                className={cn(
                  'p-6 rounded-2xl',
                  'bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50',
                  'dark:from-rose-950/40 dark:via-pink-950/30 dark:to-rose-950/40',
                  'border border-rose-200/60 dark:border-rose-900/40'
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-6 h-6 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400 mb-2">
                      {part.title}
                    </h4>
                    <p
                      className={cn(
                        part.title === '一句话总结'
                          ? 'text-lg font-medium text-rose-900 dark:text-rose-100'
                          : 'text-rose-800 dark:text-rose-200'
                      )}
                      style={{
                        fontFamily: part.title === '一句话总结'
                          ? '"Noto Serif SC", Georgia, serif'
                          : 'inherit',
                      }}
                    >
                      {part.content.replace(/^[^\n]+\n/, '').trim() || part.content}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 双列网格布局 */}
      <div className="grid md:grid-cols-2 gap-4">
        {regularParts.map((part) => {
          const Icon = part.icon
          return (
            <div
              key={part.id}
              className={cn(
                'p-5 rounded-xl',
                'bg-white dark:bg-stone-900/50',
                'border border-stone-200/80 dark:border-stone-800/60',
                'hover:shadow-md transition-shadow'
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-rose-500" />
                <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  {part.title}
                </h4>
              </div>
              <MarkdownRenderer
                content={part.content}
                variant="compact"
                className={cn(
                  'text-sm',
                  '[&_strong]:text-rose-700 [&_strong]:dark:text-rose-400',
                  '[&_table]:text-xs',
                  '[&_table_th]:py-2 [&_table_th]:px-3',
                  '[&_table_td]:py-2 [&_table_td]:px-3',
                  '[&_li]:py-0.5',
                )}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
