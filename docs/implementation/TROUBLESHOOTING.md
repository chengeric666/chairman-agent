# Chairman Agent 问题排查指南

**文档版本**: 1.0 (SSOT)
**最后更新**: 2025-11-25
**状态**: ✅ 已验证

---

## 概述

本文档是Chairman Agent项目的**问题排查指南（SSOT）**，涵盖：
- OCR问题排查
- Docker部署问题
- API调用问题
- 性能优化

---

## 1. OCR问题排查

### 1.1 "无可用内容"问题

**症状**：上传PDF后显示"无可用内容"

**排查步骤**：

```bash
# 1. 验证OCR模块可导入
docker exec chairman_open_notebook /app/.venv/bin/python3 -c \
  "from open_notebook.utils.pdf_ocr_utils import process_pdf_with_ocr_fallback; print('OK')"

# 2. 验证PaddleOCR可用
docker exec chairman_open_notebook /app/.venv/bin/python3 -c \
  "from paddleocr import PaddleOCR; print('OK')"

# 3. 检查OCR模型是否缓存
docker exec chairman_open_notebook ls -la /root/.paddlex/
```

**常见原因**：

| 原因 | 解决方案 |
|------|----------|
| OCR代码未部署到容器 | 执行 `./scripts/deploy_ocr.sh` |
| Python导入缺失 | 检查 `numpy`, `PIL` 导入 |
| API版本不匹配 | 使用 `predict()` 而非 `ocr()` |

### 1.2 OCR处理缓慢

**症状**：处理一页PDF需要20秒以上

**原因**：DPI设置过高

**解决方案**：
```python
# 修改 pdf_ocr_utils.py
# 将 dpi=150 改为 dpi=72
pix = page.get_pixmap(dpi=72)  # 性能提升75%
```

**性能对比**：

| DPI | 处理时间/页 | 文字识别率 |
|-----|-------------|------------|
| 150 | ~20-30秒 | 高 |
| 72 | ~5-6秒 | 足够 |
| 60 | ~4秒 | 可接受 |

### 1.3 PaddleOCR API兼容性

**PaddleOCR 3.3.2+ 正确用法**：

```python
# ❌ 废弃API
result = ocr.ocr(img_data, cls=True)

# ✅ 推荐API
from paddleocr import PaddleOCR
import numpy as np

ocr = PaddleOCR(use_textline_orientation=True)
result = ocr.predict(np.array(img))

# 提取文字
if result and len(result) > 0:
    rec_texts = result[0].get('rec_texts', [])
```

---

## 2. Docker部署问题

### 2.1 容器启动失败

**排查步骤**：

```bash
# 1. 查看容器日志
docker logs chairman_open_notebook

# 2. 检查依赖服务
docker compose ps

# 3. 检查端口占用
lsof -i :8502
```

**常见原因**：

| 错误信息 | 原因 | 解决方案 |
|----------|------|----------|
| `port already in use` | 端口被占用 | 修改docker-compose.yml端口 |
| `SurrealDB connection failed` | 数据库未就绪 | 等待或重启surreal服务 |
| `OPENROUTER_API_KEY not set` | 环境变量缺失 | 配置.env文件 |

### 2.2 Volume Mount不生效

**验证方法**：

```bash
# 创建测试文件
echo "TEST_$(date +%s)" > thirdparty/open-notebook/frontend/TEST.txt

# 检查容器内
docker exec chairman_open_notebook cat /app/frontend/TEST.txt
```

**如果不生效**：
1. 检查docker-compose.yml中的volumes配置
2. 确认本地路径存在
3. 重启容器

### 2.3 构建失败（网络问题）

**错误信息**：
```
Service Unavailable: Get "https://ghcr.io/v2/..."
```

**解决方案**：
1. 使用热更新替代重建镜像
2. 配置Docker镜像代理
3. 使用VPN

---

## 3. API调用问题

### 3.1 OpenRouter 401错误

**症状**：LangChain调用OpenRouter返回401 Unauthorized

**根本原因**：LangChain的`initChatModel`不支持顶级`baseUrl`参数

**解决方案**：
```typescript
// ❌ 错误配置
const model = await initChatModel({
  baseUrl: "https://openrouter.ai/api/v1",  // 被忽略!
});

// ✅ 正确配置
const model = await initChatModel({
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",  // 大写URL
  },
});
```

**参考文档**：`/docs/troubleshooting/OPENROUTER_401_FIX.md`

### 3.2 API响应超时

**排查步骤**：

```bash
# 1. 检查API健康状态
curl http://localhost:5055/api/config

# 2. 检查容器内服务
docker exec chairman_open_notebook supervisorctl status

# 3. 查看API日志
docker compose logs --tail=50 open_notebook
```

---

## 4. 性能优化

### 4.1 OCR性能优化

| 优化项 | 原值 | 优化值 | 效果 |
|--------|------|--------|------|
| DPI | 150 | 72 | 75%提升 |
| max_pages | 无限制 | 根据需要 | 减少处理时间 |

### 4.2 前端构建优化

**利用增量编译**：
- 修改单个组件：<15秒
- 修改多个相关组件：<30秒

**清除缓存重建**：
```bash
docker exec chairman_open_notebook sh -c \
  "cd /app/frontend && rm -rf .next && npm run build"
```

---

## 5. 问题排查方法论

### 5.1 UltraThink分析法

1. **不臆断**：用测试验证每个假设
2. **逐层分解**：API → 性能 → 代码
3. **实际测试**：运行用户提供的样本
4. **数据对比**：对比不同配置的具体数据

### 5.2 排查流程

```
1. 复现问题
   ↓
2. 检查日志
   ↓
3. 隔离变量
   ↓
4. 验证假设
   ↓
5. 应用修复
   ↓
6. 确认解决
```

---

## 6. 常用诊断命令

### 容器状态

```bash
docker compose ps
docker compose logs -f open_notebook
docker exec chairman_open_notebook supervisorctl status
```

### 文件检查

```bash
docker exec chairman_open_notebook ls -la /app/open_notebook/utils/
docker exec chairman_open_notebook cat /app/file.py | head -20
```

### Python环境

```bash
docker exec chairman_open_notebook /app/.venv/bin/python3 -c "import module; print('OK')"
docker exec chairman_open_notebook /app/.venv/bin/pip list | grep package
```

### 网络检查

```bash
curl -s http://localhost:5055/api/config
docker exec chairman_open_notebook curl -s http://localhost:5055/api/config
```

---

## 7. Langchain兼容性问题

### 7.1 症状

PaddleOCR 3.3.2依赖旧版langchain API，导致导入错误：
```
ModuleNotFoundError: No module named 'langchain.docstore'
```

### 7.2 原因

Langchain 0.2+重构了模块结构，将部分功能迁移到了`langchain-community`。

### 7.3 解决方案：创建兼容性shim

```bash
docker exec chairman_open_notebook sh -c "
# 安装langchain相关包
/app/.venv/bin/pip install langchain langchain-community langchain-text-splitters

# 创建docstore兼容性shim
cat > /app/.venv/lib/python3.12/site-packages/langchain/docstore.py << 'EOF'
'''兼容性shim：重定向到langchain_community.docstore'''
from langchain_community import docstore
import sys
sys.modules['langchain.docstore'] = docstore
__all__ = dir(docstore)
EOF

# 创建text_splitter兼容性shim
cat > /app/.venv/lib/python3.12/site-packages/langchain/text_splitter.py << 'EOF'
'''兼容性shim：重定向到langchain_text_splitters'''
from langchain_text_splitters import *
EOF

echo '✅ 兼容性补丁创建成功'
"
```

### 7.4 验证

```bash
docker exec chairman_open_notebook /app/.venv/bin/python3 -c \
  "from langchain.docstore import InMemoryDocstore; print('OK')"
```

---

## 8. 已知问题与解决方案

| 问题 | 状态 | 解决方案 |
|------|------|----------|
| OCR "无可用内容" | ✅ 已解决 | 部署正确的pdf_ocr_utils.py |
| OpenRouter 401 | ✅ 已解决 | 使用configuration.baseURL |
| 前端修改不生效 | ✅ 已解决 | npm build + 重启 + 清缓存 |
| OCR处理慢 | ✅ 已解决 | DPI降为72 |
| langchain模块错误 | ✅ 已解决 | 创建兼容性shim |
| libGL.so.1错误 | ✅ 官方已包含 | 官方镜像已安装相关库 |

---

**文档维护者**: Claude Code
**来源**: 基于OCR_PROBLEM_ANALYSIS.md、OCR_DEPLOYMENT_GUIDE_v2.md和实际排查经验整理
