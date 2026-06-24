from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse  # 🆕 ADD THIS
from app.core.security import require_roles, get_current_user
from app.core.firebase import db
from app.services.audit import log_action
from app.services.pdf_service import generate_report_pdf  # 🆕 ADD THIS
from app.services.cloudinary_service import upload_pdf  # 🆕 ADD THIS
from datetime import datetime, timezone
from pydantic import BaseModel
import uuid
import io  # 🆕 ADD THIS
import httpx  # 🆕 ADD THIS

router = APIRouter()

class ReportActuals(BaseModel):
    deliveredItems: list
    notes: str = ""

# ============================================================
# UPDATED ENDPOINT - Now generates actual PDF
# ============================================================
@router.post("/{campaign_id}/generate")
async def generate_report(campaign_id: str, actuals: ReportActuals, user=Depends(require_roles(["digitalOps", "admin"]))):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign = doc.to_dict()
    if campaign.get("status") not in ["delivered", "inExecution"]:
        raise HTTPException(status_code=400, detail="Campaign must be delivered or in execution")
    
    # Generate a report ID
    report_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # 📄 Generate PDF using the new function
    pdf_bytes = generate_report_pdf(campaign, actuals.deliveredItems, actuals.notes)
    
    # ☁️ Upload to Cloudinary
    pdf_url = await upload_pdf(pdf_bytes, f"report_{report_id}")
    
    # Save to reports collection with PDF URL
    db.collection("reports").document(report_id).set({
        "campaignId": campaign_id,
        "deliveredItems": actuals.deliveredItems,
        "notes": actuals.notes,
        "generatedBy": user["uid"],
        "generatedAt": now,
        "createdAt": now,
        "pdfUrl": pdf_url  # 🆕 Store Cloudinary URL
    })
    
    # Update campaign
    ref.update({
        "report": {
            "deliveredItems": actuals.deliveredItems, 
            "notes": actuals.notes,
            "generatedBy": user["uid"], 
            "generatedAt": now,
            "reportId": report_id,
            "pdfUrl": pdf_url  # 🆕 Store Cloudinary URL
        },
        "status": "reported", 
        "updatedAt": now
    })
    
    await log_action(campaign_id, "REPORT_GENERATED", user["uid"], user.get("role", ""), f"Report ID: {report_id}")
    
    # Return reportId and reportUrl (Cloudinary URL)
    return {
        "message": "Report generated",
        "reportId": report_id,
        "reportUrl": pdf_url  # 🆕 Return Cloudinary URL
    }


# ============================================================
# GET ALL REPORTS FOR A CAMPAIGN
# ============================================================
@router.get("/{campaign_id}/reports")
async def get_campaign_reports(campaign_id: str, user=Depends(require_roles(["digitalOps", "admin", "sales"]))):
    """Get all generated reports for a campaign"""
    reports = db.collection("reports").where("campaignId", "==", campaign_id).stream()
    
    result = []
    for r in reports:
        data = r.to_dict()
        data["id"] = r.id
        result.append(data)
    
    return result


# ============================================================
# UPDATED ENDPOINT - Now downloads actual PDF from Cloudinary
# ============================================================
@router.get("/{campaign_id}/pdf/{report_id}")
async def download_report_pdf(campaign_id: str, report_id: str, user=Depends(get_current_user)):
    """Download report PDF from Cloudinary"""
    doc = db.collection("reports").document(report_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report = doc.to_dict()
    
    if report.get("campaignId") != campaign_id:
        raise HTTPException(status_code=403, detail="Report does not belong to this campaign")
    
    pdf_url = report.get("pdfUrl")
    
    if not pdf_url:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    # Fetch from Cloudinary and stream
    async with httpx.AsyncClient() as client:
        response = await client.get(pdf_url)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch PDF from storage")
        
        return StreamingResponse(
            io.BytesIO(response.content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=report_{report_id}.pdf"
            }
        )


# ============================================================
# EXISTING ENDPOINTS - KEEP AS IS
# ============================================================
@router.get("/pipeline")
async def get_pipeline(user=Depends(require_roles(["admin", "adManager"]))):
    campaigns = db.collection("campaigns").stream()
    pipeline = [{"id": c.id, **c.to_dict()} for c in campaigns]
    total_booked = sum(
        c.get("totals", {}).get("grandTotal", 0) for c in pipeline
        if c.get("status") not in ["draft", "campaignConfigured", "discountPending", "discountRejected"]
    )
    total_discounts = sum(
        c.get("totals", {}).get("discountValue", 0) for c in pipeline
        if c.get("discount", {}).get("status") == "approved"
    )
    now = datetime.now(timezone.utc).isoformat()
    overdue = [
        c for c in pipeline
        if c.get("status") in ["briefUnlocked", "inExecution"]
        and c.get("campaign", {}).get("endDate", "9999") < now[:10]
    ]
    return {
        "campaigns": pipeline,
        "totalBooked": total_booked,
        "totalDiscounts": total_discounts,
        "overdueCount": len(overdue),
        "overdue": overdue,
        "count": len(pipeline)
    }

@router.get("/discounts")
async def get_discount_report(user=Depends(require_roles(["admin", "adManager"]))):
    campaigns = db.collection("campaigns").stream()
    discounts = []
    for c in campaigns:
        data = c.to_dict()
        discount = data.get("discount", {})
        if discount.get("status") == "approved":
            discounts.append({
                "campaignId": c.id, "dabRef": data.get("dabRef", ""),
                "client": data.get("client", {}).get("name", ""),
                "rep": data.get("createdBy", ""),
                "percentage": discount.get("percentage", 0),
                "value": data.get("totals", {}).get("discountValue", 0),
                "approvedBy": discount.get("approvedBy", ""),
                "approvedAt": discount.get("approvedAt", ""),
            })
    return {"discounts": discounts, "total": sum(d["value"] for d in discounts)}

@router.get("/revenue-by-rep")
async def revenue_by_rep(user=Depends(require_roles(["admin", "adManager"]))):
    campaigns = db.collection("campaigns").stream()
    rep_revenue = {}
    for c in campaigns:
        data = c.to_dict()
        if data.get("status") not in ["draft", "campaignConfigured", "discountPending", "discountRejected"]:
            rep = data.get("createdBy", "unknown")
            total = data.get("totals", {}).get("grandTotal", 0)
            rep_revenue[rep] = rep_revenue.get(rep, 0) + total
    return {"revenueByRep": rep_revenue}
    