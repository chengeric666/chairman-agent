import { v4 as uuidv4 } from "uuid";
import {
  OpenCanvasGraphAnnotation,
  OpenCanvasGraphReturnType,
} from "../../state.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { optionallyUpdateArtifactMeta } from "./update-meta.js";
import {
  buildPrompt,
  createNewArtifactContent,
  validateState,
} from "./utils.js";
import {
  createContextDocumentMessages,
  getFormattedReflections,
  getModelConfig,
  getModelFromConfig,
  isUsingO1MiniModel,
  optionallyGetSystemPromptFromConfig,
} from "../../../utils.js";
import { isArtifactMarkdownContent } from "@opencanvas/shared/utils/artifacts";
import { AIMessage } from "@langchain/core/messages";
import {
  extractThinkingAndResponseTokens,
  isThinkingModel,
} from "@opencanvas/shared/utils/thinking";

// 数字化报告需要的最大 tokens 数量（Grok 支持最大 131K，我们使用 32K 以确保完整生成）
const DIGITAL_REPORT_MAX_TOKENS = 32_768;

export const rewriteArtifact = async (
  state: typeof OpenCanvasGraphAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<OpenCanvasGraphReturnType> => {
  const { modelName } = getModelConfig(config);
  // 强制使用较大的 maxTokens 以支持完整的数字化报告（HTML/代码）生成
  // 这确保即使前端配置的 maxTokens 较小，报告也能完整生成
  const smallModelWithConfig = (await getModelFromConfig(config, {
    maxTokens: DIGITAL_REPORT_MAX_TOKENS,
  })).withConfig({
    runName: "rewrite_artifact_model_call",
  });
  const memoriesAsString = await getFormattedReflections(config);
  const { currentArtifactContent, recentHumanMessage } = validateState(state);

  const artifactMetaToolCall = await optionallyUpdateArtifactMeta(
    state,
    config
  );
  const artifactType = artifactMetaToolCall.type;
  const isNewType = artifactType !== currentArtifactContent.type;

  const artifactContent = isArtifactMarkdownContent(currentArtifactContent)
    ? currentArtifactContent.fullMarkdown
    : currentArtifactContent.code;

  const formattedPrompt = buildPrompt({
    artifactContent,
    memoriesAsString,
    isNewType,
    artifactMetaToolCall,
  });

  const userSystemPrompt = optionallyGetSystemPromptFromConfig(config);
  const fullSystemPrompt = userSystemPrompt
    ? `${userSystemPrompt}\n${formattedPrompt}`
    : formattedPrompt;

  const contextDocumentMessages = await createContextDocumentMessages(config);
  const isO1MiniModel = isUsingO1MiniModel(config);
  const newArtifactResponse = await smallModelWithConfig.invoke([
    { role: isO1MiniModel ? "user" : "system", content: fullSystemPrompt },
    ...contextDocumentMessages,
    recentHumanMessage,
  ]);

  let thinkingMessage: AIMessage | undefined;
  let artifactContentText = newArtifactResponse.content as string;

  if (isThinkingModel(modelName)) {
    const { thinking, response } =
      extractThinkingAndResponseTokens(artifactContentText);
    thinkingMessage = new AIMessage({
      id: `thinking-${uuidv4()}`,
      content: thinking,
    });
    artifactContentText = response;
  }

  const newArtifactContent = createNewArtifactContent({
    artifactType,
    state,
    currentArtifactContent,
    artifactMetaToolCall,
    newContent: artifactContentText as string,
  });

  return {
    artifact: {
      ...state.artifact,
      currentIndex: state.artifact.contents.length + 1,
      contents: [...state.artifact.contents, newArtifactContent],
    },
    messages: [...(thinkingMessage ? [thinkingMessage] : [])],
    _messages: [...(thinkingMessage ? [thinkingMessage] : [])],
  };
};
