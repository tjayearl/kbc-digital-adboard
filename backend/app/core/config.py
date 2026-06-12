from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator

class Settings(BaseSettings):
    FIREBASE_CREDENTIALS_PATH: str = "serviceAccountKey.json"
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://kbc-digital-adboard.firebaseapp.com",
        "https://kbc-digital-adboard.web.app",
        "https://kbc-digital-adboard.onrender.com"
    ]
    SECRET_KEY: str = "your-secret-key"
    FIREBASE_WEB_API_KEY: str = "AIzaSyBUw-wWwidO9q-z35O0Z8ddcjBcMGtsMs8"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        if isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except Exception:
                pass
        return v

    class Config:
        env_file = ".env"

settings = Settings()