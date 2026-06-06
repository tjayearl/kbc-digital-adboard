from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_roles
from app.core.firebase import db
from app.services.audit import log_action
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter()

class RequestDiscountBody(BaseModel):
    percentage: float
    reason: str

class ReviewDiscountBody(BaseModel):
    action: str
    note: str = ""

@router.post("/{campaign_id}/request")
async def request_discount(campaign_id: str, body: RequestDiscountBody, user=Depends(require_roles(["sales", "admin"]))):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if doc.to_dict().get("status") != "draft":
        raise HTTPException(status_code=400, detail="Discount can only be requested on a draft campaign")
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "status": "discountPending",
        "discount": {"requested": True, "requestedBy": user["uid"], "requestedAt": now,
                     "percentage": body.percentage, "status": "pending", "reason": body.reason},
        "updatedAt": now
    })
    await log_action(campaign_id, "DISCOUNT_REQUESTED", user["uid"], user.get("role", ""), f"{body.percentage}% requested")
    return {"message": "Discount request submitted"}

@router.post("/{campaign_id}/review")
async def review_discount(campaign_id: str, body: ReviewDiscountBody, user=Depends(require_roles(["adManager", "admin"]))):
    if body.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be approve or reject")
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    now = datetime.now(timezone.utc).isoformat()
    new_status = "discountApproved" if body.action == "approve" else "draft"
    discount_status = "approved" if body.action == "approve" else "rejected"
    ref.update({
        "status": new_status, "discount.status": discount_status,
        "discount.approvedBy": user["uid"], "discount.approvedAt": now, "updatedAt": now
    })
    await log_action(campaign_id, f"DISCOUNT_{discount_status.upper()}", user["uid"], user.get("role", ""), body.note)
    return {"message": f"Discount {discount_status}"}