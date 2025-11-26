import {
  getArtifactContent,
  isArtifactCodeContent,
} from "@opencanvas/shared/utils/artifacts";
import {
  ArtifactCodeV3,
  ArtifactMarkdownV3,
  ProgrammingLanguageOptions,
} from "@opencanvas/shared/types";
import {
  OPTIONALLY_UPDATE_META_PROMPT,
  UPDATE_ENTIRE_ARTIFACT_PROMPT,
  UPDATE_DIGITAL_REPORT_PROMPT,
  getReportTemplateInstructions,
} from "../../prompts.js";
import { OpenCanvasGraphAnnotation } from "../../state.js";
import { z } from "zod";
import { OPTIONALLY_UPDATE_ARTIFACT_META_SCHEMA } from "./schemas.js";

/**
 * 从 artifact 内容中提取数字化报告模板 ID
 * 模板 ID 以 HTML 注释形式嵌入: <!-- DIGITAL_REPORT_TEMPLATE: xxx -->
 */
export const extractReportTemplateId = (
  artifactContent: string
): string | null => {
  const match = artifactContent.match(
    /<!--\s*DIGITAL_REPORT_TEMPLATE:\s*(\S+)\s*-->/
  );
  return match ? match[1] : null;
};

/**
 * 检查 artifact 是否为数字化报告
 */
export const isDigitalReport = (artifactContent: string): boolean => {
  return extractReportTemplateId(artifactContent) !== null;
};

export const validateState = (
  state: typeof OpenCanvasGraphAnnotation.State
) => {
  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;
  if (!currentArtifactContent) {
    throw new Error("No artifact found");
  }

  const recentHumanMessage = state._messages.findLast(
    (message) => message.getType() === "human"
  );
  if (!recentHumanMessage) {
    throw new Error("No recent human message found");
  }

  return { currentArtifactContent, recentHumanMessage };
};

const buildMetaPrompt = (
  artifactMetaToolCall: z.infer<typeof OPTIONALLY_UPDATE_ARTIFACT_META_SCHEMA>
) => {
  const titleSection =
    artifactMetaToolCall?.title && artifactMetaToolCall?.type !== "code"
      ? `And its title is (do NOT include this in your response):\n${artifactMetaToolCall.title}`
      : "";

  return OPTIONALLY_UPDATE_META_PROMPT.replace(
    "{artifactType}",
    artifactMetaToolCall?.type
  ).replace("{artifactTitle}", titleSection);
};

interface BuildPromptArgs {
  artifactContent: string;
  memoriesAsString: string;
  isNewType: boolean;
  artifactMetaToolCall: z.infer<typeof OPTIONALLY_UPDATE_ARTIFACT_META_SCHEMA>;
}

/**
 * 构建数字化报告更新 Prompt
 */
const buildDigitalReportPrompt = (
  artifactContent: string,
  templateId: string
): string => {
  const templateInstructions = getReportTemplateInstructions(templateId);

  return UPDATE_DIGITAL_REPORT_PROMPT.replace(
    "{artifactContent}",
    artifactContent
  ).replace("{templateInstructions}", templateInstructions);
};

export const buildPrompt = ({
  artifactContent,
  memoriesAsString,
  isNewType,
  artifactMetaToolCall,
}: BuildPromptArgs) => {
  // 检查是否为数字化报告
  const reportTemplateId = extractReportTemplateId(artifactContent);
  if (reportTemplateId) {
    // 使用数字化报告专用 Prompt
    return buildDigitalReportPrompt(artifactContent, reportTemplateId);
  }

  // 普通 artifact 更新逻辑
  const metaPrompt = isNewType ? buildMetaPrompt(artifactMetaToolCall) : "";

  return UPDATE_ENTIRE_ARTIFACT_PROMPT.replace(
    "{artifactContent}",
    artifactContent
  )
    .replace("{reflections}", memoriesAsString)
    .replace("{updateMetaPrompt}", metaPrompt);
};

interface CreateNewArtifactContentArgs {
  artifactType: string;
  state: typeof OpenCanvasGraphAnnotation.State;
  currentArtifactContent: ArtifactCodeV3 | ArtifactMarkdownV3;
  artifactMetaToolCall: z.infer<typeof OPTIONALLY_UPDATE_ARTIFACT_META_SCHEMA>;
  newContent: string;
}

const getLanguage = (
  artifactMetaToolCall: z.infer<typeof OPTIONALLY_UPDATE_ARTIFACT_META_SCHEMA>,
  currentArtifactContent: ArtifactCodeV3 | ArtifactMarkdownV3 // Replace 'any' with proper type
) =>
  artifactMetaToolCall?.language ||
  (isArtifactCodeContent(currentArtifactContent)
    ? currentArtifactContent.language
    : "other");

export const createNewArtifactContent = ({
  artifactType,
  state,
  currentArtifactContent,
  artifactMetaToolCall,
  newContent,
}: CreateNewArtifactContentArgs): ArtifactCodeV3 | ArtifactMarkdownV3 => {
  const baseContent = {
    index: state.artifact.contents.length + 1,
    title: artifactMetaToolCall?.title || currentArtifactContent.title,
  };

  if (artifactType === "code") {
    return {
      ...baseContent,
      type: "code",
      language: getLanguage(
        artifactMetaToolCall,
        currentArtifactContent
      ) as ProgrammingLanguageOptions,
      code: newContent,
    };
  }

  return {
    ...baseContent,
    type: "text",
    fullMarkdown: newContent,
  };
};
