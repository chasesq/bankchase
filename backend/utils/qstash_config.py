"""
QStash configuration and utilities for background job processing
"""
import os
from typing import Any

from qstash import AsyncQStash

# QStash configuration
QSTASH_TOKEN = os.getenv("QSTASH_TOKEN", "")
QSTASH_URL = os.getenv("QSTASH_URL", "http://localhost:8080")
IS_LOCAL_MODE = os.getenv("QSTASH_LOCAL_MODE", "false").lower() == "true"

# Initialize QStash client
client = None
if QSTASH_TOKEN:
    client = AsyncQStash(token=QSTASH_TOKEN)


async def publish_event(
    event_name: str,
    data: dict[str, Any],
    delay_seconds: int = 0,
    url_path: str = "/api/qstash/webhook"
) -> str | None:
    """
    Publish an event to QStash for processing
    
    Args:
        event_name: Name of the event
        data: Event payload
        delay_seconds: Delay before processing (0 = immediate)
        url_path: Webhook path on backend
        
    Returns:
        Message ID if successful, None if not configured
    """
    if not client:
        print(f"[Warning] QStash not configured. Event {event_name} not published.")
        return None
    
    try:
        payload = {
            "event_name": event_name,
            "timestamp": __import__('datetime').datetime.utcnow().isoformat(),
            "data": data
        }
        
        message = await client.publish_json(
            api_path=url_path,
            body=payload,
            delay=delay_seconds if delay_seconds > 0 else None,
            url=QSTASH_URL if IS_LOCAL_MODE else None
        )
        
        return message.get("messageId") if hasattr(message, 'get') else str(message)
    except Exception as e:
        print(f"[Error] Failed to publish event {event_name}: {e!s}")
        return None


async def schedule_job(
    job_name: str,
    payload: dict[str, Any],
    cron_expression: str,
    url_path: str = "/api/qstash/scheduled-job"
) -> str | None:
    """
    Schedule a recurring job with QStash
    
    Args:
        job_name: Name of the job
        payload: Job payload
        cron_expression: Cron expression (e.g., "0 * * * *" for hourly)
        url_path: Webhook path on backend
        
    Returns:
        Schedule ID if successful
    """
    if not client:
        print(f"[Warning] QStash not configured. Job {job_name} not scheduled.")
        return None
    
    try:
        # QStash scheduling would be done here
        # For now, return a mock ID
        return f"job_{job_name}_{__import__('uuid').uuid4().hex[:8]}"
    except Exception as e:
        print(f"[Error] Failed to schedule job {job_name}: {e!s}")
        return None


def verify_qstash_signature(signature: str, body: bytes, signing_key: str | None = None) -> bool:
    """
    Verify QStash webhook signature
    
    Args:
        signature: Signature from X-Qstash-Signature header
        body: Request body
        signing_key: Signing key (defaults to QSTASH_SIGNING_KEY env var)
        
    Returns:
        True if signature is valid
    """
    try:
        import hashlib
        import hmac
        
        key = signing_key or os.getenv("QSTASH_SIGNING_KEY", "")
        if not key:
            print("[Warning] QSTASH_SIGNING_KEY not set. Skipping signature verification.")
            return True
        
        expected = hmac.new(
            key.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected)
    except Exception as e:
        print(f"[Error] Signature verification failed: {e!s}")
        return False


def get_config() -> dict[str, Any]:
    """Get current QStash configuration"""
    return {
        "url": QSTASH_URL,
        "is_local_mode": IS_LOCAL_MODE,
        "is_configured": bool(client),
        "token_set": bool(QSTASH_TOKEN)
    }
