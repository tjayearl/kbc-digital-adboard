from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class CampaignStatus(str, Enum):
    draft = "draft"
    discount_pending = "discountPending"
    discount_approved = "discountApproved"
    order_sheet_generated = "orderSheetGenerated"
    client_signed = "clientSigned"
    ad_manager_countersigned = "adManagerCountersigned"
    payment_confirmed = "paymentConfirmed"
    brief_unlocked = "briefUnlocked"
    in_execution = "inExecution"
    delivered = "delivered"
    reported = "reported"
    closed = "closed"

class ClientInfo(BaseModel):
    name: str
    contact: str
    email: str
    phone: str
    company: str

class CampaignInfo(BaseModel):
    name: str
    startDate: str
    endDate: str
    flightDays: int

class LineItem(BaseModel):
    productId: str
    productName: str
    platform: str
    quantity: int
    postsPerDay: int
    unitPrice: float
    totalPrice: float

class Boosting(BaseModel):
    required: bool
    platforms: List[str] = []
    budget: float = 0
    isOnTopOfOrder: bool = False

class Discount(BaseModel):
    requested: bool = False
    requestedBy: Optional[str] = None
    requestedAt: Optional[str] = None
    percentage: Optional[float] = None
    approvedBy: Optional[str] = None
    approvedAt: Optional[str] = None
    status: Optional[str] = None

class Totals(BaseModel):
    subtotal: float
    vatAmount: float
    grandTotal: float
    discountValue: float = 0

class CreateCampaignRequest(BaseModel):
    client: ClientInfo
    campaign: CampaignInfo
    lineItems: List[LineItem]
    boosting: Boosting
    discount: Discount
    totals: Totals
    bookingType: Optional[str] = None

class UpdateCampaignStatusRequest(BaseModel):
    status: CampaignStatus
    note: Optional[str] = None