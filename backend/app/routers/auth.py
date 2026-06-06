from fastapi import APIRouter, HTTPException
from app.core.firebase import firebase_auth, db
from pydantic import BaseModel

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
        db.collection("users").document(request.uid).update({"role": request.role})
        return {"message": f"Role {request.role} assigned to {request.uid}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))