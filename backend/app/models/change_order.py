from pydantic import BaseModel
from typing import List
from app.models.campaign import LineItem, Totals

class CreateChangeOrderRequest(BaseModel):
    parentCampaignId: str
    additionalLineItems: List[LineItem]
    totals: Totals
    reason: str