'use client'

import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

// 生成标题的 anchor id（支持中文）
function generateHeadingId(text: React.ReactNode): string {
  const str = String(text)
  return str
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * MarkdownRenderer - 统一的 Markdown 渲染组件
 *
 * 特性：
 * - 支持 GFM (GitHub Flavored Markdown)：表格、任务列表、删除线等
 * - 优化的表格渲染：响应式、zebra 条纹、悬停高亮
 * - 清晰的标题层级和间距
 * - 支持暗色模式
 * - 可自定义样式变体
 */

export type MarkdownVariant = 'default' | 'compact' | 'article'

interface MarkdownRendererProps {
  /** Markdown 内容 */
  content: string
  /** 样式变体 */
  variant?: MarkdownVariant
  /** 额外的 className */
  className?: string
  /** 自定义组件覆盖 */
  components?: Components
  /** 自定义链接组件 */
  linkComponent?: Components['a']
}

// 基础表格组件 - 响应式 + zebra 条纹
const tableComponents: Partial<Components> = {
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/50">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border bg-background">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-muted/30 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-muted-foreground">
      {children}
    </td>
  ),
}

// 默认样式的组件
const defaultComponents: Partial<Components> = {
  ...tableComponents,
  // 标题 - 添加 id 支持 TOC 跳转
  h1: ({ children }) => (
    <h1 id={generateHeadingId(children)} className="text-2xl font-bold text-foreground mt-6 mb-4 pb-2 border-b border-border scroll-mt-20">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 id={generateHeadingId(children)} className="text-xl font-semibold text-foreground mt-5 mb-3 scroll-mt-20">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 id={generateHeadingId(children)} className="text-lg font-semibold text-foreground mt-4 mb-2 scroll-mt-20">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 id={generateHeadingId(children)} className="text-base font-medium text-foreground mt-3 mb-2 scroll-mt-20">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 id={generateHeadingId(children)} className="text-sm font-medium text-foreground mt-3 mb-2 scroll-mt-20">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 id={generateHeadingId(children)} className="text-sm font-medium text-muted-foreground mt-3 mb-2 scroll-mt-20">
      {children}
    </h6>
  ),
  // 列表
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-6 my-3 space-y-1.5">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-6 my-3 space-y-1.5">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-muted-foreground leading-relaxed">
      {children}
    </li>
  ),
  // 段落和强调
  p: ({ children }) => (
    <p className="my-3 leading-relaxed text-muted-foreground">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-muted-foreground">
      {children}
    </em>
  ),
  // 引用块
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground bg-muted/20 py-2 rounded-r">
      {children}
    </blockquote>
  ),
  // 代码
  code: ({ children, className }) => {
    const isInline = !className
    return isInline ? (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
        {children}
      </code>
    ) : (
      <code className="block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto">
      {children}
    </pre>
  ),
  // 分隔线
  hr: () => (
    <hr className="my-6 border-border" />
  ),
  // 链接
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2"
    >
      {children}
    </a>
  ),
}

// 紧凑样式（用于聊天消息等）
const compactComponents: Partial<Components> = {
  ...tableComponents,
  h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-medium mt-2 mb-1">{children}</h4>,
  p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-sm">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 my-2 text-sm italic">
      {children}
    </blockquote>
  ),
}

// 文章样式（用于长文阅读）
const articleComponents: Partial<Components> = {
  ...tableComponents,
  h1: ({ children }) => (
    <h1 id={generateHeadingId(children)} className="text-3xl font-bold text-foreground mt-8 mb-6 pb-3 border-b-2 border-primary/20 scroll-mt-20">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 id={generateHeadingId(children)} className="text-2xl font-semibold text-foreground mt-7 mb-4 scroll-mt-20">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 id={generateHeadingId(children)} className="text-xl font-semibold text-foreground mt-6 mb-3 scroll-mt-20">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 id={generateHeadingId(children)} className="text-lg font-medium text-foreground mt-5 mb-3 scroll-mt-20">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="my-4 leading-7 text-foreground/90">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-8 my-4 space-y-2">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-8 my-4 space-y-2">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-foreground/90 leading-7">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary pl-6 my-6 py-4 bg-muted/30 rounded-r-lg">
      {children}
    </blockquote>
  ),
}

// 样式变体映射
const variantStyles: Record<MarkdownVariant, string> = {
  default: 'prose prose-sm prose-neutral dark:prose-invert max-w-none',
  compact: 'prose prose-sm prose-neutral dark:prose-invert max-w-none text-sm',
  article: 'prose prose-neutral dark:prose-invert max-w-none prose-lg',
}

// 组件映射
const variantComponents: Record<MarkdownVariant, Partial<Components>> = {
  default: defaultComponents,
  compact: compactComponents,
  article: articleComponents,
}

export function MarkdownRenderer({
  content,
  variant = 'default',
  className,
  components: customComponents,
  linkComponent,
}: MarkdownRendererProps) {
  const baseComponents = variantComponents[variant]

  // 合并组件：基础组件 + 自定义组件 + 链接组件
  const mergedComponents: Components = {
    ...baseComponents,
    ...customComponents,
    ...(linkComponent ? { a: linkComponent } : {}),
  }

  return (
    <div className={cn(variantStyles[variant], className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={mergedComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// 导出组件类型，方便其他组件使用
export type { Components as MarkdownComponents }
