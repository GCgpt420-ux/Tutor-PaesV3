import os
import re

backend_dir = "/home/gcuevas/ia_bot_v2/tutorpaes/backend"

for root, _, files in os.walk(backend_dir):
    if any(x in root for x in ["venv", "__pycache__", "migrations", ".alembic"]):
        continue
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            if "datetime.utcnow" in content:
                new_content = content.replace("default=datetime.utcnow", "default=lambda: datetime.now(timezone.utc)")
                new_content = new_content.replace("onupdate=datetime.utcnow", "onupdate=lambda: datetime.now(timezone.utc)")
                new_content = new_content.replace("datetime.utcnow", "datetime.now(timezone.utc)")
                
                # Ensure timezone import exists
                if "timezone" not in new_content:
                    if "from datetime import " in new_content:
                        new_content = re.sub(r'(from datetime import [^\n]+)', r'\1, timezone', new_content, count=1)
                    else:
                        new_content = "from datetime import timezone\n" + new_content
                        
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {path}")
