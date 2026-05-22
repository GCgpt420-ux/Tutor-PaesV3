# API Key Rotation Policy

## Overview
All API keys used in TutorPAES (OpenAI, Groq, Cerebras, Transbank) must be rotated quarterly minimum, or immediately if compromised. This policy ensures secure credential management and compliance with security best practices.

## Key Categories

### Production Keys
- **Rotation:** Every 90 days (quarterly)
- **Storage:** Environment variables only, never committed to git
- **Audit:** All key access logged in AIUsageLog table with provider, endpoint, timestamp, cost
- **Revocation:** Previous versions remain in environment for 7 days (grace period) to prevent immediate breakage

### Staging Keys
- **Rotation:** Every 120 days
- **Storage:** Environment variables, separate from production
- **Testing:** Pre-rotation testing required on staging 24 hours before production rotation

### Integration/Sandbox Keys
- **Rotation:** Every 180 days (biannually)
- **Storage:** May be in code for sandbox credentials, but clearly marked as non-production
- **Examples:** Transbank sandbox ID (597055555532) is public and defined in code

## Providers

### OpenAI
- **Keys:** API keys from https://platform.openai.com/api-keys
- **Usage:** Text generation, embedding models (gpt-4o-mini)
- **Cost:** Per-token pricing (separate billing)
- **Emergency Contact:** OpenAI support dashboard
- **Revocation:** Immediate via dashboard

### Groq
- **Keys:** Free tier keys from https://console.groq.com/keys
- **Usage:** Fast inference API (mixtral-8x7b-32768)
- **Cost:** Free tier with rate limits, paid tier available
- **Emergency Contact:** Groq support
- **Revocation:** Via console

### Cerebras
- **Keys:** Free tier keys from https://cloud.cerebras.ai/api-keys
- **Usage:** Fast LLM inference (llama-3.1-70b)
- **Cost:** Free tier with usage limits
- **Emergency Contact:** Cerebras support
- **Revocation:** Via console

### Transbank (WebPay Plus)
- **Keys:** Commerce code + API key from Transbank sandbox and production
- **Usage:** Payment processing for course purchases
- **Cost:** Transaction fees (not API charges)
- **Emergency Contact:** Transbank account manager
- **Revocation:** Via Transbank partner portal

---

## Rotation Procedure

### 1. Pre-Rotation Planning

**Timeline (before rotation date):**
- Week 1: Schedule rotation 2 weeks in advance
- Week 2: Request new keys from provider
- Day before: Test new key on staging

**Checklist:**
- [ ] New key requested from provider
- [ ] New key tested on staging (24 hours minimum)
- [ ] No recent critical deployments
- [ ] Monitoring alerts active
- [ ] Slack #security notified

### 2. Generate New Key

Request new key from provider:

```bash
# OpenAI: https://platform.openai.com/api-keys
# - Click "Create new secret key"
# - Copy and save securely
# - Note the key ID for audit

# Groq: https://console.groq.com/keys
# - Click "Create API Key"
# - Copy immediately (not shown again)
# - Save in secure location

# Cerebras: https://cloud.cerebras.ai/api-keys
# - Request new key
# - Copy and verify in code

# Transbank: Contact account manager
# - Request production credentials
# - Commerce Code and API Key
# - Verify against sandbox credentials
```

### 3. Version the New Key

**Old approach (non-versioned):**
```bash
OPENAI_API_KEY=sk-proj-old-key-xyz  # Single key, immediate replacement risk
```

**New approach (versioned):**
```bash
# Before rotation:
OPENAI_API_KEY=sk-proj-old-key-xyz           # Active (v0)
OPENAI_API_KEY_V0=sk-proj-old-key-xyz        # Explicit version

# After rotation:
OPENAI_API_KEY=sk-proj-new-key-abc           # Points to active
OPENAI_API_KEY_V1=sk-proj-new-key-abc        # New active version
OPENAI_API_KEY_V0=sk-proj-old-key-xyz        # Grace period (7 days)

# After grace period (7 days later):
OPENAI_API_KEY=sk-proj-new-key-abc           # Only new key remains
OPENAI_API_KEY_V1=sk-proj-new-key-abc
# OPENAI_API_KEY_V0 removed
```

### 4. Update Environment

```bash
# 1. Deploy new .env to production
cd /prod-deployment
git checkout main
cp .env.prod.backup .env.prod
# Edit to update OPENAI_API_KEY_V1 and OPENAI_API_KEY
# Keep OPENAI_API_KEY_V0 for grace period
git add .env.prod
git commit -m "Rotate OpenAI key (V1 active, V0 grace period until DATE)"

# 2. Verify API calls successful
# Monitor: Check /api/health endpoint
curl https://tutorpaes.cl/api/health

# 3. Monitor logs for 24 hours
# Watch for:
# - Rate limit errors
# - Authentication failures
# - Cost spikes (indicates doubled usage)
grep -i "api.*error\|rate.*limit\|auth" /var/log/tutorpaes.log

# 4. Audit usage
SELECT provider, COUNT(*) as requests, SUM(cost) as total_cost
FROM ai_usage_logs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY provider;
```

### 5. Grace Period & Revocation

**During 7-day grace period:**
- Old key remains active in environment
- All new requests use new key (v1)
- Old key (v0) available if rollback needed
- Monitor logs for any v0 usage (should be none)

**After grace period:**
```bash
# Remove old key from environment
# OPENAI_API_KEY_V0=sk-proj-old-key-xyz  # Remove this line
# Commit and deploy
git commit -m "Complete OpenAI key rotation (removed V0 after grace period)"

# Revoke key at provider if not already done
# OpenAI: https://platform.openai.com/api-keys → Delete
```

### 6. Log Rotation Event

**Database audit log:**
```sql
INSERT INTO audit_log (
    event_type,
    provider,
    old_key_version,
    new_key_version,
    rotated_by,
    rotated_at,
    grace_period_expires_at,
    notes
) VALUES (
    'key_rotation',
    'openai',
    'v0',
    'v1',
    'devops@tutorpaes.cl',
    NOW(),
    NOW() + INTERVAL '7 days',
    'Quarterly rotation - scheduled maintenance'
);

-- Query rotation history
SELECT * FROM audit_log 
WHERE event_type = 'key_rotation' 
ORDER BY rotated_at DESC;
```

---

## Emergency Rotation (Suspected Compromise)

**If a key is suspected compromised:**

### Immediate Actions (within 1 hour)
1. **Revoke immediately** - Don't wait for grace period
   ```bash
   # OpenAI
   # Go to https://platform.openai.com/api-keys
   # Delete the compromised key immediately
   # Chat support if urgent
   ```

2. **Generate new key** - Get replacement from provider

3. **Deploy new key** - Update production .env with new key
   ```bash
   # Skip versioning grace period - replace immediately
   OPENAI_API_KEY=sk-proj-emergency-new-key
   # Deploy to prod
   ```

4. **Search logs** - Look for unauthorized usage
   ```bash
   # Check last 24 hours before key was exposed
   SELECT * FROM ai_usage_logs
   WHERE created_at > NOW() - INTERVAL '24 hours'
   AND provider = 'openai'
   ORDER BY created_at DESC;
   ```

5. **Alert team** - Slack #security notification
   ```
   🚨 SECURITY: OpenAI API key compromised
   - Time discovered: 2024-01-XX 14:30 UTC
   - Grace period: SKIPPED (immediate revocation)
   - New key deployed: 2024-01-XX 14:45 UTC
   - Status: All systems operational
   - Investigation: Check #incident-LOG for details
   ```

### Follow-up Actions (within 24 hours)
- Analyze logs for unauthorized usage patterns
- Check cost anomalies
- Update incident log
- Schedule post-incident review
- Document lessons learned

---

## Monitoring

### Rotation Schedule

Track in `MONITORING.md`:

| Provider | Last Rotation | Next Due | Status |
|----------|---------------|----------|--------|
| OpenAI | 2024-01-15 | 2024-04-15 | Active (V1) |
| Groq | 2024-01-15 | 2024-04-15 | Active (V1) |
| Cerebras | 2024-01-20 | 2024-04-20 | Active (V1) |
| Transbank | 2024-01-01 | 2024-04-01 | OVERDUE ⚠️ |

### Cost Monitoring

Alert if unexpected spikes:

```sql
-- Detect cost anomaly (e.g., 2x normal spend in a day)
SELECT 
    provider,
    DATE(created_at),
    SUM(cost) as daily_cost,
    LAG(SUM(cost)) OVER (
        PARTITION BY provider 
        ORDER BY DATE(created_at)
    ) as prev_day_cost
FROM ai_usage_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY provider, DATE(created_at)
HAVING SUM(cost) > 2 * LAG(SUM(cost)) OVER (...)
```

### Key Health Checks

Run daily:

```bash
#!/bin/bash
# healthcheck_keys.sh

# Test OpenAI
curl -s -H "Authorization: Bearer $OPENAI_API_KEY" \
    https://api.openai.com/v1/models | jq '.data | length'

# Test Groq
curl -s -H "Authorization: Bearer $GROQ_API_KEY" \
    https://api.groq.com/openai/v1/models | jq '.data | length'

# Test Cerebras
curl -s -H "Authorization: Bearer $CEREBRAS_API_KEY" \
    https://api.cerebras.ai/v1/models | jq '.data | length'

# Test Transbank
# curl -s -H "Authorization: Bearer $TBK_API_KEY" \
#     https://webpay.transbank.cl/api/v1.0/sessions
```

---

## Audit Trail

### All Key Access Logged

Every API call that uses a key is logged:

```sql
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY,
    provider VARCHAR(50),           -- openai, groq, cerebras, transbank
    endpoint VARCHAR(255),          -- /v1/chat/completions, /v1/payments
    key_version VARCHAR(10),        -- v1, v0 (if versioned)
    user_id UUID,                   -- Who initiated the request
    status INT,                     -- 200, 429, 401, etc
    tokens_used INT,                -- For LLMs (not used for payments)
    cost DECIMAL(10,6),             -- In USD
    error_message TEXT,             -- If failed
    created_at TIMESTAMPTZ,
    INDEX idx_provider_date (provider, created_at),
    INDEX idx_user_date (user_id, created_at)
);
```

### Query Recent Usage

```python
# In analytics dashboard / admin panel

from sqlalchemy import func, desc

def get_key_usage_report(provider: str, days: int = 30):
    """Get usage report for a provider."""
    return db.session.query(
        AIUsageLog.provider,
        func.count(AIUsageLog.id).label('total_requests'),
        func.sum(AIUsageLog.cost).label('total_cost'),
        func.avg(AIUsageLog.cost).label('avg_cost_per_request'),
        func.max(AIUsageLog.created_at).label('last_used')
    ).filter(
        AIUsageLog.provider == provider,
        AIUsageLog.created_at >= func.now() - timedelta(days=days)
    ).group_by(
        AIUsageLog.provider
    ).first()

# Usage:
report = get_key_usage_report("openai", days=30)
print(f"OpenAI - 30 days: {report.total_requests} requests, ${report.total_cost}")
```

---

## Implementation Checklist

- [ ] Add API_KEY_ROTATION_POLICY.md to DOCS/
- [ ] Create KeyManager class in app/core/key_management.py
- [ ] Update LLM providers to use KeyManager
- [ ] Create rotate_api_keys.py helper script
- [ ] Update .env.example with versioning examples
- [ ] Add key rotation schedule to project wiki
- [ ] Set calendar reminders for quarterly rotations
- [ ] Document in onboarding guide
- [ ] Add health check script to monitoring
- [ ] Train team on rotation procedure

---

## References

- [OWASP: Secrets Management](https://owasp.org/www-community/attacks/Sensitive_Data_Exposure)
- [AWS: Rotating API Keys](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [NIST: Access Control](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5)
- [CWE-798: Use of Hard-Coded Credentials](https://cwe.mitre.org/data/definitions/798.html)
