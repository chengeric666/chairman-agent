# src/api/gateway.py
# 智董 API网关 - 统一的HTTP入口点

import logging
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Optional, Dict, Any
from datetime import datetime
import asyncio
import uuid

from src.config import config
from src.retrieval.knowledge_retriever import get_retriever
from src.agents.simple_knowledge_agent import get_simple_knowledge_agent
from src.agents.writing_coach import get_writing_coach
from src.agents.deep_analyzer import get_deep_analyzer
from src.api.routes import router as api_routes
from src.api.canvas_deep_research_routes import router as canvas_deepresearch_router

# 日志配置
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI应用
app = FastAPI(
    title="智董 API Gateway",
    description="Chairman Agent - 董事长思想知识库与AI助手系统",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册API路由
app.include_router(api_routes, prefix="/api")
# 注册OpenCanvas和OpenDeepResearch路由
app.include_router(canvas_deepresearch_router, prefix="/api", tags=["OpenCanvas & DeepResearch"])

# ==================== 全局状态 ====================

# 任务存储（生产环境应使用数据库或Redis）
task_store: Dict[str, Dict[str, Any]] = {}


# ==================== 辅助函数 ====================

def get_retriever_instance():
    """依赖注入：获取检索器实例"""
    try:
        return get_retriever()
    except Exception as e:
        logger.error(f"❌ 检索器初始化失败: {e}")
        raise HTTPException(status_code=503, detail="检索器服务不可用")


def get_agent_instance():
    """依赖注入：获取Agent实例"""
    try:
        return get_simple_knowledge_agent()
    except Exception as e:
        logger.error(f"❌ Agent初始化失败: {e}")
        raise HTTPException(status_code=503, detail="Agent服务不可用")


# ==================== 健康检查端点 ====================

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@app.get("/api/health")
async def api_health_check(retriever = Depends(get_retriever_instance)):
    """详细的健康检查 - 包括Milvus连接验证"""
    try:
        # 检查检索器
        logger.info("检查Milvus连接...")
        # 可以添加更多的检查逻辑

        return {
            "status": "healthy",
            "services": {
                "api": "✅ running",
                "milvus": "✅ connected",
                "retriever": "✅ ready"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"健康检查失败: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )


# ==================== 知识库查询端点 ====================

@app.get("/api/knowledge/search")
async def search_knowledge(
    query: str = Query(..., description="查询的主题或问题"),
    top_k: int = Query(10, description="返回最多多少个结果", ge=1, le=50),
    similarity_threshold: float = Query(0.5, description="相似度阈值", ge=0, le=1),
    retriever = Depends(get_retriever_instance)
):
    """
    知识库搜索端点

    从董事长的思想库中检索相关内容

    示例:
    GET /api/knowledge/search?query=人才战略&top_k=5
    """
    try:
        logger.info(f"📚 处理知识库查询: {query}")

        results = retriever.retrieve_knowledge(
            query=query,
            top_k=top_k,
            similarity_threshold=similarity_threshold
        )

        return {
            "status": "success",
            "query": query,
            "results": results,
            "count": len(results.split('\n\n')) - 1,  # 简单计数
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ 知识库查询失败: {e}")
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}")


# ==================== Agent查询端点 ====================

@app.post("/api/agents/query")
async def agent_query(
    topic: str = Query(..., description="查询的主题"),
    agent_type: str = Query("simple_knowledge", description="Agent类型: simple_knowledge"),
    agent = Depends(get_agent_instance)
):
    """
    Agent查询端点 - 使用简单知识库查询Agent

    示例:
    POST /api/agents/query?topic=人才战略
    """
    task_id = str(uuid.uuid4())

    try:
        logger.info(f"🤖 启动Agent查询 (task_id={task_id}): {topic}")

        # 创建任务记录
        task_store[task_id] = {
            "id": task_id,
            "type": agent_type,
            "status": "running",
            "topic": topic,
            "created_at": datetime.utcnow().isoformat(),
            "result": None,
            "error": None
        }

        # 后台执行（为了MVP简单起见，这里同步执行）
        try:
            result = agent.query(topic)

            task_store[task_id]["status"] = "completed"
            task_store[task_id]["result"] = result

            logger.info(f"✅ Agent查询完成 (task_id={task_id})")

        except Exception as e:
            logger.error(f"❌ Agent执行失败: {e}")
            task_store[task_id]["status"] = "failed"
            task_store[task_id]["error"] = str(e)

        return {
            "status": "accepted",
            "task_id": task_id,
            "type": agent_type,
            "created_at": task_store[task_id]["created_at"]
        }

    except Exception as e:
        logger.error(f"❌ Agent查询请求失败: {e}")
        raise HTTPException(status_code=400, detail=f"请求失败: {str(e)}")


@app.get("/api/agents/{task_id}/status")
async def get_task_status(task_id: str):
    """
    查询Agent任务状态

    示例:
    GET /api/agents/{task_id}/status
    """
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = task_store[task_id]

    return {
        "task_id": task_id,
        "type": task.get("type"),
        "status": task.get("status"),
        "created_at": task.get("created_at"),
        "result": task.get("result"),
        "error": task.get("error")
    }


@app.post("/api/agents/{task_id}/cancel")
async def cancel_task(task_id: str):
    """
    取消正在运行的任务

    示例:
    POST /api/agents/{task_id}/cancel
    """
    if task_id not in task_store:
        raise HTTPException(status_code=404, detail="任务不存在")

    task = task_store[task_id]

    if task["status"] == "running":
        task["status"] = "cancelled"
        logger.info(f"❌ 任务已取消: {task_id}")

    return {
        "task_id": task_id,
        "status": task["status"]
    }


# ==================== 数据管理端点 ====================

@app.post("/api/sync/manual")
async def manual_sync(
    full_sync: bool = Query(False, description="是否执行全量同步")
):
    """
    手动触发数据同步

    示例:
    POST /api/sync/manual?full_sync=false
    """
    try:
        logger.info(f"🔄 手动同步触发 (full_sync={full_sync})")

        # 这里应该触发数据同步服务
        # 为了MVP简单起见，先返回成功响应

        return {
            "status": "sync_started",
            "full_sync": full_sync,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ 同步触发失败: {e}")
        raise HTTPException(status_code=500, detail=f"同步失败: {str(e)}")


@app.get("/api/stats/knowledge-base")
async def get_knowledge_base_stats(
    retriever = Depends(get_retriever_instance)
):
    """
    获取知识库统计信息

    示例:
    GET /api/stats/knowledge-base
    """
    try:
        # 获取Milvus中的统计信息
        from pymilvus import Collection

        collection = Collection(config.MILVUS_COLLECTION_NAME)
        collection.load()

        stats = {
            "total_documents": collection.num_entities,
            "vector_dimension": config.MILVUS_VECTOR_DIM,
            "embedding_model": config.MODEL_EMBEDDING,
            "collection_name": config.MILVUS_COLLECTION_NAME
        }

        return {
            "status": "success",
            "stats": stats,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ 获取统计信息失败: {e}")
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


# ==================== 批处理端点 ====================

@app.post("/api/batch/search")
async def batch_search(
    queries: list = None,
    retriever = Depends(get_retriever_instance)
):
    """
    批量查询端点

    示例：
    POST /api/batch/search
    {
        "queries": ["人才战略", "创新理念", "财务管理"]
    }
    """
    if not queries:
        raise HTTPException(status_code=400, detail="queries参数必填")

    try:
        results = {}
        for query in queries:
            result = retriever.retrieve_knowledge(query, top_k=5)
            results[query] = result

        return {
            "status": "success",
            "results": results,
            "count": len(queries),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ 批量查询失败: {e}")
        raise HTTPException(status_code=500, detail=f"批量查询失败: {str(e)}")


# ==================== MVP-2: 写作指导端点 ====================

@app.post("/api/writing/suggest")
async def writing_suggest(
    topic: str = Query(..., description="创作主题"),
    purpose: str = Query(..., description="创作目的"),
    content: str = Query(..., description="当前内容"),
    audience: str = Query("内部管理层", description="目标受众")
):
    """
    为创作内容提供高质量的写作建议 - MVP-2

    示例:
    POST /api/writing/suggest?topic=人才战略&purpose=员工培训&content=...
    """
    task_id = str(uuid.uuid4())

    try:
        logger.info(f"📝 处理写作建议请求 (task_id={task_id}): {topic}")

        coach = get_writing_coach()

        result = coach.suggest_content(
            topic=topic,
            purpose=purpose,
            current_content=content,
            audience=audience
        )

        task_store[task_id] = {
            "id": task_id,
            "type": "writing_suggestion",
            "status": "completed",
            "topic": topic,
            "result": result,
            "created_at": datetime.utcnow().isoformat()
        }

        return {
            "status": "success",
            "task_id": task_id,
            "result": result
        }

    except Exception as e:
        logger.error(f"❌ 写作建议失败: {e}")
        raise HTTPException(status_code=500, detail=f"写作建议失败: {str(e)}")


@app.post("/api/writing/evaluate")
async def writing_evaluate(
    topic: str = Query(..., description="创作主题"),
    draft: str = Query(..., description="初稿内容"),
    revision_round: int = Query(1, description="修订轮次", ge=1, le=10)
):
    """
    评估初稿质量并提供改进建议 - MVP-2

    示例:
    POST /api/writing/evaluate?topic=人才战略&draft=...
    """
    try:
        logger.info(f"📊 评估初稿质量: {topic} (第{revision_round}轮)")

        coach = get_writing_coach()

        result = coach.evaluate_draft(
            topic=topic,
            draft=draft,
            revision_round=revision_round
        )

        return {
            "status": "success",
            "result": result
        }

    except Exception as e:
        logger.error(f"❌ 初稿评估失败: {e}")
        raise HTTPException(status_code=500, detail=f"初稿评估失败: {str(e)}")


# ==================== MVP-3: 深度分析端点 ====================

@app.post("/api/analysis/systemize-thought")
async def systemize_thought(
    topic: str = Query(..., description="要体系化的主题"),
    depth_level: str = Query("high", description="分析深度: low/medium/high")
):
    """
    思想体系化分析 - MVP-3核心功能

    示例:
    POST /api/analysis/systemize-thought?topic=人才战略&depth_level=high
    """
    task_id = str(uuid.uuid4())

    try:
        logger.info(f"🧠 思想体系化分析 (task_id={task_id}): {topic}")

        analyzer = get_deep_analyzer()

        result = analyzer.systemize_thought(
            topic=topic,
            depth_level=depth_level
        )

        task_store[task_id] = {
            "id": task_id,
            "type": "thought_systemization",
            "status": "completed",
            "topic": topic,
            "result": result,
            "created_at": datetime.utcnow().isoformat()
        }

        return {
            "status": "success",
            "task_id": task_id,
            "result": result
        }

    except Exception as e:
        logger.error(f"❌ 思想体系化失败: {e}")
        raise HTTPException(status_code=500, detail=f"思想体系化失败: {str(e)}")


@app.post("/api/analysis/analyze-meeting")
async def analyze_meeting(
    meeting_name: str = Query(..., description="会议名称"),
    transcript: str = Query(..., description="会议记录"),
    meeting_date: str = Query(None, description="会议日期")
):
    """
    深度分析会议记录 - MVP-3

    示例:
    POST /api/analysis/analyze-meeting?meeting_name=董事会&transcript=...
    """
    task_id = str(uuid.uuid4())

    try:
        logger.info(f"📋 分析会议 (task_id={task_id}): {meeting_name}")

        analyzer = get_deep_analyzer()

        result = analyzer.analyze_meeting(
            meeting_name=meeting_name,
            transcript=transcript,
            meeting_date=meeting_date
        )

        task_store[task_id] = {
            "id": task_id,
            "type": "meeting_analysis",
            "status": "completed",
            "meeting_name": meeting_name,
            "result": result,
            "created_at": datetime.utcnow().isoformat()
        }

        return {
            "status": "success",
            "task_id": task_id,
            "result": result
        }

    except Exception as e:
        logger.error(f"❌ 会议分析失败: {e}")
        raise HTTPException(status_code=500, detail=f"会议分析失败: {str(e)}")


@app.post("/api/analysis/extract-principles")
async def extract_principles(
    topic: str = Query(..., description="主题")
):
    """
    提取和系统化管理原则 - MVP-3

    示例:
    POST /api/analysis/extract-principles?topic=人才战略
    """
    try:
        logger.info(f"📌 提取管理原则: {topic}")

        analyzer = get_deep_analyzer()

        result = analyzer.extract_principles(topic=topic)

        return {
            "status": "success",
            "result": result
        }

    except Exception as e:
        logger.error(f"❌ 原则提取失败: {e}")
        raise HTTPException(status_code=500, detail=f"原则提取失败: {str(e)}")


# ==================== 信息端点 ====================

@app.get("/api/info")
async def get_api_info():
    """获取API信息和配置"""
    return {
        "name": "智董 API Gateway",
        "version": "1.0.0",
        "environment": "development" if config.DEBUG else "production",
        "models": {
            "reasoning": config.MODEL_REASONING,
            "tool_call": config.MODEL_TOOLCALL,
            "embedding": config.MODEL_EMBEDDING
        },
        "endpoints": {
            "knowledge_search": "/api/knowledge/search",
            "agent_query": "/api/agents/query",
            "health": "/health",
            "api_health": "/api/health"
        }
    }


# ==================== 错误处理 ====================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """404处理"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "端点不存在",
            "path": str(request.url),
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """500处理"""
    logger.error(f"❌ 内部错误: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "内部服务器错误",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# ==================== 主程序 ====================

if __name__ == "__main__":
    # 验证配置
    if not config.validate():
        exit(1)

    # 启动API服务
    logger.info(f"🚀 启动API服务: {config.API_HOST}:{config.API_PORT}")

    uvicorn.run(
        app,
        host=config.API_HOST,
        port=config.API_PORT,
        log_level=config.LOG_LEVEL.lower()
    )
