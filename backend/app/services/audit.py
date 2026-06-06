from app.core.firebase import db
from datetime import datetime, timezone
import uuid

async def log_action(
    campaign_id: str,
    action: str,
    actor: str,
    role: str,
    detail: str = ""
):
    log_entry = {
        "logId": str(uuid.uuid4()),
        "campaignId": campaign_id,
        "action": action,
        "actor": actor,
        "role": role,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "detail": detail
    }
    db.collection("auditLog").add(log_entry)