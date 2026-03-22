import os

backend_dir = "/home/gcuevas/ia_bot_v2/tutorpaes/backend"

for root, _, files in os.walk(backend_dir):
    if any(x in root for x in ["venv", "__pycache__", "migrations", ".alembic"]):
        continue
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            has_future = any("from __future__" in line for line in lines)
            if has_future and lines and lines[0] == "from datetime import timezone\n":
                lines.pop(0)
                # find the index after the last future import
                idx = 0
                for i, line in enumerate(lines):
                    if "from __future__" in line:
                        idx = i + 1
                lines.insert(idx, "from datetime import timezone\n")
                
                with open(path, "w", encoding="utf-8") as f:
                    f.writelines(lines)
                print(f"Fixed future import in {path}")
