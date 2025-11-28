'use client'

import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  FileText,
  Lightbulb,
  BookOpen,
  HelpCircle,
  List,
  Sparkles,
} from 'lucide-react'

/**
 * InsightHeader - 洞察文章头部
 *
 * 设计：Editorial Magazine 风格
 * - 类型专属图标和配色
 * - 优雅的排版
 * - 元信息展示
 */

interface InsightHeaderProps {
  insightType: string
  sourceTitle?: string
  created?: string
  className?: string
  /** 是否隐藏类型徽章（当左侧有 TOC 时隐藏，避免重复） */
  hideTypeBadge?: boolean
}

// 类型配置：图标、颜色、中文名称
const TYPE_CONFIG: Record<string, {
  icon: typeof FileText
  color: string
  bgColor: string
  borderColor: string
  label: string
}> = {
  '论文分析': {
    icon: FileText,
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    borderColor: 'border-blue-200 dark:border-blue-900',
    label: '论文分析',
  },
  '核心洞见': {
    icon: Lightbulb,
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    borderColor: 'border-amber-200 dark:border-amber-900',
    label: '核心洞见',
  },
  '精炼摘要': {
    icon: BookOpen,
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    borderColor: 'border-emerald-200 dark:border-emerald-900',
    label: '精炼摘要',
  },
  '反思问题': {
    icon: HelpCircle,
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/50',
    borderColor: 'border-purple-200 dark:border-purple-900',
    label: '反思问题',
  },
  '内容目录': {
    icon: List,
    color: 'text-slate-700 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-950/50',
    borderColor: 'border-slate-200 dark:border-slate-800',
    label: '内容目录',
  },
  '简明摘要': {
    icon: Sparkles,
    color: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/50',
    borderColor: 'border-rose-200 dark:border-rose-900',
    label: '简明摘要',
  },
}

// 默认配置
const DEFAULT_CONFIG = {
  icon: Sparkles,
  color: 'text-stone-700 dark:text-stone-400',
  bgColor: 'bg-stone-50 dark:bg-stone-950/50',
  borderColor: 'border-stone-200 dark:border-stone-800',
  label: '洞察',
}

export function InsightHeader({
  insightType,
  sourceTitle,
  created,
  className,
  hideTypeBadge = false,
}: InsightHeaderProps) {
  const config = TYPE_CONFIG[insightType] || DEFAULT_CONFIG
  const Icon = config.icon

  return (
    <header className={cn('space-y-6', className)}>
      {/* 类型徽章 - 当有左侧 TOC 时隐藏 */}
      {!hideTypeBadge && (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full',
              'border-2 font-medium text-sm tracking-wide',
              'transition-all duration-300 hover:scale-105',
              config.bgColor,
              config.borderColor,
              config.color
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="uppercase">{config.label}</span>
          </div>
        </div>
      )}

      {/* 来源标题 */}
      {sourceTitle && (
        <div className="relative">
          {/* 装饰线 */}
          <div className="absolute -left-6 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-stone-300 via-stone-400 to-stone-300 dark:from-stone-700 dark:via-stone-600 dark:to-stone-700" />

          <h1
            className={cn(
              // Editorial 风格标题 - 使用 serif 字体
              'font-serif text-3xl lg:text-4xl font-bold leading-tight',
              'text-stone-900 dark:text-stone-100',
              // 标题装饰
              'tracking-tight'
            )}
            style={{
              fontFamily: '"Noto Serif SC", "Source Serif Pro", Georgia, serif',
            }}
          >
            {sourceTitle}
          </h1>
        </div>
      )}

      {/* 元信息行 */}
      <div className="flex items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
        {created && created !== 'None' && !isNaN(new Date(created).getTime()) && (
          <time
            dateTime={created}
            className="flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-600" />
            {formatDistanceToNow(new Date(created), {
              addSuffix: true,
              locale: zhCN,
            })}
          </time>
        )}
      </div>

      {/* 分隔线 - 优雅的渐变 */}
      <div className="relative h-px">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-stone-300 to-transparent dark:via-stone-700" />
      </div>
    </header>
  )
}

// 导出类型配置供其他组件使用
export { TYPE_CONFIG, DEFAULT_CONFIG }
