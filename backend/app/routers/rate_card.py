from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_roles, get_current_user
from app.core.firebase import db
from app.models.rate_card import RateCardItem, UpdateRateCardItem
from datetime import datetime, timezone
import uuid

router = APIRouter()

@router.get("/")
async def get_rate_card(user=Depends(get_current_user)):
    items = db.collection("rateCard").stream()
    return [{"id": i.id, **i.to_dict()} for i in items]

@router.post("/")
async def add_rate_card_item(item: RateCardItem, user=Depends(require_roles(["admin"]))):
    item_id = str(uuid.uuid4())
    data = {**item.dict(), "version": 1,
            "updatedAt": datetime.now(timezone.utc).isoformat(), "updatedBy": user["uid"]}
    db.collection("rateCard").document(item_id).set(data)
    return {"message": "Rate card item added", "id": item_id}

@router.patch("/{item_id}")
async def update_rate_card_item(item_id: str, item: UpdateRateCardItem, user=Depends(require_roles(["admin"]))):
    ref = db.collection("rateCard").document(item_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Item not found")
    update_data = {k: v for k, v in item.dict().items() if v is not None}
    update_data["version"] = doc.to_dict().get("version", 1) + 1
    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    update_data["updatedBy"] = user["uid"]
    ref.update(update_data)
    return {"message": "Rate card item updated"}

@router.delete("/{item_id}")
async def delete_rate_card_item(item_id: str, user=Depends(require_roles(["admin"]))):
    db.collection("rateCard").document(item_id).delete()
    return {"message": "Rate card item deleted"}