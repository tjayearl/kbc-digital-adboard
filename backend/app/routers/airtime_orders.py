from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_roles, get_current_user
from app.core.firebase import db
from pydantic import BaseModel
from datetime import datetime, timezone
import uuid

router = APIRouter()

class CreateAirtimeOrderRequest(BaseModel):
    serial: str

@router.post("/")
async def create_airtime_serial(
    request: CreateAirtimeOrderRequest,
    user=Depends(require_roles(["finance", "admin"]))
):
    existing = list(db.collection("airtimeOrders").where(
        "serial", "==", request.serial
    ).limit(1).stream())
    if existing:
        raise HTTPException(status_code=400, detail="Serial already exists")

    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    db.collection("airtimeOrders").document(doc_id).set({
        "serial": request.serial,
        "loadedBy": user["uid"],
        "loadedAt": now,
        "matched": False,
        "matchedAt": None
    })
    return {"message": "Air-Time serial registered", "serial": request.serial}

@router.get("/")
async def list_airtime_serials(user=Depends(require_roles(["finance", "admin"]))):
    serials = db.collection("airtimeOrders").stream()
    return [{"id": s.id, **s.to_dict()} for s in serials]

@router.delete("/{serial_id}")
async def delete_airtime_serial(
    serial_id: str,
    user=Depends(require_roles(["admin"]))
):
    db.collection("airtimeOrders").document(serial_id).delete()
    return {"message": "Serial deleted"}