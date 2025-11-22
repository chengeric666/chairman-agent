# src/utils/tools.py
# 通用工具函数库

import logging
import hashlib
import json
from typing import Any, Dict, List, Optional
from datetime import datetime
import asyncio
from functools import wraps

logger = logging.getLogger(__name__)


# ==================== 文本处理工具 ====================

def clean_text(text: str) -> str:
    """清洁文本：移除多余的空格和换行"""
    if not text:
        return ""

    # 移除多行空格
    import re
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r'  +', ' ', text)
    return text.strip()


def truncate_text(text: str, max_length: int = 1000, suffix: str = "...") -> str:
    """截断文本到最大长度"""
    if len(text) <= max_length:
        return text

    return text[:max_length - len(suffix)] + suffix


def extract_paragraphs(text: str) -> List[str]:
    """从文本中提取段落"""
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    return paragraphs


def highlight_text(text: str, keywords: List[str]) -> str:
    """高亮文本中的关键词"""
    for keyword in keywords:
        text = text.replace(keyword, f"**{keyword}**")
    return text


# ==================== 数据验证工具 ====================

def is_valid_query(query: str, min_length: int = 2, max_length: int = 500) -> bool:
    """验证查询是否有效"""
    if not query or not isinstance(query, str):
        return False

    query = query.strip()
    return min_length <= len(query) <= max_length


def is_valid_topic(topic: str) -> bool:
    """验证主题是否有效"""
    return is_valid_query(topic, min_length=1, max_length=100)


def validate_json(data: str) -> bool:
    """验证字符串是否有效的JSON"""
    try:
        json.loads(data)
        return True
    except (json.JSONDecodeError, ValueError):
        return False


def parse_json_safe(data: str, default: Any = None) -> Any:
    """安全解析JSON"""
    try:
        return json.loads(data)
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"JSON解析失败: {e}")
        return default


# ==================== 哈希和指纹工具 ====================

def generate_content_hash(content: str) -> str:
    """生成内容的哈希值"""
    return hashlib.md5(content.encode()).hexdigest()


def generate_fingerprint(data: Dict) -> str:
    """生成数据的指纹（用于去重）"""
    json_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(json_str.encode()).hexdigest()


def is_duplicate(content1: str, content2: str, threshold: float = 0.95) -> bool:
    """判断两个内容是否重复"""
    # 简单的哈希比较（可以后续改进为模糊匹配）
    hash1 = generate_content_hash(content1)
    hash2 = generate_content_hash(content2)
    return hash1 == hash2


# ==================== 时间工具 ====================

def get_timestamp_iso() -> str:
    """获取ISO格式的时间戳"""
    return datetime.utcnow().isoformat()


def parse_timestamp(timestamp_str: str) -> Optional[datetime]:
    """解析时间戳字符串"""
    try:
        return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        logger.warning(f"无法解析时间戳: {timestamp_str}")
        return None


def time_since(timestamp_str: str) -> str:
    """计算从给定时间至今的时间差"""
    dt = parse_timestamp(timestamp_str)
    if not dt:
        return "未知"

    delta = datetime.utcnow() - dt.replace(tzinfo=None)

    if delta.days > 365:
        return f"{delta.days // 365}年前"
    elif delta.days > 30:
        return f"{delta.days // 30}月前"
    elif delta.days > 0:
        return f"{delta.days}天前"
    elif delta.seconds > 3600:
        return f"{delta.seconds // 3600}小时前"
    elif delta.seconds > 60:
        return f"{delta.seconds // 60}分钟前"
    else:
        return "刚刚"


# ==================== 列表工具 ====================

def chunk_list(items: List, chunk_size: int) -> List[List]:
    """将列表分块"""
    return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]


def deduplicate_list(items: List, key_fn=None) -> List:
    """移除列表中的重复项"""
    if key_fn is None:
        return list(set(items)) if isinstance(items[0], (str, int)) else list(dict.fromkeys(items))

    seen = set()
    result = []
    for item in items:
        key = key_fn(item)
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result


def sort_by_relevance(items: List[Dict], scores: List[float]) -> List[Dict]:
    """根据相关性得分排序项目"""
    return [item for _, item in sorted(zip(scores, items), reverse=True)]


# ==================== 异步工具 ====================

def async_timeout(seconds: int):
    """异步超时装饰器"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(func(*args, **kwargs), timeout=seconds)
            except asyncio.TimeoutError:
                logger.error(f"异步操作超时: {func.__name__}")
                raise

        return wrapper

    return decorator


def sync_timeout(seconds: int):
    """同步超时装饰器"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            import signal

            def timeout_handler(signum, frame):
                raise TimeoutError(f"操作超时: {func.__name__}")

            # 设置信号处理
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(seconds)

            try:
                result = func(*args, **kwargs)
            finally:
                signal.alarm(0)  # 取消警报

            return result

        return wrapper

    return decorator


# ==================== 日志工具 ====================

def setup_logger(name: str, level: str = "INFO") -> logging.Logger:
    """设置日志记录器"""
    logger = logging.getLogger(name)
    logger.setLevel(level)

    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    return logger


def log_execution_time(func):
    """记录函数执行时间的装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        import time

        start = time.time()
        logger.info(f"开始执行: {func.__name__}")

        try:
            result = func(*args, **kwargs)
            elapsed = time.time() - start
            logger.info(f"完成: {func.__name__} ({elapsed:.2f}s)")
            return result
        except Exception as e:
            elapsed = time.time() - start
            logger.error(f"失败: {func.__name__} ({elapsed:.2f}s) - {e}")
            raise

    return wrapper


# ==================== 性能监控 ====================

class PerformanceMetrics:
    """性能指标收集器"""

    def __init__(self, name: str):
        self.name = name
        self.metrics = {}

    def record(self, metric_name: str, value: float):
        """记录指标"""
        if metric_name not in self.metrics:
            self.metrics[metric_name] = []
        self.metrics[metric_name].append(value)

    def get_average(self, metric_name: str) -> float:
        """获取平均值"""
        values = self.metrics.get(metric_name, [])
        return sum(values) / len(values) if values else 0

    def get_max(self, metric_name: str) -> float:
        """获取最大值"""
        values = self.metrics.get(metric_name, [])
        return max(values) if values else 0

    def get_min(self, metric_name: str) -> float:
        """获取最小值"""
        values = self.metrics.get(metric_name, [])
        return min(values) if values else 0

    def summary(self) -> Dict:
        """获取摘要"""
        return {
            metric: {
                "average": self.get_average(metric),
                "max": self.get_max(metric),
                "min": self.get_min(metric),
                "count": len(self.metrics.get(metric, []))
            }
            for metric in self.metrics
        }


# ==================== 高级查询工具 ====================

def build_search_query(keywords: List[str], filters: Dict = None) -> str:
    """构建搜索查询"""
    query = " AND ".join(keywords)

    if filters:
        for key, value in filters.items():
            query += f" AND {key}:{value}"

    return query


def parse_search_query(query: str) -> Dict:
    """解析搜索查询"""
    parts = {
        "keywords": [],
        "filters": {}
    }

    tokens = query.split()
    for token in tokens:
        if ":" in token:
            key, value = token.split(":", 1)
            parts["filters"][key] = value
        else:
            parts["keywords"].append(token)

    return parts
