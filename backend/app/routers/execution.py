from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.security import require_roles
from app.core.firebase import db
from app.services.cloudinary_service import upload_file
from app.services.audit import log_action
from datetime import datetime, timezone
import uuid

router = APIRouter()

@router.post("/{campaign_id}/start-execution")
async def start_execution(campaign_id: str, user=Depends(require_roles(["digitalOps", "admin"]))):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = doc.to_dict()
    if campaign.get("status") != "briefUnlocked":
        raise HTTPException(status_code=400, detail="Campaign must be unlocked first")
    
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "status": "inExecution",
        "executionStartedAt": now,
        "executionStartedBy": user["uid"],
        "updatedAt": now
    })
    
    await log_action(campaign_id, "EXECUTION_STARTED", user["uid"], user.get("role", ""), "")
    return {"message": "Campaign marked as in execution"}

@router.post("/{campaign_id}/schedule")
async def schedule_campaign(
    campaign_id: str,
    user=Depends(require_roles(["digitalOps"]))
):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = doc.to_dict()
    if campaign.get("status") != "briefUnlocked":
        raise HTTPException(status_code=400, detail="Campaign must be unlocked first")
    
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "status": "scheduled",
        "scheduledAt": now,
        "scheduledBy": user["uid"],
        "updatedAt": now
    })
    
    await log_action(campaign_id, "CAMPAIGN_SCHEDULED", user["uid"], user.get("role", ""), "")
    return {"message": "Campaign scheduled successfully"}

@router.post("/{campaign_id}/go-live")
async def log_go_live(
    campaign_id: str, 
    taskId: str = Form(...), 
    note: str = Form(""),
    user=Depends(require_roles(["digitalOps", "admin"]))
):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = doc.to_dict()
    current_status = campaign.get("status")
    
    # ✅ FIX: Include "scheduled" in allowed statuses
    if current_status not in ["briefUnlocked", "inExecution", "scheduled"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Campaign must be unlocked, in execution, or scheduled. Current status: {current_status}"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update execution task
    db.collection("executionTasks").document(taskId).update({
        "status": "live", 
        "goLiveTimestamp": now, 
        "loggedBy": user["uid"], 
        "note": note
    })
    
    # ✅ FIX: Set campaign status to "live" (not "inExecution")
    ref.update({
        "status": "live", 
        "updatedAt": now
    })
    
    await log_action(
        campaign_id, 
        "GO_LIVE_LOGGED", 
        user["uid"], 
        user.get("role", ""), 
        f"Task {taskId} went live"
    )
    return {"message": "Go-live logged", "timestamp": now}

@router.post("/{campaign_id}/pod")
async def upload_pod(
    campaign_id: str, 
    file: UploadFile = File(...), 
    note: str = Form(""),
    user=Depends(require_roles(["digitalOps", "admin"]))
):
    # ✅ FIX: Only allow POD upload if campaign is "live"
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = doc.to_dict()
    if campaign.get("status") != "live":
        raise HTTPException(
            status_code=400, 
            detail=f"Campaign must be live before uploading POD. Current status: {campaign.get('status')}"
        )
    
    file_bytes = await file.read()
    pod_id = str(uuid.uuid4())
    file_url = await upload_file(file_bytes, pod_id, "pod")
    now = datetime.now(timezone.utc).isoformat()
    
    # ✅ FIX: Update POD fields but DON'T auto-change to "delivered"
    # The campaign becomes "delivered" when the report is generated
    ref.update({
        "podUrl": file_url, 
        "podUploadedAt": now, 
        "podUploadedBy": user["uid"],
        "podNote": note,
        "updatedAt": now
        # ✅ REMOVED: "status": "delivered" - Don't auto-change status!
    })
    
    await log_action(campaign_id, "POD_UPLOADED", user["uid"], user.get("role", ""), note)
    return {"message": "Proof of delivery uploaded", "fileUrl": file_url}