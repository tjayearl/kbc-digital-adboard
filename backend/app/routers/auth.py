from fastapi import APIRouter, HTTPException
from app.core.firebase import firebase_auth, db
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter()

class SetRoleRequest(BaseModel):
    uid: str
    role: str

@router.post("/set-role")
async def set_user_role(request: SetRoleRequest):
    valid_roles = ["sales", "adManager", "digitalOps", "finance", "admin"]
    if request.role not in valid_roles:
        raise HTTPException(status_code=400, detail="Invalid role")
    try:
        firebase_auth.set_custom_user_claims(request.uid, {"role": request.role})
        user_record = firebase_auth.get_user(request.uid)
        db.collection("users").document(request.uid).set({
            "uid": request.uid,
            "email": user_record.email,
            "name": user_record.display_name or user_record.email,
            "role": request.role,
            "active": True,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }, merge=True)
        return {"message": f"Role {request.role} assigned to {request.uid}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))