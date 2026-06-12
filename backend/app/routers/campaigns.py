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
        "status": "draft", "createdBy": user["uid"], "createdAt": now, "updatedAt": now,
    }
    ref = db.collection("campaigns").add(campaign_data)
    campaign_id = ref[1].id
    await log_action(campaign_id, "CAMPAIGN_CREATED", user["uid"], user.get("role", ""), "Campaign created in draft")
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
    return [{"id": c.id, **c.to_dict()} for c in campaigns]

@router.get("/{campaign_id}")
async def get_campaign(campaign_id: str, user=Depends(get_current_user)):
    doc = db.collection("campaigns").document(campaign_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = doc.to_dict()
    if user.get("role") == "sales" and campaign.get("createdBy") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return {"id": doc.id, **campaign}

@router.put("/{campaign_id}")
async def update_campaign(campaign_id: str, request: CreateCampaignRequest, user=Depends(require_roles(["sales", "admin"]))):
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
        "updatedAt": now,
    }
    
    ref.update(campaign_data)
    await log_action(campaign_id, "CAMPAIGN_UPDATED", user["uid"], user.get("role", ""), "Campaign details updated")
    return {"message": "Campaign updated"}

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, user=Depends(require_roles(["admin"]))):
    db.collection("campaigns").document(campaign_id).delete()
    return {"message": "Campaign deleted"}