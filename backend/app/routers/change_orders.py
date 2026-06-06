from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_roles
from app.core.firebase import db
from app.models.change_order import CreateChangeOrderRequest
from app.services.audit import log_action
from app.services.dab_ref import generate_dab_co_ref
from datetime import datetime, timezone

router = APIRouter()

@router.post("/")
async def create_change_order(request: CreateChangeOrderRequest, user=Depends(require_roles(["sales", "admin"]))):
    parent = db.collection("campaigns").document(request.parentCampaignId).get()
    if not parent.exists:
        raise HTTPException(status_code=404, detail="Parent campaign not found")
    allowed = ["adManagerCountersigned", "paymentConfirmed", "briefUnlocked", "inExecution"]
    if parent.to_dict().get("status") not in allowed:
        raise HTTPException(status_code=400, detail="Change Orders can only be raised after Ad Manager countersign")
    dab_co_ref = await generate_dab_co_ref(parent.to_dict().get("dabRef", request.parentCampaignId))
    now = datetime.now(timezone.utc).isoformat()
    co_data = {**request.dict(), "dabCoRef": dab_co_ref, "status": "draft",
               "createdBy": user["uid"], "createdAt": now, "updatedAt": now}
    ref = db.collection("changeOrders").add(co_data)
    co_id = ref[1].id
    await log_action(request.parentCampaignId, "CHANGE_ORDER_RAISED", user["uid"], user.get("role", ""), f"Change Order {dab_co_ref} raised")
    return {"message": "Change Order created", "coId": co_id, "dabCoRef": dab_co_ref}

@router.get("/campaign/{campaign_id}")
async def get_change_orders(campaign_id: str, user=Depends(require_roles(["sales", "adManager", "admin", "finance"]))):
    cos = db.collection("changeOrders").where("parentCampaignId", "==", campaign_id).stream()
    return [{"id": c.id, **c.to_dict()} for c in cos]