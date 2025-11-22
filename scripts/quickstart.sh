#!/bin/bash

# 快速启动脚本

set -e

echo "=========================================="
echo "智董 (Chairman Agent) 快速启动"
echo "=========================================="

# 1. 检查环境
echo ""
echo "【1】检查环境..."
if [ ! -f ".env" ]; then
    echo "创建.env文件..."
    cp .env.example .env
    echo "⚠️  请编辑.env文件，填入OPENROUTER_API_KEY等关键配置"
    echo "编辑后再运行此脚本"
    exit 1
fi

# 2. 创建数据目录
echo ""
echo "【2】创建数据目录..."
mkdir -p data/{milvus,etcd,minio,postgres,redis,api}
mkdir -p logs

# 3. 启动Docker服务
echo ""
echo "【3】启动Docker Compose服务..."
docker-compose up -d

# 4. 等待服务就绪
echo ""
echo "【4】等待服务就绪..."
echo "等待Milvus启动..."
for i in {1..30}; do
    if curl -s http://localhost:9091/healthz > /dev/null 2>&1; then
        echo "✓ Milvus已启动"
        break
    fi
    echo "  第 $i 次检查..."
    sleep 2
done

# 5. 检查服务状态
echo ""
echo "【5】检查服务状态..."
docker-compose ps

# 6. 打印访问信息
echo ""
echo "=========================================="
echo "启动完成！"
echo "=========================================="
echo ""
echo "服务地址："
echo "  API网关:        http://localhost:8000"
echo "  API文档:        http://localhost:8000/docs"
echo "  Milvus:         localhost:19530"
echo "  Redis:          localhost:6379"
echo "  MinIO:          http://localhost:9001"
echo ""
echo "常用命令："
echo "  查看日志:       docker-compose logs -f"
echo "  停止服务:       docker-compose down"
echo "  运行测试:       pytest tests/ -v"
echo ""
echo "首个API调用示例："
echo "  curl 'http://localhost:8000/api/health'"
echo ""
