from pydantic import BaseModel

class GenerateOrderSheetRequest(BaseModel):
    campaignId: str

class UploadSignedSheetRequest(BaseModel):
    campaignId: str
    airtimeOrderSerial: str