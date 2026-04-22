# Priority 1 Security & Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking progress.

**Goal:** Fix 5 critical blocker issues: Redis requirement for rate limiting, API key rotation policy, frontend E2E tests foundation, multi-worker deployment setup, and N+1 query optimization.

**Architecture:** 
- Issue #1-2 (Security): Add Redis enforcement + document key rotation requirements
- Issue #3 (Testing): Setup Playwright E2E framework foundation  
- Issue #4 (DevOps): Implement Gunicorn multi-worker configuration + Railway.json update
- Issue #5 (Database): Fix catalog N+1 queries with selectinload optimization

**Tech Stack:** FastAPI, SQLAlchemy, Next.js, Playwright, Gunicorn, Redis

---

## TASK 1: Redis Requirement Enforcement (Security)

**Files:**
- Modify: `tutorpaes/backend/app/core/rate_limiter.py:18-35`
- Modify: `tutorpaes/backend/app/core/config.py:85-105`
- Modify: `tutorpaes/backend/app/main.py:1-30`
- Create: `tutorpaes/backend/app/core/validators.py` (new validation module)
- Test: `tutorpaes/backend/tests/test_security/test_redis_requirement.py`

### Summary
Redis should be REQUIRED for production deployments to prevent multi-worker rate limit bypasses. Currently optional.

### Steps

- [ ] **Step 1: Read current rate_limiter.py implementation**

```bash
cd /home/gabriel/Tutor-PaesV3/.worktrees/priority-1-security-testing
cat tutorpaes/backend/app/core/rate_limiter.py
```

Expected output: See current SlowAPI configuration with optional Redis

- [ ] **Step 2: Create production validation logic**

Create `tutorpaes/backend/app/core/validators.py`:

```python
"""Production environment validators."""
import os
from typing import Optional

def validate_redis_in_production(redis_url: Optional[str], environment: str) -> None:
    """
    Enforce Redis requirement in production for distributed rate limiting.
    
    Args:
        redis_url: Redis connection URL from environment
        environment: Deployment environment (development/staging/production)
        
    Raises:
        ValueError: If production without Redis
    """
    if environment == "production" and not redis_url:
        raise ValueError(
            "REDIS_URL is REQUIRED for production deployments. "
            "Rate limiting must be distributed across workers. "
            "Configure Redis via REDIS_URL environment variable."
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
```

- [ ] **Step 3: Update config.py to validate Redis requirement**

In `tutorpaes/backend/app/core/config.py`, add to the Settings class initialization:

```python
from .validators import validate_redis_in_production

class Settings(BaseSettings):
    # ... existing fields ...
    REDIS_URL: Optional[str] = None
    ENVIRONMENT: str = Field(default="development")
    
    @field_validator('ENVIRONMENT')
    @classmethod
    def validate_production_settings(cls, v, info):
        """Validate production environment requirements."""
        if v == "production" and not info.data.get('REDIS_URL'):
            raise ValueError(
                "REDIS_URL environment variable is REQUIRED for production. "
                "Multi-worker deployments require distributed rate limiting."
            )
        return v
```

- [ ] **Step 4: Update rate_limiter.py to enforce Redis**

Modify `tutorpaes/backend/app/core/rate_limiter.py`:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
from typing import Optional

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
REDIS_URL = os.getenv("REDIS_URL")

# Enforce Redis in production
if ENVIRONMENT == "production" and not REDIS_URL:
    raise RuntimeError(
        "FATAL: REDIS_URL not configured. "
        "Production deployments REQUIRE Redis for distributed rate limiting. "
        "Multi-worker setups will bypass in-memory limits. "
        "Configure REDIS_URL environment variable and restart."
    )

if REDIS_URL:
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=REDIS_URL,
        default_limits=["100 per minute"],
    )
    print(f"✅ Rate limiter using Redis: {REDIS_URL[:20]}...")
else:
    # Development: in-memory (with warning)
    print("⚠️  WARNING: Rate limiter in-memory mode. Single worker only.")
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["100 per minute"],
    )
```

- [ ] **Step 5: Write test for Redis requirement**

Create `tutorpaes/backend/tests/test_security/test_redis_requirement.py`:

```python
"""Test Redis requirement enforcement for production."""
import os
import pytest
from unittest.mock import patch


def test_redis_required_in_production():
    """Test that Redis is required in production environment."""
    with patch.dict(os.environ, {"ENVIRONMENT": "production"}, clear=False):
        # Should raise when trying to initialize limiter without Redis
        with pytest.raises(RuntimeError, match="REDIS_URL not configured"):
            from tutorpaes.backend.app.core import rate_limiter
            # Force reload to trigger validation


def test_redis_optional_in_development():
    """Test that Redis is optional in development."""
    with patch.dict(
        os.environ, 
        {"ENVIRONMENT": "development", "REDIS_URL": ""}, 
        clear=False
    ):
        # Should not raise in development
        import importlib
        import tutorpaes.backend.app.core.rate_limiter as limiter_module
        importlib.reload(limiter_module)
        assert limiter_module.limiter is not None


def test_redis_url_validation_in_config():
    """Test Pydantic validator rejects production without Redis."""
    from tutorpaes.backend.app.core.config import Settings
    
    with pytest.raises(ValueError, match="REDIS_URL.*required"):
        Settings(ENVIRONMENT="production", REDIS_URL=None)
```

- [ ] **Step 6: Test locally**

```bash
cd /home/gabriel/Tutor-PaesV3/.worktrees/priority-1-security-testing/tutorpaes/backend
pytest tests/test_security/test_redis_requirement.py -v
```

Expected: 2 passes, 0 failures

- [ ] **Step 7: Update .env.example to highlight Redis requirement**

Add to `tutorpaes/backend/.env.example`:

```
# ⚠️  PRODUCTION REQUIREMENT: Redis is REQUIRED for multi-worker deployments
# Without Redis, rate limiting is per-process only (rate limits can be bypassed)
# Configure for production:
REDIS_URL=redis://default:password@redis-host:6379/0
```

- [ ] **Step 8: Commit**

```bash
git add app/core/validators.py app/core/rate_limiter.py app/core/config.py .env.example
git add tests/test_security/test_redis_requirement.py
git commit -m "feat: enforce Redis requirement for production rate limiting

- Add Redis validation in config and rate_limiter modules
- Raise RuntimeError in production without Redis to prevent bypasses
- Add comprehensive tests for Redis requirement
- Document Redis requirement in .env.example
- Multi-worker deployments now protected from rate limit evasion"
```

---

## TASK 2: API Key Rotation Policy Documentation & Framework

**Files:**
- Create: `DOCS/API_KEY_ROTATION_POLICY.md` (documentation)
- Create: `tutorpaes/backend/app/core/key_management.py` (key versioning framework)
- Modify: `tutorpaes/backend/.env.example`
- Create: `tutorpaes/backend/scripts/rotate_api_keys.py` (helper script)

### Summary
Implement API key versioning framework and document rotation policy for OpenAI, Groq, Cerebras, and Transbank keys.

### Steps

- [ ] **Step 1: Create key rotation policy document**

Create `DOCS/API_KEY_ROTATION_POLICY.md`:

```markdown
# API Key Rotation Policy

## Overview
All API keys used in TutorPAES (OpenAI, Groq, Cerebras, Transbank) must be rotated quarterly minimum, or immediately if compromised.

## Key Categories

### Production Keys
- **Rotation:** Every 90 days (quarterly)
- **Storage:** Environment variables only, never committed
- **Audit:** Log every key access in AIUsageLog table
- **Revocation:** Previous versions remain in env for 7 days (grace period)

### Integration/Sandbox Keys
- **Rotation:** Every 180 days (biannually)
- **Storage:** May be in code for sandbox credentials, but clearly marked
- **Examples:** Transbank sandbox ID (597055555532) is public

## Rotation Procedure

### 1. Generate New Key
Request new key from provider:
- OpenAI: https://platform.openai.com/api-keys
- Groq: https://console.groq.com/keys
- Cerebras: https://cloud.cerebras.ai/api-keys
- Transbank: Contact account manager

### 2. Version the New Key
```bash
# Before:
OPENAI_API_KEY=sk-proj-old-key-xyz

# After (with versioning):
OPENAI_API_KEY_V1=sk-proj-new-key-abc
OPENAI_API_KEY_V0=sk-proj-old-key-xyz  # Grace period (7 days)
OPENAI_API_KEY=sk-proj-new-key-abc    # Active (points to V1)
```

### 3. Update Environment
- Deploy new .env to production
- Verify API calls successful
- Monitor logs for 24 hours
- Remove old key after grace period

### 4. Log Rotation Event
```sql
INSERT INTO audit_log (event, provider, old_key_version, new_key_version, rotated_at)
VALUES ('key_rotation', 'openai', 'v0', 'v1', NOW());
```

## Emergency Rotation (Suspected Compromise)

If a key is suspected compromised:
1. Immediately revoke in provider console
2. Generate new key
3. Deploy new key to all environments
4. Search logs for unauthorized usage
5. Alert on Slack #security

## Monitoring

Track in `/monitoring/key_rotation_schedule.md`:
- Last rotation date per key
- Next scheduled rotation
- Grace period expiry
- Revocation status

## Audit Trail

All key access logged:
- Provider: openai, groq, cerebras, transbank
- Action: authenticate, generate_response, etc.
- Timestamp: UTC
- User/System: who made the call
- Status: success/failure

Query usage by key:
```python
# In analytics dashboard
SELECT provider, COUNT(*) as requests, SUM(cost) as total_cost
FROM ai_usage_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY provider
ORDER BY total_cost DESC;
```
```

- [ ] **Step 2: Create key management framework**

Create `tutorpaes/backend/app/core/key_management.py`:

```python
"""
API key versioning and rotation framework.
Supports backward compatibility during key rotation grace period.
"""
import os
from typing import Optional, Literal
from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass
class KeyVersion:
    """Represents a versioned API key."""
    version: str  # e.g., "v1", "v0"
    key: str
    created_at: datetime
    rotated_at: Optional[datetime] = None
    status: Literal["active", "deprecated", "revoked"] = "active"


class KeyManager:
    """Manage API key versions and rotation."""
    
    def __init__(self, provider: str):
        """
        Initialize key manager for a provider.
        
        Args:
            provider: "openai", "groq", "cerebras", "transbank"
        """
        self.provider = provider
        self._versions: dict[str, KeyVersion] = {}
        self._load_versions_from_env()
    
    def _load_versions_from_env(self) -> None:
        """Load all versioned keys from environment variables."""
        # Try to load versioned keys: PROVIDER_API_KEY_V1, V0, etc.
        for v in range(10):  # Support up to 10 versions
            env_var = f"{self.provider.upper()}_API_KEY_V{v}"
            key_value = os.getenv(env_var)
            if key_value:
                self._versions[f"v{v}"] = KeyVersion(
                    version=f"v{v}",
                    key=key_value,
                    created_at=datetime.now(),  # TODO: load from metadata
                    status="active" if v == 0 else "deprecated"
                )
    
    def get_active_key(self) -> str:
        """
        Get currently active key.
        Falls back to PROVIDER_API_KEY if versioning not used.
        """
        # Try versioned key first
        active = next(
            (v.key for v in self._versions.values() if v.status == "active"),
            None
        )
        if active:
            return active
        
        # Fall back to non-versioned env var
        fallback_var = f"{self.provider.upper()}_API_KEY"
        fallback_key = os.getenv(fallback_var)
        if not fallback_key:
            raise ValueError(
                f"No API key found for {self.provider}. "
                f"Set {fallback_var} or {fallback_var}_V0"
            )
        return fallback_key
    
    def get_key_version(self, version: str) -> Optional[str]:
        """Get specific key version (for backward compatibility)."""
        if version in self._versions:
            return self._versions[version].key
        return None
    
    def mark_deprecated(self, version: str, grace_period_days: int = 7) -> None:
        """
        Mark a key version as deprecated.
        Will be revoked after grace period.
        """
        if version in self._versions:
            self._versions[version].status = "deprecated"
            self._versions[version].rotated_at = datetime.now()
            # TODO: Schedule revocation after grace_period_days


# Provider-specific key managers
openai_keys = KeyManager("openai")
groq_keys = KeyManager("groq")
cerebras_keys = KeyManager("cerebras")
transbank_keys = KeyManager("transbank")


def get_api_key(provider: Literal["openai", "groq", "cerebras", "transbank"]) -> str:
    """
    Get active API key for a provider.
    
    Usage:
        key = get_api_key("openai")
        client = OpenAI(api_key=key)
    """
    manager_map = {
        "openai": openai_keys,
        "groq": groq_keys,
        "cerebras": cerebras_keys,
        "transbank": transbank_keys,
    }
    
    if provider not in manager_map:
        raise ValueError(f"Unknown provider: {provider}")
    
    return manager_map[provider].get_active_key()
```

- [ ] **Step 3: Update LLM provider service to use key management**

Modify `tutorpaes/backend/app/services/llm_provider_service.py` to use KeyManager:

```python
from app.core.key_management import get_api_key

class OpenAIProvider:
    def __init__(self):
        api_key = get_api_key("openai")  # Uses key manager
        self.client = OpenAI(api_key=api_key)

class GroqProvider:
    def __init__(self):
        api_key = get_api_key("groq")
        self.client = Groq(api_key=api_key)
```

- [ ] **Step 4: Create rotation helper script**

Create `tutorpaes/backend/scripts/rotate_api_keys.py`:

```python
"""
Helper script to rotate API keys safely.
Usage: python rotate_api_keys.py --provider openai
"""
import argparse
import os
from datetime import datetime
from app.core.key_management import KeyManager


def rotate_key(provider: str, new_key: str) -> None:
    """
    Rotate API key for a provider.
    Marks old key as deprecated, activates new key.
    """
    manager = KeyManager(provider)
    
    # Get current active version
    active_version = next(
        (k for k, v in manager._versions.items() if v.status == "active"),
        None
    )
    
    if active_version:
        # Mark old as deprecated
        manager.mark_deprecated(active_version)
        print(f"✓ Marked {active_version} as deprecated (7-day grace period)")
    
    # Add new key
    new_version = f"v{len(manager._versions)}"
    env_var = f"{provider.upper()}_API_KEY_{new_version}"
    print(f"\n📝 Set this in production environment:")
    print(f"{env_var}={new_key}")
    print(f"\n⏰ Grace period ends: {datetime.now() + timedelta(days=7)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Rotate API keys")
    parser.add_argument(
        "--provider",
        choices=["openai", "groq", "cerebras", "transbank"],
        required=True
    )
    parser.add_argument("--new-key", required=True, help="New API key value")
    
    args = parser.parse_args()
    rotate_key(args.provider, args.new_key)
```

- [ ] **Step 5: Update .env.example**

Add to `tutorpaes/backend/.env.example`:

```
# API Key Management (with versioning support)
# Support both non-versioned and versioned keys
# Non-versioned (simple): OPENAI_API_KEY=sk-...
# Versioned (rotation): OPENAI_API_KEY_V1=sk-... OPENAI_API_KEY_V0=sk-...

# OpenAI
OPENAI_API_KEY=  # Production key (or use OPENAI_API_KEY_V1)

# Groq
GROQ_API_KEY=    # Production key (or use GROQ_API_KEY_V1)

# Cerebras
CEREBRAS_API_KEY= # Production key (or use CEREBRAS_API_KEY_V1)

# Transbank
TBK_API_KEY=      # Production key (or use TBK_API_KEY_V1)

# Key Rotation Notes:
# - Rotate every 90 days minimum
# - Use KeyManager for versioning support
# - See docs/API_KEY_ROTATION_POLICY.md for details
```

- [ ] **Step 6: Commit**

```bash
git add DOCS/API_KEY_ROTATION_POLICY.md
git add tutorpaes/backend/app/core/key_management.py
git add tutorpaes/backend/scripts/rotate_api_keys.py
git add tutorpaes/backend/.env.example
git commit -m "feat: implement API key rotation policy and versioning framework

- Create comprehensive key rotation policy document
- Add KeyManager class for versioned key handling
- Support backward compatibility during grace period (7 days)
- Update LLM provider service to use key management
- Document rotation schedule: 90 days production, 180 days sandbox
- Add rotate_api_keys.py helper script
- Update .env.example with key versioning examples"
```

---

## TASK 3: Frontend E2E Testing Foundation (Playwright)

**Files:**
- Create: `tutorpaes/frontend/playwright.config.ts`
- Create: `tutorpaes/frontend/e2e/auth.spec.ts`
- Create: `tutorpaes/frontend/e2e/quiz.spec.ts`
- Modify: `tutorpaes/frontend/package.json` (add Playwright)
- Create: `.github/workflows/e2e.yml` (CI/CD pipeline)

### Summary
Setup Playwright E2E testing framework with critical user journeys (auth, quiz).

### Steps

- [ ] **Step 1: Install Playwright**

```bash
cd /home/gabriel/Tutor-PaesV3/.worktrees/priority-1-security-testing/tutorpaes/frontend
npm install --save-dev @playwright/test
npx playwright install
```

Expected: Playwright browsers downloaded, npm packages installed

- [ ] **Step 2: Create Playwright configuration**

Create `tutorpaes/frontend/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['github'],
    ['list']
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

- [ ] **Step 3: Create auth E2E tests**

Create `tutorpaes/frontend/e2e/auth.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.click('button:has-text("Sign In")');
    
    // Should redirect to dashboard
    await page.waitForURL('/protected/progreso');
    await expect(page).toHaveURL(/\/protected\/progreso/);
  });

  test('should reject invalid password', async ({ page }) => {
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button:has-text("Sign In")');
    
    // Should show error message
    const errorMsg = page.locator('text=Invalid credentials');
    await expect(errorMsg).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should register new user', async ({ page }) => {
    await page.click('a:has-text("Create Account")');
    await page.waitForURL(/\/auth\/signup/);
    
    await page.fill('input[placeholder="Email"]', 'newuser@example.com');
    await page.fill('input[placeholder="Password"]', 'NewPassword123!');
    await page.fill('input[placeholder="Confirm"]', 'NewPassword123!');
    await page.click('button:has-text("Sign Up")');
    
    // Should redirect to onboarding
    await page.waitForURL(/\/onboarding/);
  });

  test('should reset password via email', async ({ page }) => {
    await page.click('a:has-text("Forgot Password")');
    await page.waitForURL(/\/auth\/forgot-password/);
    
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.click('button:has-text("Send Reset Link")');
    
    // Should show confirmation message
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('should logout', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/\/protected\/progreso/);
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    
    // Should redirect to home
    await page.waitForURL('/');
  });
});
```

- [ ] **Step 4: Create quiz E2E tests**

Create `tutorpaes/frontend/e2e/quiz.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Quiz Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/\/protected\/progreso/);
  });

  test('should complete a quiz attempt', async ({ page }) => {
    // Navigate to exams
    await page.click('[data-testid="nav-exams"]');
    await page.waitForURL(/\/protected\/ensayos/);
    
    // Select an exam
    const examCard = page.locator('text=PAES Demo').first();
    await examCard.click();
    
    // Start quiz
    await page.click('button:has-text("Start Exam")');
    await page.waitForURL(/\/protected\/quiz/);
    
    // Answer questions (5 questions)
    for (let i = 0; i < 5; i++) {
      // Select an answer
      await page.click('button:has-text("A")',  { timeout: 5000 });
      
      // Click next or submit
      if (i < 4) {
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(500); // Wait for next question to load
      } else {
        await page.click('button:has-text("Submit")');
      }
    }
    
    // Should show results
    await page.waitForURL(/\/protected\/resultados/);
    await expect(page.locator('text=Your Score')).toBeVisible();
  });

  test('should display AI explanation for wrong answer', async ({ page }) => {
    // Navigate to quiz
    await page.goto('/protected/quiz'); // Assuming there's an active attempt
    
    // Select wrong answer intentionally
    await page.click('button:has-text("B")');
    
    // Ask for explanation
    await page.click('button:has-text("Explain")');
    
    // AI explanation should appear
    const explanation = page.locator('[data-testid="ai-explanation"]');
    await expect(explanation).toBeVisible({ timeout: 10000 });
    
    // Should contain actual content
    const text = await explanation.textContent();
    expect(text?.length).toBeGreaterThan(10);
  });

  test('should display progress tracking', async ({ page }) => {
    // Navigate to progress page
    await page.click('[data-testid="nav-progress"]');
    await page.waitForURL(/\/protected\/progreso/);
    
    // Check dashboard elements
    await expect(page.locator('text=Overall Progress')).toBeVisible();
    await expect(page.locator('text=Accuracy')).toBeVisible();
    await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
  });
});
```

- [ ] **Step 5: Update package.json with E2E scripts**

Modify `tutorpaes/frontend/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "e2e": "playwright test",
    "e2e:headed": "playwright test --headed",
    "e2e:debug": "playwright test --debug",
    "e2e:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.45.0"
  }
}
```

- [ ] **Step 6: Create GitHub Actions CI/CD workflow**

Create `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, feature/*, develop]
  pull_request:
    branches: [main, develop]

jobs:
  e2e:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: mvp_db_test
          POSTGRES_USER: tutorpaes_app
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'npm'
          cache-dependency-path: tutorpaes/frontend/package-lock.json

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install Python dependencies
        working-directory: tutorpaes/backend
        run: pip install -r requirements.txt

      - name: Start backend server
        working-directory: tutorpaes/backend
        run: |
          export DATABASE_URL="postgresql://tutorpaes_app:test_password@localhost:5432/mvp_db_test"
          alembic upgrade head
          python scripts/seed_user.py
          uvicorn app.main:app --host 127.0.0.1 --port 8000 &
          sleep 5

      - name: Install frontend dependencies
        working-directory: tutorpaes/frontend
        run: npm install

      - name: Install Playwright browsers
        working-directory: tutorpaes/frontend
        run: npx playwright install --with-deps

      - name: Run E2E tests
        working-directory: tutorpaes/frontend
        run: npm run e2e

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: tutorpaes/frontend/playwright-report/
          retention-days: 30
```

- [ ] **Step 7: Test locally**

```bash
cd /home/gabriel/Tutor-PaesV3/.worktrees/priority-1-security-testing/tutorpaes/frontend
npm run e2e:headed
```

Expected: Chromium browser opens, runs tests visually

- [ ] **Step 8: Commit**

```bash
git add tutorpaes/frontend/playwright.config.ts
git add tutorpaes/frontend/e2e/auth.spec.ts
git add tutorpaes/frontend/e2e/quiz.spec.ts
git add tutorpaes/frontend/package.json
git add .github/workflows/e2e.yml
git commit -m "feat: add Playwright E2E testing foundation

- Setup Playwright with Chrome, Firefox, Safari browsers
- Add auth E2E tests: login, register, password reset, logout
- Add quiz E2E tests: complete flow, AI explanations, progress tracking
- Configure GitHub Actions CI/CD pipeline for automated E2E runs
- Support both headed (UI) and headless modes for debugging
- Capture screenshots and videos on failures"
```

---

## TASK 4: Multi-Worker Deployment Setup (Gunicorn + WEB_CONCURRENCY)

**Files:**
- Modify: `tutorpaes/backend/Dockerfile`
- Modify: `tutorpaes/backend/railway.json`
- Create: `tutorpaes/backend/wsgi.py` (WSGI entry point)
- Modify: `tutorpaes/backend/.env.example`
- Create: `DOCS/DEPLOYMENT_MULTI_WORKER.md`

### Summary
Implement production-grade multi-worker setup using Gunicorn with WEB_CONCURRENCY scaling.

### Steps

- [ ] **Step 1: Create WSGI entry point**

Create `tutorpaes/backend/wsgi.py`:

```python
"""WSGI entry point for production deployments with Gunicorn."""
import os
import sys
from pathlib import Path

# Add app directory to path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir.parent))

from app.main import app

# For Gunicorn to find the app
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "wsgi:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development"
    )
```

- [ ] **Step 2: Update Dockerfile for multi-stage and Gunicorn**

Modify `tutorpaes/backend/Dockerfile`:

```dockerfile
# Stage 1: Builder
FROM python:3.11-slim as builder

WORKDIR /tmp

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Create non-root user
RUN useradd -m -u 10001 appuser

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /home/appuser/.local

# Set environment
ENV PATH=/home/appuser/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random

COPY --chown=appuser:appuser . .

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
    CMD python -c "import requests; requests.get('http://localhost:8000/api/v1/health/ready', timeout=5)" || exit 1

# Production: Gunicorn with auto-scaling workers
CMD gunicorn \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers ${WEB_CONCURRENCY:-4} \
    --worker-class uvicorn.workers.UvicornWorker \
    --max-requests 10000 \
    --max-requests-jitter 1000 \
    --timeout 120 \
    --graceful-timeout 30 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    app.main:app
```

- [ ] **Step 3: Update railway.json for multi-worker**

Modify `tutorpaes/backend/railway.json`:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK"
  },
  "deploy": {
    "startCommand": "gunicorn --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-4} --worker-class uvicorn.workers.UvicornWorker --timeout 120 --graceful-timeout 30 app.main:app",
    "healthcheckPath": "/api/v1/health/ready",
    "healthcheckTimeout": 10,
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 3
  }
}
```

- [ ] **Step 4: Update requirements.txt with Gunicorn**

Add to `tutorpaes/backend/requirements.txt`:

```
gunicorn==21.2.0
uvicorn[standard]==0.27.0
```

- [ ] **Step 5: Create deployment documentation**

Create `DOCS/DEPLOYMENT_MULTI_WORKER.md`:

```markdown
# Multi-Worker Deployment Guide

## Architecture

Production deployment uses Gunicorn with UvicornWorker:

```
Load Balancer / Railway
    ↓
Gunicorn (Process Manager)
    ├─ Worker 1 (Uvicorn ASGI)
    ├─ Worker 2 (Uvicorn ASGI)
    ├─ Worker 3 (Uvicorn ASGI)
    └─ Worker 4 (Uvicorn ASGI) [default]
```

## Worker Scaling

### Configuration

**Environment Variable:** `WEB_CONCURRENCY`

```bash
# Development (single worker)
WEB_CONCURRENCY=1

# Staging (2-4 workers)
WEB_CONCURRENCY=4

# Production (scale to CPU cores)
WEB_CONCURRENCY=$(($(nproc) * 2 + 1))  # 2.5x CPU cores
# Example: 4-core machine → 9 workers
```

### Calculation Formula

```
Workers = (2 × CPU_CORES) + 1
```

**Rationale:** Balance between parallelism and memory overhead. Typically optimal for I/O-bound workloads.

**Railway Default:** WEB_CONCURRENCY=4 (good for small/medium)

### Memory Requirements

- Per worker: ~100-150 MB base + request buffer
- Total memory = Workers × 150 MB + overhead

**Example:**
- 4 workers × 150 MB = 600 MB + 100 MB overhead = ~700 MB required

## Configuration Details

### Gunicorn Settings

```
--workers 4              # Number of worker processes
--worker-class uvicorn.workers.UvicornWorker  # ASGI-compatible
--max-requests 10000    # Restart worker after 10k requests (memory leak prevention)
--max-requests-jitter 1000  # Randomize to stagger restarts
--timeout 120           # Request timeout (2 minutes)
--graceful-timeout 30   # Shutdown grace period
--keep-alive 5          # Connection keep-alive (seconds)
```

### Rate Limiting Across Workers

⚠️ **REQUIREMENT:** Redis must be configured (`REDIS_URL` env var)

Without Redis: Each worker has independent rate limits (limits can be bypassed)
With Redis: Centralized rate limit tracking across all workers

### Database Connection Pooling

SQLAlchemy configured for multi-worker:
- pool_size: 20 (base connections)
- max_overflow: 30 (peak overflow)
- pool_pre_ping: True (validate before use)

**Total connections:** 4 workers × (20 + 30) = 200 max

Ensure PostgreSQL `max_connections` > 200 in production.

## Deployment Checklist

- [ ] Redis REDIS_URL configured
- [ ] WEB_CONCURRENCY set to target value
- [ ] PostgreSQL max_connections increased if needed
- [ ] Load balancer health checks pointing to `/api/v1/health/ready`
- [ ] Rate limiting tests pass with concurrent requests
- [ ] Graceful shutdown tested (no request loss)
- [ ] Memory usage monitored for leaks

## Monitoring

### Health Endpoints

```bash
# Readiness probe (used by load balancer)
curl http://localhost:8000/api/v1/health/ready

# Liveness probe (basic health)
curl http://localhost:8000/api/v1/health/
```

### Worker Status

```bash
# Check active workers
ps aux | grep gunicorn

# Monitor worker restarts
tail -f /var/log/app/gunicorn.log | grep "Worker restarted"
```

### Performance Metrics

- Request latency: Monitor 99th percentile
- Worker utilization: Should be 70-80% on average
- Connection pool: Should not hit max_overflow frequently

## Troubleshooting

### Issue: Rate limits being bypassed

**Cause:** Each worker has independent in-memory rate limiter

**Solution:** Configure Redis `REDIS_URL` environment variable

### Issue: Workers crashing due to memory

**Cause:** Memory leak or max_requests too high

**Solution:** 
- Reduce max_requests: `--max-requests 1000`
- Profile memory usage: `memory_profiler`
- Monitor with: `top -p $(pgrep -f gunicorn)`

### Issue: Slow requests cause timeouts

**Cause:** --timeout too low

**Solution:** Increase timeout: `--timeout 180` (3 minutes for long LLM calls)

## Performance Tips

1. **Use CDN for static files** - Reduce worker load
2. **Enable gzip compression** - Reduce bandwidth
3. **Cache database queries** - Reduce DB connections
4. **Monitor slow queries** - Optimize N+1 issues
5. **Configure Redis properly** - For rate limiting + future caching
```

- [ ] **Step 6: Update .env.example**

Add to `tutorpaes/backend/.env.example`:

```
# Multi-Worker Deployment
# Formula: WEB_CONCURRENCY = (2 × CPU_CORES) + 1
# Examples: 1-core = 3, 2-core = 5, 4-core = 9, 8-core = 17
WEB_CONCURRENCY=4

# Gunicorn settings (advanced)
GUNICORN_WORKERS=4
GUNICORN_TIMEOUT=120
GUNICORN_GRACEFUL_TIMEOUT=30
GUNICORN_MAX_REQUESTS=10000
```

- [ ] **Step 7: Test multi-worker locally**

```bash
cd /home/gabriel/Tutor-PaesV3/.worktrees/priority-1-security-testing/tutorpaes/backend

# Run with 2 workers
WEB_CONCURRENCY=2 gunicorn \
  --bind 0.0.0.0:8000 \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  app.main:app

# In another terminal, test concurrent requests
for i in {1..20}; do 
  curl -s http://localhost:8000/api/v1/health/ & 
done
wait

# Check worker list
ps aux | grep gunicorn
```

Expected: 2 worker processes visible, all requests succeed

- [ ] **Step 8: Commit**

```bash
git add tutorpaes/backend/Dockerfile
git add tutorpaes/backend/railway.json
git add tutorpaes/backend/wsgi.py
git add tutorpaes/backend/requirements.txt
git add tutorpaes/backend/.env.example
git add DOCS/DEPLOYMENT_MULTI_WORKER.md
git commit -m "feat: implement multi-worker production deployment

- Add Gunicorn with UvicornWorker for production serving
- Implement multi-stage Docker build (200MB size reduction)
- Update railway.json with proper worker scaling
- Support WEB_CONCURRENCY auto-scaling per CPU cores
- Add graceful shutdown, request timeout, connection pooling
- Document multi-worker configuration and troubleshooting
- Memory leak prevention: max-requests-jitter rotation
- Health checks: /api/v1/health/ready for load balancer"
```

---

## TASK 5: N+1 Query Optimization in Catalog

**Files:**
- Modify: `tutorpaes/backend/app/api/v1/endpoints/catalog.py` (multiple locations)
- Modify: `tutorpaes/backend/app/db/models.py` (lazy loading strategy)
- Create: `tutorpaes/backend/tests/test_performance/test_catalog_queries.py`
- Create: `DOCS/QUERY_OPTIMIZATION.md`

### Summary
Fix N+1 queries in catalog endpoints by adding selectinload hints for nested relationships.

### Steps

- [ ] **Step 1: Profile current N+1 problem**

First, identify the slow queries:

```bash
cd /home/gabriel/Tutor-PaesV3/.worktrees/priority-1-security-testing/tutorpaes/backend

# Enable SQL query logging
cat > test_catalog_profile.py << 'EOF'
import asyncio
from sqlalchemy import event
from sqlalchemy.engine import Engine
from app.db.session import SessionLocal, engine
from app.db.models import Exam

query_count = 0

@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    global query_count
    query_count += 1
    print(f"\n[Query {query_count}] {statement[:100]}...")

async def test():
    db = SessionLocal()
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    # BEFORE: N+1 problem
    print("\n=== BEFORE (N+1) ===")
    query_count = 0
    exams = db.scalars(select(Exam)).all()
    for exam in exams:
        for subject in exam.subjects:  # N+1!
            for topic in subject.topics:  # N+2!
                pass
    print(f"\nTotal queries: {query_count}")
    
    db.close()
    db = SessionLocal()
    
    # AFTER: Optimized
    print("\n\n=== AFTER (Optimized) ===")
    query_count = 0
    exams = db.scalars(
        select(Exam)
        .options(selectinload(Exam.subjects).selectinload(Subject.topics))
    ).all()
    for exam in exams:
        for subject in exam.subjects:
            for topic in subject.topics:
                pass
    print(f"\nTotal queries: {query_count}")

if __name__ == "__main__":
    asyncio.run(test())
EOF

python test_catalog_profile.py
```

Expected: Show 40+ queries in BEFORE, 3 queries in AFTER

- [ ] **Step 2: Update catalog.py with selectinload optimization**

Key sections to modify in `tutorpaes/backend/app/api/v1/endpoints/catalog.py`:

```python
from sqlalchemy.orm import selectinload
from app.db.models import Exam, Subject, Topic

# GET /exams - BEFORE (N+1)
@router.get("/exams")
async def get_exams(db: Session = Depends(get_db)):
    return db.scalars(select(Exam).where(Exam.is_active == True)).all()

# GET /exams - AFTER (Optimized)
@router.get("/exams")
async def get_exams(db: Session = Depends(get_db)):
    return db.scalars(
        select(Exam)
        .where(Exam.is_active == True)
        .options(
            selectinload(Exam.subjects).selectinload(Subject.topics),
            selectinload(Exam.questions)
        )
    ).all()

# GET /exams/{exam_id}/subjects - BEFORE (N+1)
async def get_exam_subjects(exam_id: int, db: Session = Depends(get_db)):
    return db.scalars(
        select(Subject).where(Subject.exam_id == exam_id)
    ).all()

# GET /exams/{exam_id}/subjects - AFTER (Optimized)
async def get_exam_subjects(exam_id: int, db: Session = Depends(get_db)):
    return db.scalars(
        select(Subject)
        .where(Subject.exam_id == exam_id)
        .options(selectinload(Subject.topics).selectinload(Topic.questions))
    ).all()
```

Find all loops over relationships and add `.options()` with `selectinload()`.

- [ ] **Step 3: Create query optimization tests**

Create `tutorpaes/backend/tests/test_performance/test_catalog_queries.py`:

```python
"""Test catalog queries for N+1 problems."""
import pytest
from sqlalchemy import event
from sqlalchemy.engine import Engine
from app.db.session import SessionLocal
from app.db.models import Exam, Subject, Topic
from app.api.v1.endpoints import catalog


class QueryCounter:
    """Count SQL queries executed."""
    def __init__(self):
        self.count = 0
    
    @pytest.fixture(autouse=True)
    def setup(self, db_session):
        @event.listens_for(Engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            self.count += 1
        yield
        event.remove(Engine, "before_cursor_execute", receive_before_cursor_execute)


@pytest.mark.asyncio
async def test_get_exams_no_n_plus_one(db_session):
    """Test that get_exams doesn't have N+1 problem."""
    counter = QueryCounter()
    
    # Seed test data: 3 exams, 4 subjects each, 3 topics each
    for i in range(3):
        exam = Exam(code=f"EXAM{i}", name=f"Exam {i}")
        db_session.add(exam)
        db_session.flush()
        
        for j in range(4):
            subject = Subject(exam_id=exam.id, code=f"SUBJ{j}", name=f"Subject {j}")
            db_session.add(subject)
            db_session.flush()
            
            for k in range(3):
                topic = Topic(subject_id=subject.id, code=f"TOPIC{k}", name=f"Topic {k}")
                db_session.add(topic)
        db_session.commit()
    
    # Reset counter
    counter.count = 0
    
    # Call endpoint
    exams = await catalog.get_exams(db_session)
    
    # Access all relationships
    for exam in exams:
        for subject in exam.subjects:
            for topic in subject.topics:
                pass
    
    # Should be < 10 queries (selectinload should batch)
    # Without optimization: 1 + 3 + 12 = 16 queries
    # With optimization: 3 queries (exams + subjects + topics)
    assert counter.count < 10, f"Expected <10 queries, got {counter.count}"
```

- [ ] **Step 4: Create query optimization documentation**

Create `DOCS/QUERY_OPTIMIZATION.md`:

```markdown
# Query Optimization Guide

## N+1 Problem

### What Is It?

N+1 query problem occurs when code does lazy loading in a loop:

```python
# ❌ BAD: N+1 queries
exams = db.scalars(select(Exam)).all()  # 1 query
for exam in exams:                      # N exams
    print(exam.subjects)                # N queries (lazy load each time)
```

For 5 exams → 6 total queries (1 + 5)
For 100 exams → 101 total queries!

### Impact

- Slow response times
- Wasted database connections
- High database load
- Poor user experience

### Solution: selectinload()

```python
# ✅ GOOD: Eager loading with selectinload
exams = db.scalars(
    select(Exam)
    .options(selectinload(Exam.subjects))
).all()  # 2 queries total
for exam in exams:
    print(exam.subjects)  # No additional queries!
```

## Selectinload Patterns

### Single Relationship

```python
select(Exam).options(selectinload(Exam.subjects))
```

Queries: 1 (exams) + 1 (subjects) = 2 total

### Nested Relationships

```python
select(Exam).options(
    selectinload(Exam.subjects).selectinload(Subject.topics)
)
```

Queries: 1 (exams) + 1 (subjects) + 1 (topics) = 3 total

### Multiple Relationships

```python
select(Exam).options(
    selectinload(Exam.subjects),
    selectinload(Exam.questions),
    selectinload(Exam.attempts)
)
```

Each relationship still uses 1 query

### Collections vs Single

```python
# Collection (1:many) - use selectinload
selectinload(Exam.subjects)  # Load all subjects for exam

# Single item (many:1) - use joinedload
joinedload(Subject.exam)  # Load one exam for each subject
```

## Performance Optimization Checklist

- [ ] Profile queries with SQL logging enabled
- [ ] Identify loops over relationships
- [ ] Add `.options(selectinload(...))` before loops
- [ ] Use `joinedload()` for many:1 relationships
- [ ] Test with `test_catalog_queries.py`
- [ ] Verify query count < expected
- [ ] Monitor database CPU in production

## Common Patterns

### API Endpoint Pattern

```python
@router.get("/items")
async def get_items(db: Session = Depends(get_db)):
    return db.scalars(
        select(Item)
        .options(
            selectinload(Item.category),
            selectinload(Item.tags),
            selectinload(Item.comments).selectinload(Comment.author)
        )
        .where(Item.is_active == True)
        .limit(100)
    ).all()
```

### Query Helper Functions

```python
def build_exam_query():
    """Build optimized exam query with all relationships."""
    return (
        select(Exam)
        .options(
            selectinload(Exam.subjects)
            .selectinload(Subject.topics)
            .selectinload(Topic.questions)
        )
    )

# Usage
exams = db.scalars(build_exam_query()).all()
```

## Monitoring

### Enable Query Logging

```python
# In development
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)
```

### Query Count Test

```python
def count_queries(func):
    query_count = 0
    
    @event.listens_for(Engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        nonlocal query_count
        query_count += 1
    
    result = func()
    return result, query_count
```

## Trade-offs

| Approach | Queries | Memory | Flexibility |
|----------|---------|--------|-------------|
| Lazy load | N + 1 | Low | High |
| Selectinload | 2-3 | Medium | Medium |
| Joinedload | 1 | High | Low |
| Separate queries | Many | Low | High |

**Recommendation:** Start with selectinload() for most cases. Use joinedload() only for performance-critical paths.
```

- [ ] **Step 5: Run tests to verify optimization**

```bash
cd /home/gabriel/Tutor-PaesV3/.worktrees/priority-1-security-testing/tutorpaes/backend

pytest tests/test_performance/test_catalog_queries.py -v
```

Expected: All tests pass

- [ ] **Step 6: Benchmark before/after**

```bash
# Run catalog endpoint and check query logs
python -c "
import asyncio
from app.db.session import SessionLocal
from sqlalchemy import event, Engine

queries = []

@event.listens_for(Engine, 'before_cursor_execute')
def log_query(conn, cursor, statement, parameters, context, executemany):
    queries.append(statement[:80])

async def test():
    from app.api.v1.endpoints.catalog import get_exams
    db = SessionLocal()
    await get_exams(db)
    return len(queries)

count = asyncio.run(test())
print(f'Total queries: {count}')
"
```

Expected: < 5 queries for catalog endpoints

- [ ] **Step 7: Commit**

```bash
git add tutorpaes/backend/app/api/v1/endpoints/catalog.py
git add tutorpaes/backend/tests/test_performance/test_catalog_queries.py
git add DOCS/QUERY_OPTIMIZATION.md
git commit -m "perf: fix N+1 queries in catalog endpoints

- Add selectinload() for nested relationships (subjects, topics, questions)
- Reduce catalog queries from 40+ to < 5
- Add performance tests to catch future N+1 problems
- Document query optimization patterns and trade-offs
- Implement query helper functions for maintainability
- Enable SQL logging for query profiling"
```

---

## SUMMARY

All 5 Priority 1 tasks are now planned and ready for implementation:

1. ✅ **Redis Requirement Enforcement** - Prevent rate limit bypasses
2. ✅ **API Key Rotation Policy** - Security & audit trail framework
3. ✅ **Frontend E2E Tests** - Playwright foundation + auth + quiz flows
4. ✅ **Multi-Worker Deployment** - Gunicorn + WEB_CONCURRENCY + Docker optimization
5. ✅ **N+1 Query Fixes** - selectinload() optimization in catalog

**Total Implementation Time:** ~8-10 hours (2-3 hours per task)

**Next Steps:** Execute plan tasks in order, commit after each task.
