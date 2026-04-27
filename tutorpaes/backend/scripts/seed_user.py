from sqlalchemy import select

from app.core.auth import get_password_hash
from app.core.config import settings
from app.db.base import Base
from app.db.models import User
from app.db.session import SessionLocal, engine


def sync_demo_user(db, demo_email: str, demo_password: str):
    """Crea o sincroniza el usuario demo con los credenciales actuales de configuración."""
    user = db.scalar(select(User).where(User.email == demo_email))

    if not user:
        user = User(
            name="Demo User",
            email=demo_email,
            phone="123456789",
            hashed_password=get_password_hash(demo_password),
            is_active=True,
            is_admin=True,
        )
        db.add(user)
        db.commit()
        return user, True

    user.is_admin = True
    user.is_active = True
    user.hashed_password = get_password_hash(demo_password)
    db.add(user)
    db.commit()
    return user, False


def main():
    db = SessionLocal()
    try:
        # Crear tablas si no existen (solo al ejecutar script, no al importar)
        Base.metadata.create_all(bind=engine)

        demo_email = settings.DEMO_EMAIL
        demo_password = settings.DEMO_PASSWORD
        user, created = sync_demo_user(db, demo_email=demo_email, demo_password=demo_password)

        if created:
            print(
                f" Usuario demo creado (id={user.id}, email={demo_email}, "
                f"password={demo_password}, is_admin={user.is_admin})"
            )
        else:
            print(
                f" Usuario demo sincronizado (id={user.id}, email={demo_email}, "
                f"password={demo_password}, is_admin={user.is_admin})"
            )
    except Exception as e:
        print(f" Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
