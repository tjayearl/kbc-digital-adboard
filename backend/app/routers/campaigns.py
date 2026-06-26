from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_roles, get_current_user
from app.core.firebase import db
from app.models.campaign import CreateCampaignRequest
from app.services.audit import log_action
from app.services.dab_ref import generate_dab_ref
from datetime import datetime, timezone

router = APIRouter()

@router.post("/")
async def create_campaign(request: CreateCampaignRequest, user=Depends(require_roles(["sales", "admin"]))):
    for item in request.lineItems:
        rate_ref = db.collection("rateCard").document(item.productId).get()
        if not rate_ref.exists:
            raise HTTPException(status_code=400, detail=f"Product {item.productId} not found in rate card")
        rate_price = rate_ref.to_dict().get("unitPrice", 0)
        if abs(item.unitPrice - rate_price) > 0.01:
            raise HTTPException(status_code=400, detail=f"Price mismatch for {item.productName}. Use rate card price.")
    subtotal = sum(item.totalPrice for item in request.lineItems)
    vat = round(subtotal * 0.16, 2)
    grand_total = round(subtotal + vat, 2)
    now = datetime.now(timezone.utc).isoformat()
    campaign_data = {
        **request.dict(),
        "totals": {"subtotal": subtotal, "vatAmount": vat, "grandTotal": grand_total,
                   "discountValue": request.totals.discountValue},
        "status": request.status or "campaignConfigured", "createdBy": user["uid"], "createdAt": now, "updatedAt": now,
    }
    ref = db.collection("campaigns").add(campaign_data)
    campaign_id = ref[1].id
    await log_action(campaign_id, "CAMPAIGN_CREATED", user["uid"], user.get("role", ""), f"Campaign created in status {request.status or 'campaignConfigured'}")
    return {"message": "Campaign created", "campaignId": campaign_id}

@router.get("/")
async def list_campaigns(user=Depends(get_current_user)):
    role = user.get("role")
    uid = user["uid"]
    if role == "sales":
        campaigns = db.collection("campaigns").where("createdBy", "==", uid).stream()
    elif role == "digitalOps":
        campaigns = db.collection("campaigns").where("status", "in", [
            "briefUnlocked", "inExecution", "delivered", "reported", "closed"
        ]).stream()
    else:
        campaigns = db.collection("campaigns").stream()
        
    result = []
    user_names = {}
    for c in campaigns:
        data = c.to_dict()
        created_by = data.get("createdBy")
        if created_by:
            if created_by not in user_names:
                user_doc = db.collection("users").document(created_by).get()
                if user_doc.exists:
                    user_names[created_by] = user_doc.to_dict().get("name", created_by)
                else:
                    user_names[created_by] = created_by
            data["owner"] = user_names[created_by]
        else:
            data["owner"] = "Unknown"
        result.append({"id": c.id, **data})
    return result

@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str, user=Depends(get_current_user)):
    doc = db.collection("campaigns").document(campaign_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = doc.to_dict()
    if user.get("role") == "sales" and campaign.get("createdBy") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    created_by = campaign.get("createdBy")
    if created_by:
        user_doc = db.collection("users").document(created_by).get()
        if user_doc.exists:
            campaign["owner"] = user_doc.to_dict().get("name", created_by)
        else:
            campaign["owner"] = created_by
    else:
        campaign["owner"] = "Unknown"
        
    return {"id": doc.id, **campaign}

@router.put("/{campaign_id}")
async def update_campaign(campaign_id: str, request: CreateCampaignRequest, user=Depends(require_roles(["sales", "admin", "digitalOps", "adManager", "finance"]))):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = doc.to_dict()
    if user.get("role") == "sales" and campaign.get("createdBy") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    for item in request.lineItems:
        rate_ref = db.collection("rateCard").document(item.productId).get()
        if not rate_ref.exists:
            raise HTTPException(status_code=400, detail=f"Product {item.productId} not found in rate card")
        rate_price = rate_ref.to_dict().get("unitPrice", 0)
        if abs(item.unitPrice - rate_price) > 0.01:
            raise HTTPException(status_code=400, detail=f"Price mismatch for {item.productName}. Use rate card price.")
            
    subtotal = sum(item.totalPrice for item in request.lineItems)
    vat = round(subtotal * 0.16, 2)
    grand_total = round(subtotal + vat, 2)
    now = datetime.now(timezone.utc).isoformat()
    
    campaign_data = {
        **request.dict(),
        "totals": {"subtotal": subtotal, "vatAmount": vat, "grandTotal": grand_total,
                   "discountValue": request.totals.discountValue},
        "status": request.status or campaign.get("status", "draft"),
        "updatedAt": now,
    }
    
    ref.update(campaign_data)
    await log_action(campaign_id, "CAMPAIGN_UPDATED", user["uid"], user.get("role", ""), f"Campaign details updated. Status: {request.status or campaign.get('status')}")
    return {"message": "Campaign updated"}

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, user=Depends(require_roles(["sales", "admin"]))):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = doc.to_dict()
    if user.get("role") == "sales" and campaign.get("createdBy") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")
    ref.delete()
    return {"message": "Campaign deleted"}

@router.get("/{campaign_id}/audit")
async def get_campaign_audit(campaign_id: str, user=Depends(get_current_user)):
    doc = db.collection("campaigns").document(campaign_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = doc.to_dict()
    if user.get("role") == "sales" and campaign.get("createdBy") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    logs = db.collection("auditLog").where("campaignId", "==", campaign_id).stream()
    result = []
    user_names = {}
    for l in logs:
        data = l.to_dict()
        actor = data.get("actor")
        if actor:
            if actor not in user_names:
                user_doc = db.collection("users").document(actor).get()
                if user_doc.exists:
                    user_names[actor] = user_doc.to_dict().get("name", actor)
                else:
                    user_names[actor] = actor
            data["actor"] = user_names[actor]
        result.append({"id": l.id, **data})
    result.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return result

# ============================================================
# NEW: Digital Ops Approval Endpoint
# ============================================================
@router.patch("/{campaign_id}/approve")
async def approve_campaign(campaign_id: str, user=Depends(require_roles(["digitalOps", "admin"]))):
    """Digital Ops approves a campaign for execution"""
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = doc.to_dict()
    
    # Check if user has access (digitalOps or admin can approve any campaign)
    if user.get("role") not in ["admin", "digitalOps"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Only briefUnlocked campaigns can be approved
    if campaign.get("status") != "briefUnlocked":
        raise HTTPException(
            status_code=400, 
            detail=f"Campaign must be in briefUnlocked status. Current status: {campaign.get('status')}"
        )
    
    # Update status to inExecution and record approval
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "status": "inExecution",
        "approvedBy": user["uid"],
        "approvedAt": now,
        "updatedAt": now
    })
    
    await log_action(
        campaign_id, 
        "CAMPAIGN_APPROVED", 
        user["uid"], 
        user.get("role", ""), 
        f"Campaign approved for execution by Digital Ops"
    )
    
    return {"message": "Campaign approved for execution", "campaignId": campaign_id}

# ============================================================
# NEW: Status Update Endpoint
# ============================================================
@router.patch("/{campaign_id}/status")
async def update_campaign_status(
    campaign_id: str, 
    status: str, 
    user=Depends(require_roles(["digitalOps", "admin", "sales"]))
):
    """Update campaign status"""
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = doc.to_dict()
    
    # Check permissions
    if user.get("role") == "sales" and campaign.get("createdBy") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Validate status
    valid_statuses = ["briefUnlocked", "inExecution", "delivered", "reported", "closed"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "status": status,
        "updatedAt": now
    })
    
    await log_action(
        campaign_id, 
        "STATUS_UPDATED", 
        user["uid"], 
        user.get("role", ""), 
        f"Campaign status updated to: {status}"
    )
    
    return {"message": "Status updated", "campaignId": campaign_id, "status": status}