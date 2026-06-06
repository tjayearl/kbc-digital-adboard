from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.security import require_roles
from app.core.firebase import db
from app.services.cloudinary_service import upload_file
from app.services.audit import log_action
from datetime import datetime, timezone
import uuid

router = APIRouter()

@router.post("/{campaign_id}/go-live")
async def log_go_live(
    campaign_id: str, taskId: str = Form(...), note: str = Form(""),
    user=Depends(require_roles(["digitalOps", "admin"]))
):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if doc.to_dict().get("status") not in ["briefUnlocked", "inExecution"]:
        raise HTTPException(status_code=400, detail="Campaign brief is not unlocked")
    now = datetime.now(timezone.utc).isoformat()
    db.collection("executionTasks").document(taskId).update({
        "status": "live", "goLiveTimestamp": now, "loggedBy": user["uid"], "note": note
    })
    ref.update({"status": "inExecution", "updatedAt": now})
    await log_action(campaign_id, "GO_LIVE_LOGGED", user["uid"], user.get("role", ""), f"Task {taskId} went live")
    return {"message": "Go-live logged", "timestamp": now}

@router.post("/{campaign_id}/pod")
async def upload_pod(
    campaign_id: str, file: UploadFile = File(...), note: str = Form(""),
    user=Depends(require_roles(["digitalOps", "admin"]))
):
    file_bytes = await file.read()
    pod_id = str(uuid.uuid4())
    file_url = await upload_file(file_bytes, pod_id, "pod")
    now = datetime.now(timezone.utc).isoformat()
    db.collection("campaigns").document(campaign_id).update({
        "podUrl": file_url, "podUploadedAt": now, "podUploadedBy": user["uid"],
        "status": "delivered", "updatedAt": now
    })
    await log_action(campaign_id, "POD_UPLOADED", user["uid"], user.get("role", ""), note)
    return {"message": "Proof of delivery uploaded", "fileUrl": file_url}