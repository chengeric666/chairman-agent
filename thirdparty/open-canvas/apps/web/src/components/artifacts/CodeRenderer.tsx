import { ArtifactCodeV3 } from "@opencanvas/shared/types";
import React, { MutableRefObject, useEffect, useState, Dispatch, SetStateAction } from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { sql } from "@codemirror/lang-sql";
import { json } from "@codemirror/lang-json";
import { rust } from "@codemirror/lang-rust";
import { xml } from "@codemirror/lang-xml";
import { clojure } from "@nextjournal/lang-clojure";
import { csharp } from "@replit/codemirror-lang-csharp";
import styles from "./CodeRenderer.module.css";
import { cleanContent } from "@/lib/normalize_string";
import { cn } from "@/lib/utils";
import { CopyText } from "./components/CopyText";
import { getArtifactContent } from "@opencanvas/shared/utils/artifacts";
import { useGraphContext } from "@/contexts/GraphContext";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { Eye, Code } from "lucide-react";
import { motion } from "framer-motion";

// HTML预览切换按钮组件
function PreviewToggle({
  isPreviewMode,
  setIsPreviewMode,
}: {
  isPreviewMode: boolean;
  setIsPreviewMode: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <TooltipIconButton
        tooltip={isPreviewMode ? "查看源代码" : "预览HTML"}
        variant="outline"
        delayDuration={400}
        onClick={() => setIsPreviewMode((p) => !p)}
      >
        {isPreviewMode ? (
          <Code className="w-5 h-5 text-gray-600" />
        ) : (
          <Eye className="w-5 h-5 text-gray-600" />
        )}
      </TooltipIconButton>
    </motion.div>
  );
}

// HTML预览组件 - 使用sandbox iframe安全渲染
function HtmlPreview({ code }: { code: string }) {
  // 先使用 cleanContent 处理换行符(\n -> 真实换行)和HTML实体解码
  // 然后清理可能的markdown代码块标记
  const cleanHtmlCode = cleanContent(code)
    .replace(/^```html\n?/i, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/g, '')
    .trim();

  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden">
      <iframe
        srcDoc={cleanHtmlCode}
        className="w-full h-[800px] border-0"
        sandbox="allow-scripts allow-same-origin"
        title="HTML预览"
      />
    </div>
  );
}

export interface CodeRendererProps {
  editorRef: MutableRefObject<EditorView | null>;
  isHovering: boolean;
}

const getLanguageExtension = (language: string) => {
  switch (language) {
    case "javascript":
      return javascript({ jsx: true, typescript: false });
    case "typescript":
      return javascript({ jsx: true, typescript: true });
    case "cpp":
      return cpp();
    case "java":
      return java();
    case "php":
      return php();
    case "python":
      return python();
    case "html":
      return html();
    case "sql":
      return sql();
    case "json":
      return json();
    case "rust":
      return rust();
    case "xml":
      return xml();
    case "clojure":
      return clojure();
    case "csharp":
      return csharp();
    default:
      return [];
  }
};

export function CodeRendererComponent(props: Readonly<CodeRendererProps>) {
  const { graphData } = useGraphContext();
  const {
    artifact,
    isStreaming,
    updateRenderedArtifactRequired,
    firstTokenReceived,
    setArtifactContent,
    setUpdateRenderedArtifactRequired,
  } = graphData;

  // HTML预览模式状态
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (updateRenderedArtifactRequired) {
      setUpdateRenderedArtifactRequired(false);
    }
  }, [updateRenderedArtifactRequired]);

  if (!artifact) {
    return null;
  }

  const artifactContent = getArtifactContent(artifact) as ArtifactCodeV3;
  const extensions = [getLanguageExtension(artifactContent.language)];

  if (!artifactContent.code) {
    return null;
  }

  const isEditable = !isStreaming;

  // 检查是否是HTML语言
  const isHtmlLanguage = artifactContent.language === "html";

  return (
    <div className="relative">
      <style jsx global>{`
        .pulse-code .cm-content {
          animation: codePulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes codePulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
      {props.isHovering && (
        <div className="absolute top-0 right-4 z-10 flex gap-2">
          <CopyText currentArtifactContent={artifactContent} />
          {/* HTML语言时显示预览切换按钮 */}
          {isHtmlLanguage && (
            <PreviewToggle
              isPreviewMode={isPreviewMode}
              setIsPreviewMode={setIsPreviewMode}
            />
          )}
        </div>
      )}
      {/* 根据预览模式显示不同内容 */}
      {isHtmlLanguage && isPreviewMode ? (
        <HtmlPreview code={artifactContent.code} />
      ) : (
        <CodeMirror
          editable={isEditable}
          className={cn(
            "w-full min-h-full",
            styles.codeMirrorCustom,
            isStreaming && !firstTokenReceived ? "pulse-code" : ""
          )}
          value={cleanContent(artifactContent.code)}
          height="800px"
          extensions={extensions}
          onChange={(c) => setArtifactContent(artifactContent.index, c)}
          onCreateEditor={(view) => {
            props.editorRef.current = view;
          }}
        />
      )}
    </div>
  );
}

export const CodeRenderer = React.memo(CodeRendererComponent);
