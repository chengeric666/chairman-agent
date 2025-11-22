# src/models.py
# 数据模型定义

from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


# ==================== 枚举定义 ====================

class TaskStatus(str, Enum):
    """任务状态"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentType(str, Enum):
    """Agent类型"""
    SIMPLE_KNOWLEDGE = "simple_knowledge"
    THOUGHT_SYSTEMIZER = "thought_systemizer"
    MEETING_ANALYZER = "meeting_analyzer"
    WRITING_ASSISTANT = "writing_assistant"


# ==================== 知识库模型 ====================

class Note(BaseModel):
    """笔记模型"""
    id: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "id": "note_001",
                "content": "这是一条思想笔记",
                "metadata": {"tags": ["人才", "战略"]},
                "tags": ["重要", "核心"]
            }
        }


class KnowledgeSearchRequest(BaseModel):
    """知识库搜索请求"""
    query: str = Field(..., description="查询的主题或问题")
    top_k: int = Field(10, ge=1, le=50, description="返回最多多少个结果")
    similarity_threshold: float = Field(0.5, ge=0, le=1, description="相似度阈值")
    filters: Optional[Dict[str, Any]] = Field(None, description="过滤条件")


class KnowledgeSearchResponse(BaseModel):
    """知识库搜索响应"""
    status: str
    query: str
    results: str  # 格式化的结果
    count: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SearchResult(BaseModel):
    """单个搜索结果"""
    note_id: str
    content: str
    similarity_score: float
    metadata: Dict[str, Any]
    created_at: Optional[datetime] = None


# ==================== Agent模型 ====================

class AgentQueryRequest(BaseModel):
    """Agent查询请求"""
    topic: str = Field(..., description="查询的主题")
    agent_type: Optional[AgentType] = Field(AgentType.SIMPLE_KNOWLEDGE, description="Agent类型")
    context: Optional[str] = Field(None, description="额外的上下文信息")


class AgentQueryResponse(BaseModel):
    """Agent查询响应"""
    status: str
    task_id: str
    agent_type: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TaskStatus_Model(BaseModel):
    """任务状态模型"""
    task_id: str
    type: str
    status: TaskStatus
    created_at: datetime
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class AgentResult(BaseModel):
    """Agent执行结果"""
    status: str
    topic: str
    answer: str
    reasoning: Optional[List[Dict]] = None
    confidence: Optional[float] = None


# ==================== 批量操作模型 ====================

class BatchSearchRequest(BaseModel):
    """批量搜索请求"""
    queries: List[str] = Field(..., description="查询列表")
    top_k: int = Field(10, ge=1, le=50, description="每个查询返回的结果数")


class BatchSearchResponse(BaseModel):
    """批量搜索响应"""
    status: str
    results: Dict[str, str]  # query -> formatted_results
    count: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ==================== 系统模型 ====================

class HealthStatus(BaseModel):
    """健康检查状态"""
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"
    services: Optional[Dict[str, str]] = None


class SystemInfo(BaseModel):
    """系统信息"""
    name: str
    version: str
    environment: str
    models: Dict[str, str]
    endpoints: Dict[str, str]


class SystemStats(BaseModel):
    """系统统计信息"""
    total_documents: int
    vector_dimension: int
    embedding_model: str
    collection_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    """错误响应"""
    error: str
    details: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None


# ==================== 数据同步模型 ====================

class SyncRequest(BaseModel):
    """同步请求"""
    full_sync: bool = Field(False, description="是否执行全量同步")
    note_ids: Optional[List[str]] = Field(None, description="特定的Note ID列表")


class SyncResponse(BaseModel):
    """同步响应"""
    status: str
    full_sync: bool
    documents_synced: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ==================== 配置模型 ====================

class RetrievalConfig(BaseModel):
    """检索配置"""
    top_k: int = 10
    similarity_threshold: float = 0.5
    min_query_length: int = 2
    max_query_length: int = 500


class LLMConfig(BaseModel):
    """LLM配置"""
    temperature: float = 0.7
    max_tokens: int = 4000
    timeout: int = 120
    model_reasoning: str = "deepseek/deepseek-r1"
    model_toolcall: str = "deepseek/deepseek-v3"


class SystemConfig(BaseModel):
    """系统配置"""
    debug: bool = False
    log_level: str = "INFO"
    api_port: int = 8000
    api_host: str = "0.0.0.0"
    retrieval: RetrievalConfig = Field(default_factory=RetrievalConfig)
    llm: LLMConfig = Field(default_factory=LLMConfig)
