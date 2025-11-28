"""Configuration management for the Open Deep Research system."""

import os
from enum import Enum
from typing import Any, List, Optional

from langchain_core.runnables import RunnableConfig
from pydantic import BaseModel, Field


class SearchAPI(Enum):
    """Enumeration of available search API providers."""

    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    TAVILY = "tavily"
    KNOWLEDGE_BASE = "knowledge_base"  # 新增: 使用内部知识库
    NONE = "none"

class MCPConfig(BaseModel):
    """Configuration for Model Context Protocol (MCP) servers."""
    
    url: Optional[str] = Field(
        default=None,
        optional=True,
    )
    """The URL of the MCP server"""
    tools: Optional[List[str]] = Field(
        default=None,
        optional=True,
    )
    """The tools to make available to the LLM"""
    auth_required: Optional[bool] = Field(
        default=False,
        optional=True,
    )
    """Whether the MCP server requires authentication"""

class Configuration(BaseModel):
    """Main configuration class for the Deep Research agent."""
    
    # General Configuration
    max_structured_output_retries: int = Field(
        default=3,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 3,
                "min": 1,
                "max": 10,
                "description": "Maximum number of retries for structured output calls from models"
            }
        }
    )
    allow_clarification: bool = Field(
        default=True,
        metadata={
            "x_oap_ui_config": {
                "type": "boolean",
                "default": True,
                "description": "Whether to allow the researcher to ask the user clarifying questions before starting research"
            }
        }
    )
    max_concurrent_research_units: int = Field(
        default=1,
        metadata={
            "x_oap_ui_config": {
                "type": "slider",
                "default": 1,
                "min": 1,
                "max": 20,
                "step": 1,
                "description": "并发研究单元数量。使用免费模型时建议设为1-2以避免速率限制。"
            }
        }
    )
    # Research Configuration
    search_api: SearchAPI = Field(
        default=SearchAPI.KNOWLEDGE_BASE,  # 改为默认使用知识库
        metadata={
            "x_oap_ui_config": {
                "type": "select",
                "default": "knowledge_base",
                "description": "搜索引擎选择。注意：确保选定的模型支持所选的搜索API。",
                "options": [
                    {"label": "董智知识库", "value": SearchAPI.KNOWLEDGE_BASE.value},
                    {"label": "Tavily网络搜索", "value": SearchAPI.TAVILY.value},
                    {"label": "OpenAI网络搜索", "value": SearchAPI.OPENAI.value},
                    {"label": "Anthropic网络搜索", "value": SearchAPI.ANTHROPIC.value},
                    {"label": "无搜索", "value": SearchAPI.NONE.value}
                ]
            }
        }
    )
    max_researcher_iterations: int = Field(
        default=6,
        metadata={
            "x_oap_ui_config": {
                "type": "slider",
                "default": 6,
                "min": 1,
                "max": 10,
                "step": 1,
                "description": "Maximum number of research iterations for the Research Supervisor. This is the number of times the Research Supervisor will reflect on the research and ask follow-up questions."
            }
        }
    )
    max_react_tool_calls: int = Field(
        default=10,
        metadata={
            "x_oap_ui_config": {
                "type": "slider",
                "default": 10,
                "min": 1,
                "max": 30,
                "step": 1,
                "description": "Maximum number of tool calling iterations to make in a single researcher step."
            }
        }
    )
    # Model Configuration
    summarization_model: str = Field(
        default="openai:x-ai/grok-4.1-fast:free",
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "default": "openai:x-ai/grok-4.1-fast:free",
                "description": "Model for summarizing research results from Tavily search results"
            }
        }
    )
    summarization_model_max_tokens: int = Field(
        default=8192,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 8192,
                "description": "Maximum output tokens for summarization model"
            }
        }
    )
    max_content_length: int = Field(
        default=50000,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 50000,
                "min": 1000,
                "max": 200000,
                "description": "Maximum character length for webpage content before summarization"
            }
        }
    )
    research_model: str = Field(
        default="openai:x-ai/grok-4.1-fast:free",
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "default": "openai:x-ai/grok-4.1-fast:free",
                "description": "Model for conducting research. NOTE: Make sure your Researcher Model supports the selected search API."
            }
        }
    )
    research_model_max_tokens: int = Field(
        default=10000,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 10000,
                "description": "Maximum output tokens for research model"
            }
        }
    )
    compression_model: str = Field(
        default="openai:x-ai/grok-4.1-fast:free",
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "default": "openai:x-ai/grok-4.1-fast:free",
                "description": "Model for compressing research findings from sub-agents. NOTE: Make sure your Compression Model supports the selected search API."
            }
        }
    )
    compression_model_max_tokens: int = Field(
        default=8192,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 8192,
                "description": "Maximum output tokens for compression model"
            }
        }
    )
    final_report_model: str = Field(
        default="openai:x-ai/grok-4.1-fast:free",
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "default": "openai:x-ai/grok-4.1-fast:free",
                "description": "Model for writing the final report from all research findings"
            }
        }
    )
    final_report_model_max_tokens: int = Field(
        default=10000,
        metadata={
            "x_oap_ui_config": {
                "type": "number",
                "default": 10000,
                "description": "Maximum output tokens for final report model"
            }
        }
    )
    # 知识库配置
    knowledge_base_url: str = Field(
        default=os.environ.get("KB_API_URL", "http://localhost:5055"),
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "default": "http://localhost:5055",
                "description": "知识库API服务器地址 (董智Open-Notebook)"
            }
        }
    )
    knowledge_base_api_key: str = Field(
        default=os.environ.get("KB_API_KEY", "chairman"),
        metadata={
            "x_oap_ui_config": {
                "type": "password",
                "default": "chairman",
                "description": "知识库API密钥"
            }
        }
    )
    knowledge_base_search_limit: int = Field(
        default=10,
        metadata={
            "x_oap_ui_config": {
                "type": "slider",
                "default": 10,
                "min": 1,
                "max": 50,
                "step": 1,
                "description": "每次知识库搜索返回的结果数量"
            }
        }
    )
    knowledge_base_search_type: str = Field(
        default="vector",
        metadata={
            "x_oap_ui_config": {
                "type": "select",
                "default": "vector",
                "description": "知识库搜索类型",
                "options": [
                    {"label": "向量搜索 (语义搜索)", "value": "vector"},
                    {"label": "全文搜索 (关键词搜索)", "value": "fulltext"},
                    {"label": "混合搜索", "value": "hybrid"},
                ]
            }
        }
    )
    # MCP server configuration
    mcp_config: Optional[MCPConfig] = Field(
        default=None,
        optional=True,
        metadata={
            "x_oap_ui_config": {
                "type": "mcp",
                "description": "MCP server configuration"
            }
        }
    )
    mcp_prompt: Optional[str] = Field(
        default=None,
        optional=True,
        metadata={
            "x_oap_ui_config": {
                "type": "text",
                "description": "Any additional instructions to pass along to the Agent regarding the MCP tools that are available to it."
            }
        }
    )


    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "Configuration":
        """Create a Configuration instance from a RunnableConfig."""
        configurable = config.get("configurable", {}) if config else {}
        field_names = list(cls.model_fields.keys())
        values: dict[str, Any] = {
            field_name: os.environ.get(field_name.upper(), configurable.get(field_name))
            for field_name in field_names
        }
        return cls(**{k: v for k, v in values.items() if v is not None})

    class Config:
        """Pydantic configuration."""
        
        arbitrary_types_allowed = True