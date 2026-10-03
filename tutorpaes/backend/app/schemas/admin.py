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


class PilotUserAuditOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_admin: bool
    is_active: bool
    cohort: str
    completed_attempts: int
    total_attempts: int
    questions_answered: int


class PilotAuditSummary(BaseModel):
    total_users: int
    active_users: int
    by_cohort: dict[str, int]
    total_completed_attempts: int
    total_questions_answered: int


class PilotAuditResponse(BaseModel):
    summary: PilotAuditSummary
    users: list[PilotUserAuditOut]

