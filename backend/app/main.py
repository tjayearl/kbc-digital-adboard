from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    auth, campaigns, rate_card, discounts, order_sheet,
    change_orders, execution, execution_tasks, materials,
    airtime_orders, reports, users
)
from app.core.config import settings

app = FastAPI(
    title="KBC Digital AdBoard API",
    description="Backend API for the KBC Digital AdBoard system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(rate_card.router, prefix="/api/v1/rate-card", tags=["Rate Card"])
app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["Campaigns"])
app.include_router(discounts.router, prefix="/api/v1/discounts", tags=["Discounts"])
app.include_router(order_sheet.router, prefix="/api/v1/order-sheet", tags=["Order Sheet"])
app.include_router(change_orders.router, prefix="/api/v1/change-orders", tags=["Change Orders"])
app.include_router(execution.router, prefix="/api/v1/execution", tags=["Execution"])
app.include_router(execution_tasks.router, prefix="/api/v1/execution-tasks", tags=["Execution Tasks"])
app.include_router(materials.router, prefix="/api/v1/materials", tags=["Materials"])
app.include_router(airtime_orders.router, prefix="/api/v1/airtime-orders", tags=["Air-Time Orders"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])

@app.get("/")
def root():
    return {"status": "KBC Digital AdBoard API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}