const actualNewline = `
`;

/**
 * 解码HTML实体 - 修复LLM有时输出HTML实体编码的问题
 * 例如: &lt; -> <, &gt; -> >, &quot; -> ", &amp; -> &
 */
export const decodeHtmlEntities = (content: string): string => {
  if (!content) return "";
  return content
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&"); // &amp; 必须放最后，避免重复解码
};

export const cleanContent = (content: string): string => {
  if (!content) return "";
  let cleaned = content.replace(/\\n/g, actualNewline);
  // 检测并解码HTML实体（针对HTML代码被错误编码的情况）
  if (cleaned.includes("&lt;") || cleaned.includes("&gt;")) {
    cleaned = decodeHtmlEntities(cleaned);
  }
  return cleaned;
};

export const reverseCleanContent = (content: string): string => {
  return content ? content.replaceAll(actualNewline, "\n") : "";
};

export const newlineToCarriageReturn = (str: string) =>
  // str.replace(actualNewline, "\r\n");
  str.replace(actualNewline, [actualNewline, actualNewline].join(""));

export const emptyLineCount = (content: string): number => {
  const liens = content.split("\n");
  return liens.filter((line) => line.trim() == "").length;
};
