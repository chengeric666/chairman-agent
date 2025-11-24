import { SearchResult } from "@opencanvas/shared/types";
import { WebSearchState } from "../state.js";
import { getKnowledgeBaseClient } from "../../knowledge-base/client.js";

export async function search(
  state: WebSearchState
): Promise<Partial<WebSearchState>> {
  try {
    // 使用内部知识库代替外部搜索服务
    const kbClient = getKnowledgeBaseClient();

    // 获取用户查询
    const query = state.messages[state.messages.length - 1].content as string;

    // 执行知识库搜索
    const results = await kbClient.search({
      query,
      type: "vector",
      limit: 5,
      scoreThreshold: 0.3,
    });

    return {
      webSearchResults: results,
    };
  } catch (error) {
    console.error("Search from knowledge base failed:", error);
    // 降级处理：返回空结果而不是抛出错误
    return {
      webSearchResults: [],
    };
  }
}
