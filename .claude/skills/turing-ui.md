# TuringUI - TuringFlow Design System Skill

**Skill Name**: turing-ui
**Version**: 1.0.0
**Description**: 应用TuringFlow设计系统创建专业、流动、高端的UI组件和页面
**Target Users**: CEO、董事长等高管用户
**Design Philosophy**: 流动 (Flow)、有机 (Organic)、专业 (Professional)、高端 (Premium)

---

## 何时使用此 Skill

当你需要创建或优化以下内容时，使用此 skill：

- ✅ 登录页、欢迎页等全屏页面
- ✅ 需要TuringFlow品牌风格的组件
- ✅ 需要有机流动效果的背景
- ✅ 需要专业高端UI的表单、卡片、按钮等
- ✅ 需要适配中老年高管用户的界面（高对比度、清晰可读）

**不适用场景**:
- ❌ 需要深色主题的界面
- ❌ 需要极简无装饰的界面
- ❌ 移动端优先的界面

---

## 设计原则

在使用此 skill 时，始终遵循以下原则：

### 1. 环流主题 (Circulation)
- 所有装饰元素必须使用有机曲线，禁止使用直线
- 使用SVG path的Bezier曲线 (Q, C命令)
- 添加自然流动的动画 (12-25秒循环)

### 2. 沉浸式体验
- 背景元素横跨整个屏幕宽度
- 使用顶部波浪 + 底部波浪 + 左右装饰的4层结构
- 内容"漂浮"在流动环境中 (z-index: 10)

### 3. 专业与高端
- 浅色主题 (bg-slate-50, bg-blue-50/30)
- 高对比度深色文字 (text-slate-900)
- 半透明白色卡片 (bg-white/90, backdrop-blur)
- 精致的阴影和边框

---

## 核心组件库

### 1. 沉浸式流动背景 (Immersive Flow Background)

**使用场景**: 全屏页面的背景层

**代码模板**:
```tsx
<div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 relative overflow-hidden">
  {/* === 顶部全屏波浪 - 天空流动 === */}
  <svg className="absolute top-0 left-0 w-full h-1/3 opacity-40 organic-shape-1" viewBox="0 0 1200 400" preserveAspectRatio="none">
    <defs>
      <linearGradient id="top-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.4 }} />
        <stop offset="50%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.3 }} />
        <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.25 }} />
      </linearGradient>
    </defs>
    <path d="M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z" fill="url(#top-gradient)">
      <animate attributeName="d" dur="12s" repeatCount="indefinite"
        values="M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z;
                M0,0 L0,200 Q300,240 600,220 T1200,200 L1200,0 Z;
                M0,0 L0,240 Q300,280 600,260 T1200,240 L1200,0 Z;
                M0,0 L0,220 Q300,260 600,240 T1200,220 L1200,0 Z" />
    </path>
  </svg>

  {/* === 底部全屏波浪 - 大地流动 === */}
  <svg className="absolute bottom-0 left-0 w-full h-1/3 opacity-35 organic-shape-2" viewBox="0 0 1200 400" preserveAspectRatio="none">
    <defs>
      <linearGradient id="bottom-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.3 }} />
        <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.25 }} />
        <stop offset="100%" style={{ stopColor: '#a855f7', stopOpacity: 0.2 }} />
      </linearGradient>
    </defs>
    <path d="M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z" fill="url(#bottom-gradient)">
      <animate attributeName="d" dur="18s" repeatCount="indefinite"
        values="M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z;
                M0,400 L0,160 Q300,120 600,140 T1200,160 L1200,400 Z;
                M0,400 L0,200 Q300,160 600,180 T1200,200 L1200,400 Z;
                M0,400 L0,180 Q300,140 600,160 T1200,180 L1200,400 Z" />
    </path>
  </svg>

  {/* === 左侧垂直装饰曲线 - 视觉平衡 === */}
  <svg className="absolute left-0 top-1/4 h-1/2 w-1/6 opacity-25" viewBox="0 0 200 600" preserveAspectRatio="none">
    <defs>
      <linearGradient id="left-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#14b8a6', stopOpacity: 0.35 }} />
        <stop offset="50%" style={{ stopColor: '#06b6d4', stopOpacity: 0.25 }} />
        <stop offset="100%" style={{ stopColor: '#0ea5e9', stopOpacity: 0.15 }} />
      </linearGradient>
    </defs>
    <path d="M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z" fill="url(#left-gradient)">
      <animate attributeName="d" dur="15s" repeatCount="indefinite"
        values="M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z;
                M0,0 Q80,150 100,300 Q80,450 0,600 L0,0 Z;
                M0,0 Q90,150 70,300 Q70,450 0,600 L0,0 Z;
                M0,0 Q100,150 80,300 Q60,450 0,600 L0,0 Z" />
    </path>
  </svg>

  {/* === 右侧垂直装饰曲线 - 视觉平衡 === */}
  <svg className="absolute right-0 top-1/3 h-2/5 w-1/8 opacity-20" viewBox="0 0 150 500" preserveAspectRatio="none">
    <defs>
      <linearGradient id="right-gradient" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.3 }} />
        <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.15 }} />
      </linearGradient>
    </defs>
    <path d="M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z" fill="url(#right-gradient)">
      <animate attributeName="d" dur="20s" repeatCount="indefinite"
        values="M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z;
                M150,0 Q70,125 50,250 Q70,375 150,500 L150,0 Z;
                M150,0 Q60,125 80,250 Q80,375 150,500 L150,0 Z;
                M150,0 Q50,125 70,250 Q90,375 150,500 L150,0 Z" />
    </path>
  </svg>

  {/* === 主内容区域 === */}
  <div className="flex-1 flex items-center justify-center p-6 relative z-10">
    {/* 在这里放置您的内容 */}
  </div>
</div>
```

**CSS动画支持** (添加到 `<style jsx global>`):
```css
@keyframes float-slow {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -30px) rotate(3deg); }
  66% { transform: translate(-20px, -15px) rotate(-2deg); }
}

@keyframes float-slower {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-40px, 20px) scale(1.05); }
}

.organic-shape-1 {
  animation: float-slow 20s ease-in-out infinite;
}

.organic-shape-2 {
  animation: float-slower 25s ease-in-out infinite;
  animation-delay: -5s;
}
```

---

### 2. 品牌标识组合 (Logo + Brand)

**使用场景**: 页面顶部的品牌展示

**代码模板**:
```tsx
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
    <svg className="absolute -bottom-1 left-0 w-full h-2" viewBox="0 0 100 8" preserveAspectRatio="none">
      <defs>
        <linearGradient id="underline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
          <stop offset="50%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d="M0,4 Q25,2 50,4 T100,4" stroke="url(#underline-gradient)" strokeWidth="2" fill="none">
        <animate attributeName="d" dur="4s" repeatCount="indefinite"
          values="M0,4 Q25,2 50,4 T100,4;
                  M0,4 Q25,6 50,4 T100,4;
                  M0,4 Q25,2 50,4 T100,4" />
      </path>
    </svg>
  </div>
</div>

<p className="text-center text-sm text-slate-500 tech-font mb-8 font-medium">
  智能知识管理平台
</p>
```

---

### 3. 漂浮卡片 (Floating Card)

**使用场景**: 表单容器、内容卡片

**代码模板**:
```tsx
<Card className="bg-white/90 backdrop-blur-sm shadow-2xl border border-slate-200/60 overflow-hidden relative">
  {/* 顶部流动装饰线 */}
  <svg className="absolute top-0 left-0 w-full h-2" viewBox="0 0 400 8" preserveAspectRatio="none">
    <defs>
      <linearGradient id="card-accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
        <stop offset="50%" style={{ stopColor: '#6366f1', stopOpacity: 0.6 }} />
        <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.3 }} />
      </linearGradient>
    </defs>
    <path d="M0,4 Q100,2 200,4 T400,4" stroke="url(#card-accent)" strokeWidth="3" fill="none">
      <animate attributeName="d" dur="5s" repeatCount="indefinite"
        values="M0,4 Q100,2 200,4 T400,4;
                M0,4 Q100,6 200,4 T400,4;
                M0,4 Q100,2 200,4 T400,4" />
    </path>
  </svg>

  <CardHeader className="space-y-1 pb-4 pt-6">
    <CardTitle className="text-2xl text-slate-900 tech-font font-semibold">
      标题
    </CardTitle>
    <CardDescription className="text-sm text-slate-600 tech-font">
      描述文字
    </CardDescription>
  </CardHeader>

  <CardContent className="pb-6">
    {/* 卡片内容 */}
  </CardContent>
</Card>
```

---

### 4. 渐变按钮 (Gradient Button)

**使用场景**: 主要操作按钮

**代码模板**:
```tsx
{/* 主按钮 - 蓝色渐变 */}
<Button
  type="submit"
  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white tech-font font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
  disabled={isLoading}
>
  {isLoading ? (
    <span className="flex items-center gap-2 justify-center">
      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      处理中...
    </span>
  ) : '确定'}
</Button>

{/* 次要按钮 - 边框样式 */}
<Button
  variant="outline"
  className="w-full justify-start gap-3 text-slate-700 hover:bg-slate-100"
>
  <Icon className="h-4 w-4" />
  次要操作
</Button>
```

---

### 5. 优雅输入框 (Elegant Input)

**使用场景**: 表单输入

**代码模板**:
```tsx
<Input
  type="text"
  placeholder="请输入..."
  className="h-11 bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 tech-font focus:border-blue-500 input-elegant-focus transition-all duration-300"
/>
```

**CSS聚焦样式**:
```css
.input-elegant-focus:focus {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(59, 130, 246, 0.12),
    0 1px 3px rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
}
```

---

### 6. 安全徽章 (Security Badge)

**使用场景**: 安全提示、信任指标

**代码模板**:
```tsx
<div className="pt-4 border-t border-slate-200">
  <div className="flex items-center justify-center gap-3 text-sm">
    {/* 主要安全指标 - 带脉冲动画 */}
    <div
      className="flex items-center gap-2 text-green-700 font-medium tech-font"
      style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
    >
      <Shield className="h-4 w-4" />
      <span>安全登录</span>
    </div>

    {/* 分隔线 */}
    <div className="w-px h-4 bg-slate-300"></div>

    {/* 次要指标 */}
    <div className="flex items-center gap-2 text-slate-600 tech-font">
      <Lock className="h-4 w-4" />
      <span>数据加密</span>
    </div>
  </div>
</div>
```

**CSS脉冲光晕动画**:
```css
@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(34, 197, 94, 0.6));
  }
}
```

---

### 7. 淡入动画 (Fade-in Animation)

**使用场景**: 页面加载时的元素动画

**代码模板**:
```tsx
{/* 第一个元素 - 无延迟 */}
<div className={`${mounted ? 'login-animate' : 'opacity-0'}`}>
  {/* 内容 */}
</div>

{/* 第二个元素 - 0.2s延迟 */}
<div className={`${mounted ? 'login-animate-delay' : 'opacity-0'}`}>
  {/* 内容 */}
</div>
```

**React状态管理**:
```tsx
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])
```

**CSS动画**:
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

---

## 完整页面模板

### 登录页面模板

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock } from 'lucide-react'

export function TuringUILoginPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .tech-font {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          letter-spacing: -0.01em;
        }

        @keyframes fade-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.4)); }
          50% { filter: drop-shadow(0 0 16px rgba(34, 197, 94, 0.6)); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(3deg); }
          66% { transform: translate(-20px, -15px) rotate(-2deg); }
        }

        @keyframes float-slower {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 20px) scale(1.05); }
        }

        .login-animate {
          animation: fade-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .login-animate-delay {
          opacity: 0;
          animation: fade-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.2s;
        }

        .organic-shape-1 {
          animation: float-slow 20s ease-in-out infinite;
        }

        .organic-shape-2 {
          animation: float-slower 25s ease-in-out infinite;
          animation-delay: -5s;
        }

        .input-elegant-focus:focus {
          outline: none;
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.12),
            0 1px 3px rgba(59, 130, 246, 0.2);
          border-color: #3b82f6;
        }
      `}</style>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 relative overflow-hidden">
        {/* [沉浸式流动背景 - 复制上面的4个SVG] */}

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="w-full max-w-md">
            {/* [品牌标识 - 复制上面的Logo+Brand组合] */}

            {/* [漂浮卡片 - 复制上面的Card模板] */}
          </div>
        </div>
      </div>
    </>
  )
}
```

---

## 颜色快速参考

```tsx
// 渐变背景
className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50"

// 卡片
className="bg-white/90 backdrop-blur-sm shadow-2xl border border-slate-200/60"

// 主文字
className="text-slate-900"

// 次要文字
className="text-slate-600"

// 弱化文字
className="text-slate-400"

// 主按钮
className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"

// 边框
className="border border-slate-300"

// 聚焦边框
className="focus:border-blue-500"
```

---

## 使用说明

### 1. 快速开始

当用户请求创建TuringFlow风格的页面时：

1. **评估需求**: 确定是全屏页面还是组件级别
2. **选择模板**: 从上面的组件库选择合适的模板
3. **组合应用**: 将沉浸式背景 + 品牌标识 + 卡片等组合
4. **调整细节**: 根据具体需求调整文案、间距等

### 2. 自定义指南

**修改颜色**:
- 顶部波浪: 修改 `#06b6d4`, `#0ea5e9`, `#3b82f6` (保持cyan→blue渐变)
- 底部波浪: 修改 `#6366f1`, `#8b5cf6`, `#a855f7` (保持indigo→purple渐变)

**修改动画速度**:
- 快速流动: `dur="8s"`
- 标准流动: `dur="12s"` (推荐)
- 缓慢流动: `dur="20s"`

**修改不透明度**:
- 顶部波浪: `opacity-40` (推荐 30-50)
- 底部波浪: `opacity-35` (推荐 25-45)
- 左侧装饰: `opacity-25` (推荐 20-30)
- 右侧装饰: `opacity-20` (推荐 15-25)

### 3. 响应式处理

移动端适配建议:
```tsx
{/* 隐藏左右装饰曲线 */}
<svg className="hidden lg:block absolute left-0 ...">

{/* 调整品牌字号 */}
<h1 className="text-3xl md:text-4xl lg:text-5xl">

{/* 调整间距 */}
<div className="p-4 md:p-6">
```

---

## 完整文件参考

详细的设计系统文档请查看:
**`/thirdparty/open-notebook/TURINGFLOW_DESIGN_SYSTEM.md`**

参考实现:
**`/thirdparty/open-notebook/frontend/src/components/auth/LoginForm.tsx`**

---

## 关键要点总结

✅ **必须遵守**:
- 使用有机Bezier曲线，禁止直线
- 全屏宽度的顶部和底部波浪
- 浅色主题 + 高对比度文字
- Inter字体 + tech-font类
- 半透明白色卡片 + backdrop-blur

✅ **推荐使用**:
- 12-25秒的自然流动动画
- 淡入上滑的页面加载动画
- 脉冲光晕的安全徽章
- 流动下划线装饰品牌名

❌ **避免**:
- 直线和硬边
- 深色背景
- 过于花哨的动画
- 低对比度配色

---

**版本**: 1.0.0
**创建时间**: 2025-11-23
**维护者**: Claude (Anthropic)
**设计系统**: TuringFlow Design System v1.0.0
