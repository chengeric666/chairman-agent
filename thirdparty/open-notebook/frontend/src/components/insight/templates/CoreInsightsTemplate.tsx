'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import { Lightbulb } from 'lucide-react'
import type { TemplateProps } from './index'

/**
 * CoreInsightsTemplate - 核心洞见模板
 *
 * 设计特点：
 * - 卡片式布局
 * - 编号徽章
 * - 每条洞见独立突出
 */

interface InsightCard {
  number: number
  title: string
  content: string
}

// 解析洞见内容为卡片
function parseInsights(content: string): InsightCard[] {
  const cards: InsightCard[] = []
  // 匹配 "### 洞见 N: 标题" 格式
  // 使用 [\s\S] 替代 . 来匹配换行符（避免使用 ES2018 的 s 标志）
  const insightRegex = /###\s*洞见\s*(\d+)[：:]\s*([\s\S]+?)(?=###\s*洞见|\n## |$)/g

  let match
  while ((match = insightRegex.exec(content)) !== null) {
    cards.push({
      number: parseInt(match[1], 10),
      title: match[2].split('\n')[0].trim(),
      content: match[2].trim(),
    })
  }

  return cards
}

export function CoreInsightsTemplate({ content }: TemplateProps) {
  const insights = useMemo(() => parseInsights(content), [content])

  // 如果无法解析为卡片，回退到默认渲染
  if (insights.length === 0) {
    return (
      <div className="core-insights-template">
        <MarkdownRenderer content={content} variant="article" />
      </div>
    )
  }

  return (
    <div className="core-insights-template space-y-8 max-w-6xl">
      {/* 洞见卡片网格 */}
      <div className="grid gap-6">
        {insights.map((insight, index) => (
          <div
            key={insight.number}
            className={cn(
              'insight-card group',
              'relative p-6 rounded-2xl',
              'bg-gradient-to-br from-amber-50/80 to-orange-50/50',
              'dark:from-amber-950/30 dark:to-orange-950/20',
              'border border-amber-200/60 dark:border-amber-900/40',
              'transition-all duration-300',
              'hover:shadow-lg hover:shadow-amber-500/10',
              'hover:-translate-y-0.5'
            )}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            {/* 编号徽章 */}
            <div
              className={cn(
                'absolute -top-3 -left-3',
                'w-10 h-10 rounded-xl',
                'bg-gradient-to-br from-amber-400 to-orange-500',
                'flex items-center justify-center',
                'text-white font-bold text-lg',
                'shadow-lg shadow-amber-500/30',
                'group-hover:scale-110 transition-transform'
              )}
            >
              {insight.number}
            </div>

            {/* 灯泡图标 */}
            <Lightbulb
              className={cn(
                'absolute top-4 right-4',
                'w-5 h-5 text-amber-400/50',
                'group-hover:text-amber-500 transition-colors'
              )}
            />

            {/* 卡片内容 */}
            <div className="pl-4 pt-2">
              <MarkdownRenderer
                content={insight.content}
                variant="compact"
                className={cn(
                  '[&_strong]:text-amber-700 [&_strong]:dark:text-amber-400',
                  '[&_h4]:text-amber-800 [&_h4]:dark:text-amber-300',
                  '[&_h4]:font-semibold [&_h4]:text-lg [&_h4]:mb-2'
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
