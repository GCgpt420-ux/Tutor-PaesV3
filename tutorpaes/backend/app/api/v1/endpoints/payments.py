"""
Payments Endpoints - Transbank Integration
Handles payment creation and confirmation for premium plan subscriptions.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import User, Payment, UserEntitlement, Invoice
from app.core.auth import get_current_user
from app.core.rate_limiter import limiter
from app.services.transbank_service import create_payment_order, confirm_payment
from app.services.invoice_service import get_user_billing_history, get_invoice_by_id

router = APIRouter(prefix="/payments", tags=["payments"])


# -----------------------------------------------------------------------
# PYDANTIC MODELS
# -----------------------------------------------------------------------

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


# Billing & Invoice Models
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


# -----------------------------------------------------------------------
# ENDPOINTS
# -----------------------------------------------------------------------

@router.post("/create", response_model=PaymentCreateOut)
@limiter.limit("15/minute")
def create_payment_endpoint(
    request: Request,
    payload: PaymentCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates a Transbank payment order for plan upgrade.
    Returns the payment URL and order details.
    
    Plans:
    - monthly: $7,900 CLP
    - annual: $79,900 CLP
    """
    plan = payload.plan.lower()
    
    # Validate plan
    if plan not in ["monthly", "annual"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan. Must be 'monthly' or 'annual'."
        )
    
    # Define pricing
    amount = 79900 if plan == "annual" else 7900
    
    # Return URL for Transbank callback (configured via environment variable)
    from app.core.config import settings
    if not settings.PAYMENT_RETURN_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment return URL not configured. Contact support."
        )
    return_url = settings.PAYMENT_RETURN_URL
    
    try:
        result = create_payment_order(
            user_id=user.id,
            amount=amount,
            plan=plan,
            return_url=return_url,
            db=db
        )
        
        return {
            "url": result["url"] + f"?token_ws={result['token']}",
            "buy_order": result["buy_order"],
            "token_ws": result["token"],
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating payment"
        )


@router.get("/confirm", response_model=PaymentConfirmOut)
@limiter.limit("20/minute")
def confirm_payment_endpoint(
    request: Request,
    token_ws: str = Query(..., description="Transbank token from redirect"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Confirms a Transbank payment and activates the subscription.
    Called after user returns from Transbank payment page.
    Requires authentication to prevent IDOR: only the owner of the payment can confirm it.
    """
    payment = db.scalar(
        select(Payment).where(Payment.token_ws == token_ws)
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found or already processed"
        )

    # IDOR guard: el pago debe pertenecer al usuario autenticado.
    if payment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "forbidden",
                "detail": "No tienes permiso para confirmar este pago.",
                "code": "IDOR_BLOCKED",
            },
        )
    
    try:
        result = confirm_payment(token_ws, db)
        
        if result["success"]:
            if payment.status == "authorized":
                existing_entitlement = db.scalar(
                    select(UserEntitlement).where(
                        (UserEntitlement.user_id == payment.user_id) &
                        (UserEntitlement.plan != "free")
                    )
                )

                if existing_entitlement and existing_entitlement.meta.get("payment_id") == payment.id:
                    return {
                        "success": True,
                        "message": f"Pago confirmado. Plan {payment.plan} activado.",
                        "plan": payment.plan,
                        "authorized_at": payment.authorized_at.isoformat() if payment.authorized_at else None,
                    }

            # Calculate entitlement end date
            days = 365 if payment.plan == "annual" else 30
            base_date = payment.authorized_at or datetime.now(timezone.utc)
            end_date = base_date + timedelta(days=days)
            
            # Create or update user entitlement
            existing_entitlement = db.scalar(
                select(UserEntitlement).where(
                    (UserEntitlement.user_id == payment.user_id) &
                    (UserEntitlement.plan != "free")
                )
            )
            
            if existing_entitlement:
                existing_entitlement.is_active = True
                existing_entitlement.plan = "pro"
                existing_entitlement.starts_at = datetime.now(timezone.utc)
                existing_entitlement.ends_at = end_date
                existing_entitlement.meta = {
                    **(existing_entitlement.meta or {}),
                    "payment_id": payment.id,
                    "plan_type": payment.plan,
                }
            else:
                entitlement = UserEntitlement(
                    user_id=payment.user_id,
                    plan="pro",
                    starts_at=datetime.now(timezone.utc),
                    ends_at=end_date,
                    is_active=True,
                    meta={"payment_id": payment.id, "plan_type": payment.plan}
                )
                db.add(entitlement)
            
            db.commit()
            
            return {
                "success": True,
                "message": f"Pago confirmado. Plan {payment.plan} activado.",
                "plan": payment.plan,
                "authorized_at": datetime.now(timezone.utc).isoformat(),
            }
        else:
            return {
                "success": False,
                "message": "El pago fue rechazado. Intenta nuevamente.",
                "plan": payment.plan,
                "authorized_at": None,
            }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error confirming payment"
        )


# -----------------------------------------------------------------------
# BILLING & INVOICE ENDPOINTS
# -----------------------------------------------------------------------

@router.get("/history", response_model=BillingHistoryOut)
@limiter.limit("30/minute")
def get_billing_history(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
):
    """
    Retorna el historial de pagos e invoices del usuario autenticado.
    
    Returns:
        - payments: Lista de pagos con sus invoices asociados
        - total_spent: Monto total gastado (en pesos)
        - count: Número de transacciones
    """
    try:
        history = get_user_billing_history(user.id, db, limit=limit)
        
        # Transformar datos al formato de respuesta
        billing_items = []
        for item in history.get("payments", []):
            invoice_data = None
            if item.get("invoice"):
                invoice_data = InvoiceOut(
                    id=item["invoice"].get("id"),
                    invoice_number=item["invoice"].get("invoice_number"),
                    status=item["invoice"].get("status"),
                    issue_date=item["invoice"].get("issue_date") or "",
                    due_date=item["invoice"].get("due_date") or "",
                    total_amount=item["invoice"].get("total_amount", 0),
                    pdf_url=f"/api/v1/payments/invoices/{item['invoice'].get('id')}/download",
                )
            
            billing_items.append(
                BillingItemOut(
                    payment_id=item["payment_id"],
                    buy_order=item["buy_order"],
                    amount=item["amount"],
                    plan=item["plan"],
                    status=item["status"],
                    created_at=item["created_at"],
                    authorized_at=item["authorized_at"],
                    invoice=invoice_data,
                )
            )
        
        return BillingHistoryOut(
            payments=billing_items,
            total_spent=history["total_spent"],
            count=history["count"],
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching billing history"
        )


@router.get("/invoices/{invoice_id}")
@limiter.limit("30/minute")
def get_invoice(
    invoice_id: int,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna los detalles de una invoice específica.
    Solo el propietario del pago/invoice puede acceder.
    """
    try:
        invoice = get_invoice_by_id(invoice_id, db)
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        # IDOR guard: verificar que la invoice pertenece al usuario
        if invoice.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para acceder a esta invoice"
            )
        
        return InvoiceOut(
            id=invoice.id,
            invoice_number=invoice.invoice_number,
            status=invoice.status,
            issue_date=invoice.issue_date.isoformat(),
            due_date=invoice.due_date.isoformat(),
            total_amount=invoice.total_amount,
            pdf_url=f"/api/v1/payments/invoices/{invoice.id}/download",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching invoice"
        )


@router.get("/invoices/{invoice_id}/download")
@limiter.limit("20/minute")
def download_invoice_pdf(
    invoice_id: int,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Descarga el PDF de una invoice.
    Stub: actualmente retorna un placeholder.
    
    TODO: Implementar generación real de PDF:
    - Usar reportlab o weasyprint
    - Almacenar en S3 o storage local
    - Retornar archivo descargable
    """
    try:
        invoice = get_invoice_by_id(invoice_id, db)
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found"
            )
        
        # IDOR guard
        if invoice.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para descargar esta invoice"
            )
        
        return {
            "message": "PDF generation in progress",
            "invoice_number": invoice.invoice_number,
            "status": "placeholder",
            "note": "Implementación de descarga de PDF en progreso",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error downloading invoice"
        )


@router.get("/{payment_id}", response_model=PaymentStatusOut)
def get_payment_status(
    payment_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the status of a specific payment.
    """
    payment = db.scalar(
        select(Payment).where(
            (Payment.id == payment_id) &
            (Payment.user_id == user.id)
        )
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )

    return {
        "id": payment.id,
        "amount": payment.amount,
        "plan": payment.plan,
        "status": payment.status,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
        "authorized_at": payment.authorized_at.isoformat() if payment.authorized_at else None,
    }
