# Ollama Embedding迁移 - 快速参考

## 决策矩阵

### 应该迁移吗?

| 指标 | 分数 | 建议 |
|------|------|------|
| 技术可行性 | ⭐⭐⭐⭐⭐ | ✅ 强烈推荐 |
| 实施时间 | ⭐⭐⭐⭐ (6-13小时) | ✅ 可行 |
| 开发复杂度 | ⭐⭐⭐ (中等) | ✅ 可接受 |
| 业务价值 | ⭐⭐⭐⭐⭐ | ✅ 高价值 |
| **总体建议** | | **✅ 立即执行** |

---

## 模型选择速查表

```
场景                          推荐模型              向量维度    理由
─────────────────────────────────────────────────────────────────
⭐ 最佳平衡 (推荐首选)        nomic-embed-text      768       质量+性能+社区
🏆 最高精度                  mxbai-embed-large    1024       MTEB排名第一
💾 最节省资源                all-minilm:l6-v2     384       与现状相同
🌍 多语言最优                qwen3-embedding      1536       MTEB多语言排名第一
```

---

## 快速部署清单

### ✅ 部署前 (1-2天)

```bash
# 1. 环境验证
[ ] Ollama已安装并运行
[ ] 目标模型已拉取: ollama pull nomic-embed-text
[ ] Ollama API可访问: curl http://localhost:11434/api/tags

# 2. 代码准备
[ ] 创建feature分支
[ ] 复制实现指南中的所有代码改动
[ ] 更新dependencies和配置

# 3. 数据备份
[ ] 备份Milvus数据
[ ] 导出chairman_thoughts集合
```

### ⚡ 快速部署 (30分钟)

```bash
# 1. 停止服务
docker-compose stop chairman_api

# 2. 构建新镜像
docker-compose build chairman_api

# 3. 启动所有服务
docker-compose up -d

# 4. 验证
curl http://localhost:8001/api/health
curl "http://localhost:8001/api/knowledge/search?query=test&top_k=3"

# 5. 监控日志
docker-compose logs -f chairman_api
```

---

## 关键指标

### 性能对比

| 指标 | SentenceTransformers | Ollama (nomic) | 变化 |
|------|------------------|-------|------|
| 延迟 (ms) | 50-100 | 100-150 | +50-100% |
| 内存 (MB) | 300-500 | 800-1200 | +200-300% |
| 搜索质量 | 基线 | +7-9% | ✅ 改善 |
| 吞吐量 (queries/s) | 100 | 1000+ (批处理) | ✅ 显著提升 |

### 向量维度影响

```
维度          存储 (per 1000 doc)    查询速度    质量
────────────────────────────────────────────────
384维         1.5MB                 基线       基线
768维         3MB                   -10%       +7-9%
1024维        4MB                   -15%       +9-11%
```

---

## 故障处理

### 快速诊断

```bash
# 服务健康检查
curl -v http://localhost:11434/api/tags

# 检查embedding
curl http://localhost:11434/api/embed -d '{"model":"nomic-embed-text","input":["test"]}'

# 检查Milvus
docker exec chairman_milvus curl http://localhost:9091/healthz

# 检查应用
curl http://localhost:8001/health
```

### 紧急回滚

```bash
# 方案1: 快速恢复 (< 5分钟)
docker-compose down
docker volume rm chairman_milvus
# 恢复备份
docker-compose up -d

# 方案2: 保留两个系统 (零停机)
# 修改MILVUS_COLLECTION_NAME = "chairman_thoughts"
# 重新启动
docker-compose up -d --no-deps --build chairman_api
```

---

## 文件修改速查

```
修改文件清单:

修改            文件                        改动行数    复杂度
────────────────────────────────────────────────────
新建            src/retrieval/
                ollama_embedding_client.py   200+       中等
修改            src/config.py               10-15      简单
修改            src/retrieval/
                knowledge_retriever.py       30-40      中等
修改            src/sync_service/
                sync_engine.py              20-30      简单
修改            src/api/gateway.py          15-20      简单
修改            docker-compose.yml          20-30      简单
修改            requirements.txt            1-2        极简
────────────────────────────────────────────────────
总计                                       ~300行     中等
```

---

## 环境变量速查

```bash
# 新增环境变量
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
MODEL_EMBEDDING=nomic-embed-text
OLLAMA_TIMEOUT=60

# 修改的环境变量
MILVUS_VECTOR_DIM=768  # 从384改为768

# 其他保持不变
MILVUS_HOST=milvus
MILVUS_PORT=19530
NOTEBOOK_API_URL=http://open_notebook:5055
```

---

## 测试清单

### 单元测试
```bash
pytest tests/test_ollama_embedding.py -v
```

### 集成测试
```bash
pytest tests/test_integration.py -v
```

### 性能基准
```bash
python tests/benchmark_embeddings.py
```

### 手工验证
```bash
# 测试搜索功能
curl "http://localhost:8001/api/knowledge/search?query=人才&top_k=5"

# 测试健康检查
curl http://localhost:8001/api/health
```

---

## 成功标准

部署成功需要满足:

```
✅ 功能
  ├─ 所有搜索查询返回结果
  └─ API响应格式正确

✅ 性能
  ├─ P99延迟 < 150ms
  └─ 可用性 > 99%

✅ 质量
  ├─ 搜索相关度 > 0.75
  └─ 用户满意度 ≥ 4.0/5.0

✅ 系统
  ├─ Ollama正常运行
  ├─ Milvus响应正常
  └─ 无错误日志
```

---

## 风险等级

```
🟢 低风险 (可以执行)
  ├─ 代码改动清晰，测试覆盖
  ├─ 有完整的回滚方案
  └─ 技术栈成熟稳定

🟡 需要注意
  ├─ 向量维度变更 (需要数据重建)
  └─ 性能基线变化 (需要监控)

🔴 无高风险项
```

---

## 参考资源

| 资源 | URL |
|------|-----|
| Ollama官网 | https://ollama.ai |
| Ollama文档 | https://docs.ollama.com/capabilities/embeddings |
| 实现指南 | `OLLAMA_MIGRATION_IMPLEMENTATION_GUIDE.md` |
| 详细分析 | `ANALYSIS_OLLAMA_EMBEDDING_MIGRATION.md` |

---

## 预计时间表

```
第1天: 准备 (2-3小时)
  ├─ 环境搭建
  ├─ 代码审查
  └─ 数据备份

第2天: 开发 (4-6小时)
  ├─ 代码实现
  ├─ 单元测试
  └─ 集成测试

第3天: 部署 (1-2小时)
  ├─ 数据迁移
  ├─ 系统启动
  └─ 基线验证

持续: 监控 (1周)
  └─ 性能和质量验证
```

---

## 常见问题 (FAQ)

**Q: 需要停机多久?**
A: 30分钟 (数据迁移). 可选择非高峰期进行.

**Q: 现有数据会丢失吗?**
A: 不会. 所有数据都会重新向量化并保留完整性.

**Q: 性能会下降吗?**
A: 延迟增加30-50ms (可接受范围), 但搜索质量提升7-9%.

**Q: 是否必须使用nomic-embed-text?**
A: 不是. 可选all-minilm:l6-v2 (最低风险) 或mxbai-embed-large (最高质量).

**Q: 回滚有多困难?**
A: 非常容易. 恢复备份 < 5分钟.

---

**最后更新**: 2025-11-23
**作者**: Chairman Agent Team
**版本**: 1.0

