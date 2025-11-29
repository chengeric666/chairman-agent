import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStreamContext } from "@/providers/Stream";
import { useState, FormEvent } from "react";
import { Button } from "../ui/button";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "./messages/ai";
import { HumanMessage } from "./messages/human";
import {
  DO_NOT_RENDER_ID_PREFIX,
  ensureToolCallsHaveResponses,
} from "@/lib/ensure-tool-responses";
import Image from "next/image";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  ArrowDown,
  LoaderCircle,
  PanelRightOpen,
  PanelRightClose,
  SquarePen,
  XIcon,
  Plus,
  Home,
  Microscope,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import ThreadHistory from "./history";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ContentBlocksPreview } from "./ContentBlocksPreview";
import {
  useArtifactOpen,
  ArtifactContent,
  ArtifactTitle,
  useArtifactContext,
} from "./artifact";

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div
        ref={context.contentRef}
        className={props.contentClassName}
      >
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="h-4 w-4" />
      <span>滚动到底部</span>
    </Button>
  );
}

// 研究阶段类型 - 状态机驱动
type ResearchPhase = 'starting' | 'researching' | 'completed';

// 研究过程容器 - 状态机驱动的单一组件
function SupervisorMessagesContainer({
  messages,
  phase,
  handleRegenerate,
}: {
  messages: Message[];
  phase: ResearchPhase;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false); // 仅 completed 阶段使用

  // ========== STARTING 阶段 ==========
  // 简洁的"研究进行中"卡片，无展开按钮
  if (phase === 'starting') {
    return (
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <LoaderCircle className="w-4 h-4 animate-spin text-primary" />
            <span className="font-medium text-foreground">研究过程</span>
            <span className="text-sm text-primary">启动中...</span>
          </div>
        </div>
        <div className="bg-muted/30 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>正在准备研究环境...</span>
          </div>
        </div>
      </div>
    );
  }

  // ========== RESEARCHING 阶段 ==========
  // 固定头部 + 动态 Timeline（始终展开，不可折叠）
  if (phase === 'researching') {
    return (
      <div className="overflow-hidden rounded-lg border border-border">
        {/* 固定头部 */}
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <LoaderCircle className="w-4 h-4 animate-spin text-primary" />
            <span className="font-medium text-foreground">研究过程</span>
            <span className="text-sm text-primary">进行中...</span>
          </div>
        </div>
        {/* 始终展开的 Timeline 内容 */}
        <div className="p-4 bg-muted/30">
          <div className="relative pl-6 ml-3 border-l-2 border-primary/30">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={`supervisor-msg-${index}-${message.id || 'no-id'}`} className="relative">
                  {/* Timeline 圆点指示器 */}
                  <div className="absolute -left-[33px] top-3 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  {/* 消息内容 */}
                  <AssistantMessage
                    message={message}
                    isLoading={false}
                    handleRegenerate={handleRegenerate}
                  />
                </div>
              ))}
              {/* 加载中指示器 - 始终显示在末尾 */}
              <div className="relative">
                <div className="absolute -left-[33px] top-2 w-4 h-4 rounded-full bg-primary animate-pulse" />
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  <span>正在研究中...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== COMPLETED 阶段 ==========
  // 可折叠的完整历史框（默认收起）
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* 卡片头部 */}
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">研究过程</span>
          <span className="text-sm text-muted-foreground">共 {messages.length} 条研究记录</span>
        </div>
      </div>

      {/* 内容区域 - 仅展开时显示 */}
      {isExpanded && (
        <div className="p-4 bg-muted/30">
          <div className="relative pl-6 ml-3 border-l-2 border-primary/30">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={`supervisor-msg-${index}-${message.id || 'no-id'}`} className="relative">
                  {/* Timeline 圆点指示器 - 绿色表示已完成 */}
                  <div className="absolute -left-[33px] top-3 w-4 h-4 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  </div>
                  {/* 消息内容 */}
                  <AssistantMessage
                    message={message}
                    isLoading={false}
                    handleRegenerate={handleRegenerate}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 底部展开/收起按钮 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full cursor-pointer items-center justify-center border-t border-border py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:bg-muted/50 hover:text-foreground"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4 mr-1" />
            <span className="text-xs">收起</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-1" />
            <span className="text-xs">展开详情</span>
          </>
        )}
      </button>
    </div>
  );
}

function BackToNotebook() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href="http://localhost:8502"
            className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">返回知识库</span>
          </a>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>返回 TuringFlow 知识库</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Thread() {
  const [artifactContext, setArtifactContext] = useArtifactContext();
  const [artifactOpen, closeArtifact] = useArtifactOpen();

  const [threadId, _setThreadId] = useQueryState("threadId");
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false),
  );
  const [hideToolCalls, setHideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );
  const [showProcessMessages, setShowProcessMessages] = useQueryState(
    "showProcess",
    parseAsBoolean.withDefault(true),
  );
  const [input, setInput] = useState("");
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks: _resetBlocks,
    dragOver,
    handlePaste,
  } = useFileUpload();
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useStreamContext();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  const lastError = useRef<string | undefined>(undefined);

  const setThreadId = (id: string | null) => {
    _setThreadId(id);

    // close artifact and reset artifact context
    closeArtifact();
    setArtifactContext({});
  };

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("发生错误，请重试。", {
        description: (
          <p>
            <strong>错误信息：</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || isLoading)
      return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
        ...contentBlocks,
      ] as Message["content"],
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    const context =
      Object.keys(artifactContext).length > 0 ? artifactContext : undefined;

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], context },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          context,
          messages: [
            ...(prev.messages ?? []),
            ...toolMessages,
            newHumanMessage,
          ],
        }),
      },
    );

    setInput("");
    setContentBlocks([]);
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
  ) => {
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
    });
  };

  const chatStarted = !!threadId || !!messages.length;
  const hasNoAIOrToolMessages = !messages.find(
    (m) => m.type === "ai" || m.type === "tool",
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="relative hidden lg:flex">
        <motion.div
          className="absolute z-20 h-full overflow-hidden border-r bg-sidebar"
          style={{ width: 300 }}
          animate={
            isLargeScreen
              ? { x: chatHistoryOpen ? 0 : -300 }
              : { x: chatHistoryOpen ? 0 : -300 }
          }
          initial={{ x: -300 }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          <div
            className="relative h-full"
            style={{ width: 300 }}
          >
            <ThreadHistory />
          </div>
        </motion.div>
      </div>

      <div
        className={cn(
          "grid w-full grid-cols-[1fr_0fr] transition-all duration-500",
          artifactOpen && "grid-cols-[3fr_2fr]",
        )}
      >
        <motion.div
          className={cn(
            "relative flex min-w-0 flex-1 flex-col overflow-hidden",
            !chatStarted && "grid-rows-[1fr]",
          )}
          layout={isLargeScreen}
          animate={{
            marginLeft: chatHistoryOpen ? (isLargeScreen ? 300 : 0) : 0,
            width: chatHistoryOpen
              ? isLargeScreen
                ? "calc(100% - 300px)"
                : "100%"
              : "100%",
          }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          {!chatStarted && (
            <div className="absolute top-0 left-0 z-10 flex w-full items-center justify-between gap-3 p-2 pl-4">
              <div>
                {(!chatHistoryOpen || !isLargeScreen) && (
                  <Button
                    className="hover:bg-accent"
                    variant="ghost"
                    onClick={() => setChatHistoryOpen((p) => !p)}
                  >
                    {chatHistoryOpen ? (
                      <PanelRightOpen className="size-5" />
                    ) : (
                      <PanelRightClose className="size-5" />
                    )}
                  </Button>
                )}
              </div>
              <div className="absolute top-2 right-4 flex items-center">
                <BackToNotebook />
              </div>
            </div>
          )}
          {chatStarted && (
            <div className="relative z-10 flex items-center justify-between gap-3 p-2 border-b border-border/50">
              <div className="relative flex items-center justify-start gap-2">
                <div className="absolute left-0 z-10">
                  {(!chatHistoryOpen || !isLargeScreen) && (
                    <Button
                      className="hover:bg-accent"
                      variant="ghost"
                      onClick={() => setChatHistoryOpen((p) => !p)}
                    >
                      {chatHistoryOpen ? (
                        <PanelRightOpen className="size-5" />
                      ) : (
                        <PanelRightClose className="size-5" />
                      )}
                    </Button>
                  )}
                </div>
                <motion.button
                  className="flex cursor-pointer items-center gap-2"
                  onClick={() => setThreadId(null)}
                  animate={{
                    marginLeft: !chatHistoryOpen ? 48 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <Image
                    src="/Turingflow-blue-logo.png"
                    alt="TuringFlow"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-lg font-semibold tracking-tight text-gradient-turingflow">
                      深度研究
                    </span>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      TuringFlow 董智
                    </span>
                  </div>
                </motion.button>
              </div>

              <div className="flex items-center gap-4">
                <BackToNotebook />
                <TooltipIconButton
                  size="lg"
                  className="p-4"
                  tooltip="新建研究"
                  variant="ghost"
                  onClick={() => setThreadId(null)}
                >
                  <SquarePen className="size-5" />
                </TooltipIconButton>
              </div>

              <div className="from-background to-background/0 absolute inset-x-0 top-full h-5 bg-gradient-to-b" />
            </div>
          )}

          <StickToBottom className="relative flex-1 overflow-hidden">
            <StickyToBottomContent
              className={cn(
                "absolute inset-0 overflow-y-scroll px-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
                !chatStarted && "mt-[25vh] flex flex-col items-stretch",
                chatStarted && "grid grid-rows-[1fr_auto]",
              )}
              contentClassName="pt-8 pb-16 max-w-3xl mx-auto flex flex-col gap-4 w-full"
              content={
                <>
                  {/* 渲染消息列表 */}
                  {(() => {
                    const filteredMessages = messages.filter((m) =>
                      showProcessMessages || !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX)
                    );
                    const values = stream.values as any;
                    const supervisorMessages = values?.supervisor_messages || [];
                    const hasFinalReport = !!values?.final_report;

                    // 找到最后一条 AI 消息的索引（通常是最终报告）
                    let lastAiIndex = -1;
                    for (let i = filteredMessages.length - 1; i >= 0; i--) {
                      if (filteredMessages[i].type === 'ai') {
                        lastAiIndex = i;
                        break;
                      }
                    }

                    // ========== 状态机驱动的研究阶段计算 ==========
                    // 统一计算当前研究阶段，避免多个独立条件分支的状态混乱
                    const researchPhase: ResearchPhase | null = (() => {
                      if (!showProcessMessages) return null;
                      // COMPLETED: 研究已完成（有最终报告，不在加载中）
                      if (!isLoading && hasFinalReport && supervisorMessages.length > 0) return 'completed';
                      // RESEARCHING: 研究进行中（有supervisor消息正在生成）
                      if (isLoading && supervisorMessages.length > 0) return 'researching';
                      // STARTING: 研究刚开始（正在加载但还没有supervisor消息）
                      if (isLoading && supervisorMessages.length === 0) return 'starting';
                      return null;
                    })();

                    const messageElements = filteredMessages.map((message, index) => {
                      const elements: React.ReactNode[] = [];

                      // 研究完成后，在最终报告之前显示研究过程（可折叠）
                      if (
                        researchPhase === 'completed' &&
                        index === lastAiIndex &&
                        supervisorMessages.length > 0
                      ) {
                        elements.push(
                          <SupervisorMessagesContainer
                            key="supervisor-messages-completed"
                            messages={supervisorMessages}
                            phase="completed"
                            handleRegenerate={handleRegenerate}
                          />
                        );
                      }

                      // 渲染消息本身
                      if (message.type === "human") {
                        elements.push(
                          <HumanMessage
                            key={message.id || `${message.type}-${index}`}
                            message={message}
                            isLoading={isLoading}
                          />
                        );
                      } else {
                        elements.push(
                          <AssistantMessage
                            key={message.id || `${message.type}-${index}`}
                            message={message}
                            isLoading={isLoading}
                            handleRegenerate={handleRegenerate}
                          />
                        );
                      }

                      return elements;
                    });

                    // 研究进行中（starting 或 researching）：在消息列表末尾显示研究过程
                    if (researchPhase === 'starting' || researchPhase === 'researching') {
                      messageElements.push(
                        <SupervisorMessagesContainer
                          key="supervisor-messages-in-progress"
                          messages={supervisorMessages}
                          phase={researchPhase}
                          handleRegenerate={handleRegenerate}
                        />
                      );
                    }

                    return messageElements;
                  })()}
                  {/* Special rendering case where there are no AI/tool messages, but there is an interrupt.
                    We need to render it outside of the messages list, since there are no messages to render */}
                  {hasNoAIOrToolMessages && !!stream.interrupt && (
                    <AssistantMessage
                      key="interrupt-msg"
                      message={undefined}
                      isLoading={isLoading}
                      handleRegenerate={handleRegenerate}
                    />
                  )}
                  {/* 只有在没有显示研究过程组件时才显示通用加载提示 */}
                  {isLoading && !firstTokenReceived && !showProcessMessages && (
                    <AssistantMessageLoading />
                  )}
                </>
              }
              footer={
                <div className="sticky bottom-0 flex flex-col items-center gap-8 bg-background">
                  {!chatStarted && (
                    <div className="relative flex flex-col items-center gap-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
                      {/* 背景光晕效果 */}
                      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-radial from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

                      {/* Logo 区域 */}
                      <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className="relative group">
                          {/* Logo 光环 - 持续脉动 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full blur-2xl scale-[2] glow-pulse" />
                          {/* 悬停时的额外光环 */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-blue-600/30 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <Image
                            src="/Turingflow-blue-logo.png"
                            alt="TuringFlow"
                            width={140}
                            height={140}
                            className="relative h-[140px] w-[140px] object-contain drop-shadow-xl logo-float transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>

                        {/* 标题区域 */}
                        <div className="flex flex-col items-center gap-3 text-center">
                          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 bg-clip-text text-transparent">
                            深度研究
                          </h1>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="h-px w-8 bg-gradient-to-r from-transparent to-border" />
                            <span className="text-sm font-medium tracking-widest uppercase">
                              TuringFlow 董智
                            </span>
                            <span className="h-px w-8 bg-gradient-to-l from-transparent to-border" />
                          </div>
                        </div>
                      </div>

                      {/* 描述文字 */}
                      <p className="relative z-10 text-center text-muted-foreground max-w-lg text-base leading-relaxed">
                        AI驱动的智能研究助手，为您进行
                        <span className="text-foreground font-medium">深度分析</span>
                        、
                        <span className="text-foreground font-medium">信息检索</span>
                        与
                        <span className="text-foreground font-medium">知识洞察</span>
                      </p>
                    </div>
                  )}

                  <ScrollToBottom className="animate-in fade-in-0 zoom-in-95 absolute bottom-full left-1/2 mb-4 -translate-x-1/2" />

                  <div
                    ref={dropRef}
                    className={cn(
                      "bg-muted/50 relative z-10 mx-auto mb-8 w-full max-w-3xl rounded-2xl shadow-sm transition-all input-focus-ring",
                      dragOver
                        ? "border-primary border-2 border-dotted"
                        : "border border-border",
                    )}
                  >
                    <form
                      onSubmit={handleSubmit}
                      className="mx-auto grid max-w-3xl grid-rows-[1fr_auto] gap-2"
                    >
                      <ContentBlocksPreview
                        blocks={contentBlocks}
                        onRemove={removeBlock}
                      />
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPaste={handlePaste}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !e.metaKey &&
                            !e.nativeEvent.isComposing
                          ) {
                            e.preventDefault();
                            const el = e.target as HTMLElement | undefined;
                            const form = el?.closest("form");
                            form?.requestSubmit();
                          }
                        }}
                        placeholder="输入您的研究问题..."
                        className="field-sizing-content resize-none border-none bg-transparent p-3.5 pb-0 shadow-none ring-0 outline-none focus:ring-0 focus:outline-none text-base"
                      />

                      <div className="flex flex-wrap items-center gap-4 p-2 pt-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="render-tool-calls"
                            checked={hideToolCalls ?? false}
                            onCheckedChange={setHideToolCalls}
                          />
                          <Label
                            htmlFor="render-tool-calls"
                            className="text-sm text-muted-foreground"
                          >
                            隐藏工具调用
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-process"
                            checked={showProcessMessages ?? true}
                            onCheckedChange={setShowProcessMessages}
                          />
                          <Label
                            htmlFor="show-process"
                            className="text-sm text-muted-foreground"
                          >
                            显示研究过程
                          </Label>
                        </div>
                        <Label
                          htmlFor="file-input"
                          className="flex cursor-pointer items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Plus className="size-5" />
                          <span className="text-sm">
                            上传PDF或图片
                          </span>
                        </Label>
                        <input
                          id="file-input"
                          type="file"
                          onChange={handleFileUpload}
                          multiple
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                          className="hidden"
                        />
                        {stream.isLoading ? (
                          <Button
                            key="stop"
                            onClick={() => stream.stop()}
                            className="ml-auto"
                            variant="outline"
                          >
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            取消
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            className="ml-auto shadow-md transition-all bg-gradient-turingflow hover:opacity-90"
                            disabled={
                              isLoading ||
                              (!input.trim() && contentBlocks.length === 0)
                            }
                          >
                            <Microscope className="h-4 w-4 mr-1" />
                            开始研究
                          </Button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              }
            />
          </StickToBottom>
        </motion.div>
        <div className="relative flex flex-col border-l">
          <div className="absolute inset-0 flex min-w-[30vw] flex-col">
            <div className="grid grid-cols-[1fr_auto] border-b p-4">
              <ArtifactTitle className="truncate overflow-hidden" />
              <button
                onClick={closeArtifact}
                className="cursor-pointer"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <ArtifactContent className="relative flex-grow" />
          </div>
        </div>
      </div>
    </div>
  );
}
