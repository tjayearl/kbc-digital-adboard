from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from app.core.security import require_roles, get_current_user
from app.core.firebase import db
from app.services.pdf_service import generate_order_sheet_pdf
from app.services.cloudinary_service import upload_pdf, upload_signed_pdf
from app.services.audit import log_action
from app.services.dab_ref import generate_dab_ref
from datetime import datetime, timezone
import logging
import io

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/{campaign_id}/generate")
async def generate_order_sheet(campaign_id: str, user=Depends(require_roles(["sales", "admin"]))):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = doc.to_dict()
    if campaign.get("status") not in ["draft", "discountApproved"]:
        raise HTTPException(status_code=400, detail="Campaign must be in draft or discountApproved status")
    if campaign.get("discount", {}).get("status") == "pending":
        raise HTTPException(status_code=400, detail="Cannot generate Order Sheet while discount is pending")
    dab_ref = await generate_dab_ref()
    campaign["dabRef"] = dab_ref
    try:
        pdf_bytes = generate_order_sheet_pdf(campaign)
    except Exception as exc:
        logger.exception("Failed to generate order sheet PDF for campaign %s", campaign_id)
        raise HTTPException(status_code=500, detail="Failed to generate Order Sheet PDF") from exc
    try:
        pdf_url = await upload_pdf(pdf_bytes, f"{dab_ref}")
    except Exception as exc:
        logger.exception("Failed to upload order sheet PDF for campaign %s", campaign_id)
        raise HTTPException(status_code=500, detail="Failed to upload Order Sheet PDF.") from exc
    now = datetime.now(timezone.utc).isoformat()
    try:
        ref.update({"dabRef": dab_ref, "orderSheetPdfUrl": pdf_url, "status": "orderSheetGenerated", "updatedAt": now})
    except Exception as exc:
        logger.exception("Failed to update campaign %s after order sheet PDF upload", campaign_id)
        raise HTTPException(status_code=500, detail="Order Sheet PDF was uploaded, but the campaign could not be updated") from exc
    try:
        await log_action(campaign_id, "ORDER_SHEET_GENERATED", user["uid"], user.get("role", ""), f"DAB Ref: {dab_ref}")
    except Exception:
        logger.exception("Failed to write order sheet audit log for campaign %s", campaign_id)
    return {"message": "Order Sheet generated", "dabRef": dab_ref, "pdfUrl": pdf_url}

@router.get("/{campaign_id}/download")
async def download_order_sheet(campaign_id: str, user=Depends(get_current_user)):
    doc = db.collection("campaigns").document(campaign_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = doc.to_dict()
    if not campaign.get("orderSheetPdfUrl"):
        raise HTTPException(status_code=404, detail="No Order Sheet generated yet")
    dab_ref = campaign.get("dabRef", campaign_id)
    # Re-generate PDF from campaign data and stream directly — bypasses Cloudinary auth
    pdf_bytes = generate_order_sheet_pdf(campaign)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={dab_ref}.pdf"}
    )

@router.get("/{campaign_id}/download-signed")
async def download_signed_sheet(campaign_id: str, user=Depends(get_current_user)):
    import requests as req
    doc = db.collection("campaigns").document(campaign_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign = doc.to_dict()
    signed_url = campaign.get("signedSheetUrl")
    if not signed_url:
        raise HTTPException(status_code=404, detail="No signed sheet uploaded yet")
    dab_ref = campaign.get("dabRef", campaign_id)
    # Fetch from Cloudinary server-side and stream to client
    response = req.get(signed_url)
    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Could not fetch signed sheet from storage")
    return StreamingResponse(
        io.BytesIO(response.content),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={dab_ref}-signed.pdf"}
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
    file_bytes = await file.read()
    dab_ref = doc.to_dict().get("dabRef", campaign_id)
    file_url = await upload_signed_pdf(file_bytes, f"{dab_ref}-signed")
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
        "status": "briefUnlocked", 
        "signatures.adManagerSigned": True,
        "signatures.adManagerSignedAt": now, 
        "signatures.adManagerUid": user["uid"],
        "payment.confirmed": True,
        "payment.confirmedBy": user["uid"],
        "payment.confirmedAt": now,
        "updatedAt": now
    })
    await log_action(campaign_id, "AD_MANAGER_COUNTERSIGNED", user["uid"], user.get("role", ""), "")
    await log_action(campaign_id, "PAYMENT_CONFIRMED_BRIEF_UNLOCKED", user["uid"], user.get("role", ""), "Auto-confirmed payment on countersign. Brief unlocked.")
    return {"message": "Order Sheet countersigned and brief unlocked"}

@router.post("/{campaign_id}/confirm-payment")
async def confirm_payment(campaign_id: str, user=Depends(require_roles(["finance", "admin"]))):
    raise HTTPException(status_code=400, detail="Finance payment confirmation is disabled. Payments are auto-confirmed on countersign.")

@router.post("/{campaign_id}/dispute-payment")
async def dispute_payment(campaign_id: str, user=Depends(require_roles(["finance", "admin"]))):
    raise HTTPException(status_code=400, detail="Finance payment disputing is disabled.")
