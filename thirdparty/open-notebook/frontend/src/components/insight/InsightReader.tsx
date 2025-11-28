'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { InsightHeader } from './InsightHeader'
import { InsightToolbar } from './InsightToolbar'
import { InsightTOC, type TOCItem } from './InsightTOC'
import { getTemplateComponent, templateSupportsTOC, cleanContentMetadata, type InsightTemplateKey } from './templates'

/**
 * InsightReader - 杂志级洞察阅读器
 *
 * 设计理念：Editorial Magazine 风格
 * - 优雅的衬线标题字体
 * - 充裕的阅读空间
 * - 类型专属的视觉语言
 * - 流畅的导航体验
 */

export interface InsightData {
  id: string
  content: string
  insight_type: string
  template_key?: InsightTemplateKey
  created?: string
  source_title?: string
}

interface InsightReaderProps {
  insight: InsightData
  className?: string
  onClose?: () => void
}

// 生成唯一的 heading ID（与 MarkdownRenderer 保持一致）
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')
}

// 从 Markdown 内容提取 TOC 项
function extractTOC(content: string): TOCItem[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm
  const items: TOCItem[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length as 1 | 2 | 3
    const text = match[2].trim()
    const id = generateHeadingId(text)

    items.push({ id, text, level })
  }

  return items
}

export function InsightReader({ insight, className, onClose }: InsightReaderProps) {
  const [activeSection, setActiveSection] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // 获取模板键
  const templateKey = insight.template_key || insight.insight_type

  // 检查模板是否支持 TOC
  const supportsTOC = useMemo(
    () => templateSupportsTOC(templateKey),
    [templateKey]
  )

  // 清理内容中的元数据（如字数标记）
  const cleanedContent = useMemo(
    () => cleanContentMetadata(insight.content),
    [insight.content]
  )

  // 提取目录（仅当模板支持 TOC 时才有意义）
  const tocItems = useMemo(
    () => supportsTOC ? extractTOC(cleanedContent) : [],
    [cleanedContent, supportsTOC]
  )

  // 是否显示 TOC 侧边栏
  const showTOC = supportsTOC && tocItems.length > 3

  // 获取对应的模板组件
  const TemplateComponent = useMemo(
    () => getTemplateComponent(templateKey),
    [templateKey]
  )

  // 滚动到指定章节 - 使用更可靠的方式
  const scrollToSection = useCallback((id: string) => {
    if (!contentRef.current) return

    // 方法1：直接按 ID 查找
    let element = contentRef.current.querySelector(`[id="${id}"]`)

    // 方法2：如果找不到，尝试用 CSS.escape
    if (!element) {
      try {
        element = contentRef.current.querySelector(`#${CSS.escape(id)}`)
      } catch {
        // ignore
      }
    }

    // 方法3：遍历所有标题，查找匹配的文本
    if (!element) {
      const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6')
      for (const heading of headings) {
        const headingId = generateHeadingId(heading.textContent || '')
        if (headingId === id) {
          element = heading
          break
        }
      }
    }

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // 滚动监听，更新当前活跃章节
  useEffect(() => {
    if (!contentRef.current || tocItems.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const headingId = entry.target.id || generateHeadingId(entry.target.textContent || '')
            setActiveSection(headingId)
          }
        })
      },
      {
        root: contentRef.current,
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0,
      }
    )

    // 观察所有标题元素
    const headings = contentRef.current.querySelectorAll('h1, h2, h3')
    headings.forEach((heading) => observer.observe(heading))

    return () => observer.disconnect()
  }, [tocItems])

  // 切换全屏
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className={cn(
        // 基础容器 - 使用固定高度确保滚动正常
        'insight-reader relative flex flex-col w-full h-full',
        // Editorial 风格背景 - 温暖的奶油色调
        'bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100',
        'dark:from-stone-950 dark:via-stone-900 dark:to-stone-950',
        // 全屏模式样式
        isFullscreen && 'fixed inset-0 z-50',
        className
      )}
    >
      {/* 顶部工具栏 - 固定高度 */}
      <div className="flex-shrink-0">
        <InsightToolbar
          content={insight.content}
          insightType={insight.insight_type}
          insightTitle={insight.source_title}
          contentRef={contentRef}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          onClose={onClose}
        />
      </div>

      {/* 主内容区 - flex-1 占据剩余空间，overflow-hidden 防止溢出 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧 TOC 导航 - 仅支持 TOC 的模板且有足够标题时显示 */}
        {showTOC && (
          <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 border-r border-stone-200/60 dark:border-stone-800/60">
            <div className="flex-1 overflow-y-auto">
              <InsightTOC
                items={tocItems}
                activeId={activeSection}
                onItemClick={scrollToSection}
              />
            </div>
          </aside>
        )}

        {/* 右侧阅读区 - 使用 overflow-y-auto 启用滚动 */}
        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* 内容区：统一使用较大内边距和全宽，让模板自己控制内容布局 */}
          <article className={cn(
            'py-8 lg:py-10',
            'px-8 lg:px-12 xl:px-16',  // 统一内边距
            'max-w-none'  // 全宽，让模板内部控制具体宽度
          )}>
            {/* 文章头部 */}
            <InsightHeader
              insightType={insight.insight_type}
              sourceTitle={insight.source_title}
              created={insight.created}
              hideTypeBadge={showTOC}
            />

            {/* 内容区 - 使用类型专属模板，传入清理后的内容 */}
            <div className="mt-8">
              <TemplateComponent
                content={cleanedContent}
                insightType={insight.insight_type}
              />
            </div>

            {/* 底部留白，确保最后一个章节可以滚动到顶部 */}
            <div className="h-[30vh]" />
          </article>
        </main>
      </div>

      {/* 底部装饰线 */}
      <div className="flex-shrink-0 h-1 bg-gradient-to-r from-transparent via-stone-300/50 to-transparent dark:via-stone-700/50" />
    </div>
  )
}
