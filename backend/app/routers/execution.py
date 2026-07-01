from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.security import require_roles
from app.core.firebase import db
from app.services.cloudinary_service import upload_file
from app.services.audit import log_action
from datetime import datetime, timezone
import uuid

router = APIRouter()

# ============================================================
# EXISTING ROUTES
# ============================================================

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
    user=Depends(require_roles(["digitalOps", "admin"]))
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


# ============================================================
# UPDATED: GO-LIVE ROUTE (Now accepts JSON instead of Form data)
# ============================================================
@router.post("/{campaign_id}/go-live")
async def log_go_live(
    campaign_id: str, 
    data: dict,
    user=Depends(require_roles(["digitalOps", "admin"]))
):
    """Log the go-live details for a campaign"""
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = doc.to_dict()
    current_status = campaign.get("status")
    
    # Allow go-live from scheduled or live status
    if current_status not in ["scheduled", "live"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Campaign must be scheduled or live. Current status: {current_status}"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "actualGoLiveDate": data.get("actualGoLiveDate"),
        "goLiveLoggedBy": data.get("goLiveLoggedBy"),
        "goLiveNotes": data.get("goLiveNotes"),
        "status": "live",
        "updatedAt": now
    })
    
    await log_action(
        campaign_id, 
        "GO_LIVE_LOGGED", 
        user["uid"], 
        user.get("role", ""), 
        f"Campaign went live at {data.get('actualGoLiveDate')}"
    )
    
    return {"message": "Go-live logged successfully"}


# ============================================================
# DIGITAL OPS - SAVE EXECUTION PLAN (NEW ROUTE)
# ============================================================
@router.post("/{campaign_id}/plan")
async def save_execution_plan(
    campaign_id: str, 
    execution_plan: dict,
    user=Depends(require_roles(["digitalOps", "admin"]))
):
    """Save the execution plan for a campaign"""
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get the campaign to check status
    campaign = doc.to_dict()
    current_status = campaign.get("status")
    
    # Allow saving plan from these statuses
    if current_status not in ["briefUnlocked", "inExecution", "scheduled"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Campaign must be unlocked, in execution, or scheduled. Current status: {current_status}"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "executionPlan": execution_plan.get("executionPlan"),
        "updatedAt": now
    })
    
    await log_action(
        campaign_id, 
        "EXECUTION_PLAN_SAVED", 
        user["uid"], 
        user.get("role", ""), 
        "Execution plan saved"
    )
    
    return {"message": "Execution plan saved successfully"}


# ============================================================
# DIGITAL OPS - SAVE DELIVERED ITEMS (NEW ROUTE)
# ============================================================
@router.post("/{campaign_id}/delivered-items")
async def save_delivered_items(
    campaign_id: str, 
    data: dict,
    user=Depends(require_roles(["digitalOps", "admin"]))
):
    """Save the delivered items for a campaign"""
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get the campaign to check status
    campaign = doc.to_dict()
    current_status = campaign.get("status")
    
    # Allow saving delivered items from these statuses
    if current_status not in ["live", "delivered"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Campaign must be live or delivered. Current status: {current_status}"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "deliveredItems": data.get("deliveredItems"),
        "updatedAt": now
    })
    
    await log_action(
        campaign_id, 
        "DELIVERED_ITEMS_SAVED", 
        user["uid"], 
        user.get("role", ""), 
        f"{len(data.get('deliveredItems', []))} delivered items saved"
    )
    
    return {"message": "Delivered items saved successfully"}


# ============================================================
# EXISTING: POD UPLOAD ROUTE (Unchanged)
# ============================================================
@router.post("/{campaign_id}/pod")
async def upload_pod(
    campaign_id: str, 
    file: UploadFile = File(...), 
    note: str = Form(""),
    user=Depends(require_roles(["digitalOps", "admin"]))
):
    """Upload Proof of Delivery for a campaign"""
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
    
    ref.update({
        "podUrl": file_url, 
        "podUploadedAt": now, 
        "podUploadedBy": user["uid"],
        "podNote": note,
        "podFileName": file.filename,
        "updatedAt": now
    })
    
    await log_action(campaign_id, "POD_UPLOADED", user["uid"], user.get("role", ""), note)
    return {"message": "Proof of delivery uploaded", "fileUrl": file_url, "fileName": file.filename}