with open("app/routes/github_routes.py", "r", encoding="utf-8") as f:
    lines = f.readlines()
with open("normal_inspect.txt", "w", encoding="utf-8") as f_out:
    for idx in range(250, 275):
        if idx < len(lines):
            f_out.write(f"{idx+1}: {repr(lines[idx])}\n")
