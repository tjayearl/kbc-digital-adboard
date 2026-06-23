import cloudinary
import cloudinary.uploader
from app.core.config import settings
import io

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

async def upload_pdf(pdf_bytes: bytes, public_id: str) -> str:
    result = cloudinary.uploader.upload(
        io.BytesIO(pdf_bytes),
        public_id=public_id,
        resource_type="raw",
        folder="dab/order-sheets",
        overwrite=True,
        access_control=[{"access_type": "anonymous"}],
        access_mode="public",
        type="upload"
    )
    print(f"Cloudinary upload result: {result}")
    return result["secure_url"]

async def upload_file(file_bytes: bytes, public_id: str, folder: str) -> str:
    result = cloudinary.uploader.upload(
        io.BytesIO(file_bytes),
        public_id=public_id,
        resource_type="auto",
        folder=f"dab/{folder}",
        overwrite=True,
        access_mode="public",
        type="upload"
    )
    return result["secure_url"]

async def upload_signed_pdf(pdf_bytes: bytes, public_id: str) -> str:
    result = cloudinary.uploader.upload(
        io.BytesIO(pdf_bytes),
        public_id=public_id,
        resource_type="raw",
        folder="dab/signed-sheets",
        overwrite=True,
        access_control=[{"access_type": "anonymous"}],
        access_mode="public",
        type="upload"
    )
    print(f"Signed PDF upload result: {result}")
    return result["secure_url"]
