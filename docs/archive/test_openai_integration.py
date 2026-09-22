#!/usr/bin/env python3
"""
Test Script - Verificar integración de OpenAI con TutorPAES
===========================================================

Uso:
    python3 test_openai_integration.py
"""

import sys
import os
from pathlib import Path

# Agregar backend al path
backend_path = Path(__file__).parent / "tutorpaes" / "backend"
sys.path.insert(0, str(backend_path))

def test_config():
    """Test 1: Verificar configuración"""
    print("\n" + "="*60)
    print(" TEST 1: Verificar Configuración")
    print("="*60)
    
    try:
        from app.core.config import settings
        
        print(f" APP_NAME: {settings.APP_NAME}")
        print(f" DATABASE_URL: {settings.DATABASE_URL[:40]}...")
        print(f" OPENAI_API_KEY configurada: {bool(settings.OPENAI_API_KEY)}")
        print(f" OPENAI_MODEL: {settings.OPENAI_MODEL}")
        print(f" AI_ENABLE_LLM: {settings.AI_ENABLE_LLM}")
        
        if not settings.OPENAI_API_KEY:
            print("\n  OPENAI_API_KEY no está configurada")
            print("   Agrega en backend/.env:")
            print("   OPENAI_API_KEY=sk-proj-xxxxxxxxx")
            return False
        
        return True
    
    except Exception as e:
        print(f" Error: {e}")
        return False


def test_openai_client():
    """Test 2: Conectar con OpenAI"""
    print("\n" + "="*60)
    print(" TEST 2: Conexión OpenAI")
    print("="*60)
    
    try:
        from app.services.openai_service import check_openai_connection
        
        result = check_openai_connection()
        
        if result.get("status") == "ok":
            print(f" Conexión exitosa")
            print(f"   Modelo: {result.get('model', 'N/A')}")
            print(f"   Mensaje: {result.get('message')}")
            return True
        else:
            print(f" {result.get('message', 'Error desconocido')}")
            if "not_configured" in result.get("status", ""):
                print("\n   Solución: Configura OPENAI_API_KEY en .env")
            return False
    
    except ImportError:
        print(" openai library no instalada")
        print("   Instala con: pip install openai")
        return False
    except Exception as e:
        print(f" Error: {e}")
        return False


def test_database():
    """Test 3: Conectar con base de datos"""
    print("\n" + "="*60)
    print("  TEST 3: Base de Datos")
    print("="*60)
    
    try:
        from app.db.session import SessionLocal
        from app.db.models import User
        
        db = SessionLocal()
        user = db.query(User).filter(User.email == 'demo@example.com').first()
        db.close()
        
        if user:
            print(f" Base de datos conectada")
            print(f"   Usuario demo encontrado: {user.name}")
            return True
        else:
            print("  Usuario demo no encontrado en BD")
            print("   Puedes ejecutar: python3 scripts/seed_user.py")
            return False
    
    except Exception as e:
        print(f" Error: {e}")
        print("   Verifica que PostgreSQL está corriendo")
        return False


def test_profiling():
    """Test 4: Sistema de Profiling"""
    print("\n" + "="*60)
    print(" TEST 4: Profiling de Usuario")
    print("="*60)
    
    try:
        from app.db.session import SessionLocal
        from app.db.models import User
        from app.services.ai_service import (
            _get_user_overall_level,
            _get_user_weak_topics
        )
        
        db = SessionLocal()
        user = db.query(User).filter(User.email == 'demo@example.com').first()
        
        if not user:
            print("  Usuario demo no encontrado")
            db.close()
            return False
        
        level, accuracy = _get_user_overall_level(user, db)
        weak_topics = _get_user_weak_topics(user, db)
        
        print(f" Profiling funciona")
        print(f"   Usuario: {user.name}")
        print(f"   Nivel: {level}")
        print(f"   Accuracy: {accuracy:.1%}")
        print(f"   Temas débiles: {weak_topics or 'Ninguno'}")
        
        db.close()
        return True
    
    except Exception as e:
        print(f" Error: {e}")
        return False


def test_feedback_generation():
    """Test 5: Generación de Feedback"""
    print("\n" + "="*60)
    print(" TEST 5: Generación de Feedback")
    print("="*60)
    
    try:
        from app.db.session import SessionLocal
        from app.db.models import User, Attempt, AttemptFeedback
        from app.services.ai_service import generate_feedback
        
        db = SessionLocal()
        user = db.query(User).filter(User.email == 'demo@example.com').first()
        
        if not user:
            print("  Usuario demo no encontrado")
            db.close()
            return False
        
        # Obtener un feedback
        attempt = db.query(Attempt).filter(Attempt.user_id == user.id).first()
        
        if not attempt:
            print("  Sin intentos registrados para usuario demo")
            db.close()
            return False
        
        feedback = db.query(AttemptFeedback).filter(
            AttemptFeedback.attempt_id == attempt.id
        ).first()
        
        if not feedback:
            print("  Sin feedback registrado")
            db.close()
            return False
        
        # Generar feedback
        result = generate_feedback(feedback, db, user=user)
        
        print(f" Feedback generado")
        print(f"   Source: {result.get('source', 'unknown')}")
        print(f"   Explicación (primeros 100 chars):")
        print(f"   '{result.get('explanation', '')[:100]}...'")
        
        db.close()
        return True
    
    except Exception as e:
        print(f" Error: {e}")
        return False


def main():
    """Ejecutar todos los tests"""
    print("\n")
    print("╔" + "═"*58 + "╗")
    print("║" + " "*15 + "OPENAI INTEGRATION TEST SUITE" + " "*15 + "║")
    print("╚" + "═"*58 + "╝")
    
    tests = [
        ("Configuración", test_config),
        ("OpenAI Connection", test_openai_client),
        ("Base de Datos", test_database),
        ("Profiling", test_profiling),
        ("Feedback", test_feedback_generation),
    ]
    
    results = {}
    for name, test_func in tests:
        try:
            results[name] = test_func()
        except KeyboardInterrupt:
            print("\n\n Prueba interrumpida por usuario")
            sys.exit(1)
        except Exception as e:
            print(f"\n Error inesperado en {name}: {e}")
            results[name] = False
    
    # Resumen
    print("\n" + "="*60)
    print(" RESUMEN")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = " PASS" if result else " FAIL"
        print(f"{status}: {name}")
    
    print(f"\nResultado: {passed}/{total} tests completados")
    
    if passed == total:
        print("\n ¡Todo funciona! OpenAI está integrado correctamente")
        print("\nPróximos pasos:")
        print("  1. Instancia backend: uvicorn app.main:app --reload")
        print("  2. Instancia frontend: npm run dev")
        print("  3. Prueba en navegador: http://localhost:3000")
        return 0
    else:
        print("\n  Algunos tests fallaron. Revisa los errores arriba.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
