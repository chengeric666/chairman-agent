# Chairman Agent 开发实践指南

**文档版本**: 1.0 (SSOT)
**最后更新**: 2025-11-25
**状态**: ✅ 已验证

---

## 概述

本文档是Chairman Agent项目的**开发实践指南（SSOT）**，涵盖：
- 代码修改工作流
- Docker部署最佳实践
- 前端/后端热更新
- 版本管理策略

---

## 1. 代码修改工作流

### 1.1 批量修改（推荐用于多文件）

**适用场景**：
- 需要修改5个以上文件
- 修改涉及重复性规则（如中文化、重命名等）
- 需要保持术语一致性

**示例流程**：
1. 创建修改规则文档
2. 列出所有需要修改的文件清单
3. 使用Task工具批量处理
4. 返回详细修改报告

### 1.2 手动修改（少量文件）

**适用场景**：
- 修改1-4个文件
- 需要精确控制修改位置
- 修改逻辑复杂

**工作流**：
```bash
# 1. 读取文件内容
# 2. 精确替换（Edit工具）
# 3. 再次读取验证
```

### 1.3 修改规则制定

**中文化规则示例**：

| 类型 | 处理方式 |
|------|----------|
| UI文本、按钮、标签 | 中文化 |
| Provider名称 (Openai, Ollama等) | 保留英文 |
| Model名称 (gpt-4, claude-3等) | 保留英文 |
| 专业术语 (Embedding, API等) | 保留英文 |
| 品牌名称 "Open Notebook" | → "董智" |

---

## 2. Docker部署策略

### 2.1 方案对比

| 方案 | 适用场景 | 构建时间 | 持久性 |
|------|----------|----------|--------|
| **热更新 (docker cp)** | 日常开发 | <1分钟 | 临时 |
| **Volume Mount** | 前端代码 | 即时 | 持久 |
| **重建镜像** | 依赖变更 | 5-15分钟 | 永久 |

### 2.2 热更新流程（99%场景）

```bash
# 1. 复制文件到容器
docker cp local_file.py container:/app/path/

# 2. 前端需要构建
docker exec container sh -c "cd /app/frontend && npm run build"

# 3. 重启容器
docker compose restart service_name
```

### 2.3 何时重建镜像

**需要重建镜像的情况**：
- 需要安装apt系统包
- 需要添加新的Python包
- 需要修改基础环境配置

**不需要重建镜像的情况**：
- 纯前端代码修改
- 纯Python业务逻辑修改
- 配置文件修改

---

## 3. 前端开发

### 3.1 Volume Mount机制

docker-compose.yml已配置前端Volume Mount：
```yaml
volumes:
  - ./thirdparty/open-notebook/frontend:/app/frontend
```

**效果**：本地修改实时同步到容器内

### 3.2 前端更新流程

```bash
# 1. 修改本地代码
# thirdparty/open-notebook/frontend/src/...

# 2. 容器内构建（利用增量编译）
docker exec chairman_open_notebook sh -c "cd /app/frontend && npm run build"

# 3. 重启容器
docker compose restart open_notebook

# 4. 清除浏览器缓存 (Cmd+Shift+R)
```

### 3.3 构建输出说明

```
Route (app)                        Size    First Load JS
┌ ○ /login                        10.7 kB  122 kB
```

**图例**：
- `○` = Static（静态预渲染）
- `ƒ` = Dynamic（服务端动态渲染）

---

## 4. 后端开发

### 4.1 Editable Install机制

官方镜像使用Python editable install：
```python
# 代码从 /app/open_notebook/ 加载
import open_notebook  # → /app/open_notebook/__init__.py
```

### 4.2 后端更新流程

```bash
# 1. 复制修改的Python文件
docker cp local_file.py chairman_open_notebook:/app/open_notebook/path/

# 2. 重启容器（无需build）
docker compose restart open_notebook
```

### 4.3 验证代码已更新

```bash
# 检查文件内容
docker exec chairman_open_notebook cat /app/open_notebook/path/file.py | head -20

# 检查模块可导入
docker exec chairman_open_notebook /app/.venv/bin/python3 -c \
  "from open_notebook.module import function; print('OK')"
```

---

## 5. 批量文件操作

### 5.1 逐个复制（<5文件）

```bash
docker cp file1.py container:/path1/
docker cp file2.py container:/path2/
```

### 5.2 链式复制（5-10文件）

```bash
docker cp file1.py container:/path1/ && \
docker cp file2.py container:/path2/ && \
docker cp file3.py container:/path3/
```

### 5.3 目录复制（>10文件）

```bash
# 整体复制目录
docker cp local_dir/. container:/app/target_dir/
```

---

## 6. 调试技巧

### 6.1 查看容器日志

```bash
# 实时日志
docker compose logs -f open_notebook

# 最近100行
docker compose logs --tail=100 open_notebook
```

### 6.2 进入容器Shell

```bash
docker exec -it chairman_open_notebook sh

# 或使用bash（如果可用）
docker exec -it chairman_open_notebook bash
```

### 6.3 检查服务状态

```bash
# Supervisord管理的服务
docker exec chairman_open_notebook supervisorctl status
```

---

## 7. 经验教训

### ✅ 推荐做法

1. **使用热更新替代重建镜像**
   - 速度提升：从15分钟 → 1分钟
   - 避免网络问题

2. **利用Volume Mount**
   - 前端代码实时同步
   - 无需手动docker cp

3. **分批修改和测试**
   - 每批修改后验证功能
   - 便于定位问题

### ❌ 避免的错误

1. **不要直接重建Docker镜像**（开发环境）
2. **不要忘记重启容器**
3. **不要一次性修改过多文件**

---

## 8. 一键部署脚本模板

### 8.1 前端部署脚本

```bash
#!/bin/bash
# deploy-frontend.sh - 前端代码部署脚本

set -e

echo "📦 开始前端部署..."

# 构建前端
echo "🔨 构建前端..."
docker exec chairman_open_notebook sh -c "cd /app/frontend && npm run build"

# 重启容器
echo "🔄 重启容器..."
docker compose restart open_notebook

# 等待启动
echo "⏳ 等待容器启动..."
sleep 5

# 验证
echo "✅ 部署完成！"
docker compose ps open_notebook
echo "访问: http://localhost:8502"
```

### 8.2 后端部署脚本

```bash
#!/bin/bash
# deploy-backend.sh - 后端代码部署脚本

set -e

LOCAL_BASE="thirdparty/open-notebook/open_notebook"
CONTAINER="chairman_open_notebook"

echo "📦 开始后端部署..."

# 复制修改的文件（根据需要调整）
echo "复制文件到容器..."
docker cp "${LOCAL_BASE}/utils/your_module.py" "${CONTAINER}:/app/open_notebook/utils/"
docker cp "${LOCAL_BASE}/graphs/source.py" "${CONTAINER}:/app/open_notebook/graphs/"

# 重启容器
echo "🔄 重启容器..."
docker compose restart open_notebook

# 等待启动
sleep 5

# 验证
echo "✅ 部署完成！"
docker compose ps open_notebook
```

---

## 9. 版本管理策略

### 9.1 策略选择

| 策略 | 适用环境 | 优点 | 缺点 |
|------|----------|------|------|
| **固定版本** | 生产环境 | 可重现、可回滚 | 需手动更新 |
| **跟随最新** | 开发环境 | 自动获取新特性 | 不可预测 |
| **混合策略** | 推荐 | 灵活、多版本共存 | 配置稍复杂 |

### 9.2 混合策略示例

```dockerfile
# Dockerfile.ocr - 使用构建参数
ARG BASE_VERSION=v1-latest-single
FROM lfnovo/open_notebook:${BASE_VERSION}
```

```yaml
# docker-compose.yml - 指定版本
build:
  args:
    BASE_VERSION: v1.2.1  # 生产环境固定版本
image: chairman_open_notebook:ocr-v1.2.1
```

### 9.3 官方更新流程

```bash
# 1. 修改docker-compose.yml中的BASE_VERSION
# BASE_VERSION: v1.2.1 → v1.3.0

# 2. 构建新版本镜像
docker compose build open_notebook

# 3. 测试验证
docker compose up -d open_notebook

# 4. 如有问题，快速回滚
# 修改回旧版本，使用已存在的镜像秒启动
```

---

## 10. 容器路径映射

| 本地路径 | 容器路径 |
|----------|----------|
| `thirdparty/open-notebook/frontend/src/` | `/app/frontend/src/` |
| `thirdparty/open-notebook/open_notebook/` | `/app/open_notebook/` |
| `data/notebook/` | `/app/data/` |
| `data/paddleocr_models/` | `/root/.paddleocr/` (如配置) |

---

## 11. 工作量统计参考

| 操作类型 | 频率 | 使用方案 | 耗时 |
|---------|------|---------|-----|
| 前端UI修改 | 每天5-10次 | 热更新 | <1分钟 |
| 后端业务逻辑 | 每天2-5次 | 热更新 | 10秒 |
| Python代码优化 | 每周1-2次 | 热更新 | 10秒 |
| 添加新依赖 | 每月0-1次 | 重建镜像 | 2-5分钟 |

**结论**: 99%的开发工作使用热更新，开发效率不受影响。

---

**文档维护者**: Claude Code
**来源**: 基于FRONTEND_DOCKER_DEPLOYMENT_BEST_PRACTICES.md和DOCKER_DEPLOYMENT_STRATEGY_ANALYSIS.md提取整理
