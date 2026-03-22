import os

backend_dir = "/home/gcuevas/ia_bot_v2/tutorpaes/backend"

for root, _, files in os.walk(backend_dir):
    if any(x in root for x in ["venv", "__pycache__", "migrations", ".alembic"]):
        continue
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            changed = False
            if "datetime.now(timezone.utc)()" in content:
                content = content.replace("datetime.now(timezone.utc)()", "datetime.now(timezone.utc)")
                changed = True
                
            if "timezone.utc" in content and "import timezone" not in content and ", timezone" not in content:
                content = "from datetime import timezone\n" + content
                changed = True

            if changed:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Fixed {path}")
