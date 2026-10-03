#!/usr/bin/env python3
"""
Wrapper script to execute seed_pilot_users from the repository root.
"""
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "tutorpaes" / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Load .env
from dotenv import load_dotenv
env_path = BACKEND_DIR / ".env"
if env_path.exists():
    load_dotenv(env_path)

from scripts.seed_pilot_users import seed_pilot_users

if __name__ == "__main__":
    seed_pilot_users()
