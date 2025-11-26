/**
 * 数字化报告模板定义
 * 基于 80+ 专业样例和《可交互数字化报告设计方法论 V9》
 */

export type ReportTemplateId =
  | "strategic-insight"
  | "business-narrative"
  | "knowledge-system"
  | "profile-insight"
  | "consulting-analysis"
  | "ai-custom";

export interface ReportTemplate {
  id: ReportTemplateId;
  name: string;
  description: string;
  icon: string; // lucide-react 图标名
  color: string;
  features: string[];
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "strategic-insight",
    name: "战略洞察报告",
    description: "市场分析、战略规划、投资决策",
    icon: "Globe",
    color: "blue",
    features: ["D3地图", "MCDA模型", "战略卡片"],
  },
  {
    id: "business-narrative",
    name: "商业叙事报告",
    description: "企业发展史、行业演变、案例研究",
    icon: "Clock",
    color: "amber",
    features: ["时间轴", "演进图表", "历史脉络"],
  },
  {
    id: "knowledge-system",
    name: "知识体系报告",
    description: "培训材料、方法论指南、技术文档",
    icon: "BookOpen",
    color: "green",
    features: ["侧边导航", "代码块", "层级内容"],
  },
  {
    id: "profile-insight",
    name: "人物洞察报告",
    description: "人物专访、演讲精华、思想洞察",
    icon: "User",
    color: "purple",
    features: ["Apple风格", "大字引言", "极简设计"],
  },
  {
    id: "consulting-analysis",
    name: "咨询分析报告",
    description: "企业诊断、最佳实践、合规分析",
    icon: "BarChart3",
    color: "rose",
    features: ["多维对比", "数据双视", "指标卡片"],
  },
  {
    id: "ai-custom",
    name: "AI 自定义",
    description: "让 AI 根据您的内容自动设计最合适的报告风格",
    icon: "Sparkles",
    color: "violet",
    features: ["智能匹配", "创意设计", "灵活适配"],
  },
];

/**
 * 根据模板ID获取模板信息
 */
export const getReportTemplateById = (
  id: ReportTemplateId
): ReportTemplate | undefined => {
  return REPORT_TEMPLATES.find((t) => t.id === id);
};

/**
 * 获取报告初始HTML骨架
 * 模板ID嵌入在HTML注释中，供Agent识别使用的模板类型
 */
export const getReportInitialTemplate = (templateId: ReportTemplateId): string => {
  const template = getReportTemplateById(templateId);
  const templateName = template?.name || "数字化报告";

  const baseTemplate = `<!DOCTYPE html>
<!-- DIGITAL_REPORT_TEMPLATE: ${templateId} -->
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="report-template" content="${templateId}">
    <title>数字化报告 - ${templateName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Noto Sans SC', sans-serif; background-color: #f8fafc; color: #1f2937; }
        .card { background: white; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); transition: transform 0.3s, box-shadow 0.3s; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
        .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
        .fade-in.visible { opacity: 1; transform: translateY(0); }
        .glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); }
    </style>
</head>
<body class="antialiased">
    <!-- Header -->
    <header class="glass sticky top-0 z-50 border-b border-slate-200">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <span class="text-xl font-bold text-slate-800">报告标题</span>
            <nav class="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
                <a href="#section1" class="hover:text-blue-600 transition-colors">章节一</a>
                <a href="#section2" class="hover:text-blue-600 transition-colors">章节二</a>
            </nav>
        </div>
    </header>

    <!-- Hero Section -->
    <section class="text-center py-20 bg-gradient-to-b from-white to-slate-50">
        <div class="container mx-auto px-4">
            <h1 class="text-4xl md:text-5xl font-bold text-slate-800 mb-4">报告主标题</h1>
            <p class="text-xl text-slate-600 max-w-3xl mx-auto">副标题或简要描述，概述报告核心内容</p>
        </div>
    </section>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-12">
        <section id="section1" class="mb-16 fade-in">
            <div class="card p-8">
                <h2 class="text-2xl font-bold text-slate-800 mb-4">章节标题</h2>
                <p class="text-slate-600 leading-relaxed">内容占位符，请在此处填写报告内容...</p>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="bg-slate-800 text-slate-300 py-8">
        <div class="container mx-auto px-4 text-center">
            <p class="text-sm">© 2025 图灵环流 智能情报分析报告。保留所有权利。</p>
        </div>
    </footer>

    <script>
        // 滚动触发动画
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    </script>
</body>
</html>`;

  return baseTemplate;
};
