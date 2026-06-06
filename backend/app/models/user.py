from pydantic import BaseModel
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    sales = "sales"
    ad_manager = "adManager"
    digital_ops = "digitalOps"
    finance = "finance"
    admin = "admin"

class CreateUserRequest(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole
    phone: Optional[str] = None

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    active: Optional[bool] = None
    role: Optional[UserRole] = None