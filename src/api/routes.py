"""
API路由定义

整合Open-Notebook和Chairman Agent的所有API端点
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import logging

from src.api.notebook_client import get_notebook_client
from src.config import config

logger = logging.getLogger(__name__)

# 创建路由
router = APIRouter()


# ==================== Open-Notebook代理端点 ====================

@router.get("/knowledge/search")
async def search_knowledge(
    query: str = Query(..., description="搜索查询"),
    top_k: int = Query(10, description="返回结果数", ge=1, le=50),
):
    """
    搜索知识库

    代理请求到Open-Notebook的搜索API
    """
    try:
        logger.info(f"📚 搜索知识库: {query}")
        client = get_notebook_client()
        result = await client.search(query=query, top_k=top_k)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"搜索失败: {e}")
        raise HTTPException(status_code=500, detail=f"搜索失败: {str(e)}")


@router.get("/knowledge/documents")
async def list_documents(
    skip: int = Query(0, description="跳过数"),
    limit: int = Query(10, description="限制数", ge=1, le=100),
):
    """
    列出知识库文档

    代理请求到Open-Notebook
    """
    try:
        logger.info(f"📋 列出文档: skip={skip}, limit={limit}")
        client = get_notebook_client()
        result = await client.list_documents(skip=skip, limit=limit)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"列出文档失败: {e}")
        raise HTTPException(status_code=500, detail=f"列出文档失败: {str(e)}")


@router.post("/knowledge/chat")
async def chat_with_knowledge(
    message: str = Query(..., description="用户消息"),
    conversation_id: Optional[str] = Query(None, description="对话ID"),
):
    """
    与知识库进行对话

    代理请求到Open-Notebook的聊天API
    """
    try:
        logger.info(f"💬 对话请求: {message[:50]}...")
        client = get_notebook_client()
        result = await client.chat(message=message, conversation_id=conversation_id)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"对话失败: {e}")
        raise HTTPException(status_code=500, detail=f"对话失败: {str(e)}")


@router.get("/knowledge/stats")
async def get_knowledge_stats():
    """
    获取知识库统计信息

    返回知识库的文档数、类型分布等
    """
    try:
        logger.info("📊 获取知识库统计")
        client = get_notebook_client()
        result = await client.get_stats()
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        logger.error(f"获取统计失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取统计失败: {str(e)}")


# ==================== Agent端点（占位符，Week 2实施） ====================

@router.post("/agents/writing-coach")
async def writing_coach_query(
    topic: str = Query(..., description="创作主题"),
):
    """
    创作辅导Agent

    基于OpenCanvas改造，帮助用户进行创意创作

    TODO: Week 2实施 - 集成OpenCanvas
    """
    return {
        "status": "planning",
        "message": "创作辅导Agent正在建设中...",
        "topic": topic
    }


@router.post("/agents/deep-analyzer")
async def deep_analyzer_query(
    topic: str = Query(..., description="分析主题"),
):
    """
    深度分析Agent

    基于OpenDeepResearch改造，进行深入的话题分析

    TODO: Week 2实施 - 集成OpenDeepResearch
    """
    return {
        "status": "planning",
        "message": "深度分析Agent正在建设中...",
        "topic": topic
    }


# ==================== 系统端点 ====================

@router.get("/status")
async def system_status():
    """
    获取系统状态

    包括所有集成服务的连接状态
    """
    try:
        client = get_notebook_client()
        notebook_healthy = await client.health_check()

        return {
            "status": "operational",
            "services": {
                "chairman-api": "🟢 running",
                "open-notebook": "🟢 running" if notebook_healthy else "🔴 offline",
                "timestamp": "now"
            }
        }
    except Exception as e:
        logger.error(f"状态检查失败: {e}")
        return {
            "status": "degraded",
            "error": str(e)
        }


@router.get("/config")
async def get_system_config():
    """
    获取系统配置（非敏感信息）

    返回系统配置的摘要，不包括API密钥
    """
    return {
        "system": "Chairman Agent",
        "version": "1.0.0",
        "notebook_api_url": config.NOTEBOOK_API_URL,
        "milvus_host": config.MILVUS_HOST,
        "milvus_port": config.MILVUS_PORT,
        "environment": config.ENVIRONMENT,
    }
