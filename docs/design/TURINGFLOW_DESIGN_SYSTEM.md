# TuringFlow 设计系统

**品牌名称**: 董智 (TuringFlow智能知识平台)
**设计理念**: 流动、有机、专业、高端
**目标用户**: CEO、董事长等高管用户

---

## 🎨 核心设计原则

### 1. "环流"主题 (Circulation Theme)
- 所有设计元素应体现"流动"的概念
- 使用有机曲线而非直线
- 动画应该是自然的、流畅的，模拟水流
- 避免生硬的几何形状

### 2. 沉浸式体验 (Immersive Experience)
- 全屏幕宽度的背景元素
- 内容"漂浮"在流动的环境中
- 多层次的视觉深度
- 微妙的动画增强氛围感

### 3. 专业与高端 (Professional & Premium)
- 浅色主题，高对比度文字
- 简洁清晰的界面
- 精致的细节处理
- 适合中老年高管用户的可读性

---

## 🌈 颜色系统

### 主色调 (Primary Colors)
```css
/* Cyan/Teal 系列 - 代表流动、清新 */
--flow-cyan-light: #06b6d4
--flow-cyan: #0ea5e9
--flow-teal: #14b8a6

/* Blue 系列 - 代表科技、专业 */
--flow-blue-light: #3b82f6
--flow-blue: #2563eb
--flow-blue-dark: #1e40af

/* Indigo/Purple 系列 - 代表深度、智慧 */
--flow-indigo: #6366f1
--flow-purple: #8b5cf6
--flow-purple-light: #a855f7
```

### 背景色 (Background Colors)
```css
/* 主背景 - 浅色渐变 */
--bg-primary: linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f8fafc 100%)
--bg-slate-50: #f8fafc
--bg-blue-50: #eff6ff

/* 卡片背景 - 半透明白色 */
--bg-card: rgba(255, 255, 255, 0.9)
--bg-card-hover: rgba(255, 255, 255, 0.95)
```

### 文字色 (Text Colors)
```css
/* 主文字 - 深灰，高对比度 */
--text-primary: #0f172a (slate-900)
--text-secondary: #475569 (slate-600)
--text-muted: #94a3b8 (slate-400)

/* 强调色 */
--text-accent-blue: #2563eb
--text-accent-green: #15803d (安全提示)
```

### 功能色 (Functional Colors)
```css
/* 成功/安全 */
--success-green: #22c55e
--success-dark: #15803d

/* 错误/警告 */
--error-red: #ef4444
--error-bg: #fef2f2

/* 边框 */
--border-light: rgba(226, 232, 240, 0.6) (slate-200/60)
--border-focus: #3b82f6
```

---

## 📝 字体系统

### 字体家族
```css
/* 主字体 - Inter (现代科技感) */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif

/* 中文字体 - Noto Sans SC (备选) */
--font-chinese: 'Noto Sans SC', sans-serif

/* 品牌字体设置 */
.tech-font {
  font-family: var(--font-primary);
  letter-spacing: -0.01em; /* 紧凑现代感 */
}
```

### 字体大小
```css
/* 品牌标题 - 董智 */
--text-brand: 3rem (48px)

/* 页面标题 */
--text-title: 1.5rem (24px)
--text-subtitle: 1rem (16px)

/* 正文 */
--text-base: 0.875rem (14px)
--text-small: 0.75rem (12px)
```

### 字重
```css
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

---

## 🌊 有机曲线系统 (Organic Curves)

### SVG 曲线模板

#### 1. 全屏顶部波浪 (Top Wave)
```jsx
<svg className="absolute top-0 left-0 w-full h-1/3 opacity-40" viewBox="0 0 1200 400" preserveAspectRatio="none">
  <defs>
    <linearGradient id="top-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.4 }} />
      <stop offset="50%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.3 }} />
      <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.25 }} />
    </linearGradient>
  </defs>
  <path d="M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z" fill="url(#top-gradient)">
    <animate
      attributeName="d"
      dur="12s"
      repeatCount="indefinite"
      values="
        M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z;
        M0,0 L0,200 Q300,240 600,220 T1200,200 L1200,0 Z;
        M0,0 L0,240 Q300,280 600,260 T1200,240 L1200,0 Z;
        M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z
      "
    />
  </path>
</svg>
```

#### 2. 全屏底部波浪 (Bottom Wave)
```jsx
<svg className="absolute bottom-0 left-0 w-full h-1/3 opacity-35" viewBox="0 0 1200 400" preserveAspectRatio="none">
  <defs>
    <linearGradient id="bottom-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.3 }} />
      <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.25 }} />
      <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.2 }} />
    </linearGradient>
  </defs>
  <path d="M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z" fill="url(#bottom-gradient)">
    <animate
      attributeName="d"
      dur="18s"
      repeatCount="indefinite"
      values="
        M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z;
        M0,400 L0,160 Q300,120 600,140 T1200,160 L1200,400 Z;
        M0,400 L0,200 Q300,160 600,180 T1200,200 L1200,400 Z;
        M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z
      "
    />
  </path>
</svg>
```

#### 3. 左侧垂直装饰曲线 (Left Accent)
```jsx
<svg className="absolute left-0 top-1/4 h-1/2 w-1/6 opacity-25" viewBox="0 0 200 600" preserveAspectRatio="none">
  <defs>
    <linearGradient id="left-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style={{ stopColor: '#14b8a6', stopOpacity: 0.35 }} />
      <stop offset="50%" style={{ stopColor: '#06b6d4', stopOpacity: 0.25 }} />
      <stop offset="100%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.15 }} />
    </linearGradient>
  </defs>
  <path d="M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z" fill="url(#left-gradient)">
    <animate
      attributeName="d"
      dur="15s"
      repeatCount="indefinite"
      values="
        M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z;
        M0,0 Q80,150 100,300 Q80,450 0,600 L0,0 Z;
        M0,0 Q90,150 70,300 Q70,450 0,600 L0,0 Z;
        M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z
      "
    />
  </path>
</svg>
```

#### 4. 右侧垂直装饰曲线 (Right Accent)
```jsx
<svg className="absolute right-0 top-1/3 h-2/5 w-1/8 opacity-20" viewBox="0 0 150 500" preserveAspectRatio="none">
  <defs>
    <linearGradient id="right-gradient" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.3 }} />
      <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.15 }} />
    </linearGradient>
  </defs>
  <path d="M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z" fill="url(#right-gradient)">
    <animate
      attributeName="d"
      dur="20s"
      repeatCount="indefinite"
      values="
        M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z;
        M150,0 Q70,125 50,250 Q70,375 150,500 L150,0 Z;
        M150,0 Q60,125 80,250 Q80,375 150,500 L150,0 Z;
        M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z
      "
    />
  </path>
</svg>
```

#### 5. 流动下划线 (Flowing Underline)
```jsx
<svg className="absolute -bottom-1 left-0 w-full h-2" viewBox="0 0 100 8" preserveAspectRatio="none">
  <defs>
    <linearGradient id="underline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
      <stop offset="50%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
      <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
    </linearGradient>
  </defs>
  <path d="M0,4 Q25,2 50,4 T100,4" stroke="url(#underline-gradient)" strokeWidth="2" fill="none">
    <animate
      attributeName="d"
      dur="4s"
      repeatCount="indefinite"
      values="
        M0,4 Q25,2 50,4 T100,4;
        M0,4 Q25,6 50,4 T100,4;
        M0,4 Q25,2 50,4 T100,4
      "
    />
  </path>
</svg>
```

---

## 🎬 动画系统

### 关键帧动画

#### 1. 淡入上滑 (Fade Slide Up)
```css
@keyframes fade-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-animate {
  animation: fade-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.login-animate-delay {
  opacity: 0;
  animation: fade-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.2s;
}
```

#### 2. 脉冲光晕 (Pulse Glow)
```css
@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(34, 197, 94, 0.6));
  }
}

/* 用于安全提示图标 */
.security-badge {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

#### 3. 有机漂浮 (Organic Float)
```css
@keyframes float-slow {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(30px, -30px) rotate(3deg);
  }
  66% {
    transform: translate(-20px, -15px) rotate(-2deg);
  }
}

@keyframes float-slower {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-40px, 20px) scale(1.05);
  }
}

.organic-shape-1 {
  animation: float-slow 20s ease-in-out infinite;
}

.organic-shape-2 {
  animation: float-slower 25s ease-in-out infinite;
  animation-delay: -5s;
}
```

### 动画时长指南
- **快速反馈**: 150-300ms (按钮悬停、输入框聚焦)
- **页面转场**: 400-600ms (页面元素淡入)
- **环境动画**: 10-25s (背景流动效果)
- **缓动函数**: `cubic-bezier(0.16, 1, 0.3, 1)` (自然平滑)

---

## 🏗️ 布局系统

### 容器规格
```css
/* 页面容器 */
.page-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止背景SVG溢出 */
}

/* 内容容器 */
.content-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-center;
  padding: 1.5rem;
  position: relative;
  z-index: 10; /* 高于背景SVG */
}

/* 卡片容器 */
.card-container {
  width: 100%;
  max-width: 28rem; /* 448px */
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.6);
  border-radius: 0.5rem;
}
```

### 间距系统
```css
/* 基于 4px 网格 */
--spacing-1: 0.25rem  /* 4px */
--spacing-2: 0.5rem   /* 8px */
--spacing-3: 0.75rem  /* 12px */
--spacing-4: 1rem     /* 16px */
--spacing-5: 1.25rem  /* 20px */
--spacing-6: 1.5rem   /* 24px */
--spacing-8: 2rem     /* 32px */
--spacing-12: 3rem    /* 48px */
```

---

## 🧩 组件样式

### 按钮 (Button)
```jsx
// 主按钮 - 渐变蓝色
<Button className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white tech-font font-medium shadow-md hover:shadow-lg transition-all duration-200">
  登录
</Button>

// 次要按钮 - 边框
<Button variant="outline" className="w-full justify-start gap-3">
  <LogOut className="h-4 w-4" />
  退出登录
</Button>
```

### 输入框 (Input)
```jsx
<Input
  className="h-11 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 tech-font focus:border-blue-500 input-elegant-focus transition-all duration-300"
  placeholder="请输入密码"
/>

// 聚焦样式
.input-elegant-focus:focus {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(59, 130, 246, 0.12),
    0 1px 3px rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
}
```

### 卡片 (Card)
```jsx
<Card className="bg-white/90 backdrop-blur-sm shadow-2xl border border-slate-200/60 overflow-hidden relative">
  {/* 顶部流动装饰线 */}
  <svg className="absolute top-0 left-0 w-full h-2" viewBox="0 0 400 8">
    {/* ... 流动线条 SVG ... */}
  </svg>

  <CardHeader className="space-y-1 pb-4 pt-6">
    <CardTitle className="text-2xl text-slate-900 tech-font font-semibold">
      标题
    </CardTitle>
  </CardHeader>

  <CardContent className="pb-6">
    {/* 内容 */}
  </CardContent>
</Card>
```

### Logo + 品牌组合
```jsx
<div className="flex items-center justify-center gap-4 mb-6">
  <img
    src="/turingflow-logo.png"
    alt="TuringFlow"
    className="h-14 w-auto"
  />
  <div className="relative">
    <h1 className="text-5xl font-bold text-slate-900 tech-font tracking-tight">
      董智
    </h1>
    {/* 流动下划线 */}
    <svg className="absolute -bottom-1 left-0 w-full h-2" viewBox="0 0 100 8">
      {/* ... 流动下划线 SVG ... */}
    </svg>
  </div>
</div>
```

### 安全徽章 (Security Badge)
```jsx
<div className="flex items-center justify-center gap-3 text-sm">
  <div className="flex items-center gap-2 text-green-700 font-medium tech-font"
       style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
    <Shield className="h-4 w-4" />
    <span>安全登录</span>
  </div>
  <div className="w-px h-4 bg-slate-300"></div>
  <div className="flex items-center gap-2 text-slate-600 tech-font">
    <Lock className="h-4 w-4" />
    <span>数据加密</span>
  </div>
</div>
```

---

## 📐 设计模式

### 1. 沉浸式流动背景
**使用场景**: 全屏登录页、欢迎页、介绍页

**结构**:
```jsx
<div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 relative overflow-hidden">
  {/* 顶部全屏波浪 */}
  {/* 底部全屏波浪 */}
  {/* 左侧垂直装饰 */}
  {/* 右侧垂直装饰 */}

  <div className="flex-1 flex items-center justify-center p-6 relative z-10">
    {/* 主要内容 */}
  </div>

  <Footer />
</div>
```

### 2. 卡片悬浮布局
**使用场景**: 内容卡片、表单容器

**特点**:
- 半透明白色背景 (`bg-white/90`)
- 毛玻璃效果 (`backdrop-blur-sm`)
- 柔和阴影 (`shadow-2xl`)
- 细边框 (`border-slate-200/60`)

### 3. 品牌标识展示
**使用场景**: Logo + 中文品牌名组合

**特点**:
- 水平排列 (`flex items-center gap-4`)
- Logo 高度固定 (`h-14`)
- 品牌名大字号 (`text-5xl`)
- 流动下划线装饰

---

## 🎯 响应式设计

### 断点系统
```css
/* Tailwind 默认断点 */
sm: 640px   /* 手机横屏 */
md: 768px   /* 平板 */
lg: 1024px  /* 笔记本 */
xl: 1280px  /* 桌面 */
2xl: 1536px /* 大屏 */
```

### 移动端适配
```jsx
// 间距调整
<div className="p-4 md:p-6 lg:p-8">

// 字体调整
<h1 className="text-3xl md:text-4xl lg:text-5xl">

// 隐藏/显示
<div className="hidden md:block">  // 移动端隐藏
<div className="md:hidden">        // 桌面端隐藏
```

---

## ♿ 可访问性

### 对比度
- 主文字对比度: 至少 7:1 (WCAG AAA)
- 次要文字对比度: 至少 4.5:1 (WCAG AA)

### 焦点指示
```css
.input-elegant-focus:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  border-color: #3b82f6;
}
```

### 语义化
- 使用 `<button>` 而非 `<div onClick>`
- 使用 `aria-label` 描述图标按钮
- 使用 `<main>`, `<header>`, `<footer>` 等语义标签

---

## 📦 资源清单

### 图片资源
- `/turingflow-logo.png` - TuringFlow 品牌 Logo (蓝色剑鱼)

### 字体资源
- Google Fonts: Inter (主字体)
- 备选: Noto Sans SC (中文)

### 图标库
- Lucide React (现代、一致的图标)

---

## 🔧 技术栈

- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS
- **组件**: shadcn/ui
- **图标**: Lucide React
- **字体**: Google Fonts (Inter)

---

## 📝 使用示例

完整的登录页面代码请参考:
- `/thirdparty/open-notebook/frontend/src/components/auth/LoginForm.tsx`

其他应用此设计系统的组件:
- `/thirdparty/open-notebook/frontend/src/components/layout/AppSidebar.tsx`
- `/thirdparty/open-notebook/frontend/src/components/layout/Footer.tsx`

---

## 🚀 快速开始

### 1. 应用全局样式
```jsx
// 在页面顶部添加
<style jsx global>{`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  .tech-font {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    letter-spacing: -0.01em;
  }

  /* 复制动画关键帧 */
  @keyframes fade-slide-up { /* ... */ }
  @keyframes pulse-glow { /* ... */ }
  /* ... 更多动画 ... */
`}</style>
```

### 2. 添加沉浸式背景
```jsx
<div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 relative overflow-hidden">
  {/* 复制 4 个 SVG 背景元素 */}
  {/* 顶部波浪 */}
  {/* 底部波浪 */}
  {/* 左侧装饰 */}
  {/* 右侧装饰 */}

  <div className="flex-1 flex items-center justify-center p-6 relative z-10">
    {/* 您的内容 */}
  </div>
</div>
```

### 3. 添加品牌元素
```jsx
<div className="flex items-center justify-center gap-4 mb-6">
  <img src="/turingflow-logo.png" alt="TuringFlow" className="h-14 w-auto" />
  <div className="relative">
    <h1 className="text-5xl font-bold text-slate-900 tech-font tracking-tight">董智</h1>
    {/* 流动下划线 SVG */}
  </div>
</div>
```

---

**版本**: 1.0.0
**最后更新**: 2025-11-23
**维护者**: Claude (Anthropic)
