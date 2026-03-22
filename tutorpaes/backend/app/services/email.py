import os
import ssl
from email.message import EmailMessage
from aiosmtplib import send
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def send_reset_password_email(to_email: str, reset_url: str):
    """
    Envia el correo de recuperación de contraseña de forma asíncrona usando aiosmtplib.
    Construye internamente el mensaje con EmailMessage nativo de Python.
    """
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Modo de fallback/desarrollo si las credenciales SMTP no están provistas
        logger.warning(
            "Configuración SMTP incompleta. Enviando correo al log en lugar de red real."
        )
        logger.info(f"--- MOCK EMAIL ---")
        logger.info(f"Destino: {to_email}")
        logger.info(f"Asunto: Recuperación de tu contraseña de TutorPAES")
        logger.info(f"Link: {reset_url}")
        logger.info(f"------------------")
        return

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = "Recuperación de contraseña - TutorPAES"
    
    body = f"""Hola,

Has solicitado un restablecimiento de contraseña para tu cuenta en TutorPAES.
Por favor, visita el siguiente enlace para crear una nueva:

{reset_url}

Si no has sido tú, ignora este mensaje. El enlace expirará pronto.

Equipo TutorPAES
"""
    message.set_content(body)

    # El contexto SSL opcional
    context = ssl.create_default_context()

    try:
        await send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=False,
            timeout=10,
            start_tls=True,
            tls_context=context,
        )
        logger.info(f"Email de recuperación enviado exitosamente a {to_email}")
    except Exception as e:
        logger.error(f"Fallo al enviar correo a {to_email}: {e}")
        # En diseño fail-safe preferimos loguear el error y no romper el request del cliente 
        # en caso de timeout del proveedor externo.
