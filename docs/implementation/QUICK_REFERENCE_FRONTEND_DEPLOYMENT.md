# 前端Docker部署快速参考

**⏱️ 完整流程总时间：约60分钟（17个文件示例）**

---

## 🚀 标准工作流（5步）

### 1️⃣ 代码修改 (45分钟)

#### 方式A：批量修改（推荐）
```bash
# 使用Task工具批量处理
Task(
  subagent_type="general-purpose",
  description="批量修改文件",
  prompt="详细的修改规则 + 文件清单"
)
```

#### 方式B：手动修改
```bash
# 读取 → 编辑 → 验证
Read(file_path) → Edit(old, new) → Read(验证)
```

---

### 2️⃣ 复制文件到容器 (1分钟)

```bash
# 单文件复制
docker cp /本地路径/file.tsx chairman_open_notebook:/app/frontend/src/components/

# 批量复制（链式）
docker cp file1.tsx container:/path1/ && \
docker cp file2.tsx container:/path2/ && \
docker cp file3.tsx container:/path3/

# 17个文件示例（8个命令）
docker cp AddSourceDialog.tsx chairman_open_notebook:/app/frontend/src/components/sources/
docker cp SourceTypeStep.tsx chairman_open_notebook:/app/frontend/src/components/sources/steps/ && \
docker cp NotebooksStep.tsx chairman_open_notebook:/app/frontend/src/components/sources/steps/ && \
docker cp ProcessingStep.tsx chairman_open_notebook:/app/frontend/src/components/sources/steps/
# ... 继续其他文件
```

---

### 3️⃣ 容器内构建 (11秒)

```bash
# 基础构建
docker exec chairman_open_notebook sh -c "cd /app/frontend && npm run build"

# 查看构建输出（推荐）
docker exec chairman_open_notebook sh -c "cd /app/frontend && npm run build 2>&1 | tail -50"
```

**成功标志**：
```
✓ Compiled successfully in 11.0s
✓ Generating static pages (15/15)
```

---

### 4️⃣ 重启容器 (5秒)

```bash
docker compose restart open_notebook
```

**等待健康检查**：
```bash
# 等待5秒后检查状态
sleep 5 && docker compose ps open_notebook
```

**预期输出**：
```
STATUS: Up 33 seconds (healthy)
```

---

### 5️⃣ 验证测试 (10分钟)

```bash
# 访问Web UI
open http://localhost:8502

# 或使用浏览器访问
# Chrome: http://localhost:8502
```

**快速验证清单**：
- [ ] 登录页面正常
- [ ] 修改的页面正确显示
- [ ] 中文文本无乱码
- [ ] 按钮和交互正常

---

## ⚡ 一键执行脚本

### 创建部署脚本（可选）

```bash
#!/bin/bash
# deploy-frontend.sh

echo "📦 复制文件到容器..."
docker cp file1.tsx chairman_open_notebook:/path1/
docker cp file2.tsx chairman_open_notebook:/path2/
# ... 添加所有文件

echo "🔨 构建前端..."
docker exec chairman_open_notebook sh -c "cd /app/frontend && npm run build"

echo "🔄 重启容器..."
docker compose restart open_notebook

echo "⏳ 等待容器启动..."
sleep 5

echo "✅ 部署完成！访问 http://localhost:8502"
docker compose ps open_notebook
```

**使用**：
```bash
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

---

## 🐛 故障排查

### 问题1：构建失败

```bash
# 清除缓存重新构建
docker exec chairman_open_notebook sh -c "cd /app/frontend && rm -rf .next && npm run build"
```

### 问题2：页面不更新

```bash
# 硬重启容器
docker compose stop open_notebook
docker compose up -d open_notebook

# 清除浏览器缓存
Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)
```

### 问题3：容器不健康

```bash
# 查看日志
docker compose logs -f open_notebook

# 进入容器调试
docker exec -it chairman_open_notebook sh
```

---

## 📊 时间对比

| 方案 | 修改 | 部署 | 总时间 |
|------|------|------|--------|
| **容器内热更新** ⭐ | 45分钟 | 1分钟 | ~60分钟 |
| 重建Docker镜像 | 45分钟 | 15分钟 | ~80分钟 |

**推荐**：开发环境使用容器内热更新

---

## 🎯 最佳实践摘要

### ✅ 应该做的

1. **使用Task工具批量修改**（5个以上文件）
2. **制定清晰的修改规则**（专业术语、品牌名称）
3. **链式复制文件**（减少命令调用）
4. **查看构建输出**（确认无ERROR）
5. **重启容器后验证**（检查健康状态）

### ❌ 避免做的

1. ❌ 不要重建Docker镜像（开发环境）
2. ❌ 不要忘记重启容器
3. ❌ 不要跳过Read步骤（Edit要求）
4. ❌ 不要一次性修改过多文件
5. ❌ 不要忽略TypeScript错误

---

## 📚 相关文档

- 详细版：`FRONTEND_DOCKER_DEPLOYMENT_BEST_PRACTICES.md`
- 设计系统：`docs/design/TURINGFLOW_DESIGN_SYSTEM.md`
- 中文化规则：项目根据具体需求定义

---

**更新时间**: 2025-11-23
**适用项目**: Open-Notebook（董智）
