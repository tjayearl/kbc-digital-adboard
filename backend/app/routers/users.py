from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_roles
from app.core.firebase import firebase_auth, db
from app.models.user import CreateUserRequest, UpdateUserRequest
from app.core.config import settings
from datetime import datetime, timezone

router = APIRouter()

@router.post("/")
async def create_user(request: CreateUserRequest, user=Depends(require_roles(["admin"]))):
    try:
        firebase_user = firebase_auth.create_user(
            email=request.email, password=request.password, display_name=request.name
        )
        firebase_auth.set_custom_user_claims(firebase_user.uid, {"role": request.role})
        db.collection("users").document(firebase_user.uid).set({
            "uid": firebase_user.uid, "name": request.name, "email": request.email,
            "role": request.role, "phone": request.phone or "", "active": True,
            "createdAt": datetime.now(timezone.utc).isoformat()
        })

        # Send password reset (activation) email to user via Firebase Auth REST API
        try:
            import requests
            api_key = settings.FIREBASE_WEB_API_KEY
            if api_key:
                url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={api_key}"
                payload = {
                    "requestType": "PASSWORD_RESET",
                    "email": request.email
                }
                res = requests.post(url, json=payload)
                if res.status_code != 200:
                    print(f"Warning: Failed to send activation email: {res.text}")
            else:
                print("Warning: FIREBASE_WEB_API_KEY not configured, cannot send activation email.")
        except Exception as email_err:
            print(f"Warning: Error sending activation email: {email_err}")

        return {"message": "User created", "uid": firebase_user.uid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_users(user=Depends(require_roles(["admin"]))):
    users = db.collection("users").stream()
    return [u.to_dict() for u in users]

@router.patch("/{uid}")
async def update_user(uid: str, request: UpdateUserRequest, user=Depends(require_roles(["admin"]))):
    update_data = {k: v for k, v in request.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    db.collection("users").document(uid).update(update_data)
    if "role" in update_data:
        firebase_auth.set_custom_user_claims(uid, {"role": update_data["role"]})
    return {"message": "User updated"}

@router.delete("/{uid}")
async def delete_user(uid: str, user=Depends(require_roles(["admin"]))):
    try:
        # Delete from Firebase Auth
        try:
            firebase_auth.delete_user(uid)
        except Exception as e:
            # If user not found in Auth, just print warning and continue to database deletion
            print(f"Warning: User {uid} not found in Firebase Auth: {e}")
        
        # Delete from Firestore
        db.collection("users").document(uid).delete()
        return {"message": "User deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))