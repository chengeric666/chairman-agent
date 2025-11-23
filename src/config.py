# src/config.py - 统一配置管理

import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

class Config:
    """应用配置"""

    # ==================== API服务配置 ====================
    # OpenRouter + DeepSeek
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_API_URL: str = "https://openrouter.io/api/v1"

    # 模型配置
    MODEL_REASONING: str = "x-ai/grok-4.1-fast:free"  # 用于推理和分析
    MODEL_TOOLCALL: str = "x-ai/grok-4.1-fast:free"   # 用于工具调用
    MODEL_EMBEDDING: str = "all-MiniLM-L6-v2"      # 向量化模型（本地）

    # ==================== Open-Notebook配置 ====================
    NOTEBOOK_API_URL: str = os.getenv("NOTEBOOK_API_URL", "http://localhost:5055")
    NOTEBOOK_API_KEY: str = os.getenv("NOTEBOOK_API_KEY", "")
    NOTEBOOK_WS_URL: str = os.getenv("NOTEBOOK_WS_URL", "ws://localhost:8000/rpc")

    # ==================== 向量数据库配置 (Milvus) ====================
    MILVUS_HOST: str = os.getenv("MILVUS_HOST", "localhost")
    MILVUS_PORT: int = int(os.getenv("MILVUS_PORT", "19530"))
    MILVUS_DB_NAME: str = "chairman_agent"
    MILVUS_COLLECTION_NAME: str = "chairman_thoughts"
    MILVUS_VECTOR_DIM: int = 384  # all-MiniLM输出维度

    # ==================== 认证配置 (Keycloak) ====================
    KEYCLOAK_URL: str = os.getenv("KEYCLOAK_URL", "http://localhost:8080")
    KEYCLOAK_REALM: str = "chairman-agent"
    KEYCLOAK_CLIENT_ID: str = "api-gateway"
    KEYCLOAK_CLIENT_SECRET: str = os.getenv("KEYCLOAK_CLIENT_SECRET", "")

    # ==================== LangGraph服置 ====================
    LANGGRAPH_API_URL: str = os.getenv("LANGGRAPH_API_URL", "http://localhost:2024")
    LANGGRAPH_THREAD_ID: Optional[str] = None

    # ==================== 应用配置 ====================
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development" if DEBUG else "production")
    API_PORT: int = int(os.getenv("PORT", os.getenv("API_PORT", "8001")))
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")

    # ==================== Agent配置 ====================
    # 知识库检索的超参数
    RETRIEVAL_TOP_K: int = 10  # 返回最相关的N个结果
    RETRIEVAL_SIMILARITY_THRESHOLD: float = 0.5  # 相似度阈值

    # LLM参数
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 4000
    LLM_TIMEOUT: int = 120

    # ==================== 数据同步配置 ====================
    SYNC_INTERVAL_SECONDS: int = 300  # 每5分钟同步一次
    SYNC_BATCH_SIZE: int = 50  # 每次同步最多50条记录

    # ==================== 存储配置 ====================
    DATA_DIR: str = os.getenv("DATA_DIR", "./data")
    LOG_DIR: str = os.getenv("LOG_DIR", "./logs")

    # 确保目录存在
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)

    @classmethod
    def validate(cls) -> bool:
        """验证关键配置是否齐全"""
        required = [
            "OPENROUTER_API_KEY",
            "NOTEBOOK_API_URL",
        ]

        missing = [key for key in required if not getattr(cls, key)]
        if missing:
            print(f"❌ 缺少必要的配置: {', '.join(missing)}")
            print("请检查 .env 文件或环境变量")
            return False

        print("✅ 配置验证通过")
        return True


# 便捷访问
config = Config()
