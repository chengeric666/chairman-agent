#!/bin/bash
# OCR功能部署脚本
# 用途: 将OCR代码部署到运行中的容器
# 用法: ./scripts/deploy_ocr.sh

set -e

CONTAINER_NAME="chairman_open_notebook"
LOCAL_BASE="thirdparty/open-notebook/open_notebook"

echo "=== OCR功能部署脚本 ==="
echo "容器: ${CONTAINER_NAME}"
echo ""

# 检查容器运行状态
echo "检查容器状态..."
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ 错误: 容器 ${CONTAINER_NAME} 未运行"
    echo "请先启动容器: docker compose up -d open_notebook"
    exit 1
fi
echo "✅ 容器运行中"

# 检查本地文件是否存在
echo ""
echo "检查本地文件..."
if [ ! -f "${LOCAL_BASE}/utils/pdf_ocr_utils.py" ]; then
    echo "❌ 错误: 找不到 ${LOCAL_BASE}/utils/pdf_ocr_utils.py"
    exit 1
fi
if [ ! -f "${LOCAL_BASE}/graphs/source.py" ]; then
    echo "❌ 错误: 找不到 ${LOCAL_BASE}/graphs/source.py"
    exit 1
fi
echo "✅ 本地文件存在"

# 复制文件
echo ""
echo "复制文件到容器..."
docker cp "${LOCAL_BASE}/utils/pdf_ocr_utils.py" \
    "${CONTAINER_NAME}:/app/open_notebook/utils/pdf_ocr_utils.py"
echo "  ✅ pdf_ocr_utils.py"

docker cp "${LOCAL_BASE}/graphs/source.py" \
    "${CONTAINER_NAME}:/app/open_notebook/graphs/source.py"
echo "  ✅ source.py"

# 重启服务
echo ""
echo "重启容器..."
docker compose restart open_notebook

# 等待启动
echo "等待服务启动..."
sleep 10

# 验证
echo ""
echo "验证OCR功能..."
docker exec ${CONTAINER_NAME} /app/.venv/bin/python3 -c \
    "from open_notebook.utils.pdf_ocr_utils import process_pdf_with_ocr_fallback; print('✅ OCR模块可导入')"

docker exec ${CONTAINER_NAME} /app/.venv/bin/python3 -c \
    "from paddleocr import PaddleOCR; print('✅ PaddleOCR可用')"

echo ""
echo "=== 部署完成 ==="
echo ""
echo "下一步:"
echo "  1. 访问 http://localhost:8502 上传PDF测试"
echo "  2. 检查日志: docker compose logs -f open_notebook"
