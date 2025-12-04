#!/bin/bash
# Open Deep Research 完整启动脚本
# 用法: ./scripts/start_deepresearch.sh [start|stop|restart|status]
#
# 服务组件:
#   - Deep Research API (LangGraph): http://localhost:2024
#   - Agent Chat UI (Next.js):       http://localhost:3030

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RESEARCH_DIR="$PROJECT_DIR/thirdparty/open_deep_research"
CHAT_UI_DIR="$PROJECT_DIR/thirdparty/agent-chat-ui"
PID_FILE_API="$PROJECT_DIR/.deepresearch-api.pid"
PID_FILE_UI="$PROJECT_DIR/.deepresearch-ui.pid"
LOG_DIR="$PROJECT_DIR/logs"

# 端口配置
API_PORT=2024
UI_PORT=3030

# 创建日志目录
mkdir -p "$LOG_DIR"

start_api() {
    echo "🔬 启动 Deep Research API (LangGraph)..."
    cd "$RESEARCH_DIR"

    # 激活虚拟环境并启动
    source .venv/bin/activate 2>/dev/null || true
    nohup .venv/bin/langgraph dev --port $API_PORT --no-browser > "$LOG_DIR/deepresearch-api.log" 2>&1 &
    API_PID=$!
    echo $API_PID > "$PID_FILE_API"

    echo "⏳ 等待 API 服务就绪..."
    for i in {1..30}; do
        if curl -s http://localhost:$API_PORT/ok > /dev/null 2>&1; then
            echo "✅ Deep Research API 已就绪"
            return 0
        fi
        sleep 1
    done
    echo "⚠️  API 启动超时，请检查日志"
}

start_ui() {
    echo "💬 启动 Agent Chat UI..."
    cd "$CHAT_UI_DIR"

    PORT=$UI_PORT nohup pnpm dev > "$LOG_DIR/agent-chat-ui.log" 2>&1 &
    UI_PID=$!
    echo $UI_PID > "$PID_FILE_UI"

    echo "⏳ 等待 UI 服务就绪..."
    for i in {1..20}; do
        if curl -s http://localhost:$UI_PORT > /dev/null 2>&1; then
            echo "✅ Agent Chat UI 已就绪"
            return 0
        fi
        sleep 1
    done
    echo "⚠️  UI 启动超时，请检查日志"
}

start_services() {
    # 检查是否已运行
    if lsof -i :$API_PORT -P > /dev/null 2>&1; then
        echo "⚠️  Deep Research API 已在运行 (端口 $API_PORT)"
    else
        start_api
    fi

    if lsof -i :$UI_PORT -P > /dev/null 2>&1; then
        echo "⚠️  Agent Chat UI 已在运行 (端口 $UI_PORT)"
    else
        start_ui
    fi

    echo ""
    echo "════════════════════════════════════════════════"
    echo "✅ Open Deep Research 服务已启动"
    echo "════════════════════════════════════════════════"
    echo "   - Deep Research API: http://localhost:$API_PORT"
    echo "   - Agent Chat UI:     http://localhost:$UI_PORT"
    echo ""
    echo "   日志文件:"
    echo "   - API:  $LOG_DIR/deepresearch-api.log"
    echo "   - UI:   $LOG_DIR/agent-chat-ui.log"
    echo "════════════════════════════════════════════════"
}

stop_services() {
    echo "🛑 停止 Deep Research 服务..."

    # 停止 API
    if [ -f "$PID_FILE_API" ]; then
        kill $(cat "$PID_FILE_API") 2>/dev/null || true
        rm "$PID_FILE_API"
    fi
    pkill -f "langgraph.*$API_PORT" 2>/dev/null || true

    # 停止 UI
    if [ -f "$PID_FILE_UI" ]; then
        kill $(cat "$PID_FILE_UI") 2>/dev/null || true
        rm "$PID_FILE_UI"
    fi
    pkill -f "next.*$UI_PORT" 2>/dev/null || true

    # 额外清理
    lsof -ti :$API_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti :$UI_PORT | xargs kill -9 2>/dev/null || true

    echo "✅ 服务已停止"
}

show_status() {
    echo "Open Deep Research 服务状态:"
    echo "─────────────────────────────"

    if lsof -i :$API_PORT -P > /dev/null 2>&1; then
        echo "✅ Deep Research API ($API_PORT): 运行中"
        # 检查健康状态
        if curl -s http://localhost:$API_PORT/ok 2>/dev/null | grep -q "ok"; then
            echo "   └─ 健康检查: OK"
        fi
    else
        echo "❌ Deep Research API ($API_PORT): 未运行"
    fi

    if lsof -i :$UI_PORT -P > /dev/null 2>&1; then
        echo "✅ Agent Chat UI ($UI_PORT): 运行中"
    else
        echo "❌ Agent Chat UI ($UI_PORT): 未运行"
    fi
}

show_logs() {
    echo "═══ Deep Research API 日志 (最后20行) ═══"
    tail -20 "$LOG_DIR/deepresearch-api.log" 2>/dev/null || echo "日志文件不存在"
    echo ""
    echo "═══ Agent Chat UI 日志 (最后20行) ═══"
    tail -20 "$LOG_DIR/agent-chat-ui.log" 2>/dev/null || echo "日志文件不存在"
}

case "${1:-start}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Open Deep Research 服务管理脚本"
        echo ""
        echo "用法: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "命令:"
        echo "  start   - 启动所有服务 (API + UI)"
        echo "  stop    - 停止所有服务"
        echo "  restart - 重启所有服务"
        echo "  status  - 查看服务状态"
        echo "  logs    - 查看服务日志"
        exit 1
        ;;
esac
