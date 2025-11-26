# HTML 预览组件优化计划（v5 - 彻底修复）

## 更新历史

| 版本 | 日期 | 修复内容 |
|------|------|----------|
| v4 | 2025-11-26 | "先大后小"策略解决 100vh 布局问题 |
| v5 | 2025-11-26 | 修复 fade-in 动画 + IntersectionObserver 嵌套滚动失效问题 |

---

## 问题根因分析

### 问题 1：高度同步的"鸡生蛋"悖论（v4 已解决）

| 现象 | 原因 |
|------|------|
| 初始 800px 高度导致内容不显示 | HTML 使用 `100vh` 布局，`100vh` = iframe 高度 = 800px |
| 高度同步脚本无法检测真实高度 | `scrollHeight` 被 iframe 高度限制 |
| 固定 5000px 能正常显示 | 给了足够空间让 `100vh` 布局正确渲染 |

### 技术原理

```
iframe 高度 = 800px
    ↓
HTML body { height: 100vh } → 100vh = 800px
    ↓
内容被裁剪，scrollHeight = 800px
    ↓
高度同步脚本检测到 800px，不增长
    ↓
死循环！
```

---

## 解决方案："先大后小"策略

### 核心思路

1. **初始使用大高度**（5000px）让 `100vh` 布局正确渲染
2. **内容渲染后**，通过改进的高度检测算法获取真实高度
3. **收缩到实际高度**，避免不必要的空白

---

## 实现步骤

### 步骤 1：修改初始高度为 5000px

```typescript
const [iframeHeight, setIframeHeight] = useState(5000); // 先大后小
```

### 步骤 2：改进高度同步脚本（使用元素边界检测）

```javascript
const HEIGHT_SYNC_SCRIPT = `
<script>
(function() {
  if (window.__heightSyncInit) return;
  window.__heightSyncInit = true;

  function getActualHeight() {
    // 方法 1：元素边界检测（解决 100vh 问题）
    var maxBottom = 0;
    var children = document.body.children;
    for (var i = 0; i < children.length; i++) {
      var rect = children[i].getBoundingClientRect();
      var bottom = rect.top + rect.height;
      if (bottom > maxBottom) maxBottom = bottom;
    }

    // 方法 2：scrollHeight（传统方式）
    var scrollH = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.documentElement.offsetHeight,
      document.body.offsetHeight
    );

    // 返回最大值，最小 800px
    return Math.max(maxBottom, scrollH, 800);
  }

  function sendHeight() {
    var height = getActualHeight();
    window.parent.postMessage({ type: 'IFRAME_HEIGHT', height: height }, '*');
  }

  // 初始化（延迟执行，等待渲染完成）
  if (document.readyState === 'complete') {
    setTimeout(sendHeight, 200);
  } else {
    window.addEventListener('load', function() {
      setTimeout(sendHeight, 200);
    });
  }

  // MutationObserver 监听变化
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(function() {
      setTimeout(sendHeight, 100);
    }).observe(document.body, {
      childList: true, subtree: true, attributes: true
    });
  }

  // 定时检查（处理异步内容如图表）
  var count = 0;
  var interval = setInterval(function() {
    sendHeight();
    if (++count > 20) clearInterval(interval); // 10秒
  }, 500);

  // 锚点拦截
  document.addEventListener('click', function(e) {
    var anchor = e.target.closest('a');
    if (anchor && anchor.getAttribute('href') &&
        anchor.getAttribute('href').startsWith('#')) {
      e.preventDefault();
      e.stopPropagation();
      var targetId = anchor.getAttribute('href').substring(1);
      var targetElement = document.getElementById(targetId) ||
                         document.querySelector('[name="' + targetId + '"]');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, true);
})();
</script>
`;
```

### 步骤 3：父组件高度监听（允许收缩）

```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'IFRAME_HEIGHT' && typeof event.data.height === 'number') {
      const newHeight = event.data.height + 50; // 50px 缓冲
      // 允许收缩，但不低于 800px
      setIframeHeight(Math.max(newHeight, 800));
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

### 步骤 4：不注入任何 CSS

保持原始 HTML 样式不变，避免破坏布局。

---

## 修改清单

| 文件 | 位置 | 修改 |
|------|------|------|
| `CodeRenderer.tsx` | `useState` | 初始高度从 800 改为 **5000** |
| `CodeRenderer.tsx` | `injectedScript` | 使用改进的高度检测算法（元素边界检测） |
| `CodeRenderer.tsx` | `handleMessage` | 允许高度收缩 |
| `CodeRenderer.tsx` | CSS 注入 | **完全移除**，不注入任何 CSS |

---

## v4 预期效果

1. ✅ 郝旭烈访谈能正常显示（初始 5000px 足够渲染 100vh 布局）
2. ✅ 高度自动收缩到实际内容高度
3. ✅ 保持严格安全沙盒（sandbox="allow-scripts"）
4. ✅ 不注入 CSS，保持原始布局
5. ⚠️ 图表溢出问题需单独处理（可选：只对 canvas/svg 添加 max-width）

---

## 问题 2：fade-in 动画 + IntersectionObserver 嵌套滚动失效（v5 修复）

### 现象

- 内容"间断性显示"：有些区域空白，有些区域有内容
- 滚动时新内容不出现
- 初始视口内的内容可见，滚动后的内容不可见

### 根本原因

HTML 报告使用了 `fade-in` CSS 动画类：

```css
.fade-in { opacity: 0; transform: translateY(40px); }
.fade-in.visible { opacity: 1; transform: translateY(0); }
```

配合 `IntersectionObserver` 检测元素进入视口后添加 `.visible` 类。

**但是在嵌套滚动场景中：**

```
外层容器: <div className="overflow-auto">  ← 用户实际滚动的容器
  └── iframe                              ← IntersectionObserver 监听的视口
        └── HTML 内容
```

- `IntersectionObserver` 默认监听的是 **iframe 内部视口**
- 用户滚动的是 **外层 div 容器**
- iframe 内部视口位置不变 → 新元素永远检测不到"进入视口"
- 结果：元素保持 `opacity: 0`，不可见

### 解决方案

**注入 CSS 强制显示所有 fade-in 元素：**

```css
.fade-in {
  opacity: 1 !important;
  transform: translateY(0) !important;
}
```

同时限制图表高度，防止 Chart.js 无限拉伸：

```css
canvas {
  max-height: 500px !important;
}
.chart-container, [class*="chart"] {
  max-height: 600px !important;
}
```

---

## v5 修改清单

| 文件 | 位置 | 修改 |
|------|------|------|
| `CodeRenderer.tsx` | `useState` | 初始高度改为 **3000px** |
| `CodeRenderer.tsx` | `injectedCSS` | 新增，强制显示 fade-in 元素 + 限制图表高度 |
| `CodeRenderer.tsx` | `getActualHeight()` | 递归遍历所有元素，支持最大 10000px |
| `CodeRenderer.tsx` | HTML 注入逻辑 | CSS 注入到 `</head>` 前，脚本注入到 `</body>` 前 |

---

## v5 预期效果

1. ✅ 郝旭烈访谈完整显示（fade-in 元素强制可见）
2. ✅ 图表高度受限（最大 500px），不会无限拉伸
3. ✅ 保持严格安全沙盒（sandbox="allow-scripts"）
4. ✅ 支持超长报告（最大 10000px）
