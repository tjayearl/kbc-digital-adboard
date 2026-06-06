from fastapi import APIRouter, Depends, HTTPException
from app.core.security import require_roles
from app.core.firebase import db
from app.services.audit import log_action
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter()

class ReportActuals(BaseModel):
    deliveredItems: list
    notes: str = ""

@router.post("/{campaign_id}/generate")
async def generate_report(campaign_id: str, actuals: ReportActuals, user=Depends(require_roles(["digitalOps", "admin"]))):
    ref = db.collection("campaigns").document(campaign_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if doc.to_dict().get("status") not in ["delivered", "inExecution"]:
        raise HTTPException(status_code=400, detail="Campaign must be delivered first")
    now = datetime.now(timezone.utc).isoformat()
    ref.update({
        "report": {"deliveredItems": actuals.deliveredItems, "notes": actuals.notes,
                   "generatedBy": user["uid"], "generatedAt": now},
        "status": "reported", "updatedAt": now
    })
    await log_action(campaign_id, "REPORT_GENERATED", user["uid"], user.get("role", ""), "")
    return {"message": "Report generated"}

@router.get("/pipeline")
async def get_pipeline(user=Depends(require_roles(["admin", "adManager"]))):
    campaigns = db.collection("campaigns").stream()
    pipeline = [{"id": c.id, **c.to_dict()} for c in campaigns]
    total_booked = sum(
        c.get("totals", {}).get("grandTotal", 0) for c in pipeline
        if c.get("status") not in ["draft", "discountPending"]
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
        if data.get("status") not in ["draft", "discountPending"]:
            rep = data.get("createdBy", "unknown")
            total = data.get("totals", {}).get("grandTotal", 0)
            rep_revenue[rep] = rep_revenue.get(rep, 0) + total
    return {"revenueByRep": rep_revenue}