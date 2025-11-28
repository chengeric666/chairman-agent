import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Timeline 容器 - Claude 风格左边框线 */}
      <div className="relative pl-6 ml-3 border-l-2 border-primary/30">
        <div className="space-y-4">
          {toolCalls.map((tc, idx) => {
            const args = tc.args as Record<string, any>;
            const hasArgs = Object.keys(args).length > 0;
            return (
              <div key={idx} className="relative">
                {/* Timeline 圆点指示器 */}
                <div className="absolute -left-[33px] top-3 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>

                {/* 工具调用卡片 */}
                <div className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
                  <div className="border-b border-border/50 bg-muted/50 px-4 py-2">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">调用工具:</span>
                      <span className="text-primary">{tc.name}</span>
                      {tc.id && (
                        <code className="ml-2 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {tc.id.slice(0, 8)}...
                        </code>
                      )}
                    </h3>
                  </div>
                  {hasArgs ? (
                    <table className="min-w-full divide-y divide-border/50">
                      <tbody className="divide-y divide-border/50">
                        {Object.entries(args).map(([key, value], argIdx) => (
                          <tr key={argIdx}>
                            <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-foreground">
                              {key}
                            </td>
                            <td className="px-4 py-2 text-sm text-muted-foreground">
                              {isComplexValue(value) ? (
                                <code className="rounded bg-muted px-2 py-1 font-mono text-xs break-all">
                                  {JSON.stringify(value, null, 2)}
                                </code>
                              ) : (
                                String(value)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <code className="block p-3 text-sm text-muted-foreground">{"{}"}</code>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  const [isExpanded, setIsExpanded] = useState(false);

  let parsedContent: any;
  let isJsonContent = false;

  try {
    if (typeof message.content === "string") {
      parsedContent = JSON.parse(message.content);
      isJsonContent = isComplexValue(parsedContent);
    }
  } catch {
    // Content is not JSON, use as is
    parsedContent = message.content;
  }

  const contentStr = isJsonContent
    ? JSON.stringify(parsedContent, null, 2)
    : String(message.content);
  const contentLines = contentStr.split("\n");
  const shouldTruncate = contentLines.length > 4 || contentStr.length > 500;
  const displayedContent =
    shouldTruncate && !isExpanded
      ? contentStr.length > 500
        ? contentStr.slice(0, 500) + "..."
        : contentLines.slice(0, 4).join("\n") + "\n..."
      : contentStr;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Timeline 容器 - 与 ToolCalls 保持一致 */}
      <div className="relative pl-6 ml-3 border-l-2 border-green-500/30">
        <div className="relative">
          {/* Timeline 圆点指示器 - 绿色表示完成 */}
          <div className="absolute -left-[33px] top-3 w-4 h-4 rounded-full bg-green-500 border-2 border-green-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>

          {/* 工具结果卡片 */}
          <div className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm">
            <div className="border-b border-border/50 bg-green-50/50 dark:bg-green-950/20 px-4 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {message.name ? (
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <span className="text-xs text-green-600 dark:text-green-400">执行结果:</span>
                    <code className="rounded bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-green-700 dark:text-green-300">
                      {message.name}
                    </code>
                  </h3>
                ) : (
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <span className="text-xs text-green-600 dark:text-green-400">执行结果</span>
                  </h3>
                )}
                {message.tool_call_id && (
                  <code className="ml-2 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {message.tool_call_id.slice(0, 8)}...
                  </code>
                )}
              </div>
            </div>
            <motion.div
              className="min-w-full bg-muted/30"
              initial={false}
              animate={{ height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-3">
                <AnimatePresence
                  mode="wait"
                  initial={false}
                >
                  <motion.div
                    key={isExpanded ? "expanded" : "collapsed"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isJsonContent ? (
                      <table className="min-w-full divide-y divide-border/50">
                        <tbody className="divide-y divide-border/50">
                          {(Array.isArray(parsedContent)
                            ? isExpanded
                              ? parsedContent
                              : parsedContent.slice(0, 5)
                            : Object.entries(parsedContent)
                          ).map((item, argIdx) => {
                            const [key, value] = Array.isArray(parsedContent)
                              ? [argIdx, item]
                              : [item[0], item[1]];
                            return (
                              <tr key={argIdx}>
                                <td className="px-4 py-2 text-sm font-medium whitespace-nowrap text-foreground">
                                  {key}
                                </td>
                                <td className="px-4 py-2 text-sm text-muted-foreground">
                                  {isComplexValue(value) ? (
                                    <code className="rounded bg-muted px-2 py-1 font-mono text-xs break-all">
                                      {JSON.stringify(value, null, 2)}
                                    </code>
                                  ) : (
                                    String(value)
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <code className="block text-sm text-muted-foreground">{displayedContent}</code>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              {((shouldTruncate && !isJsonContent) ||
                (isJsonContent &&
                  Array.isArray(parsedContent) &&
                  parsedContent.length > 5)) && (
                <motion.button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 border-t border-border/50 py-2 text-muted-foreground transition-all duration-200 ease-in-out hover:bg-muted/50 hover:text-foreground"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span className="text-xs">收起</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span className="text-xs">展开详情</span>
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
