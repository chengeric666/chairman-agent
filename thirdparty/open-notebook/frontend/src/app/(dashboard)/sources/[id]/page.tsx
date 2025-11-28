'use client'

import { useRouter, useParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useSourceChat } from '@/lib/hooks/useSourceChat'
import { ChatPanel } from '@/components/source/ChatPanel'
import { useNavigation } from '@/lib/hooks/use-navigation'
import { SourceDetailContent } from '@/components/source/SourceDetailContent'
import { sourcesApi } from '@/lib/api/sources'
import { insightsApi } from '@/lib/api/insights'
import { ReferenceTitleMap } from '@/lib/utils/source-references'

export default function SourceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sourceId = decodeURIComponent(params.id as string)
  const navigation = useNavigation()

  // Initialize source chat
  const chat = useSourceChat(sourceId)

  // Fetch source to get title for reference display
  const { data: source } = useQuery({
    queryKey: ['source', sourceId],
    queryFn: () => sourcesApi.get(sourceId),
    enabled: !!sourceId
  })

  // Fetch insights for this source to map their titles
  const { data: insights } = useQuery({
    queryKey: ['insights', sourceId],
    queryFn: () => insightsApi.listForSource(sourceId),
    enabled: !!sourceId
  })

  // Build reference title map for friendly display
  // 将 source ID 和 source_insight ID 映射到标题，用于在引用列表中显示友好名称
  const referenceTitleMap: ReferenceTitleMap = useMemo(() => {
    const map: ReferenceTitleMap = {}

    // 1. 映射 source 标题
    if (source?.title) {
      map[sourceId] = source.title
      map[`source:${sourceId.replace('source:', '')}`] = source.title
    }

    // 2. 映射所有 insight 标题（用 insight_type 作为显示名称）
    if (insights && Array.isArray(insights)) {
      insights.forEach((insight: { id: string; insight_type?: string }) => {
        const insightId = insight.id.replace('source_insight:', '')
        // 使用 insight_type（如 "核心洞见"、"精炼摘要"）作为显示标题
        map[`source_insight:${insightId}`] = insight.insight_type || '洞察'
        map[insight.id] = insight.insight_type || '洞察'
      })
    }

    return map
  }, [source?.title, sourceId, insights])

  const handleBack = useCallback(() => {
    const returnPath = navigation.getReturnPath()
    router.push(returnPath)
    navigation.clearReturnTo()
  }, [navigation, router])

  return (
    <div className="flex flex-col h-screen">
      {/* Back button */}
      <div className="pt-6 pb-4 px-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {navigation.getReturnLabel()}
        </Button>
      </div>

      {/* Main content: Source detail + Chat */}
      <div className="flex-1 grid gap-6 lg:grid-cols-[2fr_1fr] overflow-hidden px-6">
        {/* Left column - Source detail */}
        <div className="overflow-y-auto px-4 pb-6">
          <SourceDetailContent
            sourceId={sourceId}
            showChatButton={false}
            onClose={handleBack}
          />
        </div>

        {/* Right column - Chat */}
        <div className="overflow-y-auto px-4 pb-6">
          <ChatPanel
            messages={chat.messages}
            isStreaming={chat.isStreaming}
            contextIndicators={chat.contextIndicators}
            onSendMessage={(message, model) => chat.sendMessage(message, model)}
            modelOverride={chat.currentSession?.model_override}
            onModelChange={(model) => {
              if (chat.currentSessionId) {
                chat.updateSession(chat.currentSessionId, { model_override: model })
              }
            }}
            sessions={chat.sessions}
            currentSessionId={chat.currentSessionId}
            onCreateSession={(title) => chat.createSession({ title })}
            onSelectSession={chat.switchSession}
            onUpdateSession={(sessionId, title) => chat.updateSession(sessionId, { title })}
            onDeleteSession={chat.deleteSession}
            loadingSessions={chat.loadingSessions}
            referenceTitleMap={referenceTitleMap}
          />
        </div>
      </div>
    </div>
  )
}
