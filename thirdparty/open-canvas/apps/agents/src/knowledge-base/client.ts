/**
 * KnowledgeBaseClient - 知识库API客户端
 * 用于从内部知识库（Open-Notebook）检索信息
 * 替代外部搜索服务（如Exa、Firecrawl等）
 */

import { SearchResult } from "@opencanvas/shared/types";

export interface KnowledgeSearchOptions {
  query: string;
  type?: "vector" | "fulltext" | "hybrid";
  limit?: number;
  offset?: number;
  scoreThreshold?: number;
}

export interface KnowledgeSearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export class KnowledgeBaseClient {
  private apiUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(
    apiUrl: string = process.env.KNOWLEDGE_BASE_API_URL || "http://localhost:5055",
    apiKey: string = process.env.KNOWLEDGE_BASE_API_KEY || "chairman",
    timeout: number = 30000
  ) {
    this.apiUrl = apiUrl.replace(/\/$/, ""); // 移除末尾的斜杠
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  /**
   * 从知识库搜索相关内容
   * @param options 搜索选项
   * @returns 搜索结果
   */
  async search(options: KnowledgeSearchOptions): Promise<SearchResult[]> {
    try {
      const {
        query,
        type = "vector",
        limit = 5,
        offset = 0,
        scoreThreshold = 0.0,
      } = options;

      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
        offset: offset.toString(),
        type,
        ...(scoreThreshold > 0 && { threshold: scoreThreshold.toString() }),
      });

      const url = `${this.apiUrl}/api/search?${params.toString()}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `Knowledge base search failed: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        // 规范化返回结果为SearchResult[]格式
        if (data.results && Array.isArray(data.results)) {
          return data.results.map(
            (item: any): SearchResult => ({
              pageContent: item.content || item.text || "",
              metadata: {
                title: item.title || "Unknown",
                url: item.source_id || item.id || "",
                publishedDate: item.created_at || new Date().toISOString(),
                author: item.author || "Unknown",
                relevance: item.score || item.relevance || 0.5,
              },
            })
          );
        }

        return [];
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Knowledge base search timeout");
        }
        throw error;
      }
    } catch (error) {
      console.error("Knowledge base search error:", error);
      throw error;
    }
  }

  /**
   * 获取知识库源内容
   * @param sourceId 源ID
   * @returns 源内容
   */
  async getSourceContent(sourceId: string): Promise<string> {
    try {
      const url = `${this.apiUrl}/api/items/${sourceId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch source: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.content || data.text || "";
    } catch (error) {
      console.error("Failed to get source content:", error);
      throw error;
    }
  }

  /**
   * 健康检查 - 验证与知识库的连接
   * @returns 连接是否正常
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.apiUrl}/api/config`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      console.error("Knowledge base health check failed:", error);
      return false;
    }
  }

  /**
   * 获取知识库统计信息
   * @returns 统计数据
   */
  async getStats(): Promise<Record<string, any>> {
    try {
      const url = `${this.apiUrl}/api/stats`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch stats: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get stats:", error);
      return {};
    }
  }
}

/**
 * 获取或创建全局KnowledgeBaseClient实例
 */
let globalKnowledgeBaseClient: KnowledgeBaseClient | null = null;

export function getKnowledgeBaseClient(): KnowledgeBaseClient {
  if (!globalKnowledgeBaseClient) {
    globalKnowledgeBaseClient = new KnowledgeBaseClient();
  }
  return globalKnowledgeBaseClient;
}

export function createKnowledgeBaseClient(
  apiUrl?: string,
  apiKey?: string
): KnowledgeBaseClient {
  return new KnowledgeBaseClient(apiUrl, apiKey);
}
