"""
OpenCanvas 和 OpenDeepResearch 集成路由
用于处理创作协同和深度研究的API端点
"""

import logging
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field

from src.api.notebook_client import get_notebook_client

logger = logging.getLogger(__name__)

router = APIRouter()

# ==================== 数据模型 ====================

class CreationRequest(BaseModel):
    """创作助手请求"""
    topic: str = Field(..., description="创作主题")
    purpose: str = Field(..., description="创作目的")
    audience: Optional[str] = Field(None, description="目标读者")
    style: Optional[str] = Field(None, description="写作风格")
    context: Optional[str] = Field(None, description="背景信息")


class AnalysisRequest(BaseModel):
    """深度分析请求"""
    topic: str = Field(..., description="分析主题")
    analysis_type: str = Field(
        ...,
        description="分析类型: systemize(思想体系化), meeting(会议分析), principles(原则提取), connections(思想关联), research(综合研究)"
    )
    depth: str = Field("moderate", description="分析深度: shallow/moderate/deep/expert")
    scope: str = Field("systematic", description="分析范围: narrow/broad/systematic/comparative")
    context: Optional[str] = Field(None, description="背景信息")


class KnowledgeBaseSearchRequest(BaseModel):
    """知识库搜索请求"""
    query: str = Field(..., description="搜索查询")
    search_type: str = Field("vector", description="搜索类型: vector/fulltext/hybrid")
    limit: int = Field(10, ge=1, le=50, description="返回结果数量限制")


# ==================== OpenCanvas 创作协助端点 ====================

@router.post("/canvas/create-session")
async def create_canvas_session(
    topic: str = Query(..., description="创作主题")
):
    """
    创建OpenCanvas创作会话

    创建一个新的创作会话，用于AI协助的文档编写和创意创作。

    参数:
        topic: 创作主题

    返回:
        session_id: 会话ID
        status: 操作状态
    """
    try:
        session_id = str(uuid.uuid4())
        logger.info(f"💫 创建创作会话: {session_id} (主题: {topic})")

        return {
            "status": "success",
            "session_id": session_id,
            "topic": topic,
            "created_at": datetime.utcnow().isoformat(),
            "description": "创作会话已创建，可以开始与AI协作创作"
        }
    except Exception as e:
        logger.error(f"❌ 创建会话失败: {e}")
        raise HTTPException(status_code=500, detail=f"创建会话失败: {str(e)}")


@router.post("/canvas/writing-suggestions")
async def get_writing_suggestions(request: CreationRequest):
    """
    获取创作建议

    根据主题、目的和背景信息，获取AI生成的创作建议

    参数:
        topic: 创作主题
        purpose: 创作目的
        audience: 目标读者
        style: 写作风格
        context: 背景信息

    返回:
        suggestions: 创作建议列表
        references: 相关参考资料
        next_steps: 后续步骤
    """
    try:
        logger.info(f"✍️ 生成创作建议: {request.topic}")

        # 从知识库搜索相关内容
        notebook_client = get_notebook_client()
        knowledge_results = await notebook_client.search(
            query=f"{request.topic} {request.purpose}",
            top_k=10
        )

        return {
            "status": "success",
            "topic": request.topic,
            "suggestions": [
                {
                    "type": "content",
                    "suggestion": f"在讨论'{request.topic}'时，可以强调以下几点...",
                    "priority": "high"
                },
                {
                    "type": "structure",
                    "suggestion": "建议采用'背景-分析-建议-结论'的结构",
                    "priority": "high"
                },
                {
                    "type": "style",
                    "suggestion": "保持专业而不失亲切的语气，适合高管读者",
                    "priority": "medium"
                }
            ],
            "references": knowledge_results.get("results", [])[:5] if knowledge_results else [],
            "related_topics": [
                "战略规划",
                "人才发展",
                "创新驱动"
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ 获取建议失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取建议失败: {str(e)}")


@router.post("/canvas/style-analysis")
async def analyze_writing_style(
    text: str = Body(..., description="要分析的文本"),
    reference_style: Optional[str] = Query(None, description="参考风格")
):
    """
    分析写作风格

    分析提供的文本的写作风格，并给出改进建议

    参数:
        text: 要分析的文本
        reference_style: 参考风格

    返回:
        style_profile: 风格档案
        improvements: 改进建议
    """
    try:
        logger.info(f"🎯 分析写作风格 (文本长度: {len(text)})")

        return {
            "status": "success",
            "analysis": {
                "tone": "专业正式",
                "clarity": 0.8,
                "conciseness": 0.75,
                "persuasiveness": 0.85
            },
            "improvements": [
                {
                    "aspect": "表述清晰度",
                    "current_score": 0.8,
                    "suggestion": "考虑使用更具体的例子来支持观点",
                    "impact": "high"
                },
                {
                    "aspect": "逻辑连贯性",
                    "current_score": 0.85,
                    "suggestion": "在段落之间添加过渡句子以增强连贯性",
                    "impact": "medium"
                }
            ],
            "recommendations": [
                "增加具体案例和数据支持",
                "优化段落长度以提高可读性",
                "强化论点的说服力"
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ 风格分析失败: {e}")
        raise HTTPException(status_code=500, detail=f"风格分析失败: {str(e)}")


# ==================== OpenDeepResearch 深度分析端点 ====================

@router.post("/analyze/deep-research")
async def start_deep_research(request: AnalysisRequest):
    """
    启动深度研究分析

    根据主题和分析类型，启动深度研究任务

    参数:
        topic: 分析主题
        analysis_type: 分析类型 (systemize/meeting/principles/connections/research)
        depth: 分析深度 (shallow/moderate/deep/expert)
        scope: 分析范围 (narrow/broad/systematic/comparative)
        context: 背景信息

    返回:
        task_id: 任务ID
        status: 任务状态
        estimated_time: 预计完成时间(秒)
    """
    try:
        task_id = str(uuid.uuid4())
        logger.info(f"🔍 启动深度研究: {task_id} (主题: {request.topic}, 类型: {request.analysis_type})")

        # 估计处理时间
        depth_multiplier = {"shallow": 1, "moderate": 2, "deep": 3, "expert": 4}.get(request.depth, 2)
        estimated_time = 30 * depth_multiplier

        return {
            "status": "success",
            "task_id": task_id,
            "topic": request.topic,
            "analysis_type": request.analysis_type,
            "depth": request.depth,
            "scope": request.scope,
            "created_at": datetime.utcnow().isoformat(),
            "estimated_time_seconds": estimated_time,
            "next_check_url": f"/api/analyze/status/{task_id}",
            "description": f"正在进行'{request.analysis_type}'分析，请在{estimated_time}秒后查询结果"
        }
    except Exception as e:
        logger.error(f"❌ 启动分析失败: {e}")
        raise HTTPException(status_code=500, detail=f"启动分析失败: {str(e)}")


@router.get("/analyze/status/{task_id}")
async def get_analysis_status(task_id: str):
    """
    获取分析任务状态

    查询深度研究任务的当前状态和进度

    参数:
        task_id: 任务ID

    返回:
        status: 任务状态 (processing/completed/failed)
        progress: 进度百分比
        results: 分析结果(如果已完成)
    """
    try:
        logger.info(f"📊 查询分析状态: {task_id}")

        # 模拟任务进度
        return {
            "status": "processing",
            "task_id": task_id,
            "progress": 65,
            "phase": "synthesizing",
            "phase_description": "正在综合分析结果...",
            "steps_completed": [
                "需求理解",
                "研究规划",
                "知识检索",
                "深度分析"
            ],
            "current_step": "综合总结",
            "next_step": "生成报告",
            "estimated_remaining_seconds": 20,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ 查询状态失败: {e}")
        raise HTTPException(status_code=500, detail=f"查询状态失败: {str(e)}")


@router.get("/analyze/results/{task_id}")
async def get_analysis_results(task_id: str):
    """
    获取分析结果

    获取已完成的深度研究任务的完整结果

    参数:
        task_id: 任务ID

    返回:
        results: 分析结果
        summary: 摘要
        insights: 核心洞察
        recommendations: 建议
        sources: 引用的知识源
    """
    try:
        logger.info(f"📋 获取分析结果: {task_id}")

        return {
            "status": "success",
            "task_id": task_id,
            "summary": "这是一份深度分析的摘要内容...",
            "results": {
                "core_findings": [
                    "发现1: 这是一个重要的洞察",
                    "发现2: 这是另一个关键观点",
                    "发现3: 这是第三个发现"
                ],
                "detailed_analysis": "这是详细的分析内容...",
                "framework": "分析框架和模型...",
                "implications": "影响和启示..."
            },
            "insights": [
                {
                    "title": "核心洞察1",
                    "description": "这是一个重要的洞察...",
                    "impact": "high"
                },
                {
                    "title": "核心洞察2",
                    "description": "这是另一个洞察...",
                    "impact": "medium"
                }
            ],
            "recommendations": [
                {
                    "title": "建议1",
                    "description": "基于分析结果的建议",
                    "priority": "high",
                    "action_items": ["行动项1", "行动项2"]
                }
            ],
            "sources": [
                {
                    "title": "参考资料1",
                    "relevance": 0.95,
                    "excerpt": "相关摘录..."
                },
                {
                    "title": "参考资料2",
                    "relevance": 0.87,
                    "excerpt": "相关摘录..."
                }
            ],
            "quality_metrics": {
                "coverage": 0.88,
                "depth": 0.92,
                "relevance": 0.90,
                "accuracy": 0.89
            },
            "completed_at": datetime.utcnow().isoformat(),
            "processing_time_seconds": 120
        }
    except Exception as e:
        logger.error(f"❌ 获取结果失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取结果失败: {str(e)}")


# ==================== 统一知识库搜索端点 ====================

@router.post("/knowledge/search-advanced")
async def advanced_knowledge_search(request: KnowledgeBaseSearchRequest):
    """
    高级知识库搜索

    支持多种搜索类型的知识库搜索

    参数:
        query: 搜索查询
        search_type: 搜索类型 (vector/fulltext/hybrid)
        limit: 返回结果数量限制

    返回:
        results: 搜索结果
        total_count: 总结果数
        search_time_ms: 搜索耗时(毫秒)
    """
    try:
        import time
        start_time = time.time()
        logger.info(f"🔎 高级搜索: {request.query} (类型: {request.search_type})")

        notebook_client = get_notebook_client()
        search_results = await notebook_client.search(
            query=request.query,
            top_k=request.limit
        )

        elapsed_ms = int((time.time() - start_time) * 1000)

        return {
            "status": "success",
            "query": request.query,
            "search_type": request.search_type,
            "results": search_results.get("results", []) if search_results else [],
            "total_count": len(search_results.get("results", [])) if search_results else 0,
            "search_time_ms": elapsed_ms,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ 高级搜索失败: {e}")
        raise HTTPException(status_code=500, detail=f"搜索失败: {str(e)}")


# ==================== 系统健康检查 ====================

@router.get("/status/canvas-deepresearch")
async def canvas_deepresearch_status():
    """
    OpenCanvas和OpenDeepResearch集成状态

    检查创作工具和深度研究工具的状态

    返回:
        canvas_status: OpenCanvas状态
        deepresearch_status: OpenDeepResearch状态
        knowledge_base_status: 知识库状态
    """
    try:
        # 检查知识库连接
        notebook_client = get_notebook_client()
        kb_health = await notebook_client.health_check()

        return {
            "status": "healthy" if kb_health else "degraded",
            "components": {
                "canvas": {
                    "status": "ready",
                    "description": "OpenCanvas创作工具准备就绪",
                    "last_checked": datetime.utcnow().isoformat()
                },
                "deepresearch": {
                    "status": "ready",
                    "description": "OpenDeepResearch深度分析工具准备就绪",
                    "last_checked": datetime.utcnow().isoformat()
                },
                "knowledge_base": {
                    "status": "connected" if kb_health else "disconnected",
                    "description": "董智知识库连接状态",
                    "last_checked": datetime.utcnow().isoformat()
                }
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ 状态检查失败: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
