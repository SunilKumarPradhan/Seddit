from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.redis_client import redis_client
from app.config import settings
from app.utils.logger import app_logger
import time

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware using Redis."""

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and OPTIONS requests
        if request.url.path == "/health" or request.method == "OPTIONS":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        rate_limit_key = f"rate_limit:{client_ip}:{int(time.time() / 60)}"

        try:
            current_count = redis_client.get_cache(rate_limit_key)

            if current_count is None:
                redis_client.set_cache(rate_limit_key, "1", expire=60)
            else:
                count = int(current_count)

                if count >= settings.RATE_LIMIT_PER_MINUTE:
                    app_logger.warning(f"Rate limit exceeded for {client_ip}")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many requests. Please try again later."
                    )

                redis_client.client.incr(rate_limit_key)

        except HTTPException:
            raise
        except Exception as e:
            # Don't block requests if Redis fails
            app_logger.error(f"Rate limit check failed: {e}")

        return await call_next(request)