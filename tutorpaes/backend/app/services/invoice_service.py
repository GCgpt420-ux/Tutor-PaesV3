"""
Invoice/Billing Service
Maneja la generación y gestión de boletas/facturas cuando los pagos son autorizados.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from decimal import Decimal
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.models import Payment, Invoice, User
from app.core.config import settings

logger = logging.getLogger(__name__)


def generate_invoice_number() -> str:
    """
    Genera un número de boleta único.
    Formato: INV-YYYYMMDD-NNNNN (ejemplo: INV-20260406-00001)
    En producción, usar un secuenciador de BD o servicio externo de SII.
    """
    now = datetime.now(timezone.utc)
    date_part = now.strftime("%Y%m%d")
    unique_part = str(uuid.uuid4().hex[:5]).upper()
    return f"INV-{date_part}-{unique_part}"


def calculate_iva(amount_clp: int, iva_rate: float = 0.19) -> tuple[int, int, int]:
    """
    Calcula IVA para un monto.
    
    Args:
        amount_clp: Monto en pesos chilenos (centavos)
        iva_rate: Tasa de IVA (default 19%)
    
    Returns:
        (subtotal, iva_amount, total_amount) todos en centavos
    """
    # En Chile, la mayoría de suscripciones digitales están exentas de IVA si el proveedor es local
    # Para este caso, asumimos que NO hay IVA (es un servicio educativo)
    # Si necesitas incluir IVA, descomenta las líneas de abajo

    subtotal = amount_clp
    iva_amount = 0  # Sin IVA para servicios educativos en Chile
    total_amount = amount_clp

    return subtotal, iva_amount, total_amount


def create_invoice_from_payment(payment: Payment, db: Session) -> Optional[Invoice]:
    """
    Crea una boleta/factura cuando un pago es autorizado.
    Se llama desde transbank_service.confirm_payment() después de autorizar.
    
    Args:
        payment: Objeto Payment autorizado
        db: Sesión de BD
    
    Returns:
        Invoice creado o None si hay error
    """
    if payment.status != "authorized":
        logger.warning(f"Intento de generar invoice para pago sin autorizar: {payment.id}")
        return None

    try:
        # Verificar que no exista invoice ya
        existing = db.scalar(
            select(Invoice).where(Invoice.payment_id == payment.id)
        )
        if existing:
            logger.debug(f"Invoice ya existe para payment {payment.id}")
            return existing

        # Calcular IVA
        subtotal, iva_amount, total_amount = calculate_iva(payment.amount)

        # Crear invoice
        invoice = Invoice(
            payment_id=payment.id,
            user_id=payment.user_id,
            invoice_number=generate_invoice_number(),
            subtotal=subtotal,
            iva_amount=iva_amount,
            total_amount=total_amount,
            issue_date=datetime.now(timezone.utc),
            due_date=datetime.now(timezone.utc) + timedelta(days=30),  # Vencimiento en 30 días
            status="issued",
            tax_info={
                "country": "Chile",
                "iva_rate": 0.19,
                "iva_exempt": True,  # Servicios educativos exentos
                "service_type": "online_education",
                "plan": payment.plan,
            }
        )
        
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        
        logger.info(f"Invoice creado: {invoice.invoice_number} para payment {payment.id}")
        return invoice

    except Exception as e:
        db.rollback()
        logger.error(f"Error generando invoice: {str(e)}", exc_info=True)
        return None


def get_user_billing_history(user_id: int, db: Session, limit: int = 50) -> dict:
    """
    Retorna el historial de pagos e invoices de un usuario.
    
    Args:
        user_id: ID del usuario
        db: Sesión de BD
        limit: Límite de registros a retornar
    
    Returns:
        Dict con:
        - payments: Lista de pagos con sus invoices
        - total_spent: Monto total gastado
        - active_plan: Plan activo (si hay)
    """
    try:
        # Obtener pagos autorizados ordenados por fecha desc
        payments = db.scalars(
            select(Payment)
            .where(Payment.user_id == user_id)
            .where(Payment.status.in_(["authorized", "failed"]))
            .order_by(Payment.created_at.desc())
            .limit(limit)
        ).all()

        # Construir respuesta
        payment_items = []
        total_spent = 0

        for payment in payments:
            invoice = db.scalar(
                select(Invoice).where(Invoice.payment_id == payment.id)
            )
            
            item = {
                "payment_id": payment.id,
                "buy_order": payment.buy_order,
                "amount": payment.amount,
                "plan": payment.plan,
                "status": payment.status,
                "created_at": payment.created_at.isoformat() if payment.created_at else None,
                "authorized_at": payment.authorized_at.isoformat() if payment.authorized_at else None,
                "invoice": None,
            }

            if invoice:
                item["invoice"] = {
                    "id": invoice.id,
                    "invoice_number": invoice.invoice_number,
                    "status": invoice.status,
                    "issue_date": invoice.issue_date.isoformat() if invoice.issue_date else None,
                    "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
                    "total_amount": invoice.total_amount,
                }

            if payment.status == "authorized":
                total_spent += payment.amount

            payment_items.append(item)

        return {
            "payments": payment_items,
            "total_spent": total_spent,
            "count": len(payment_items),
        }

    except Exception as e:
        logger.error(f"Error obteniendo billing history para user {user_id}: {str(e)}", exc_info=True)
        return {
            "payments": [],
            "total_spent": 0,
            "count": 0,
            "error": str(e),
        }


def get_invoice_by_id(invoice_id: int, db: Session) -> Optional[Invoice]:
    """Retorna una invoice específica por ID."""
    try:
        return db.scalar(
            select(Invoice).where(Invoice.id == invoice_id)
        )
    except Exception as e:
        logger.error(f"Error obteniendo invoice {invoice_id}: {str(e)}")
        return None


def generate_invoice_pdf(invoice: Invoice, db: Session) -> dict:
    """
    Genera un PDF de la boleta.
    Actualmente es un stub que retorna un placeholder.
    En producción, usar reportlab, weasyprint, o un servicio externo.
    
    Args:
        invoice: Objeto Invoice
        db: Sesión de BD
    
    Returns:
        Dict con:
        - success: bool
        - pdf_url: URL pública del PDF (o placeholder)
        - pdf_path: Ruta local si fue guardado
        - error: mensaje de error (si aplica)
    """
    try:
        # TODO: Implementar generación real de PDF
        # Por ahora, retornar un placeholder
        # En producción:
        # 1. Usar reportlab o weasyprint para generar PDF
        # 2. Guardar en S3 o storage local
        # 3. Actualizar invoice.pdf_file_url
        # 4. Retornar URL pública descargable

        placeholder_url = f"{settings.API_V1_STR}/invoices/{invoice.id}/download"
        
        logger.debug(f"Placeholder PDF generated for invoice {invoice.id}: {placeholder_url}")
        
        return {
            "success": True,
            "pdf_url": placeholder_url,
            "pdf_path": None,
            "message": "PDF placeholder (implementación en progreso)",
        }

    except Exception as e:
        logger.error(f"Error generating PDF for invoice {invoice.id}: {str(e)}")
        return {
            "success": False,
            "pdf_url": None,
            "pdf_path": None,
            "error": str(e),
        }


def mark_invoice_as_paid(invoice: Invoice, db: Session) -> bool:
    """
    Marca una invoice como pagada (cuando se ha confirmado el cobro de Transbank).
    """
    try:
        invoice.status = "paid"
        invoice.updated_at = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"Invoice {invoice.invoice_number} marked as paid")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error marking invoice {invoice.id} as paid: {str(e)}")
        return False
