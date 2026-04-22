"""Production environment validators."""
from typing import Optional


def validate_redis_in_production(redis_url: Optional[str], environment: str) -> None:
    """
    Enforce Redis requirement in production/staging for distributed rate limiting.
    
    Args:
        redis_url: Redis connection URL from environment
        environment: Deployment environment (development/staging/production)
        
    Raises:
        ValueError: If staging/production without Redis
    """
    if environment == "production" and not redis_url:
        raise ValueError(
            "REDIS_URL is REQUIRED for production deployments. "
            "Rate limiting must be distributed across workers. "
            "Configure Redis via REDIS_URL environment variable."
        )
    
    if environment == "staging" and not redis_url:
        raise ValueError(
            "REDIS_URL required for staging environment. "
            "Rate limiting must be consistent across instances."
        )


def validate_rate_limiter_backend(redis_url: Optional[str], environment: str) -> str:
    """
    Determine rate limiter backend based on configuration.
    
    Returns:
        "redis" for production, "memory" for development (with warning)
    """
    if environment == "production":
        validate_redis_in_production(redis_url, environment)
        return "redis"
    elif environment == "staging":
        if not redis_url:
            raise ValueError("REDIS_URL required for staging environment")
        return "redis"
    else:
        # Development: warn if no Redis
        if not redis_url:
            print(
                "⚠️  WARNING: Running rate limiter in-memory (development). "
                "Use REDIS_URL for distributed rate limiting in production."
            )
        return "redis" if redis_url else "memory"
