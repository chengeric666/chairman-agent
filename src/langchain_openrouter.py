"""
LangChain OpenRouter 包装器
使用 OpenAI 兼容的 API 连接到 OpenRouter
"""
from langchain_openai import ChatOpenAI
from src.config import config


class ChatOpenRouter(ChatOpenAI):
    """OpenRouter LLM 包装器，兼容 OpenAI API"""

    def __init__(self, **kwargs):
        """
        初始化 OpenRouter 客户端

        OpenRouter 使用 OpenAI 兼容的 API，因此我们可以直接使用 ChatOpenAI
        只需要修改 base_url 和 api_key
        """
        # 设置默认值
        defaults = {
            "model": kwargs.get("model", config.MODEL_REASONING),
            "openai_api_key": kwargs.get("openai_api_key", config.OPENROUTER_API_KEY),
            "openai_api_base": kwargs.get("openai_api_base", "https://openrouter.ai/api/v1"),
            "temperature": kwargs.get("temperature", config.LLM_TEMPERATURE),
            "max_tokens": kwargs.get("max_tokens", config.LLM_MAX_TOKENS),
        }

        # 移除 None 值
        defaults = {k: v for k, v in defaults.items() if v is not None}

        # 合并用户提供的 kwargs
        defaults.update(kwargs)

        super().__init__(**defaults)


__all__ = ["ChatOpenRouter"]
