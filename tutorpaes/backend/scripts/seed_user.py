from sqlalchemy import select

from app.core.auth import get_password_hash
from app.core.config import settings
from app.db.base import Base
from app.db.models import User
from app.db.session import SessionLocal, engine


def sync_user(db, email: str, password: str, name: str, role: str, is_admin: bool):
    """Crea o sincroniza una cuenta semilla idempotente por rol."""
    user = db.scalar(select(User).where(User.email == email))

    if not user:
        user = User(
            name=name,
            email=email,
            phone="123456789",
            hashed_password=get_password_hash(password),
            is_active=True,
            is_admin=is_admin,
            role=role,
        )
        db.add(user)
        db.commit()
        return user, True

    user.name = name
    user.is_admin = is_admin
    user.role = role
    user.is_active = True
    user.hashed_password = get_password_hash(password)
    db.add(user)
    db.commit()
    return user, False


def sync_demo_user(db, demo_email: str, demo_password: str):
    """Crea o sincroniza el usuario administrativo demo existente."""
    return sync_user(
        db,
        email=demo_email,
        password=demo_password,
        name="Demo Admin",
        role="admin",
        is_admin=True,
    )


def sync_student_user(db, student_email: str, student_password: str):
    """Crea o sincroniza la cuenta estudiantil usada en la demo principal."""
    return sync_user(
        db,
        email=student_email,
        password=student_password,
        name="Estudiante Demo",
        role="student",
        is_admin=False,
    )


def main():
    db = SessionLocal()
    try:
        # Crear tablas si no existen (solo al ejecutar script, no al importar)
        Base.metadata.create_all(bind=engine)

        demo_email = settings.DEMO_EMAIL
        demo_password = settings.DEMO_PASSWORD
        admin_user, admin_created = sync_demo_user(
            db,
            demo_email=demo_email,
            demo_password=demo_password,
        )
        student_email = settings.DEMO_STUDENT_EMAIL
        student_password = settings.DEMO_STUDENT_PASSWORD
        student_user, student_created = sync_student_user(
            db,
            student_email=student_email,
            student_password=student_password,
        )

        if admin_created:
            print(
                f" Usuario admin demo creado (id={admin_user.id}, email={demo_email}, "
                f"password={demo_password}, role={admin_user.role})"
            )
        else:
            print(
                f" Usuario admin demo sincronizado (id={admin_user.id}, email={demo_email}, "
                f"password={demo_password}, role={admin_user.role})"
            )
        print(
            f" Usuario estudiante {'creado' if student_created else 'sincronizado'} "
            f"(id={student_user.id}, email={student_email}, password={student_password}, "
            f"role={student_user.role})"
        )
    except Exception as e:
        print(f" Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
