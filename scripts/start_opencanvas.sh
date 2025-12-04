#!/bin/bash
# OpenCanvas 完整启动脚本
# 用法: ./scripts/start_opencanvas.sh [start|stop|restart|status|logs]
#
# 服务组件:
#   - OpenCanvas Agents (LangGraph): http://localhost:54367
#   - OpenCanvas Web UI (Next.js):   http://localhost:8080

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CANVAS_DIR="$PROJECT_DIR/thirdparty/open-canvas"
PID_FILE_AGENTS="$PROJECT_DIR/.opencanvas-agents.pid"
PID_FILE_WEB="$PROJECT_DIR/.opencanvas-web.pid"
LOG_DIR="$PROJECT_DIR/logs"

# 端口配置
AGENTS_PORT=54367
WEB_PORT=8080

# 创建日志目录
mkdir -p "$LOG_DIR"

start_agents() {
    echo "🚀 启动 OpenCanvas Agents (LangGraph API)..."
    cd "$CANVAS_DIR/apps/agents"

    nohup yarn dev > "$LOG_DIR/opencanvas-agents.log" 2>&1 &
    AGENTS_PID=$!
    echo $AGENTS_PID > "$PID_FILE_AGENTS"

    echo "⏳ 等待 Agents 服务就绪..."
    for i in {1..30}; do
        if curl -s http://localhost:$AGENTS_PORT/ok > /dev/null 2>&1; then
            echo "✅ Agents 服务已就绪"
            return 0
        fi
        sleep 1
    done
    echo "⚠️  Agents 启动超时，请检查日志"
}

start_web() {
    echo "🌐 启动 OpenCanvas Web UI..."
    cd "$CANVAS_DIR/apps/web"

    PORT=$WEB_PORT nohup yarn dev > "$LOG_DIR/opencanvas-web.log" 2>&1 &
    WEB_PID=$!
    echo $WEB_PID > "$PID_FILE_WEB"

    echo "⏳ 等待 Web UI 就绪..."
    for i in {1..30}; do
        if curl -s http://localhost:$WEB_PORT > /dev/null 2>&1; then
            echo "✅ Web UI 已就绪"
            return 0
        fi
        sleep 1
    done
    echo "⚠️  Web UI 启动超时，请检查日志"
}

start_services() {
    # 检查是否已运行
    if lsof -i :$AGENTS_PORT -P -sTCP:LISTEN > /dev/null 2>&1; then
        echo "⚠️  OpenCanvas Agents 已在运行 (端口 $AGENTS_PORT)"
    else
        start_agents
    fi

    if lsof -i :$WEB_PORT -P -sTCP:LISTEN > /dev/null 2>&1; then
        echo "⚠️  OpenCanvas Web UI 已在运行 (端口 $WEB_PORT)"
    else
        start_web
    fi

    echo ""
    echo "════════════════════════════════════════════════"
    echo "✅ OpenCanvas 服务已启动"
    echo "════════════════════════════════════════════════"
    echo "   - Agents API: http://localhost:$AGENTS_PORT"
    echo "   - Web UI:     http://localhost:$WEB_PORT"
    echo ""
    echo "   日志文件:"
    echo "   - Agents: $LOG_DIR/opencanvas-agents.log"
    echo "   - Web:    $LOG_DIR/opencanvas-web.log"
    echo "════════════════════════════════════════════════"
}

stop_services() {
    echo "🛑 停止 OpenCanvas 服务..."

    # 停止 Agents
    if [ -f "$PID_FILE_AGENTS" ]; then
        kill $(cat "$PID_FILE_AGENTS") 2>/dev/null || true
        rm "$PID_FILE_AGENTS"
    fi
    pkill -f "langgraphjs.*$AGENTS_PORT" 2>/dev/null || true

    # 停止 Web UI
    if [ -f "$PID_FILE_WEB" ]; then
        kill $(cat "$PID_FILE_WEB") 2>/dev/null || true
        rm "$PID_FILE_WEB"
    fi
    pkill -f "next.*$WEB_PORT" 2>/dev/null || true

    # 额外清理
    lsof -ti :$AGENTS_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti :$WEB_PORT 2>/dev/null | xargs kill -9 2>/dev/null || true

    # 清理旧的 PID 文件
    rm -f "$PROJECT_DIR/.opencanvas.pid" 2>/dev/null || true

    echo "✅ 服务已停止"
}

show_status() {
    echo "OpenCanvas 服务状态:"
    echo "─────────────────────────────"

    if lsof -i :$AGENTS_PORT -P -sTCP:LISTEN > /dev/null 2>&1; then
        echo "✅ Agents ($AGENTS_PORT): 运行中"
        # 检查健康状态
        if curl -s http://localhost:$AGENTS_PORT/ok 2>/dev/null | grep -q "ok"; then
            echo "   └─ 健康检查: OK"
        fi
    else
        echo "❌ Agents ($AGENTS_PORT): 未运行"
    fi

    if lsof -i :$WEB_PORT -P -sTCP:LISTEN > /dev/null 2>&1; then
        echo "✅ Web UI ($WEB_PORT): 运行中"
    else
        echo "❌ Web UI ($WEB_PORT): 未运行"
    fi
}

show_logs() {
    echo "═══ OpenCanvas Agents 日志 (最后20行) ═══"
    tail -20 "$LOG_DIR/opencanvas-agents.log" 2>/dev/null || echo "日志文件不存在"
    echo ""
    echo "═══ OpenCanvas Web UI 日志 (最后20行) ═══"
    tail -20 "$LOG_DIR/opencanvas-web.log" 2>/dev/null || echo "日志文件不存在"
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
        echo "OpenCanvas 服务管理脚本"
        echo ""
        echo "用法: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "命令:"
        echo "  start   - 启动所有服务 (Agents + Web UI)"
        echo "  stop    - 停止所有服务"
        echo "  restart - 重启所有服务"
        echo "  status  - 查看服务状态"
        echo "  logs    - 查看服务日志"
        exit 1
        ;;
esac
