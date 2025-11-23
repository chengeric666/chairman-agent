# Chairman Agent Plan 1 部署指南

**文档版本**: 1.0
**最后更新**: 2025-11-23
**部署阶段**: Week 1 - 基础服务部署

---

## 部署架构概述

按照Plan 1的实施步骤，Chairman Agent MVP由以下服务组成：

```
┌─────────────────────────────────────────────┐
│          浏览器/客户端                        │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   ┌────▼────┐      ┌─────▼─────┐
   │UI界面   │      │知识库UI    │
   │(8001)   │      │(8502)      │
   └────┬────┘      └─────┬─────┘
        │                 │
   ┌────▼─────────────────▼─────┐
   │  Chairman API网关 (8001)    │
   │  + Open-Notebook API (5055) │
   └────┬──────────┬──────────┬──┘
        │          │          │
   ┌────▼──┐  ┌───▼──┐  ┌───▼───┐
   │OpenCanvas
   │改造    │  │OpenD R
   │改造    │  │SurrealDB│
   └────────┘  └────────┘  └───────┘
```

## 环境要求

- **操作系统**: Linux/macOS/Windows with Docker
- **Docker**: >= 20.10
- **Docker Compose**: >= 2.0
- **内存**: 最少 8GB（推荐 16GB）
- **磁盘空间**: 最少 20GB（用于容器镜像和数据）

## 部署步骤

### Day 1: 启动基础设施

#### 1.1 创建环境文件

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置必要的API密钥：

```bash
# 必须配置
OPENROUTER_API_KEY=your_api_key_here

# 可选配置
NOTEBOOK_API_KEY=
```

#### 1.2 创建数据目录

```bash
mkdir -p data/{surreal,notebook,redis,etcd,minio,milvus,api}
chmod 755 data/*
```

#### 1.3 启动SurrealDB（Open-Notebook的数据库）

```bash
docker-compose up -d surreal
```

验证SurrealDB就绪：

```bash
curl -s http://localhost:8000/health
# 应返回 "ok"
```

#### 1.4 启动其他基础服务

```bash
# 启动所有基础设施（Milvus, Etcd, MinIO, Redis）
docker-compose up -d etcd minio milvus redis
```

等待所有服务健康检查通过（约2-3分钟）：

```bash
docker-compose ps
# 所有服务应该显示 "healthy" 或 "running"
```

#### 1.5 启动Open-Notebook

```bash
docker-compose up -d open_notebook
```

验证Open-Notebook API可用：

```bash
curl -s http://localhost:5055/api/config
# 应返回 JSON 配置信息
```

访问Open-Notebook UI：
- 前端UI: http://localhost:8502
- API文档: http://localhost:5055/api/docs

### Day 2: OpenCanvas部署准备

本阶段需要为OpenCanvas改造做准备。OpenCanvas将作为独立的LangGraph服务或集成到Chairman API中。

**暂时跳过**（在Week 2执行改造）

### Day 3-4: OpenDeepResearch部署准备

类似OpenCanvas，需要在本阶段准备环境。

**暂时跳过**（在Week 2执行改造）

### Day 5: Chairman API网关启动

#### 5.1 验证Dockerfile

检查项目根目录的Dockerfile是否存在：

```bash
ls -l Dockerfile
```

#### 5.2 启动Chairman API网关

```bash
docker-compose up -d chairman_api
```

等待构建和启动（首次构建约5-10分钟）：

```bash
docker-compose logs -f chairman_api
```

验证API网关就绪：

```bash
curl -s http://localhost:8001/health
```

## 访问地址汇总

| 服务 | 地址 | 说明 |
|------|------|------|
| **Open-Notebook UI** | http://localhost:8502 | 知识库Web界面 |
| **Open-Notebook API** | http://localhost:5055/api | 知识库REST API |
| **Chairman API网关** | http://localhost:8001 | Chairman统一API入口 |
| **SurrealDB** | ws://localhost:8000/rpc | 数据库WebSocket连接 |
| **Milvus** | http://localhost:19530 | 向量数据库 |
| **Redis** | http://localhost:6379 | 缓存存储 |

## 故障排查

### SurrealDB无法连接

```bash
docker logs chairman_surreal
docker-compose restart surreal
```

### Open-Notebook启动失败

检查日志：

```bash
docker logs chairman_open_notebook
```

常见问题：
- SurrealDB未就绪：等待SurrealDB启动
- OPENROUTER_API_KEY未配置：检查.env文件
- 端口被占用：修改docker-compose.yml中的端口映射

### Chairman API无法连接到Open-Notebook

检查网络连接：

```bash
docker-compose exec chairman_api curl http://open_notebook:5055/api/config
```

## 下一步

- Week 2: 开始OpenCanvas和OpenDeepResearch的改造
- Week 3: 集成开发和测试
- Week 4-5: 前端开发和集成测试
- Week 6: 性能优化和上线准备

## 参考资源

- Plan 1完整方案: [INTEGRATION_PLAN_DETAILED.md](INTEGRATION_PLAN_DETAILED.md)
- 深度分析总结: [DEEP_ANALYSIS_SUMMARY.md](DEEP_ANALYSIS_SUMMARY.md)
- Open-Notebook官方文档: [thirdparty/open-notebook/README.md](thirdparty/open-notebook/README.md)
