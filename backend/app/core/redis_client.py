import redis
from redis import Redis
from typing import Optional
from app.config import settings
from app.utils.logger import app_logger


class RedisClient:
    """Redis client wrapper for caching and pub/sub."""
    
    def __init__(self):
        self._client: Optional[Redis] = None
    
    def connect(self):
        """Establish Redis connection."""
        try:
            self._client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
            )
            # Test connection
            self._client.ping()
            app_logger.info(f"Redis connected: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        except Exception as e:
            app_logger.error(f"Redis connection failed: {e}")
            raise
    
    def disconnect(self):
        """Close Redis connection."""
        if self._client:
            self._client.close()
            app_logger.info("Redis disconnected")
    
    @property
    def client(self) -> Redis:
        """Get Redis client instance."""
        if not self._client:
            self.connect()
        return self._client
    
    # Cache operations
    def set_cache(self, key: str, value: str, expire: int = 300):
        """Set cache with expiration (default 5 minutes)."""
        return self.client.setex(key, expire, value)
    
    def get_cache(self, key: str) -> Optional[str]:
        """Get cached value."""
        return self.client.get(key)
    
    def delete_cache(self, key: str):
        """Delete cache key."""
        return self.client.delete(key)
    
    def exists(self, key: str) -> bool:
        """Check if key exists."""
        return bool(self.client.exists(key))
    
    # Pub/Sub operations
    def publish(self, channel: str, message: str):
        """Publish message to channel."""
        return self.client.publish(channel, message)
    
    def subscribe(self, channel: str):
        """Subscribe to channel."""
        pubsub = self.client.pubsub()
        pubsub.subscribe(channel)
        return pubsub
    
    # Stream operations (for notifications)
    def add_to_stream(self, stream: str, data: dict) -> str:
        """Add message to Redis stream."""
        return self.client.xadd(stream, data)
    
    def read_stream(self, stream: str, count: int = 10, block: int = 1000):
        """Read messages from stream."""
        return self.client.xread({stream: '0'}, count=count, block=block)
    
    # Set operations (for active connections)
    def add_to_set(self, key: str, value: str):
        """Add value to set."""
        return self.client.sadd(key, value)
    
    def remove_from_set(self, key: str, value: str):
        """Remove value from set."""
        return self.client.srem(key, value)
    
    def get_set_members(self, key: str):
        """Get all members of set."""
        return self.client.smembers(key)


# Global Redis instance
redis_client = RedisClient()