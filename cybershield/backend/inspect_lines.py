with open("app/routes/github_routes.py", "r", encoding="utf-8") as f:
    lines = f.readlines()
for idx in range(250, 278):
    if idx < len(lines):
        print(f"{idx+1}: {repr(lines[idx])}")
