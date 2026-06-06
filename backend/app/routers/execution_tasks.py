from fastapi import APIRouter, Depends, HTTPException, Form
from app.core.security import require_roles, get_current_user
from app.core.firebase import db
from app.services.audit import log_action
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid

router = APIRouter()

class CreateTaskRequest(BaseModel):
    campaignId: str
    productId: str
    taskName: str
    slaDeadline: str

class UpdateTaskRequest(BaseModel):
    status: Optional[str] = None
    note: Optional[str] = None

@router.post("/")
async def create_task(
    request: CreateTaskRequest,
    user=Depends(require_roles(["admin", "adManager"]))
):
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    db.collection("executionTasks").document(task_id).set({
        "taskId": task_id,
        "campaignId": request.campaignId,
        "productId": request.productId,
        "taskName": request.taskName,
        "slaDeadline": request.slaDeadline,
        "status": "pending",
        "goLiveTimestamp": None,
        "createdBy": user["uid"],
        "createdAt": now
    })
    return {"message": "Task created", "taskId": task_id}

@router.get("/{campaign_id}")
async def get_tasks(
    campaign_id: str,
    user=Depends(get_current_user)
):
    tasks = db.collection("executionTasks").where(
        "campaignId", "==", campaign_id
    ).stream()
    return [{"id": t.id, **t.to_dict()} for t in tasks]

@router.patch("/{task_id}")
async def update_task(
    task_id: str,
    request: UpdateTaskRequest,
    user=Depends(require_roles(["digitalOps", "admin"]))
):
    ref = db.collection("executionTasks").document(task_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = {k: v for k, v in request.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    now = datetime.now(timezone.utc).isoformat()
    if update_data.get("status") == "live":
        update_data["goLiveTimestamp"] = now

    update_data["updatedAt"] = now
    update_data["updatedBy"] = user["uid"]
    ref.update(update_data)

    campaign_id = doc.to_dict().get("campaignId", "")
    await log_action(campaign_id, "TASK_UPDATED", user["uid"],
                     user.get("role", ""), f"Task {task_id} → {update_data.get('status', '')}")
    return {"message": "Task updated"}

@router.post("/{task_id}/delete") # Changed to post or delete if your requirement specified
@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    user=Depends(require_roles(["admin"]))
):
    db.collection("executionTasks").document(task_id).delete()
    return {"message": "Task deleted"}