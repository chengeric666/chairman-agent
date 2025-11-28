/**
 * 洞察模板系统
 *
 * 根据 template_key 或 insight_type 选择对应的模板组件
 * 支持默认降级策略
 */

import { ComponentType } from 'react'
import { DefaultTemplate } from './DefaultTemplate'
import { PaperAnalysisTemplate } from './PaperAnalysisTemplate'
import { CoreInsightsTemplate } from './CoreInsightsTemplate'
import { RefinedSummaryTemplate } from './RefinedSummaryTemplate'
import { ReflectionQuestionsTemplate } from './ReflectionQuestionsTemplate'
import { ContentCatalogTemplate } from './ContentCatalogTemplate'
import { BriefSummaryTemplate } from './BriefSummaryTemplate'

// 模板组件 Props
export interface TemplateProps {
  content: string
  insightType: string
}

// template_key 类型定义
export type InsightTemplateKey =
  | 'paper_analysis'
  | 'core_insights'
  | 'refined_summary'
  | 'reflection_questions'
  | 'content_catalog'
  | 'brief_summary'

// 模板配置：组件 + 是否支持左侧 TOC
interface TemplateConfig {
  component: ComponentType<TemplateProps>
  supportsTOC: boolean  // 是否支持左侧目录导航
}

// 模板映射表（含配置）
const TEMPLATE_CONFIG_MAP: Record<string, TemplateConfig> = {
  // 按 template_key 映射
  'paper_analysis': { component: PaperAnalysisTemplate, supportsTOC: true },
  'core_insights': { component: CoreInsightsTemplate, supportsTOC: false },
  'refined_summary': { component: RefinedSummaryTemplate, supportsTOC: false },
  'reflection_questions': { component: ReflectionQuestionsTemplate, supportsTOC: false },
  'content_catalog': { component: ContentCatalogTemplate, supportsTOC: true },
  'brief_summary': { component: BriefSummaryTemplate, supportsTOC: false },
  // 按中文名称映射（向后兼容）
  '论文分析': { component: PaperAnalysisTemplate, supportsTOC: true },
  '核心洞见': { component: CoreInsightsTemplate, supportsTOC: false },
  '精炼摘要': { component: RefinedSummaryTemplate, supportsTOC: false },
  '反思问题': { component: ReflectionQuestionsTemplate, supportsTOC: false },
  '内容目录': { component: ContentCatalogTemplate, supportsTOC: true },
  '简明摘要': { component: BriefSummaryTemplate, supportsTOC: false },
}

// 默认配置
const DEFAULT_CONFIG: TemplateConfig = {
  component: DefaultTemplate,
  supportsTOC: true,
}

/**
 * 获取模板配置
 */
function getTemplateConfig(key?: string): TemplateConfig {
  if (!key) return DEFAULT_CONFIG

  const normalizedKey = key.toLowerCase().trim()

  // 先尝试精确匹配
  if (TEMPLATE_CONFIG_MAP[key]) {
    return TEMPLATE_CONFIG_MAP[key]
  }

  // 再尝试标准化后匹配
  if (TEMPLATE_CONFIG_MAP[normalizedKey]) {
    return TEMPLATE_CONFIG_MAP[normalizedKey]
  }

  return DEFAULT_CONFIG
}

/**
 * 获取对应的模板组件
 *
 * @param key - template_key 或 insight_type
 * @returns 对应的模板组件，未找到时返回 DefaultTemplate
 */
export function getTemplateComponent(key?: string): ComponentType<TemplateProps> {
  return getTemplateConfig(key).component
}

/**
 * 检查模板是否支持左侧 TOC 导航
 *
 * 自定义布局的模板（如 CoreInsights、RefinedSummary）不支持 TOC，
 * 因为它们重构了内容结构，原始标题 ID 不再存在
 */
export function templateSupportsTOC(key?: string): boolean {
  return getTemplateConfig(key).supportsTOC
}

/**
 * 清理内容中的元数据标记
 * 移除 AI 生成的字数标记，如 "(128字)"、"（总字数：726）" 等
 */
export function cleanContentMetadata(content: string): string {
  return content
    // 移除 (xxx字) 或 （xxx字）
    .replace(/[（(]\s*\d+\s*字\s*[）)]/g, '')
    // 移除 （总字数：xxx）
    .replace(/[（(]\s*总字数[：:]\s*\d+\s*[）)]/g, '')
    // 移除标题后的字数标记，如 "## 核心要点（378字）"
    .replace(/(##?\s+[^(\n]+)[（(]\d+字[）)]/g, '$1')
    // 清理多余空行
    .replace(/\n{3,}/g, '\n\n')
}

// 导出所有模板组件
export {
  DefaultTemplate,
  PaperAnalysisTemplate,
  CoreInsightsTemplate,
  RefinedSummaryTemplate,
  ReflectionQuestionsTemplate,
  ContentCatalogTemplate,
  BriefSummaryTemplate,
}
