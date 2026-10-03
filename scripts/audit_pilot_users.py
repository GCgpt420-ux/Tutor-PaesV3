#!/usr/bin/env python3
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "tutorpaes" / "backend"
sys.path.insert(0, str(backend_dir))

from scripts.audit_pilot_users import main

if __name__ == "__main__":
    main()
