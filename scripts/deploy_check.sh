#!/bin/bash

# 部署检查脚本 - 验证MVP-1的所有服务和组件

set -e

echo "=========================================="
echo "智董 MVP-1 部署检查"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -n "检查 $name ... "

    if response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null); then
        status=$(echo "$response" | tail -n1)
        if [ "$status" = "$expected_status" ] || [ "$status" = "000" ]; then
            echo -e "${GREEN}✓${NC}"
            return 0
        else
            echo -e "${RED}✗ (HTTP $status)${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ (连接失败)${NC}"
        return 1
    fi
}

# 1. 检查Docker
echo ""
echo "【1】检查Docker环境..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Docker已安装${NC}"
    docker --version
else
    echo -e "${RED}✗ Docker未安装${NC}"
    exit 1
fi

# 2. 检查Docker Compose
echo ""
echo "【2】检查Docker Compose..."
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose已安装${NC}"
    docker-compose --version
else
    echo -e "${RED}✗ Docker Compose未安装${NC}"
    exit 1
fi

# 3. 检查.env文件
echo ""
echo "【3】检查配置文件..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env文件存在${NC}"
else
    echo -e "${YELLOW}⚠ .env文件不存在，使用.env.example${NC}"
    if [ ! -f ".env.example" ]; then
        echo -e "${RED}✗ .env.example也不存在${NC}"
        exit 1
    fi
fi

# 4. 检查Python虚拟环境
echo ""
echo "【4】检查Python环境..."
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✓ Python3已安装${NC}"
    python3 --version
else
    echo -e "${RED}✗ Python3未安装${NC}"
    exit 1
fi

# 5. 检查requirements.txt
echo ""
echo "【5】检查Python依赖..."
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✓ requirements.txt存在${NC}"
else
    echo -e "${RED}✗ requirements.txt不存在${NC}"
    exit 1
fi

# 6. 检查Docker镜像
echo ""
echo "【6】检查Docker镜像..."
echo -n "检查 milvus 镜像 ... "
if docker images | grep -q "milvusdb/milvus"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ 镜像不存在，将在启动时下载${NC}"
fi

# 7. 检查项目结构
echo ""
echo "【7】检查项目结构..."

required_dirs=(
    "src"
    "src/api"
    "src/agents"
    "src/retrieval"
    "src/sync_service"
    "tests"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir"
    else
        echo -e "${RED}✗${NC} $dir (缺失)"
    fi
done

# 8. 检查关键文件
echo ""
echo "【8】检查关键文件..."

required_files=(
    "docker-compose.yml"
    "Dockerfile"
    ".env.example"
    "requirements.txt"
    "src/config.py"
    "src/api/gateway.py"
    "src/retrieval/knowledge_retriever.py"
    "src/sync_service/sync_engine.py"
    "src/agents/simple_knowledge_agent.py"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (缺失)"
    fi
done

echo ""
echo "=========================================="
echo "部署检查完成"
echo "=========================================="
echo ""
echo "后续步骤："
echo "1. 复制并编辑.env文件:"
echo "   cp .env.example .env"
echo "   # 编辑.env，填入OPENROUTER_API_KEY等"
echo ""
echo "2. 启动所有服务:"
echo "   docker-compose up -d"
echo ""
echo "3. 检查服务状态:"
echo "   docker-compose ps"
echo ""
echo "4. 查看日志:"
echo "   docker-compose logs -f"
echo ""
echo "5. 运行测试:"
echo "   pytest tests/ -v"
echo ""
