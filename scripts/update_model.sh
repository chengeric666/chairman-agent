#!/bin/bash
# 模型配置更新脚本
# 用法: ./scripts/update_model.sh [model_name] [--restart]
#
# 示例:
#   ./scripts/update_model.sh status                    # 查看当前配置
#   ./scripts/update_model.sh x-ai/grok-4.1-fast        # 更新模型
#   ./scripts/update_model.sh x-ai/grok-4.1-fast --restart  # 更新并重启

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API 地址
NOTEBOOK_API="http://localhost:5055"

# 配置文件路径
ENV_FILE="$PROJECT_DIR/.env"
DOCKER_COMPOSE="$PROJECT_DIR/docker-compose.yml"
CONFIG_PY="$PROJECT_DIR/src/config.py"
DEEP_RESEARCH_CONFIG="$PROJECT_DIR/thirdparty/open_deep_research/src/open_deep_research/configuration.py"
OPENCANVAS_MODELS="$PROJECT_DIR/thirdparty/open-canvas/packages/shared/src/models.ts"

show_status() {
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}       Chairman Agent 模型配置状态${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
    echo ""

    # 1. 数据库配置
    echo -e "${YELLOW}📊 Open Notebook 数据库配置:${NC}"
    if curl -s "$NOTEBOOK_API/api/models/defaults" > /dev/null 2>&1; then
        DEFAULTS=$(curl -s "$NOTEBOOK_API/api/models/defaults")
        echo "   默认聊天模型: $(echo $DEFAULTS | python3 -c "import sys,json; print(json.load(sys.stdin).get('default_chat_model', 'N/A'))")"
        echo "   默认转换模型: $(echo $DEFAULTS | python3 -c "import sys,json; print(json.load(sys.stdin).get('default_transformation_model', 'N/A'))")"
        echo "   大上下文模型: $(echo $DEFAULTS | python3 -c "import sys,json; print(json.load(sys.stdin).get('large_context_model', 'N/A'))")"

        echo ""
        echo -e "${YELLOW}📋 已注册的模型:${NC}"
        curl -s "$NOTEBOOK_API/api/models" | python3 -c "
import sys, json
models = json.load(sys.stdin)
for m in models:
    print(f\"   - {m['id']}: {m['name']} ({m['provider']})\")
"
    else
        echo -e "   ${RED}⚠️  Open Notebook API 不可达${NC}"
    fi

    echo ""

    # 2. Docker 环境变量
    echo -e "${YELLOW}🐳 Docker 容器环境变量:${NC}"
    if docker ps | grep -q chairman_open_notebook; then
        docker exec chairman_open_notebook printenv 2>/dev/null | grep -E "LLM_MODEL|DEFAULT_TRANSFORMATION|DEFAULT_CHAT" | while read line; do
            echo "   $line"
        done
    else
        echo -e "   ${RED}⚠️  容器未运行${NC}"
    fi

    echo ""

    # 3. 配置文件
    echo -e "${YELLOW}📁 配置文件中的模型:${NC}"
    echo "   docker-compose.yml:"
    grep "LLM_MODEL\|DEFAULT_CHAT_MODEL\|DEFAULT_TRANSFORMATION_MODEL" "$DOCKER_COMPOSE" 2>/dev/null | head -3 | while read line; do
        echo "      $line"
    done

    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
}

update_model() {
    local NEW_MODEL="$1"
    local RESTART="$2"

    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}       更新模型配置: ${NEW_MODEL}${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════${NC}"
    echo ""

    # 1. 更新数据库配置
    echo -e "${YELLOW}[1/5] 更新 Open Notebook 数据库...${NC}"
    if curl -s "$NOTEBOOK_API/api/models/defaults" > /dev/null 2>&1; then
        # 创建新模型记录
        RESULT=$(curl -s -X POST "$NOTEBOOK_API/api/models" \
            -H "Content-Type: application/json" \
            -d "{\"name\": \"$NEW_MODEL\", \"provider\": \"openrouter\", \"type\": \"language\"}")

        MODEL_ID=$(echo $RESULT | python3 -c "import sys,json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

        if [ -n "$MODEL_ID" ]; then
            # 更新默认配置
            curl -s -X PUT "$NOTEBOOK_API/api/models/defaults" \
                -H "Content-Type: application/json" \
                -d "{
                    \"default_chat_model\": \"$MODEL_ID\",
                    \"default_transformation_model\": \"$MODEL_ID\",
                    \"large_context_model\": \"$NEW_MODEL\",
                    \"default_tools_model\": \"$MODEL_ID\"
                }" > /dev/null
            echo -e "   ${GREEN}✅ 数据库更新成功 (ID: $MODEL_ID)${NC}"
        else
            echo -e "   ${YELLOW}⚠️  模型可能已存在，尝试查找...${NC}"
            # 查找已存在的模型
            EXISTING_ID=$(curl -s "$NOTEBOOK_API/api/models" | python3 -c "
import sys, json
models = json.load(sys.stdin)
for m in models:
    if m['name'] == '$NEW_MODEL':
        print(m['id'])
        break
" 2>/dev/null)
            if [ -n "$EXISTING_ID" ]; then
                curl -s -X PUT "$NOTEBOOK_API/api/models/defaults" \
                    -H "Content-Type: application/json" \
                    -d "{
                        \"default_chat_model\": \"$EXISTING_ID\",
                        \"default_transformation_model\": \"$EXISTING_ID\",
                        \"large_context_model\": \"$NEW_MODEL\",
                        \"default_tools_model\": \"$EXISTING_ID\"
                    }" > /dev/null
                echo -e "   ${GREEN}✅ 使用已存在的模型 (ID: $EXISTING_ID)${NC}"
            fi
        fi
    else
        echo -e "   ${RED}⚠️  API 不可达，跳过数据库更新${NC}"
    fi

    # 2. 更新 docker-compose.yml
    echo -e "${YELLOW}[2/5] 更新 docker-compose.yml...${NC}"
    if [ -f "$DOCKER_COMPOSE" ]; then
        # 使用 sed 替换模型名称
        sed -i.bak "s|LLM_MODEL=.*|LLM_MODEL=$NEW_MODEL|g" "$DOCKER_COMPOSE"
        sed -i.bak "s|DEFAULT_CHAT_MODEL=.*|DEFAULT_CHAT_MODEL=$NEW_MODEL|g" "$DOCKER_COMPOSE"
        sed -i.bak "s|DEFAULT_TRANSFORMATION_MODEL=.*|DEFAULT_TRANSFORMATION_MODEL=$NEW_MODEL|g" "$DOCKER_COMPOSE"
        sed -i.bak "s|DEFAULT_TOOLS_MODEL=.*|DEFAULT_TOOLS_MODEL=$NEW_MODEL|g" "$DOCKER_COMPOSE"
        sed -i.bak "s|DEFAULT_LARGE_CONTEXT_MODEL=.*|DEFAULT_LARGE_CONTEXT_MODEL=$NEW_MODEL|g" "$DOCKER_COMPOSE"
        rm -f "$DOCKER_COMPOSE.bak"
        echo -e "   ${GREEN}✅ docker-compose.yml 更新成功${NC}"
    fi

    # 3. 更新 .env
    echo -e "${YELLOW}[3/5] 更新 .env...${NC}"
    if [ -f "$ENV_FILE" ]; then
        sed -i.bak "s|MODEL_REASONING=.*|MODEL_REASONING=$NEW_MODEL|g" "$ENV_FILE"
        sed -i.bak "s|MODEL_TOOLCALL=.*|MODEL_TOOLCALL=$NEW_MODEL|g" "$ENV_FILE"
        rm -f "$ENV_FILE.bak"
        echo -e "   ${GREEN}✅ .env 更新成功${NC}"
    fi

    # 4. 更新 src/config.py
    echo -e "${YELLOW}[4/5] 更新 src/config.py...${NC}"
    if [ -f "$CONFIG_PY" ]; then
        sed -i.bak "s|MODEL_REASONING:.*=.*\".*\"|MODEL_REASONING: str = \"$NEW_MODEL\"|g" "$CONFIG_PY"
        sed -i.bak "s|MODEL_TOOLCALL:.*=.*\".*\"|MODEL_TOOLCALL: str = \"$NEW_MODEL\"|g" "$CONFIG_PY"
        rm -f "$CONFIG_PY.bak"
        echo -e "   ${GREEN}✅ src/config.py 更新成功${NC}"
    fi

    # 5. 更新 Deep Research configuration.py
    echo -e "${YELLOW}[5/5] 更新 Deep Research configuration.py...${NC}"
    if [ -f "$DEEP_RESEARCH_CONFIG" ]; then
        # 替换所有 openai:xxx 格式的模型名称
        sed -i.bak "s|openai:[^\"]*|openai:$NEW_MODEL|g" "$DEEP_RESEARCH_CONFIG"
        rm -f "$DEEP_RESEARCH_CONFIG.bak"
        echo -e "   ${GREEN}✅ Deep Research 配置更新成功${NC}"
    fi

    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ 所有配置已更新为: $NEW_MODEL${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════${NC}"

    # 重启服务
    if [ "$RESTART" = "--restart" ]; then
        echo ""
        echo -e "${YELLOW}🔄 重启服务...${NC}"
        cd "$PROJECT_DIR"
        docker compose up -d --force-recreate open_notebook
        echo -e "${GREEN}✅ 服务已重启${NC}"
    else
        echo ""
        echo -e "${YELLOW}提示: 数据库配置已立即生效${NC}"
        echo -e "${YELLOW}如需应用文件配置变更，请运行:${NC}"
        echo -e "   docker compose up -d --force-recreate open_notebook"
    fi
}

show_help() {
    echo "模型配置更新脚本"
    echo ""
    echo "用法: $0 [command] [options]"
    echo ""
    echo "命令:"
    echo "  status              查看当前所有模型配置"
    echo "  <model_name>        更新模型为指定名称"
    echo "  help                显示此帮助信息"
    echo ""
    echo "选项:"
    echo "  --restart           更新后自动重启 Open Notebook 容器"
    echo ""
    echo "示例:"
    echo "  $0 status"
    echo "  $0 x-ai/grok-4.1-fast"
    echo "  $0 x-ai/grok-4 --restart"
    echo "  $0 anthropic/claude-3-opus --restart"
    echo ""
    echo "常用模型:"
    echo "  x-ai/grok-4.1-fast     - xAI Grok 4.1 Fast (推荐)"
    echo "  x-ai/grok-4            - xAI Grok 4"
    echo "  x-ai/grok-3            - xAI Grok 3"
    echo "  anthropic/claude-3-opus - Anthropic Claude 3 Opus"
    echo "  openai/gpt-4-turbo     - OpenAI GPT-4 Turbo"
}

# 主逻辑
case "${1:-status}" in
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [[ "$1" == *"/"* ]]; then
            update_model "$1" "$2"
        else
            echo -e "${RED}错误: 无效的模型名称 '$1'${NC}"
            echo "模型名称格式应为: provider/model-name"
            echo "例如: x-ai/grok-4.1-fast"
            exit 1
        fi
        ;;
esac
