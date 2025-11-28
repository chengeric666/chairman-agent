'use client'

import { useState, useRef, type RefObject } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Copy,
  Check,
  Maximize2,
  Minimize2,
  X,
  Printer,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

/**
 * InsightToolbar - 洞察工具栏
 *
 * 功能：
 * - 复制 Markdown
 * - 全屏切换
 * - 关闭按钮
 * - 打印/导出 PDF
 */

interface InsightToolbarProps {
  content: string
  insightType: string
  insightTitle?: string
  contentRef?: RefObject<HTMLElement | null>
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
  onClose?: () => void
  className?: string
}

export function InsightToolbar({
  content,
  insightType,
  insightTitle,
  contentRef,
  onToggleFullscreen,
  isFullscreen,
  onClose,
  className,
}: InsightToolbarProps) {
  const [copied, setCopied] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)

  // 复制 Markdown 内容
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  // 打印/导出 PDF（使用浏览器原生打印功能）
  const handlePrint = async () => {
    if (!contentRef?.current) {
      // 没有 contentRef 时使用整页打印
      window.print()
      return
    }

    setIsPrinting(true)

    try {
      // 创建打印专用窗口
      const printWindow = window.open('', '_blank', 'width=800,height=600')
      if (!printWindow) {
        toast.error('无法打开打印窗口，请检查弹窗设置')
        return
      }

      // 获取所有样式表
      const styleSheets = Array.from(document.styleSheets)
        .map(sheet => {
          try {
            return Array.from(sheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n')
          } catch {
            // 跨域样式表无法访问
            return ''
          }
        })
        .join('\n')

      // 构建打印文档
      const title = insightTitle || `${insightType} - Open Notebook`
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            ${styleSheets}

            /* 打印优化样式 */
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                background: white !important;
              }

              @page {
                margin: 2cm;
                size: A4;
              }

              /* 隐藏不需要打印的元素 */
              .no-print {
                display: none !important;
              }

              /* 优化分页 */
              h1, h2, h3 {
                page-break-after: avoid;
              }

              pre, blockquote, table {
                page-break-inside: avoid;
              }
            }

            /* 基础样式 */
            body {
              font-family: "Noto Serif SC", Georgia, serif;
              line-height: 1.8;
              color: #1a1a1a;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              background: white;
            }

            /* 打印页眉 */
            .print-header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e5e5;
            }

            .print-header h1 {
              font-size: 24px;
              font-weight: 600;
              color: #333;
              margin: 0 0 8px 0;
            }

            .print-header .type-badge {
              display: inline-block;
              padding: 4px 12px;
              background: #f5f5f5;
              border-radius: 16px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${title}</h1>
            <span class="type-badge">${insightType}</span>
          </div>
          ${contentRef.current.innerHTML}
        </body>
        </html>
      `)

      printWindow.document.close()

      // 等待样式加载后打印
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
        toast.success('已发送到打印机')
      }, 500)
    } catch (error) {
      console.error('Print error:', error)
      toast.error('打印失败')
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'border-b border-stone-200/60 dark:border-stone-800/60',
          'bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm',
          className
        )}
      >
        {/* 左侧：类型标识 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
            {insightType}
          </span>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-1">
          {/* 复制按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-8 w-8 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{copied ? '已复制' : '复制 Markdown'}</p>
            </TooltipContent>
          </Tooltip>

          {/* 打印/导出按钮 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrint}
                disabled={isPrinting}
                className="h-8 w-8 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              >
                {isPrinting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>打印 / 导出 PDF</p>
            </TooltipContent>
          </Tooltip>

          {/* 全屏按钮 */}
          {onToggleFullscreen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleFullscreen}
                  className="h-8 w-8 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{isFullscreen ? '退出全屏' : '全屏阅读'}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* 关闭按钮 */}
          {onClose && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>关闭 (Esc)</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
