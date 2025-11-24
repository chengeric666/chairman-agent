/**
 * 开智Canvas - 中文本地化配置
 * 品牌: 董智 (TuringFlow智能知识平台)
 * 目标用户: CEO、董事长等高管
 */

export const zhCNLocalization = {
  // ==================== 品牌和标题 ====================
  brand: {
    name: "董智Canvas",
    tagline: "AI驱动的协同创作平台",
    description: "基于知识库的智能写作助手，为高管思想提供专业的创作支持",
    appTitle: "开智Canvas - 董智协同创作系统",
  },

  // ==================== 主要功能模块 ====================
  modules: {
    webSearch: "知识库搜索",
    webSearchDesc: "从董智知识库中查询相关信息",
    openCanvas: "创作工作室",
    openCanvasDesc: "AI协助的文档编写和创意创作",
    generatePath: "生成创作路径",
    generatePathDesc: "根据需求自动规划创作策略",
    generateArtifact: "生成创作内容",
    generateArtifactDesc: "基于知识库生成高质量创作内容",
    reflect: "反思与优化",
    reflectDesc: "从用户反馈中学习和优化写作风格",
  },

  // ==================== 用户界面文本 ====================
  ui: {
    // 输入提示
    inputPlaceholder: "请输入您的创作主题或需求...",
    inputHint: "例如: 为'人才战略'写一篇高管观点文章",

    // 按钮
    search: "搜索",
    generate: "生成",
    write: "撰写",
    edit: "编辑",
    delete: "删除",
    save: "保存",
    cancel: "取消",
    confirm: "确认",
    submit: "提交",
    reset: "重置",
    clear: "清空",
    refresh: "刷新",
    download: "下载",
    share: "分享",
    copy: "复制",

    // 状态提示
    loading: "加载中...",
    searching: "正在搜索知识库...",
    generating: "正在生成内容...",
    processing: "处理中...",
    success: "操作成功",
    error: "发生错误",
    warning: "警告",
    info: "提示",

    // 结果相关
    results: "搜索结果",
    noResults: "未找到相关内容",
    resultCount: "共找到 {count} 条相关内容",
    relevance: "相关性: {score}%",
    source: "来源",
    date: "日期",
    author: "作者",

    // 表单标签
    title: "标题",
    topic: "主题",
    purpose: "创作目的",
    audience: "目标读者",
    style: "写作风格",
    keywords: "关键词",
    tags: "标签",
    category: "分类",
    content: "内容",
    draft: "草稿",
    final: "最终稿",
  },

  // ==================== 创作相关 ====================
  writing: {
    purpose: {
      analysis: "深度分析",
      strategy: "战略规划",
      summary: "知识总结",
      inspiration: "灵感启蒙",
      decision: "决策参考",
      communication: "对外传播",
      internal: "内部分享",
    },

    audience: {
      executives: "高管团队",
      employees: "全体员工",
      board: "董事会",
      investors: "投资者",
      partners: "战略合作伙伴",
      public: "社会大众",
    },

    style: {
      formal: "正式严谨",
      professional: "专业学术",
      conversational: "对话亲切",
      inspirational: "鼓舞激励",
      analytical: "分析深刻",
      narrative: "叙事生动",
    },

    suggestions: "创作建议",
    enhanceContent: "增强内容",
    improveStyle: "改进风格",
    relatedTopics: "相关话题",
    relatedSources: "相关知识源",
    styleAnalysis: "风格分析",
    contentQuality: "内容质量评估",
    readability: "可读性",
    coherence: "逻辑连贯性",
    depth: "内容深度",
  },

  // ==================== 知识库集成 ====================
  knowledge: {
    search: "知识库搜索",
    searchPlaceholder: "搜索创意、思想、案例等...",
    searchHint: "从董智知识库中获取灵感和参考",
    vector: "向量搜索",
    fulltext: "全文搜索",
    hybrid: "混合搜索",
    relevantKnowledge: "相关知识",
    relatedInsights: "相关洞察",
    context: "上下文",
    references: "参考资料",
    citedSources: "引用的源",
    insertReference: "插入参考",
    applyInsight: "应用洞察",

    filters: {
      all: "全部",
      documents: "文档",
      articles: "文章",
      meetings: "会议记录",
      insights: "洞察",
      strategies: "战略",
      cases: "案例",
    },
  },

  // ==================== Agent反馈 ====================
  agent: {
    analyzing: "正在分析您的需求...",
    searching: "正在搜索相关知识...",
    generating: "正在生成创作建议...",
    reflecting: "正在学习您的写作风格...",
    reasoning: "推理过程",
    nextSteps: "建议的后续步骤",
    learnedPatterns: "已学习的写作模式",
    styleProfile: "风格档案",
  },

  // ==================== 错误和警告 ====================
  errors: {
    networkError: "网络连接失败，请检查您的网络",
    timeoutError: "请求超时，请稍后重试",
    knowledgeBaseError: "知识库连接失败",
    generationError: "内容生成失败，请重试",
    emptyInput: "请输入创作需求",
    invalidInput: "输入内容不合法",
    serverError: "服务器错误，请稍后重试",
    authError: "认证失败，请重新登录",
    permissionError: "您没有权限执行此操作",
  },

  // ==================== 提示和帮助 ====================
  help: {
    gettingStarted: "快速开始",
    tutorial: "使用教程",
    faq: "常见问题",
    documentation: "完整文档",
    contact: "联系我们",
    feedback: "反馈意见",

    tips: {
      specificTopic: "提供明确的主题会获得更好的建议",
      defineAudience: "定义清楚目标读者有助于优化内容",
      useKeywords: "使用关键词可以获取更相关的知识",
      iterative: "通过迭代优化可以获得更好的结果",
    },
  },

  // ==================== 时间和日期 ====================
  time: {
    now: "现在",
    today: "今天",
    yesterday: "昨天",
    week: "本周",
    month: "本月",
    year: "今年",
    justNow: "刚刚",
    minutesAgo: "{n}分钟前",
    hoursAgo: "{n}小时前",
    daysAgo: "{n}天前",
  },

  // ==================== 统计和分析 ====================
  analytics: {
    wordCount: "字数",
    readingTime: "阅读时间",
    createdAt: "创建于",
    lastModified: "最后修改",
    author: "作者",
    version: "版本",
    progress: "进度",
    completion: "完成度",
    quality: "质量评分",
    engagement: "参与度",
  },

  // ==================== 协作相关 ====================
  collaboration: {
    sharing: "分享",
    "sharing desc": "与团队成员分享创作",
    comments: "评论",
    feedback: "反馈",
    review: "评审",
    suggest: "建议修改",
    versions: "版本历史",
    tracking: "变更跟踪",
    resolved: "已解决",
    pending: "待处理",
  },

  // ==================== 设置相关 ====================
  settings: {
    preferences: "偏好设置",
    language: "语言",
    theme: "主题",
    notifications: "通知",
    privacy: "隐私",
    dataManagement: "数据管理",
    api: "API密钥",
    integrations: "集成",
    about: "关于",
    version: "版本",
  },

  // ==================== 品牌信息 ====================
  brand_info: {
    title: "关于董智Canvas",
    description: `董智Canvas是一个为高管设计的协同创作平台。

    它结合了：
    • 高管思想知识库
    • AI驱动的创作助手
    • 个性化风格学习
    • 实时协作支持

    目的是帮助高管快速、高效地将思想转化为优质内容。`,
    vision: "让每位高管都能轻松地记录和分享自己的智慧",
    values: {
      intelligence: "智能 - AI驱动的创作辅助",
      personalization: "个性化 - 学习您的独特风格",
      collaboration: "协作 - 团队轻松配合",
      efficiency: "效率 - 快速高效的创作流程",
    },
  },
};

export default zhCNLocalization;
