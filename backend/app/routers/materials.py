from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.security import require_roles, get_current_user
from app.core.firebase import db
from app.services.cloudinary_service import upload_file
from app.services.audit import log_action
from datetime import datetime, timezone
import uuid

router = APIRouter()

@router.post("/{campaign_id}/upload")
async def upload_material(
    campaign_id: str,
    materialType: str = Form(...),
    dueDate: str = Form(...),
    file: UploadFile = File(...),
    user=Depends(require_roles(["sales", "admin"]))
):
    doc = db.collection("campaigns").document(campaign_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")

    file_bytes = await file.read()
    material_id = str(uuid.uuid4())
    file_url = await upload_file(file_bytes, material_id, "materials")

    now = datetime.now(timezone.utc).isoformat()
    db.collection("materials").document(material_id).set({
        "materialId": material_id,
        "campaignId": campaign_id,
        "type": materialType,
        "fileUrl": file_url,
        "fileName": file.filename,
        "specStatus": "pending",
        "dueDate": dueDate,
        "uploadedBy": user["uid"],
        "uploadedAt": now,
    })

    await log_action(campaign_id, "MATERIAL_UPLOADED", user["uid"],
                     user.get("role", ""), f"Material type: {materialType}")
    return {"message": "Material uploaded", "materialId": material_id, "fileUrl": file_url}

@router.get("/{campaign_id}")
async def get_materials(campaign_id: str, user=Depends(get_current_user)):
    materials = db.collection("materials").where("campaignId", "==", campaign_id).stream()
    return [{"id": m.id, **m.to_dict()} for m in materials]

@router.patch("/{material_id}/validate")
async def validate_material(
    material_id: str,
    user=Depends(require_roles(["digitalOps", "admin"]))
):
    ref = db.collection("materials").document(material_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Material not found")

    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "specStatus": "approved",
        "validatedBy": user["uid"],
        "validatedAt": now
    })

    campaign_id = doc.to_dict().get("campaignId", "")
    await log_action(campaign_id, "MATERIAL_VALIDATED", user["uid"],
                     user.get("role", ""), f"Material {material_id} approved")
    return {"message": "Material validated"}

@router.patch("/{material_id}/reject")
async def reject_material(
    material_id: str,
    reason: str = Form(...),
    user=Depends(require_roles(["digitalOps", "admin"]))
):
    ref = db.collection("materials").document(material_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Material not found")

    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "specStatus": "rejected",
        "rejectedBy": user["uid"],
        "rejectedAt": now,
        "rejectionReason": reason
    })

    campaign_id = doc.to_dict().get("campaignId", "")
    await log_action(campaign_id, "MATERIAL_REJECTED", user["uid"],
                     user.get("role", ""), f"Reason: {reason}")
    return {"message": "Material rejected"}