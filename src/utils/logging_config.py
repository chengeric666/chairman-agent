# src/utils/logging_config.py
# 日志配置和监控

import logging
import logging.handlers
import json
from typing import Dict
from datetime import datetime
from pathlib import Path

from src.config import config


class JSONFormatter(logging.Formatter):
    """JSON格式化器"""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, ensure_ascii=False)


def setup_logging(name: str, log_dir: str = None) -> logging.Logger:
    """设置日志记录器"""
    log_dir = log_dir or config.LOG_DIR
    Path(log_dir).mkdir(parents=True, exist_ok=True)

    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, config.LOG_LEVEL))

    # 清空已有的处理器
    logger.handlers = []

    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(logging.INFO)
    logger.addHandler(console_handler)

    # 文件处理器（JSON格式）
    log_file = Path(log_dir) / f"{name}.log"
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    file_formatter = JSONFormatter()
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(logging.DEBUG)
    logger.addHandler(file_handler)

    # 错误日志处理器
    error_log_file = Path(log_dir) / f"{name}_error.log"
    error_handler = logging.handlers.RotatingFileHandler(
        error_log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5
    )
    error_handler.setFormatter(file_formatter)
    error_handler.setLevel(logging.ERROR)
    logger.addHandler(error_handler)

    return logger


class PerformanceLogger:
    """性能日志记录器"""

    def __init__(self, name: str):
        self.logger = setup_logging(f"{name}_perf")
        self.metrics = {}

    def record_request(self, endpoint: str, method: str, status: int, duration: float):
        """记录API请求"""
        self.logger.info(
            f"API Request",
            extra={
                "endpoint": endpoint,
                "method": method,
                "status": status,
                "duration_ms": duration * 1000
            }
        )

    def record_query(self, query: str, result_count: int, duration: float):
        """记录查询"""
        self.logger.info(
            f"Knowledge Query",
            extra={
                "query": query,
                "result_count": result_count,
                "duration_ms": duration * 1000
            }
        )

    def record_agent_execution(self, agent_name: str, topic: str, status: str, duration: float):
        """记录Agent执行"""
        self.logger.info(
            f"Agent Execution",
            extra={
                "agent": agent_name,
                "topic": topic,
                "status": status,
                "duration_ms": duration * 1000
            }
        )


class ErrorTracker:
    """错误追踪器"""

    def __init__(self, name: str):
        self.logger = setup_logging(f"{name}_errors")
        self.error_counts = {}

    def track_error(self, error_type: str, error_msg: str, context: Dict = None):
        """追踪错误"""
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1

        self.logger.error(
            f"Error: {error_type}",
            extra={
                "error_type": error_type,
                "error_message": error_msg,
                "context": context or {}
            }
        )

    def get_error_summary(self) -> Dict:
        """获取错误摘要"""
        return {
            "total_errors": sum(self.error_counts.values()),
            "error_types": self.error_counts
        }


# 全局日志记录器
api_logger = setup_logging("api")
agent_logger = setup_logging("agent")
sync_logger = setup_logging("sync")
retrieval_logger = setup_logging("retrieval")

# 性能和错误跟踪
perf_logger = PerformanceLogger("chairman_agent")
error_tracker = ErrorTracker("chairman_agent")
