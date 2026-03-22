from datetime import timezone
"""
Transbank Webpay Plus Service
Gestiona la integración con Transbank para pagos en pesos chilenos.
"""

from datetime import datetime

try:
    from transbank.webpay.webpay_plus.transaction import Transaction
    from transbank.common.integration_commerce_codes import IntegrationCommerceCodes
    from transbank.common.integration_api_keys import IntegrationApiKeys
    from transbank.common.options import WebpayOptions
    from transbank.common.integration_type import IntegrationType
    _TRANSBANK_IMPORT_ERROR = None
except Exception as exc:  # pragma: no cover - optional dependency
    Transaction = None  # type: ignore[assignment]
    IntegrationCommerceCodes = None  # type: ignore[assignment]
    IntegrationApiKeys = None  # type: ignore[assignment]
    WebpayOptions = None  # type: ignore[assignment]
    IntegrationType = None  # type: ignore[assignment]
    _TRANSBANK_IMPORT_ERROR = exc

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Payment


def _ensure_transbank_available() -> None:
    """Valida que transbank-sdk esté instalado antes de usar pagos."""
    if Transaction is None or WebpayOptions is None:
        base_msg = "Transbank SDK no está disponible en el entorno actual"
        if _TRANSBANK_IMPORT_ERROR is not None:
            raise RuntimeError(f"{base_msg}: {_TRANSBANK_IMPORT_ERROR}")
        raise RuntimeError(base_msg)


def get_webpay_client() -> object:
    """
    Obtiene e inicializa el cliente de Transbank.
    Usa environment e integración según los settings.
    """
    _ensure_transbank_available()
    is_production = settings.TBK_ENVIRONMENT == "production"

    commerce_code = (
        settings.TBK_COMMERCE_CODE if is_production else IntegrationCommerceCodes.WEBPAY_PLUS
    )
    api_key = settings.TBK_API_KEY if is_production else IntegrationApiKeys.WEBPAY
    integration_type = IntegrationType.LIVE if is_production else IntegrationType.TEST

    options = WebpayOptions(commerce_code, api_key, integration_type)
    return Transaction(options)


def create_payment_order(
    user_id: int,
    amount: float,
    plan: str,  # 'monthly' or 'annual'
    return_url: str,
    db: Session
) -> dict:
    """
    Crea una orden de pago en Transbank.
    
    Args:
        user_id: ID del usuario
        amount: Monto en pesos chilenos
        plan: 'monthly' o 'annual'
        return_url: URL de retorno después del pago  db: Sesión de base de datos
    
    Returns:
        Dict con token, url, y buyOrder
    """
    try:
        # Generar IDs únicos
        buy_order = f"O-{int(datetime.now(timezone.utc).timestamp())}-{user_id}"
        session_id = f"S-{user_id}-{int(datetime.now(timezone.utc).timestamp())}"
        
        # Obtener cliente Transbank
        tx = get_webpay_client()
        
        # Crear transacción
        response = tx.create(
            buy_order=buy_order,
            session_id=session_id,
            amount=int(amount),  # Transbank requiere int
            return_url=return_url
        )

        response_token = response.get("token") if isinstance(response, dict) else getattr(response, "token", None)
        response_url = response.get("url") if isinstance(response, dict) else getattr(response, "url", None)

        if not response_token or not response_url:
            raise Exception("Respuesta inválida de Transbank al crear orden")
        
        # Guardar intención de pago en BD (estado: pending)
        payment = Payment(
            user_id=user_id,
            amount=int(amount),
            plan=plan,
            status="pending",
            buy_order=buy_order,
            token_ws=response_token,
            transbank_response={
                "session_id": session_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        return {
            "token": response_token,
            "url": response_url,  # https://webpay3gint.transbank.cl/webpayserver/initTransaction
            "buy_order": buy_order,
        }
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Error creating payment order: {str(e)}")


def confirm_payment(token: str, db: Session) -> dict:
    """
    Confirma un pago en Transbank.
    
    Args:
        token: Token de Transbank (desde parámetro ?token_ws=)
        db: Sesión de base de datos
    
    Returns:
        Dict con success y datos de respuesta
    """
    try:
        # Buscar payment en BD
        payment = db.query(Payment).filter(
            Payment.token_ws == token
        ).first()
        
        if not payment:
            raise Exception("Payment not found in database")

        if payment.status == "authorized":
            return {
                "success": True,
                "status": payment.status,
                "response_code": payment.transbank_response.get("response_code", 0),
                "status_message": payment.transbank_response.get("status", "AUTHORIZED"),
                "payment": payment,
            }

        # Obtener cliente Transbank
        tx = get_webpay_client()
        
        # Confirmar transacción
        response = tx.commit(token)
        
        # Verificar respuesta de Transbank
        response_code = response.get("response_code") if isinstance(response, dict) else getattr(response, "response_code", None)
        response_status = response.get("status") if isinstance(response, dict) else getattr(response, "status", None)
        authorization_code = response.get("authorization_code") if isinstance(response, dict) else getattr(response, "authorization_code", None)

        is_approved = (
            response_code == 0 and 
            response_status == "AUTHORIZED"
        )
        
        if is_approved:
            payment.status = "authorized"
            payment.authorized_at = datetime.now(timezone.utc)
            payment.transbank_response = {
                "response_code": response_code,
                "status": response_status,
                "authorization_code": authorization_code,
                "confirmed_at": datetime.now(timezone.utc).isoformat(),
            }
            
        else:
            # Pago rechazado
            payment.status = "failed"
            payment.transbank_response = {
                "response_code": response_code,
                "status": response_status,
                "error_at": datetime.now(timezone.utc).isoformat(),
            }
        
        db.commit()
        
        return {
            "success": is_approved,
            "status": payment.status,
            "response_code": response_code,
            "status_message": response_status,
            "payment": payment,
        }
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Error confirming payment: {str(e)}")


def get_payment_status(token: str, db: Session) -> dict:
    """
    Obtiene el estado de un pago existente.
    """
    payment = db.query(Payment).filter(
        Payment.token_ws == token
    ).first()
    
    if not payment:
        return {"error": "Payment not found"}
    
    return {
        "status": payment.status,
        "amount": payment.amount,
        "plan": payment.plan,
        "created_at": payment.created_at.isoformat() if payment.created_at else None,
        "transbank_response": payment.transbank_response,
    }

