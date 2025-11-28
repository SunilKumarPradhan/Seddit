from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.logger import app_logger
import time


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all HTTP requests."""
    
    async def dispatch(self, request: Request, call_next):
        # Log request
        start_time = time.time()
        
        app_logger.info(
            f"Request: {request.method} {request.url.path} "
            f"from {request.client.host if request.client else 'unknown'}"
        )
        
        # Process request
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        
        app_logger.info(
            f"Response: {response.status_code} "
            f"for {request.method} {request.url.path} "
            f"in {process_time:.3f}s"
        )
        
        # Add custom header
        response.headers["X-Process-Time"] = str(process_time)
        
        return response