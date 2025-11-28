'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useInsight } from '@/lib/hooks/use-insights'
import { InsightReader, type InsightData } from '@/components/insight/InsightReader'

interface SourceInsightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insight?: {
    id: string
    insight_type?: string
    content?: string
    created?: string
    template_key?: string
    source_title?: string
  }
}

export function SourceInsightDialog({ open, onOpenChange, insight }: SourceInsightDialogProps) {
  // Ensure insight ID has 'source_insight:' prefix for API calls
  const insightIdWithPrefix = insight?.id
    ? (insight.id.includes(':') ? insight.id : `source_insight:${insight.id}`)
    : ''

  const { data: fetchedInsight, isLoading } = useInsight(insightIdWithPrefix, { enabled: open && !!insight?.id })

  // Use fetched data if available, otherwise fall back to passed-in insight
  const displayInsight = fetchedInsight ?? insight

  // 构建 InsightReader 需要的数据格式
  // 注：template_key 和 source_title 是扩展字段，API 可能尚未返回
  const insightData: InsightData | null = displayInsight?.content ? {
    id: displayInsight.id || '',
    content: displayInsight.content,
    insight_type: displayInsight.insight_type || '洞见',
    // 安全访问可选字段（后续 API 扩展时将自动支持）
    template_key: (displayInsight as Record<string, unknown>).template_key as InsightData['template_key'],
    created: displayInsight.created,
    source_title: (displayInsight as Record<string, unknown>).source_title as string | undefined,
  } : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl h-[90vh] p-0 gap-0 overflow-hidden flex flex-col"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        {/* 隐藏的标题，满足可访问性要求 */}
        <VisuallyHidden>
          <DialogTitle>
            {insightData?.insight_type || '洞察'} - {insightData?.source_title || '洞见详情'}
          </DialogTitle>
        </VisuallyHidden>
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-stone-50 dark:bg-stone-950">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
              <span className="text-sm text-stone-500">加载洞见中…</span>
            </div>
          </div>
        ) : insightData ? (
          <InsightReader
            insight={insightData}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-stone-50 dark:bg-stone-950">
            <p className="text-sm text-stone-500">未选择洞见。</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
