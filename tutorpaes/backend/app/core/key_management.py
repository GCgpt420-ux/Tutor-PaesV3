"""
API key versioning and rotation framework.
Supports backward compatibility during key rotation grace period.
"""
import os
from typing import Optional, Literal, Dict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@dataclass
class KeyVersion:
    """Represents a versioned API key."""
    version: str  # e.g., "v1", "v0"
    key: str
    created_at: datetime
    rotated_at: Optional[datetime] = None
    status: Literal["active", "deprecated", "revoked"] = "active"
    grace_period_expires_at: Optional[datetime] = None


class KeyManager:
    """Manage API key versions and rotation."""
    
    GRACE_PERIOD_DAYS = 7
    
    def __init__(self, provider: str):
        """
        Initialize key manager for a provider.
        
        Args:
            provider: "openai", "groq", "cerebras", "transbank"
            
        Raises:
            ValueError: If provider not recognized
        """
        valid_providers = {"openai", "groq", "cerebras", "transbank"}
        if provider.lower() not in valid_providers:
            raise ValueError(f"Unknown provider: {provider}. Must be one of {valid_providers}")
        
        self.provider = provider.lower()
        self._versions: Dict[str, KeyVersion] = {}
        self._load_versions_from_env()
    
    def _load_versions_from_env(self) -> None:
        """Load all versioned keys from environment variables."""
        # Try to load versioned keys: PROVIDER_API_KEY_V1, V0, etc.
        # Also support PROVIDER_API_KEY as fallback
        provider_prefix = self.provider.upper()
        
        # Load explicit versions first (V0, V1, V2, ...)
        for v in range(10):  # Support up to 10 versions
            env_var_versioned = f"{provider_prefix}_API_KEY_V{v}"
            key_value = os.getenv(env_var_versioned)
            
            if key_value:
                # Determine status based on version
                status = "active" if v == 0 else "deprecated"
                
                self._versions[f"v{v}"] = KeyVersion(
                    version=f"v{v}",
                    key=key_value,
                    created_at=datetime.now(),
                    status=status
                )
                logger.info(
                    f"Loaded {self.provider} key version v{v} (status: {status})",
                    extra={"provider": self.provider, "version": f"v{v}"}
                )
            # After loading all versions, find the highest version as active
            # (higher version numbers represent newer rotations)
            if self._versions:
                all_versions = sorted([int(v.lstrip('v')) for v in self._versions.keys()])
                highest_version = f"v{all_versions[-1]}"
            
                # Set only the highest version as active
                for v_key in self._versions:
                    self._versions[v_key].status = "active" if v_key == highest_version else "deprecated"
            
                logger.debug(
                    f"Set {highest_version} as active for {self.provider}",
                    extra={"provider": self.provider, "version": highest_version}
                )
    
    def get_active_key(self) -> str:
        """
        Get currently active key.
        
        Resolution order:
        1. Key marked as "active" in versioned keys
        2. Non-versioned PROVIDER_API_KEY env var
        3. First available version if no explicit "active" marker
        
        Returns:
            Active API key string
            
        Raises:
            ValueError: If no key found for this provider
        """
        # Try to find explicitly active key
        for version_key, key_data in self._versions.items():
            if key_data.status == "active":
                logger.debug(
                    f"Using active key for {self.provider}",
                    extra={"provider": self.provider, "version": version_key}
                )
                return key_data.key
        
        # Fall back to non-versioned env var
        fallback_var = f"{self.provider.upper()}_API_KEY"
        fallback_key = os.getenv(fallback_var)
        
        if fallback_key:
            logger.debug(
                f"Using non-versioned key for {self.provider}",
                extra={"provider": self.provider}
            )
            return fallback_key
        
        # Last resort: use first available version
        if self._versions:
            first_version = next(iter(self._versions.values()))
            logger.debug(
                f"Using first available version for {self.provider}",
                extra={"provider": self.provider, "version": first_version.version}
            )
            return first_version.key
        
        raise ValueError(
            f"No API key found for {self.provider}. "
            f"Set {fallback_var} or {fallback_var}_V0 environment variable."
        )
    
    def get_key_version(self, version: str) -> Optional[str]:
        """
        Get specific key version (for backward compatibility or debugging).
        
        Args:
            version: Version string (e.g., "v0", "v1")
            
        Returns:
            Key string or None if version not found
        """
        if version in self._versions:
            return self._versions[version].key
        return None
    
    def mark_deprecated(self, version: str, grace_period_days: int = None) -> None:
        """
        Mark a key version as deprecated.
        Will be revoked after grace period.
        
        Args:
            version: Version to deprecate (e.g., "v0")
            grace_period_days: Days before revocation (default: 7)
        """
        if grace_period_days is None:
            grace_period_days = self.GRACE_PERIOD_DAYS
        
        if version not in self._versions:
            raise ValueError(f"Version {version} not found")
        
        key_data = self._versions[version]
        key_data.status = "deprecated"
        key_data.rotated_at = datetime.now()
        key_data.grace_period_expires_at = datetime.now() + timedelta(days=grace_period_days)
        
        logger.warning(
            f"Marked {self.provider} key {version} as deprecated",
            extra={
                "provider": self.provider,
                "version": version,
                "grace_period_expires_at": key_data.grace_period_expires_at.isoformat()
            }
        )
    
    def mark_revoked(self, version: str) -> None:
        """
        Mark a key version as revoked (no longer usable).
        
        Args:
            version: Version to revoke
        """
        if version not in self._versions:
            raise ValueError(f"Version {version} not found")
        
        self._versions[version].status = "revoked"
        logger.critical(
            f"Revoked {self.provider} key {version}",
            extra={"provider": self.provider, "version": version}
        )
    
    def rotate_key(self, new_key: str, grace_period_days: int = None) -> str:
        """
        Perform a key rotation.
        
        Process:
        1. Find current active version
        2. Mark it as deprecated (grace period)
        3. Add new key as active
        4. Return new version identifier
        
        Args:
            new_key: The new API key value
            grace_period_days: Days before old key revoked (default: 7)
            
        Returns:
            Version identifier of new key (e.g., "v1")
        """
        if grace_period_days is None:
            grace_period_days = self.GRACE_PERIOD_DAYS
        
        # Mark current active as deprecated
        for version, key_data in self._versions.items():
            if key_data.status == "active":
                self.mark_deprecated(version, grace_period_days)
                break
        
        # Calculate new version number
        if self._versions:
            max_version_num = max(
                int(v.lstrip('v')) for v in self._versions.keys()
            )
            new_version = f"v{max_version_num + 1}"
        else:
            new_version = "v0"
        
        # Add new key as active
        self._versions[new_version] = KeyVersion(
            version=new_version,
            key=new_key,
            created_at=datetime.now(),
            status="active"
        )
        
        logger.info(
            f"Rotated {self.provider} key to {new_version}",
            extra={"provider": self.provider, "new_version": new_version}
        )
        
        return new_version
    
    def get_status(self) -> Dict:
        """
        Get current status of all key versions.
        
        Returns:
            Dict with version info for monitoring/debugging
        """
        return {
            "provider": self.provider,
            "versions": [
                {
                    "version": v,
                    "status": key_data.status,
                    "created_at": key_data.created_at.isoformat(),
                    "rotated_at": key_data.rotated_at.isoformat() if key_data.rotated_at else None,
                    "grace_period_expires_at": (
                        key_data.grace_period_expires_at.isoformat()
                        if key_data.grace_period_expires_at else None
                    ),
                }
                for v, key_data in sorted(self._versions.items())
            ],
            "active_key": self.get_active_key()[:10] + "..." if self.get_active_key() else None,
        }


# ============================================================================
# Provider-specific key managers (lazy-loaded singletons)
# ============================================================================

_managers = {}


def get_key_manager(provider: Literal["openai", "groq", "cerebras", "transbank"]) -> KeyManager:
    """
    Get or create a key manager for a provider.
    
    Args:
        provider: Provider name
        
    Returns:
        KeyManager instance
    """
    if provider not in _managers:
        _managers[provider] = KeyManager(provider)
    return _managers[provider]


def get_api_key(provider: Literal["openai", "groq", "cerebras", "transbank"]) -> str:
    """
    Get active API key for a provider.
    
    Usage:
        key = get_api_key("openai")
        client = OpenAI(api_key=key)
    
    Args:
        provider: Provider name (openai, groq, cerebras, transbank)
        
    Returns:
        Active API key string
        
    Raises:
        ValueError: If no key found or provider unknown
    """
    manager = get_key_manager(provider)
    return manager.get_active_key()


def rotate_provider_key(
    provider: Literal["openai", "groq", "cerebras", "transbank"],
    new_key: str,
    grace_period_days: int = 7
) -> str:
    """
    Rotate key for a provider.
    
    Args:
        provider: Provider name
        new_key: New API key
        grace_period_days: Grace period before old key revoked
        
    Returns:
        New version identifier
    """
    manager = get_key_manager(provider)
    return manager.rotate_key(new_key, grace_period_days)


def get_provider_status(
    provider: Literal["openai", "groq", "cerebras", "transbank"]
) -> Dict:
    """
    Get key status for a provider (monitoring/debugging).
    
    Args:
        provider: Provider name
        
    Returns:
        Status dict with version info
    """
    manager = get_key_manager(provider)
    return manager.get_status()
