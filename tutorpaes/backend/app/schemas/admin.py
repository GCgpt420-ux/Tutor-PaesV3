from pydantic import BaseModel
from typing import Optional

class AdminUserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_admin: bool
    is_active: bool


class AdminUserUpdateIn(BaseModel):
    role: Optional[str] = None
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None
