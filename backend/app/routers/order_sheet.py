import io
import re
from datetime import datetime, timezone

import requests
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse

from app.core.security import get_current_user, require_roles
from app.core.firebase import db
from app.services.pdf_service import generate_order_sheet_pdf
from app.services.cloudinary_service import upload_pdf, upload_file
from app.services.audit import log_action
from app.services.dab_ref import generate_dab_ref

router = APIRouter()


def _pdf_filename(value: str) -> str:
    name = re.sub(r"[^A-Za-z0-9_.-]+", "_", value or "order-sheet").strip("._")
    return f"{name or 'order-sheet'}_Order_Sheet.pdf"

@router.post("/{campaign_id}/generate")
async def generate_order_sheet(campaign_id: str, user=Depends(require_roles(["sales", "admin"]))):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = doc.to_dict()
    if campaign.get("status") not in ["discountApproved"]:
        raise HTTPException(status_code=400, detail="Campaign must be approved before generating Order Sheet")
    if campaign.get("discount", {}).get("status") == "pending":
        raise HTTPException(status_code=400, detail="Cannot generate Order Sheet while discount is pending")
    
    dab_ref = await generate_dab_ref()
    campaign["dabRef"] = dab_ref
    pdf_bytes = generate_order_sheet_pdf(campaign)
    pdf_url = await upload_pdf(pdf_bytes, f"{dab_ref}")
    
    now = datetime.now(timezone.utc).isoformat()
    ref.update({"dabRef": dab_ref, "orderSheetPdfUrl": pdf_url, "status": "orderSheetGenerated", "updatedAt": now})
    await log_action(campaign_id, "ORDER_SHEET_GENERATED", user["uid"], user.get("role", ""), f"DAB Ref: {dab_ref}")
    return {"message": "Order Sheet generated", "dabRef": dab_ref, "pdfUrl": pdf_url}

@router.get("/{campaign_id}/download")
async def download_order_sheet(campaign_id: str, user=Depends(get_current_user)):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")

    campaign = doc.to_dict()
    if user.get("role") == "sales" and campaign.get("createdBy") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")

    pdf_url = campaign.get("orderSheetPdfUrl")
    if not pdf_url:
        raise HTTPException(status_code=404, detail="Order Sheet PDF has not been generated yet")

    try:
        response = requests.get(pdf_url, timeout=20)
        response.raise_for_status()
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Could not retrieve Order Sheet PDF")

    filename = _pdf_filename(campaign.get("dabRef") or campaign_id)
    return StreamingResponse(
        io.BytesIO(response.content),
        media_type=response.headers.get("content-type", "application/pdf"),
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.post("/{campaign_id}/upload-signed")
async def upload_signed_sheet(
    campaign_id: str, airtimeOrderSerial: str = Form(...),
    file: UploadFile = File(...), user=Depends(require_roles(["sales", "admin"]))
):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if doc.to_dict().get("status") != "orderSheetGenerated":
        raise HTTPException(status_code=400, detail="Order Sheet must be generated first")
    
    airtime_docs = list(db.collection("airtimeOrders").where("serial", "==", airtimeOrderSerial).limit(1).stream())
    if not airtime_docs:
        raise HTTPException(status_code=400, detail="Air-Time Order serial not found. Contact Finance to register it.")
    
    file_bytes = await file.read()
    dab_ref = doc.to_dict().get("dabRef", campaign_id)
    file_url = await upload_file(file_bytes, f"{dab_ref}-signed", "signed-sheets")
    
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "status": "clientSigned", "airtimeOrderSerial": airtimeOrderSerial,
        "signatures.clientSigned": True, "signatures.clientSignedAt": now,
        "signedSheetUrl": file_url, "updatedAt": now
    })
    await log_action(campaign_id, "CLIENT_SIGNED", user["uid"], user.get("role", ""), f"Air-Time Serial: {airtimeOrderSerial}")
    return {"message": "Signed sheet uploaded", "fileUrl": file_url}

@router.post("/{campaign_id}/countersign")
async def countersign_order_sheet(campaign_id: str, user=Depends(require_roles(["adManager", "admin"]))):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if doc.to_dict().get("status") != "clientSigned":
        raise HTTPException(status_code=400, detail="Client must sign before countersigning")
    
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "status": "adManagerCountersigned", "signatures.adManagerSigned": True,
        "signatures.adManagerSignedAt": now, "signatures.adManagerUid": user["uid"], "updatedAt": now
    })
    await log_action(campaign_id, "AD_MANAGER_COUNTERSIGNED", user["uid"], user.get("role", ""), "")
    return {"message": "Order Sheet countersigned"}

@router.post("/{campaign_id}/confirm-payment")
async def confirm_payment(campaign_id: str, user=Depends(require_roles(["finance", "admin"]))):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if doc.to_dict().get("status") != "adManagerCountersigned":
        raise HTTPException(status_code=400, detail="Ad Manager must countersign before payment can be confirmed")
    
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "status": "briefUnlocked", "payment.confirmed": True,
        "payment.confirmedBy": user["uid"], "payment.confirmedAt": now, "updatedAt": now
    })
    await log_action(campaign_id, "PAYMENT_CONFIRMED_BRIEF_UNLOCKED", user["uid"], user.get("role", ""), "Brief unlocked for Digital Ops")
    return {"message": "Payment confirmed. Brief unlocked for Digital Ops."}

@router.post("/{campaign_id}/dispute-payment")
async def dispute_payment(campaign_id: str, user=Depends(require_roles(["finance", "admin"]))):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    # Dispute logic omitted for brevity as per your snippet
    return {"message": "Payment disputed. Ad Manager has been notified."}
