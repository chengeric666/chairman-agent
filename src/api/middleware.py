# src/api/middleware.py
# API中间件 - 请求处理、验证、监控

import time
import logging
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import uuid

logger = logging.getLogger(__name__)


class RequestIDMiddleware:
    """请求ID中间件 - 为每个请求添加唯一ID"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, request: Request, call_next: Callable) -> Response:
        # 生成或获取请求ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # 执行请求
        response = await call_next(request)

        # 添加请求ID到响应头
        response.headers["X-Request-ID"] = request_id

        return response


class PerformanceMonitoringMiddleware:
    """性能监控中间件 - 记录请求耗时"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, request: Request, call_next: Callable) -> Response:
        # 记录开始时间
        start_time = time.time()

        # 执行请求
        response = await call_next(request)

        # 计算耗时
        duration = time.time() - start_time

        # 记录性能数据
        logger.info(
            f"{request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration * 1000,
                "request_id": getattr(request.state, "request_id", "unknown")
            }
        )

        # 添加性能数据到响应头
        response.headers["X-Process-Time"] = str(duration)

        return response


class RequestValidationMiddleware:
    """请求验证中间件 - 验证请求的合法性"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, request: Request, call_next: Callable) -> Response:
        # 验证内容类型
        if request.method in ["POST", "PUT"]:
            content_type = request.headers.get("content-type", "")
            if content_type and "application/json" not in content_type:
                return JSONResponse(
                    status_code=400,
                    content={"error": "Content-Type must be application/json"}
                )

        # 执行请求
        response = await call_next(request)
        return response


class ErrorHandlingMiddleware:
    """错误处理中间件"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            logger.error(
                f"Unhandled exception: {str(e)}",
                exc_info=True,
                extra={
                    "request_id": getattr(request.state, "request_id", "unknown"),
                    "path": request.url.path,
                    "method": request.method
                }
            )

            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "request_id": getattr(request.state, "request_id", "unknown")
                }
            )


class RateLimitMiddleware:
    """限流中间件"""

    def __init__(self, app, requests_per_second: int = 100):
        self.app = app
        self.requests_per_second = requests_per_second
        self.request_times = {}

    async def __call__(self, request: Request, call_next: Callable) -> Response:
        # 获取客户端IP
        client_ip = request.client.host

        # 检查限流
        now = time.time()
        if client_ip not in self.request_times:
            self.request_times[client_ip] = []

        # 清除过期的请求记录（超过1秒的记录）
        self.request_times[client_ip] = [
            t for t in self.request_times[client_ip]
            if now - t < 1.0
        ]

        # 检查请求频率
        if len(self.request_times[client_ip]) >= self.requests_per_second:
            return JSONResponse(
                status_code=429,
                content={"error": "Too Many Requests"},
                headers={"Retry-After": "1"}
            )

        # 记录请求时间
        self.request_times[client_ip].append(now)

        # 执行请求
        response = await call_next(request)
        return response


class LoggingMiddleware:
    """日志中间件 - 记录请求和响应"""

    def __init__(self, app):
        self.app = app

    async def __call__(self, request: Request, call_next: Callable) -> Response:
        # 记录请求
        logger.debug(
            f"Incoming Request: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "client_ip": request.client.host if request.client else "unknown"
            }
        )

        # 执行请求
        response = await call_next(request)

        # 记录响应
        logger.debug(
            f"Outgoing Response: {response.status_code}",
            extra={
                "status_code": response.status_code,
                "path": request.url.path
            }
        )

        return response


# 中间件装配函数
def apply_middlewares(app):
    """应用所有中间件"""
    # 顺序很重要：从下往上执行
    app.add_middleware(ErrorHandlingMiddleware)
    app.add_middleware(RateLimitMiddleware, requests_per_second=100)
    app.add_middleware(PerformanceMonitoringMiddleware)
    app.add_middleware(RequestValidationMiddleware)
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(LoggingMiddleware)

    return app
