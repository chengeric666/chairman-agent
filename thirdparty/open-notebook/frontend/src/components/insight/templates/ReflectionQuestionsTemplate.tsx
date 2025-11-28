'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/common/MarkdownRenderer'
import {
  HelpCircle,
  ChevronDown,
  Brain,
  Rocket,
  AlertTriangle,
  Compass,
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { TemplateProps } from './index'

/**
 * ReflectionQuestionsTemplate - 反思问题模板
 *
 * 设计特点：
 * - 分类分组（理解型、应用型、批判型、延伸型）
 * - 问号图标装饰
 * - 思考提示可折叠
 */

interface Question {
  category: string
  title: string
  content: string
  hints: string[]
}

interface QuestionCategory {
  id: string
  name: string
  icon: typeof HelpCircle
  color: string
  questions: Question[]
}

// 解析问题
function parseQuestions(content: string): QuestionCategory[] {
  const categories: QuestionCategory[] = []

  const categoryConfigs = [
    { pattern: /###?\s*一、理解型问题([\s\S]*?)(?=###?\s*[二三四]、|## |$)/i, name: '理解型问题', icon: Brain, color: 'purple' },
    { pattern: /###?\s*二、应用型问题([\s\S]*?)(?=###?\s*[三四]、|## |$)/i, name: '应用型问题', icon: Rocket, color: 'blue' },
    { pattern: /###?\s*三、批判型问题([\s\S]*?)(?=###?\s*四、|## |$)/i, name: '批判型问题', icon: AlertTriangle, color: 'amber' },
    { pattern: /###?\s*四、延伸型问题([\s\S]*?)(?=## |$)/i, name: '延伸型问题', icon: Compass, color: 'emerald' },
  ]

  categoryConfigs.forEach((config, index) => {
    const match = content.match(config.pattern)
    if (match && match[1].trim()) {
      // 解析该分类下的问题
      const categoryContent = match[1]
      const questionRegex = /\*\*问题\s*\d+[：:]\s*(.+?)\*\*([\s\S]*?)(?=\*\*问题|\n---|\n###|$)/gi
      const questions: Question[] = []

      let qMatch
      while ((qMatch = questionRegex.exec(categoryContent)) !== null) {
        const title = qMatch[1].trim()
        const questionContent = qMatch[2].trim()

        // 提取思考提示
        const hintsMatch = questionContent.match(/>\s*\*\*思考提示\*\*[：:]\s*(.+)/gi)
        const hints = hintsMatch
          ? hintsMatch.map(h => h.replace(/>\s*\*\*思考提示\*\*[：:]\s*/i, '').trim())
          : []

        questions.push({
          category: config.name,
          title,
          content: questionContent,
          hints,
        })
      }

      if (questions.length > 0) {
        categories.push({
          id: `cat-${index}`,
          name: config.name,
          icon: config.icon,
          color: config.color,
          questions,
        })
      }
    }
  })

  return categories
}

export function ReflectionQuestionsTemplate({ content }: TemplateProps) {
  const categories = useMemo(() => parseQuestions(content), [content])
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  // 如果无法解析，回退到默认渲染
  if (categories.length === 0) {
    return (
      <div className="reflection-questions-template">
        <MarkdownRenderer content={content} variant="article" />
      </div>
    )
  }

  const toggleQuestion = (id: string) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedQuestions(newExpanded)
  }

  const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200 dark:border-purple-900',
      text: 'text-purple-700 dark:text-purple-400',
      icon: 'text-purple-500',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-900',
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-500',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-900',
      text: 'text-amber-700 dark:text-amber-400',
      icon: 'text-amber-500',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-900',
      text: 'text-emerald-700 dark:text-emerald-400',
      icon: 'text-emerald-500',
    },
  }

  return (
    <div className="reflection-questions-template space-y-8 max-w-6xl">
      {categories.map((category) => {
        const Icon = category.icon
        const colors = colorMap[category.color] || colorMap.purple

        return (
          <div key={category.id} className="category-section">
            {/* 分类标题 */}
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('p-2 rounded-lg', colors.bg)}>
                <Icon className={cn('w-5 h-5', colors.icon)} />
              </div>
              <h3 className={cn('text-lg font-semibold', colors.text)}>
                {category.name}
              </h3>
              <span className="text-sm text-stone-500">
                ({category.questions.length} 个问题)
              </span>
            </div>

            {/* 问题列表 */}
            <div className="space-y-3 pl-2">
              {category.questions.map((question, qIndex) => {
                const questionId = `${category.id}-q${qIndex}`
                const isExpanded = expandedQuestions.has(questionId)

                return (
                  <Collapsible
                    key={questionId}
                    open={isExpanded}
                    onOpenChange={() => toggleQuestion(questionId)}
                  >
                    <div
                      className={cn(
                        'rounded-xl border',
                        colors.border,
                        'transition-all duration-200',
                        isExpanded && 'shadow-sm'
                      )}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div
                          className={cn(
                            'flex items-start gap-3 p-4',
                            'hover:bg-stone-50 dark:hover:bg-stone-900/50',
                            'rounded-t-xl transition-colors'
                          )}
                        >
                          <HelpCircle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', colors.icon)} />
                          <span className="text-left font-medium text-stone-800 dark:text-stone-200">
                            {question.title}
                          </span>
                          <ChevronDown
                            className={cn(
                              'w-5 h-5 ml-auto flex-shrink-0 text-stone-400',
                              'transition-transform duration-200',
                              isExpanded && 'rotate-180'
                            )}
                          />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className={cn('px-4 pb-4 pt-0', colors.bg, 'rounded-b-xl')}>
                          <MarkdownRenderer
                            content={question.content}
                            variant="compact"
                            className="text-sm"
                          />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
