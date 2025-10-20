from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime


class UserDetail(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str]
    role: str
    is_admin: bool
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]


class UserListResponse(BaseModel):
    users: List[UserDetail]
    total: int
    page: int
    limit: int


class AdminActivityLog(BaseModel):
    id: int
    admin_id: Optional[str]
    action: str
    target_user_id: Optional[str]
    details: Any
    created_at: datetime


class AdminSetting(BaseModel):
    setting_key: str
    setting_value: Any
    updated_at: datetime


class DomainConfigResponse(BaseModel):
    enabled: bool
    allowed_domains: List[str]
    exception_emails_count: int
    note: str


class EmailValidationRequest(BaseModel):
    email: EmailStr


class EmailValidationResponse(BaseModel):
    email: EmailStr
    is_valid: bool
    reason: str
