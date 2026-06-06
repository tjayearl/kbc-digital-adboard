from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    FIREBASE_CREDENTIALS_PATH: str = "serviceAccountKey.json"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "https://your-vercel-app.vercel.app"]
    SECRET_KEY: str = "your-secret-key"

    class Config:
        env_file = ".env"

settings = Settings()