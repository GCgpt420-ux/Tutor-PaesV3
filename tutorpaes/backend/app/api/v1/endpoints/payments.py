from datetime import timezone
"""
Payments Endpoints - Transbank Integration
Handles payment creation and confirmation for premium plan subscriptions.
"""

from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import User, Payment, UserEntitlement
from app.core.auth import get_current_user
from app.core.rate_limiter import limiter
from app.services.transbank_service import create_payment_order, confirm_payment

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
):
    """
    Confirms a Transbank payment and activates the subscription.
    Called after user returns from Transbank payment page.
    """
    
    if not token_ws:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing token_ws parameter"
        )
    
    # Find the payment by token without requiring an interactive session.
    payment = db.scalar(
        select(Payment).where(
            Payment.token_ws == token_ws
        )
    )
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found or already processed"
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
