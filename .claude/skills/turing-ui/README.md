# TuringUI - TuringFlow Design System Skill

<div align="center">
  <img src="./assets/logo.png" alt="TuringFlow Logo" width="120" />
  <h3>专业、流动、高端的 UI 设计系统</h3>
  <p>为 CEO、董事长等高管用户打造的沉浸式界面体验</p>
</div>

---

## 📖 快速开始

### 何时使用此 Skill

✅ **适用场景**:
- 登录页、欢迎页等全屏页面
- 需要 TuringFlow 品牌风格的组件
- 需要有机流动效果的背景
- 需要专业高端 UI 的表单、卡片、按钮
- 需要适配中老年高管用户的界面（高对比度、清晰可读）

❌ **不适用场景**:
- 深色主题的界面
- 极简无装饰的界面
- 移动端优先的界面

---

## 🎨 设计原则

### 1. 环流主题 (Circulation)
- ✓ 所有装饰元素使用有机曲线，禁止直线
- ✓ 使用 SVG Bezier 曲线 (Q, C 命令)
- ✓ 添加自然流动的动画 (12-25秒循环)

### 2. 沉浸式体验
- ✓ 背景元素横跨整个屏幕宽度
- ✓ 使用4层结构：顶部波浪 + 底部波浪 + 左右装饰
- ✓ 内容"漂浮"在流动环境中 (z-index: 10)

### 3. 专业与高端
- ✓ 浅色主题 (`bg-slate-50`, `bg-blue-50/30`)
- ✓ 高对比度深色文字 (`text-slate-900`)
- ✓ 半透明白色卡片 (`bg-white/90`, `backdrop-blur`)
- ✓ 精致的阴影和边框

---

## 🚀 核心组件

### 1. 沉浸式流动背景
<img src="https://via.placeholder.com/600x200/0ea5e9/ffffff?text=Immersive+Flow+Background" alt="Background Preview" width="600" />

**文件**: [`examples/immersive-background.tsx`](./examples/immersive-background.tsx)

包含4层有机曲线：
- 顶部全屏波浪（Cyan→Blue 渐变）
- 底部全屏波浪（Indigo→Purple 渐变）
- 左侧垂直装饰（Teal→Cyan 渐变）
- 右侧垂直装饰（Indigo→Purple 渐变）

**使用方式**:
```tsx
<ImmersiveFlowBackground>
  {/* 你的内容 */}
</ImmersiveFlowBackground>
```

---

### 2. 完整登录页面
<img src="https://via.placeholder.com/600x400/3b82f6/ffffff?text=Login+Page+Example" alt="Login Page" width="600" />

**文件**: [`examples/login-page-complete.tsx`](./examples/login-page-complete.tsx)

包含完整的登录页面实现：
- 品牌标识组合（Logo + 董智 + 流动下划线）
- 半透明漂浮卡片
- 渐变按钮和优雅输入框
- 安全徽章（带脉冲动画）
- 页面加载淡入动画

**特点**:
- ✓ 400+ 行完整代码
- ✓ 所有 CSS 动画都已包含
- ✓ 可直接复制使用

---

### 3. 仪表盘卡片
<img src="https://via.placeholder.com/600x300/6366f1/ffffff?text=Dashboard+Card" alt="Dashboard Card" width="600" />

**文件**: [`examples/dashboard-card.tsx`](./examples/dashboard-card.tsx)

包含:
- 半透明白色背景 + 模糊效果
- 顶部流动装饰线
- 统计数据展示
- 渐变按钮

---

## 🎯 快速参考

### 颜色系统

```tsx
// 渐变背景
className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50"

// 卡片
className="bg-white/90 backdrop-blur-sm shadow-2xl border border-slate-200/60"

// 文字
className="text-slate-900"  // 主文字
className="text-slate-600"  // 次要文字
className="text-slate-400"  // 弱化文字

// 主按钮
className="bg-gradient-to-r from-blue-600 to-indigo-600
          hover:from-blue-700 hover:to-indigo-700"
```

### 字体系统

```tsx
// 导入 Inter 字体
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

// 使用 tech-font 类
.tech-font {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: -0.01em;
}
```

### 动画速度

```tsx
// 快速流动
dur="8s"

// 标准流动（推荐）
dur="12s"

// 缓慢流动
dur="20s"
```

---

## 🏷️ 品牌标识规范

### Logo 尺寸

TuringFlow Logo 是横向的剑鱼图标，**必须保持原始宽高比**。

```tsx
// ✅ 正确 - 保持宽高比
<Image
  src="/turingflow-logo.png"
  alt="TuringFlow"
  width={180}
  height={40}
  className="h-10 w-auto"
  style={{ objectFit: 'contain' }}
/>

// ❌ 错误 - 强制正方形会导致 Logo 失真
<div className="w-10 h-10">
  <Image src="/turingflow-logo.png" fill />
</div>
```

| 场景 | Logo 高度 | 宽度 | Tailwind 类 |
|------|----------|------|------------|
| Header/导航栏 | 40px | 自适应 | `h-10 w-auto` |
| 侧边栏 | 40px | 自适应 | `h-10 w-auto` |
| 侧边栏折叠 | 48px | 裁剪显示 | `h-12 w-12` (容器) |
| 登录页 | 56px | 自适应 | `h-14 w-auto` |

### Header 品牌区域

```tsx
{/* 品牌标识 - 水平布局 */}
<div className="flex items-center gap-4">
  {/* Logo - 保持原始宽高比 */}
  <Image
    src="/turingflow-logo.png"
    alt="TuringFlow"
    width={180}
    height={40}
    className="h-10 w-auto"
    style={{ objectFit: 'contain' }}
  />
  {/* 产品名 + 副标题 */}
  <div className="flex flex-col">
    <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
      产品名称
    </span>
    <span className="text-xs text-slate-500">副标题/描述</span>
  </div>
</div>
```

### 侧边栏品牌区域

```tsx
{/* 侧边栏头部 - 垂直布局 */}
<div className="h-24 px-4 py-3 border-b border-sidebar-border flex flex-col items-center justify-center">
  <Image
    src="/turingflow-logo.png"
    alt="TuringFlow"
    width={180}
    height={40}
    className="h-10 w-auto"
    style={{ objectFit: 'contain' }}
  />
  <span className="text-sm font-medium text-sidebar-foreground/80 mt-2">
    董智智能知识平台
  </span>
</div>
```

### 品牌间距规范

| 元素间距 | 数值 | Tailwind |
|---------|------|----------|
| Logo 与产品名（水平） | 16px | `gap-4` |
| Logo 与副标题（垂直） | 8px | `gap-2` 或 `mt-2` |
| 品牌区域内边距 | 16px/12px | `px-4 py-3` |
| 品牌区域高度（侧边栏） | 96px | `h-24` |

---

## 📁 文件结构

```
.claude/skills/turing-ui/
├── README.md                          # 本文件
├── assets/
│   └── logo.png                       # TuringFlow Logo（蓝色剑鱼）
└── examples/
    ├── login-page-complete.tsx        # 完整登录页示例（400+ 行）
    ├── immersive-background.tsx       # 沉浸式背景组件
    └── dashboard-card.tsx             # 仪表盘卡片示例
```

---

## 🔧 使用指南

### 步骤 1: 查看示例

```bash
# 查看完整登录页示例
cat .claude/skills/turing-ui/examples/login-page-complete.tsx

# 查看背景组件
cat .claude/skills/turing-ui/examples/immersive-background.tsx
```

### 步骤 2: 复制代码

直接复制示例文件中的代码到你的项目中。

### 步骤 3: 自定义

根据需求调整：
- 颜色渐变
- 动画速度
- 不透明度
- 文案内容

---

## ✅ 关键要点

**必须遵守**:
- ✓ 使用有机 Bezier 曲线，禁止直线
- ✓ 全屏宽度的顶部和底部波浪
- ✓ 浅色主题 + 高对比度文字
- ✓ Inter 字体 + tech-font 类
- ✓ 半透明白色卡片 + backdrop-blur

**推荐使用**:
- ✓ 12-25秒的自然流动动画
- ✓ 淡入上滑的页面加载动画
- ✓ 脉冲光晕的安全徽章
- ✓ 流动下划线装饰品牌名

**避免**:
- ✗ 直线和硬边
- ✗ 深色背景
- ✗ 过于花哨的动画
- ✗ 低对比度配色

---

## 📚 相关资源

- **完整设计系统文档**: `docs/design/TURINGFLOW_DESIGN_SYSTEM.md`
- **参考实现**: `thirdparty/open-notebook/frontend/src/components/auth/LoginForm.tsx`
- **Logo 文件**: `docs/assets/Turingflow-blue-logo.png`

---

## 📝 版本信息

- **Version**: 1.1.0
- **Created**: 2025-11-23
- **Updated**: 2025-12-17
- **Maintained by**: Claude (Anthropic)
- **Design System**: TuringFlow Design System v1.0.0

### 更新日志

**v1.1.0 (2025-12-17)**
- 新增「品牌标识规范」章节
- 明确 Logo 尺寸规范（h-10 w-auto，保持宽高比）
- 添加 Header/侧边栏品牌区域代码示例
- 添加品牌间距规范表

---

<div align="center">
  <p><strong>TuringFlow 设计系统</strong></p>
  <p>为智董（Chairman Agent）打造的专业界面体验</p>
  <p>© 2025 图灵环流科技有限公司</p>
</div>
