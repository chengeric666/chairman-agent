#!/bin/bash
# Open Notebook 服务管理脚本
# 用法: ./scripts/start_notebook.sh [command]
#
# 服务组件 (Docker Compose):
#   - Open Notebook UI:  http://localhost:8502
#   - Open Notebook API: http://localhost:5055
#   - SurrealDB:         http://localhost:8000
#
# 部署架构:
#   - 前端: Volume Mount 热更新，修改后运行 'build' 命令
#   - 后端: docker cp 部署，'start' 会自动检测并部署

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"

# 端口配置
UI_PORT=8502
API_PORT=5055
DB_PORT=8000

# 容器名称
CONTAINER_NOTEBOOK="chairman_open_notebook"
CONTAINER_SURREAL="chairman_surreal"

# 本地代码路径
LOCAL_BACKEND="$PROJECT_DIR/thirdparty/open-notebook/open_notebook"

# 创建日志目录
mkdir -p "$LOG_DIR"

cd "$PROJECT_DIR"

# ============================================================
# 智能检测函数
# ============================================================

# 检测后端模块是否已部署
check_backend_deployed() {
    docker exec $CONTAINER_NOTEBOOK /app/.venv/bin/python3 -c \
        "from open_notebook.utils.pdf_ocr_utils import process_pdf_with_ocr_fallback" \
        2>/dev/null
}

# ============================================================
# 部署函数
# ============================================================

# 部署后端模块（OCR等）
deploy_backend() {
    echo "📦 部署后端模块到容器..."

    local deployed=0

    # OCR 工具模块
    if [ -f "${LOCAL_BACKEND}/utils/pdf_ocr_utils.py" ]; then
        docker cp "${LOCAL_BACKEND}/utils/pdf_ocr_utils.py" \
            ${CONTAINER_NOTEBOOK}:/app/open_notebook/utils/
        echo "  ✅ pdf_ocr_utils.py"
        deployed=1
    fi

    # Source 图处理（包含OCR调用）
    if [ -f "${LOCAL_BACKEND}/graphs/source.py" ]; then
        docker cp "${LOCAL_BACKEND}/graphs/source.py" \
            ${CONTAINER_NOTEBOOK}:/app/open_notebook/graphs/
        echo "  ✅ source.py"
        deployed=1
    fi

    if [ $deployed -eq 0 ]; then
        echo "  ⚠️  没有找到需要部署的后端文件"
        return 1
    fi

    # 验证部署
    echo ""
    echo "🔍 验证部署..."
    if docker exec ${CONTAINER_NOTEBOOK} /app/.venv/bin/python3 -c \
        "from open_notebook.utils.pdf_ocr_utils import process_pdf_with_ocr_fallback; print('  ✅ OCR模块可导入')" 2>/dev/null; then
        return 0
    else
        echo "  ⚠️  OCR模块验证失败，但可能不影响基本功能"
        return 0
    fi
}

# 构建前端
build_frontend() {
    echo "🔨 构建前端..."
    docker exec ${CONTAINER_NOTEBOOK} sh -c "cd /app/frontend && npm run build"
    echo "✅ 前端构建完成"
}

# ============================================================
# 服务管理函数
# ============================================================

start_services() {
    echo "🚀 启动 Open Notebook 服务..."

    # 检查 Docker 是否运行
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker 未运行，请先启动 Docker"
        exit 1
    fi

    # 启动服务
    docker compose up -d surreal open_notebook

    echo "⏳ 等待服务就绪..."

    # 等待 SurrealDB
    for i in {1..30}; do
        if docker exec $CONTAINER_SURREAL curl -s http://localhost:8000/health > /dev/null 2>&1 || \
           curl -s http://localhost:$DB_PORT/health > /dev/null 2>&1; then
            echo "✅ SurrealDB 已就绪"
            break
        fi
        sleep 1
    done

    # 等待 Open Notebook API
    for i in {1..30}; do
        if curl -s http://localhost:$API_PORT/api/config > /dev/null 2>&1; then
            echo "✅ Open Notebook API 已就绪"
            break
        fi
        sleep 1
    done

    # 等待 Open Notebook UI
    for i in {1..20}; do
        if curl -s http://localhost:$UI_PORT > /dev/null 2>&1; then
            echo "✅ Open Notebook UI 已就绪"
            break
        fi
        sleep 1
    done

    # 智能检测：后端模块是否已部署
    echo ""
    if ! check_backend_deployed; then
        echo "🔍 检测到后端模块未部署，自动部署中..."
        deploy_backend
    else
        echo "✅ 后端模块已部署"
    fi

    echo ""
    echo "════════════════════════════════════════════════"
    echo "✅ Open Notebook 服务已启动"
    echo "════════════════════════════════════════════════"
    echo "   - Web UI:     http://localhost:$UI_PORT"
    echo "   - REST API:   http://localhost:$API_PORT"
    echo "   - SurrealDB:  http://localhost:$DB_PORT"
    echo ""
    echo "   常用命令:"
    echo "   ./scripts/start_notebook.sh status  # 查看状态"
    echo "   ./scripts/start_notebook.sh build   # 前端构建"
    echo "   ./scripts/start_notebook.sh logs    # 查看日志"
    echo "════════════════════════════════════════════════"
}

stop_services() {
    echo "🛑 停止 Open Notebook 服务..."
    docker compose stop open_notebook surreal
    echo "✅ 服务已停止"
}

restart_services() {
    echo "🔄 重启 Open Notebook 服务..."
    docker compose restart open_notebook

    echo "⏳ 等待服务就绪..."
    for i in {1..30}; do
        if curl -s http://localhost:$API_PORT/api/config > /dev/null 2>&1; then
            echo "✅ Open Notebook 已就绪"
            break
        fi
        sleep 1
    done

    echo ""
    echo "════════════════════════════════════════════════"
    echo "✅ Open Notebook 已重启"
    echo "════════════════════════════════════════════════"
}

recreate_services() {
    echo "🔄 重建 Open Notebook 容器 (应用新配置)..."
    docker compose up -d --force-recreate open_notebook

    echo "⏳ 等待服务就绪..."
    for i in {1..30}; do
        if curl -s http://localhost:$API_PORT/api/config > /dev/null 2>&1; then
            echo "✅ Open Notebook 已就绪"
            break
        fi
        sleep 1
    done

    # 容器重建后自动重新部署后端模块
    echo ""
    echo "📦 重新部署后端模块..."
    deploy_backend

    echo ""
    echo "════════════════════════════════════════════════"
    echo "✅ Open Notebook 容器已重建并部署"
    echo "════════════════════════════════════════════════"
}

show_status() {
    echo "Open Notebook 服务状态:"
    echo "─────────────────────────────"

    # SurrealDB
    if docker ps | grep -q $CONTAINER_SURREAL; then
        echo "✅ SurrealDB ($DB_PORT): 运行中"
    else
        echo "❌ SurrealDB ($DB_PORT): 未运行"
    fi

    # Open Notebook 容器
    if docker ps | grep -q $CONTAINER_NOTEBOOK; then
        echo "✅ Open Notebook 容器: 运行中"

        # API 健康检查
        if curl -s http://localhost:$API_PORT/api/config > /dev/null 2>&1; then
            echo "   └─ API ($API_PORT): 健康"
        else
            echo "   └─ API ($API_PORT): 不可达"
        fi

        # UI 检查
        if curl -s http://localhost:$UI_PORT > /dev/null 2>&1; then
            echo "   └─ UI ($UI_PORT): 健康"
        else
            echo "   └─ UI ($UI_PORT): 不可达"
        fi

        # 后端模块部署状态
        echo ""
        echo "部署状态:"
        if check_backend_deployed; then
            echo "   └─ OCR模块: ✅ 已部署"
        else
            echo "   └─ OCR模块: ❌ 未部署 (运行 'start' 自动部署)"
        fi

        # 显示模型配置
        echo ""
        echo "模型配置:"
        DEFAULTS=$(curl -s http://localhost:$API_PORT/api/models/defaults 2>/dev/null)
        if [ -n "$DEFAULTS" ]; then
            echo "   └─ 大上下文模型: $(echo $DEFAULTS | python3 -c "import sys,json; print(json.load(sys.stdin).get('large_context_model', 'N/A'))" 2>/dev/null)"
        fi
    else
        echo "❌ Open Notebook 容器: 未运行"
    fi
}

show_logs() {
    echo "═══ Open Notebook 日志 (最后50行) ═══"
    docker compose logs --tail=50 open_notebook 2>/dev/null || echo "无法获取日志"
}

follow_logs() {
    echo "═══ Open Notebook 实时日志 (Ctrl+C 退出) ═══"
    docker compose logs -f open_notebook
}

show_env() {
    echo "Open Notebook 环境变量:"
    echo "─────────────────────────────"
    docker exec $CONTAINER_NOTEBOOK printenv 2>/dev/null | grep -E "LLM_|DEFAULT_|SURREAL_|API_" | sort
}

show_help() {
    echo "Open Notebook 服务管理脚本"
    echo ""
    echo "用法: $0 [command]"
    echo ""
    echo "命令:"
    echo "  start     - 启动服务（自动检测并部署后端模块）"
    echo "  stop      - 停止服务"
    echo "  restart   - 重启服务"
    echo "  recreate  - 重建容器并重新部署（应用 docker-compose.yml 变更）"
    echo "  status    - 查看服务和部署状态"
    echo "  build     - 构建前端（修改前端代码后使用）"
    echo "  logs      - 查看最近日志"
    echo "  logs-f    - 实时跟踪日志"
    echo "  env       - 查看环境变量"
    echo ""
    echo "部署架构:"
    echo "  前端: Volume Mount 热更新"
    echo "        修改 thirdparty/open-notebook/frontend/ 后运行 'build'"
    echo ""
    echo "  后端: docker cp 部署"
    echo "        'start' 会自动检测并部署，无需手动操作"
    echo ""
    echo "常用场景:"
    echo "  日常启动:     $0 start"
    echo "  修改前端后:   $0 build"
    echo "  修改配置后:   $0 recreate"
    echo "  查看状态:     $0 status"
}

# ============================================================
# 主逻辑
# ============================================================

case "${1:-start}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    recreate)
        recreate_services
        ;;
    status)
        show_status
        ;;
    build)
        build_frontend
        ;;
    logs)
        show_logs
        ;;
    logs-f|follow)
        follow_logs
        ;;
    env)
        show_env
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
