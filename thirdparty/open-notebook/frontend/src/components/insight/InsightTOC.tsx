'use client'

import { cn } from '@/lib/utils'
import { List } from 'lucide-react'

/**
 * InsightTOC - 目录导航组件
 *
 * 设计：
 * - 固定在左侧
 * - 层级缩进
 * - 活跃项高亮
 * - 点击平滑滚动
 */

export interface TOCItem {
  id: string
  text: string
  level: 1 | 2 | 3
}

interface InsightTOCProps {
  items: TOCItem[]
  activeId: string
  onItemClick: (id: string) => void
  className?: string
}

export function InsightTOC({
  items,
  activeId,
  onItemClick,
  className,
}: InsightTOCProps) {
  if (items.length === 0) return null

  return (
    <nav
      className={cn(
        'sticky top-0 h-full overflow-y-auto',
        'p-6 space-y-4',
        className
      )}
    >
      {/* 标题 */}
      <div className="flex items-center gap-2 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
        <List className="h-4 w-4" />
        <span>目录</span>
      </div>

      {/* 目录列表 */}
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = item.id === activeId

          // 根据层级设置缩进和样式
          const levelStyles: Record<1 | 2 | 3, string> = {
            1: 'pl-0 text-sm font-medium',
            2: 'pl-4 text-sm',
            3: 'pl-8 text-xs',
          }

          return (
            <li key={item.id}>
              <button
                onClick={() => onItemClick(item.id)}
                className={cn(
                  // 基础样式
                  'w-full text-left py-2 pr-2 rounded-lg',
                  'transition-all duration-200',
                  'hover:bg-stone-100 dark:hover:bg-stone-800/50',
                  // 层级样式
                  levelStyles[item.level],
                  // 活跃状态
                  isActive
                    ? 'text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800/50'
                    : 'text-stone-600 dark:text-stone-400',
                  // 活跃指示器
                  'relative'
                )}
              >
                {/* 活跃指示器 */}
                {isActive && (
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2',
                      'w-0.5 h-4 rounded-full',
                      'bg-gradient-to-b from-amber-400 to-amber-600',
                      'animate-pulse'
                    )}
                  />
                )}

                {/* 文本 - 截断过长内容 */}
                <span className="block truncate pl-2">
                  {item.text}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* 底部渐变遮罩 */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-stone-50 to-transparent dark:from-stone-950 pointer-events-none" />
    </nav>
  )
}
