from pydantic import BaseModel
from typing import Optional

class PaymentCreateIn(BaseModel):
    plan: str  # "monthly" or "annual"


class PaymentCreateOut(BaseModel):
    url: str
    buy_order: str
    token_ws: Optional[str] = None


class PaymentConfirmOut(BaseModel):
    success: bool
    message: str
    plan: str
    authorized_at: Optional[str] = None


class PaymentStatusOut(BaseModel):
    id: int
    amount: int
    plan: str
    status: str
    created_at: str
    authorized_at: Optional[str] = None


class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    status: str
    issue_date: str
    due_date: str
    total_amount: int
    pdf_url: Optional[str] = None


class BillingItemOut(BaseModel):
    payment_id: int
    buy_order: str
    amount: int
    plan: str
    status: str
    created_at: Optional[str] = None
    authorized_at: Optional[str] = None
    invoice: Optional[InvoiceOut] = None


class BillingHistoryOut(BaseModel):
    payments: list[BillingItemOut]
    total_spent: int
    count: int
