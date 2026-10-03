#!/usr/bin/env python3
"""
Script de Auditoría de Usuarios Registrados para el Piloto PAES 2026
===================================================================
Inspecciona la base de datos PostgreSQL y audita los usuarios registrados:
- Administradores
- Profesores
- 20 Escolares Cohorte 1
- 9 Egresados DEMRE 2026
- 10 Escolares Piloto
- Estudiantes de Prueba

Reporta: ID, Email, Rol, Nombre, Status Activo, Intentos Completados y Preguntas Respondidas.
"""
import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

CURRENT_FILE = Path(__file__).resolve()
BACKEND_DIR = CURRENT_FILE.parent.parent
sys.path.insert(0, str(BACKEND_DIR))


def ensure_env_loaded() -> None:
    from dotenv import load_dotenv
    env_file = BACKEND_DIR / ".env"
    if env_file.exists():
        load_dotenv(env_file)


ensure_env_loaded()

from sqlalchemy import func, select
from app.db.models import Attempt, AttemptFeedback, User, UserProgress
from app.db.session import SessionLocal


def classify_user_cohort(email: Optional[str], role: str) -> str:
    """Clasifica al usuario según su cohorte del piloto o perfil operativo."""
    if not email:
        return "Sin Email"
    e = email.lower().strip()
    if role == "admin" or e in {"demo@example.com", "g.cuevas@gmail.com"}:
        return "Administrador"
    if role == "teacher" or "profesor" in e:
        return "Profesor"
    if e.startswith("alumno0"):
        return "Egresado DEMRE 2026"
    if e.startswith("escolar"):
        return "Escolar Piloto"
    if any(e == f"alumno{i}@tutorpaes.cl" for i in range(1, 21)):
        return "Escolar Cohorte 1"
    if e == "estudiante@example.com":
        return "Estudiante Demo"
    return "Estudiante General"


def audit_users(db_session=None) -> Dict[str, Any]:
    """
    Ejecuta la auditoría de usuarios contra la base de datos.
    Retorna un diccionario con resumen global y el detalle por usuario.
    """
    should_close = False
    if db_session is None:
        db_session = SessionLocal()
        should_close = True

    try:
        users = db_session.query(User).order_by(User.id).all()

        records: List[Dict[str, Any]] = []
        by_cohort: Dict[str, int] = {}
        total_completed_attempts = 0
        total_questions_answered = 0

        for u in users:
            cohort = classify_user_cohort(u.email, u.role)
            by_cohort[cohort] = by_cohort.get(cohort, 0) + 1

            completed_att = (
                db_session.query(func.count(Attempt.id))
                .filter(Attempt.user_id == u.id, Attempt.completed_at.isnot(None))
                .scalar()
                or 0
            )
            total_att = (
                db_session.query(func.count(Attempt.id))
                .filter(Attempt.user_id == u.id)
                .scalar()
                or 0
            )

            # Preguntas en intentos y acumuladas en progreso
            attempt_questions = (
                db_session.query(func.sum(Attempt.total_questions))
                .filter(Attempt.user_id == u.id)
                .scalar()
                or 0
            )
            progress_questions = (
                db_session.query(func.sum(UserProgress.total_answered))
                .filter(UserProgress.user_id == u.id)
                .scalar()
                or 0
            )
            feedback_count = (
                db_session.query(func.count(AttemptFeedback.id))
                .join(Attempt, Attempt.id == AttemptFeedback.attempt_id)
                .filter(Attempt.user_id == u.id)
                .scalar()
                or 0
            )

            # Tomamos la mayor métrica representativa de preguntas contestadas
            q_answered = max(attempt_questions, progress_questions, feedback_count)

            total_completed_attempts += completed_att
            total_questions_answered += q_answered

            records.append({
                "id": u.id,
                "email": u.email or "N/A",
                "name": u.name,
                "role": u.role,
                "is_active": u.is_active,
                "is_admin": u.is_admin,
                "cohort": cohort,
                "completed_attempts": completed_att,
                "total_attempts": total_att,
                "questions_answered": q_answered,
                "details": {
                    "attempt_questions": attempt_questions,
                    "progress_questions": progress_questions,
                    "feedback_count": feedback_count,
                },
            })

        summary = {
            "total_users": len(users),
            "active_users": sum(1 for r in records if r["is_active"]),
            "by_cohort": by_cohort,
            "total_completed_attempts": total_completed_attempts,
            "total_questions_answered": total_questions_answered,
        }

        return {
            "summary": summary,
            "users": records,
        }
    finally:
        if should_close:
            db_session.close()


def print_table_report(data: Dict[str, Any]) -> None:
    """Imprime un reporte formateado en consola."""
    summary = data["summary"]
    users = data["users"]

    print("\n" + "=" * 115)
    print("📊 REPORTE OFICIAL DE AUDITORÍA DE USUARIOS — PILOTO PAES 2026")
    print("=" * 115)
    print(f"👥 Total Usuarios Registrados: {summary['total_users']}")
    print(f"✅ Usuarios Activos:           {summary['active_users']}")
    print(f"📝 Ensayos Completados Totales:{summary['total_completed_attempts']}")
    print(f"❓ Preguntas Respondidas Tot.:  {summary['total_questions_answered']}")
    print("-" * 115)
    print("📌 Desglose por Cohorte:")
    for cohort, count in sorted(summary["by_cohort"].items()):
        print(f"   • {cohort:<30}: {count} usuarios")
    print("=" * 115)

    headers = f"{'ID':<4} | {'Email':<32} | {'Rol':<9} | {'Nombre':<22} | {'Activo':<6} | {'Cohorte':<20} | {'Ensayos':<7} | {'Preguntas':<9}"
    print(headers)
    print("-" * 115)

    for u in users:
        active_str = "Sí" if u["is_active"] else "No"
        print(
            f"{u['id']:<4} | {u['email']:<32} | {u['role']:<9} | {u['name'][:22]:<22} | {active_str:<6} | {u['cohort'][:20]:<20} | {u['completed_attempts']:<7} | {u['questions_answered']:<9}"
        )
    print("=" * 115 + "\n")


def print_markdown_report(data: Dict[str, Any]) -> None:
    """Imprime el reporte en formato Markdown."""
    summary = data["summary"]
    users = data["users"]

    print("# 📊 Reporte de Auditoría de Usuarios — Piloto PAES 2026\n")
    print(f"- **Total de usuarios:** {summary['total_users']}")
    print(f"- **Usuarios activos:** {summary['active_users']}")
    print(f"- **Total ensayos completados:** {summary['total_completed_attempts']}")
    print(f"- **Total preguntas respondidas:** {summary['total_questions_answered']}\n")

    print("### Desglose por Cohorte\n")
    print("| Cohorte | Cantidad |")
    print("| :--- | :--- |")
    for cohort, count in sorted(summary["by_cohort"].items()):
        print(f"| {cohort} | {count} |")

    print("\n### Listado de Usuarios Registrados\n")
    print("| ID | Email | Rol | Nombre | Activo | Cohorte | Ensayos Completados | Preguntas Respondidas |")
    print("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for u in users:
        active_str = "✅" if u["is_active"] else "❌"
        print(
            f"| {u['id']} | `{u['email']}` | `{u['role']}` | {u['name']} | {active_str} | {u['cohort']} | {u['completed_attempts']} | {u['questions_answered']} |"
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Auditar usuarios del piloto PAES 2026")
    parser.add_argument("--json", action="store_true", help="Salida en formato JSON")
    parser.add_argument("--markdown", action="store_true", help="Salida en formato Markdown")
    args = parser.parse_args()

    data = audit_users()

    if args.json:
        print(json.dumps(data, indent=2, ensure_ascii=False))
    elif args.markdown:
        print_markdown_report(data)
    else:
        print_table_report(data)


if __name__ == "__main__":
    main()
