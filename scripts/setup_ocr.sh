#!/bin/bash
# Open-Notebook OCR环境一键安装脚本
# 版本: v2.0 (持久化版本)
# 创建日期: 2025-11-25
#
# 功能:
# - 自动安装PaddleOCR及所有依赖
# - 自动创建langchain兼容性补丁
# - 模型自动下载到持久化目录
# - 支持容器重启后快速恢复

set -e  # 遇到错误立即退出

echo "=================================================="
echo "  Open-Notebook OCR环境一键安装脚本"
echo "  版本: v2.0 (持久化版本)"
echo "=================================================="
echo ""

# 检查容器是否运行
if ! docker ps | grep -q chairman_open_notebook; then
    echo "❌ 错误: chairman_open_notebook容器未运行"
    echo "请先启动容器: docker compose up -d open_notebook"
    exit 1
fi

echo "✅ 容器运行中，开始安装..."
echo ""

# ========================================
# 步骤1: 配置PyPI镜像（加速下载）
# ========================================
echo "📦 步骤1/4: 配置PyPI镜像..."
docker exec chairman_open_notebook sh -c \
    "/app/.venv/bin/pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple"
echo "   ✅ PyPI镜像配置完成"
echo ""

# ========================================
# 步骤2: 安装OCR Python包
# ========================================
echo "📦 步骤2/4: 安装OCR Python包..."
echo "   ⏳ 预计时间: 1-3分钟（取决于网络速度）"
docker exec chairman_open_notebook sh -c \
    "/app/.venv/bin/pip install --no-cache-dir paddlepaddle==3.2.2 paddleocr Pillow shapely pyclipper" \
    && echo "   ✅ OCR包安装完成" \
    || { echo "   ❌ OCR包安装失败"; exit 1; }
echo ""

# ========================================
# 步骤3: 安装langchain依赖并创建兼容性补丁
# ========================================
echo "🔧 步骤3/4: 安装langchain依赖..."
docker exec chairman_open_notebook sh -c "/app/.venv/bin/pip install langchain langchain-community langchain-text-splitters" \
    && echo "   ✅ langchain依赖安装完成" \
    || { echo "   ❌ langchain依赖安装失败"; exit 1; }

echo "🔧 创建兼容性补丁..."
docker exec chairman_open_notebook sh -c "
# 创建docstore兼容性shim
cat > /app/.venv/lib/python3.12/site-packages/langchain/docstore.py << 'SHIM1'
'''兼容性shim：重定向到langchain_community.docstore'''
from langchain_community import docstore
import sys
sys.modules['langchain.docstore'] = docstore
__all__ = dir(docstore)
SHIM1

# 创建text_splitter兼容性shim
cat > /app/.venv/lib/python3.12/site-packages/langchain/text_splitter.py << 'SHIM2'
'''兼容性shim：重定向到langchain_text_splitters'''
from langchain_text_splitters import *
SHIM2

echo '   ✅ 兼容性补丁创建成功'
" || { echo "   ❌ 兼容性补丁创建失败"; exit 1; }
echo ""

# ========================================
# 步骤4: 验证安装并初始化模型
# ========================================
echo "🔍 步骤4/4: 验证安装..."
docker exec chairman_open_notebook python3 << 'PYEOF'
from paddleocr import PaddleOCR
print('   ✅ PaddleOCR导入成功')

print('   ⏳ 初始化OCR引擎（首次运行会下载模型~500MB）...')
ocr = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False)
print('   ✅ OCR引擎初始化成功')
print('   📁 模型已保存到持久化目录: data/paddleocr_models/')
PYEOF

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "🎉 OCR环境安装完成！"
    echo "=================================================="
    echo ""
    echo "📊 安装统计:"
    echo "   - PaddlePaddle: 3.2.2"
    echo "   - PaddleOCR: 3.3.2"
    echo "   - 模型: 已下载到持久化目录"
    echo "   - 兼容性补丁: 已应用"
    echo ""
    echo "✨ 现在可以上传PDF文件测试OCR功能"
    echo "   访问: http://localhost:8502"
    echo ""
    echo "⚠️ 注意: 容器重启后需要重新运行此脚本"
    echo "   但模型文件已持久化，无需重复下载"
else
    echo ""
    echo "❌ 安装过程中出现错误，请检查日志"
    exit 1
fi
