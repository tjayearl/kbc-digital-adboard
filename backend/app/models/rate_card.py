from pydantic import BaseModel
from typing import Optional

class RateCardItem(BaseModel):
    category: str
    name: str
    platform: str
    unit: str
    unitPrice: float

class UpdateRateCardItem(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    platform: Optional[str] = None
    unit: Optional[str] = None
    unitPrice: Optional[float] = None