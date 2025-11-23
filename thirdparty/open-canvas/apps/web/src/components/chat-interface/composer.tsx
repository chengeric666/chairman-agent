"use client";

import { ComposerPrimitive, ThreadPrimitive } from "@assistant-ui/react";
import { type FC, useState, useEffect } from "react";

import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { SendHorizontalIcon } from "lucide-react";
import { DragAndDropWrapper } from "./drag-drop-wrapper";
import { ComposerAttachments } from "../assistant-ui/attachment";
import { ComposerActionsPopOut } from "./composer-actions-popout";

const GENERIC_PLACEHOLDERS = [
  "分享您的想法，让我们一起创作精彩内容",
  "请输入您想要创作的主题和方向",
  "您的杰作从这里开始",
  "今天想要我帮您写什么呢？",
  "在这里输入您的创意想法，让我们开始创作",
  "您的下一部作品就从这个提示开始",
  "分享您的想法，看它如何展开",
  "让我们一起创作令人惊艳的内容",
  "您的创作之旅从这个提示开始",
  "把您的想法变成创意魔法 - 从这里开始",
];

const SEARCH_PLACEHOLDERS = [
  "分享主题 - 我会为您搜索相关资料",
  "输入任何主题 - 我会为您查找信息来源",
  "您的想法 + 最新研究 = 优质内容",
  "从这里开始获取实时信息",
  "输入主题以获得丰富的数据内容",
  "用最新的洞察进行创作",
  "立即开始写作，我为您查找相关资源",
  "您的故事 + 最新数据",
  "欢迎分享想法 - 我已准备好搜索",
  "开始创作，获取最新信息",
];

const getRandomPlaceholder = (searchEnabled: boolean) => {
  return searchEnabled
    ? SEARCH_PLACEHOLDERS[
        Math.floor(Math.random() * SEARCH_PLACEHOLDERS.length)
      ]
    : GENERIC_PLACEHOLDERS[
        Math.floor(Math.random() * GENERIC_PLACEHOLDERS.length)
      ];
};

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};

interface ComposerProps {
  chatStarted: boolean;
  userId: string | undefined;
  searchEnabled: boolean;
}

export const Composer: FC<ComposerProps> = (props: ComposerProps) => {
  const [placeholder, setPlaceholder] = useState("");

  useEffect(() => {
    setPlaceholder(getRandomPlaceholder(props.searchEnabled));
  }, [props.searchEnabled]);

  return (
    <DragAndDropWrapper>
      <ComposerPrimitive.Root className="focus-within:border-aui-ring/20 flex flex-col w-full min-h-[64px] flex-wrap items-center justify-center border px-2.5 shadow-sm transition-colors ease-in bg-white rounded-2xl">
        <div className="flex flex-wrap gap-2 items-start mr-auto">
          <ComposerAttachments />
        </div>

        <div className="flex flex-row w-full items-center justify-start my-auto">
          <ComposerActionsPopOut
            userId={props.userId}
            chatStarted={props.chatStarted}
          />
          <ComposerPrimitive.Input
            autoFocus
            placeholder={placeholder}
            rows={1}
            className="placeholder:text-muted-foreground max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
          />
          <ThreadPrimitive.If running={false}>
            <ComposerPrimitive.Send asChild>
              <TooltipIconButton
                tooltip="发送"
                variant="default"
                className="my-2.5 size-8 p-2 transition-opacity ease-in"
              >
                <SendHorizontalIcon />
              </TooltipIconButton>
            </ComposerPrimitive.Send>
          </ThreadPrimitive.If>
          <ThreadPrimitive.If running>
            <ComposerPrimitive.Cancel asChild>
              <TooltipIconButton
                tooltip="取消"
                variant="default"
                className="my-2.5 size-8 p-2 transition-opacity ease-in"
              >
                <CircleStopIcon />
              </TooltipIconButton>
            </ComposerPrimitive.Cancel>
          </ThreadPrimitive.If>
        </div>
      </ComposerPrimitive.Root>
    </DragAndDropWrapper>
  );
};
