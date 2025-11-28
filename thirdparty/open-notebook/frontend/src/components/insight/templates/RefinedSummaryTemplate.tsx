'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { BookOpen, Target, Layers, CheckCircle2, Users } from 'lucide-react'
import type { TemplateProps } from './index'

/**
 * RefinedSummaryTemplate - 精炼摘要模板
 *
 * 设计特点：
 * - Tab 导航切换各部分
 * - 概述大字号突出
 * - 5 部分标签切换
 */

interface SummarySection {
  id: string
  title: string
  icon: typeof BookOpen
  content: string
}

// 解析摘要各部分
function parseSections(content: string): {
  overview: string
  sections: SummarySection[]
} {
  // 提取一句话概述
  const overviewMatch = content.match(/##\s*一句话概述[^#]*?([^\n#]+)/i)
  const overview = overviewMatch ? overviewMatch[1].trim() : ''

  const sections: SummarySection[] = []
  const sectionConfigs = [
    { pattern: /###?\s*背景与问题([\s\S]*?)(?=###|\n## |$)/i, title: '背景与问题', icon: Target },
    { pattern: /###?\s*主要论点([\s\S]*?)(?=###|\n## |$)/i, title: '主要论点', icon: Layers },
    { pattern: /###?\s*关键框架([\s\S]*?)(?=###|\n## |$)/i, title: '关键框架', icon: Layers },
    { pattern: /###?\s*重要结论([\s\S]*?)(?=###|\n## |$)/i, title: '重要结论', icon: CheckCircle2 },
    { pattern: /##\s*适用场景([\s\S]*?)(?=##|$)/i, title: '适用场景', icon: Users },
  ]

  sectionConfigs.forEach((config, index) => {
    const match = content.match(config.pattern)
    if (match && match[1].trim()) {
      sections.push({
        id: `section-${index}`,
        title: config.title,
        icon: config.icon,
        content: match[1].trim(),
      })
    }
  })

  return { overview, sections }
}

export function RefinedSummaryTemplate({ content }: TemplateProps) {
  const { overview, sections } = useMemo(() => parseSections(content), [content])
  const [activeTab, setActiveTab] = useState(sections[0]?.id || '')

  // 如果无法解析，回退到默认渲染
  if (sections.length === 0) {
    return (
      <div className="refined-summary-template">
        <MarkdownRenderer content={content} variant="article" />
      </div>
    )
  }

  const activeSection = sections.find(s => s.id === activeTab) || sections[0]

  return (
    <div className="refined-summary-template space-y-8 max-w-6xl">
      {/* 概述大字号 */}
      {overview && (
        <div
          className={cn(
            'p-8 rounded-2xl',
            'bg-gradient-to-br from-emerald-50 to-teal-50/50',
            'dark:from-emerald-950/40 dark:to-teal-950/30',
            'border border-emerald-200/60 dark:border-emerald-900/40'
          )}
        >
          <div className="flex items-start gap-4">
            <BookOpen className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-1" />
            <p
              className={cn(
                'text-xl lg:text-2xl font-medium leading-relaxed',
                'text-emerald-900 dark:text-emerald-100'
              )}
              style={{
                fontFamily: '"Noto Serif SC", Georgia, serif',
              }}
            >
              {overview}
            </p>
          </div>
        </div>
      )}

      {/* Tab 导航 */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = section.id === activeTab

          return (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-t-lg',
                'text-sm font-medium transition-all',
                isActive
                  ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {section.title}
            </button>
          )
        })}
      </div>

      {/* 内容区 */}
      <div
        className={cn(
          'p-6 rounded-xl',
          'bg-white/50 dark:bg-stone-900/30',
          'border border-stone-200/60 dark:border-stone-800/60'
        )}
      >
        <MarkdownRenderer
          content={activeSection.content}
          variant="article"
          className={cn(
            '[&_strong]:text-emerald-700 [&_strong]:dark:text-emerald-400',
            '[&_table_th]:bg-emerald-50 [&_table_th]:dark:bg-emerald-950/50'
          )}
        />
      </div>
    </div>
  )
}
