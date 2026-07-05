"""
Module 1.2 — Technology Detection Service
Detects programming languages, frameworks, databases and devops tools
by inspecting key files fetched from the repository via raw GitHub URLs.
"""

import json
import requests

# ── file name → language mapping ─────────────────────────────────────────────
LANGUAGE_FILES = {
    "requirements.txt":        "Python",
    "setup.py":                "Python",
    "pyproject.toml":          "Python",
    "Pipfile":                 "Python",
    "package.json":            "JavaScript",
    "tsconfig.json":           "TypeScript",
    "pom.xml":                 "Java",
    "build.gradle":            "Java",
    "*.cs":                    "C#",      # pattern-matched separately
    "go.mod":                  "Go",
    "go.sum":                  "Go",
    "composer.json":           "PHP",
    "Gemfile":                 "Ruby",
}

# ── requirements.txt package → technology ─────────────────────────────────────
PYTHON_BACKEND = {
    "fastapi":     ("backend", "FastAPI"),
    "uvicorn":     ("backend", "FastAPI"),     # FastAPI is always run via uvicorn
    "flask":       ("backend", "Flask"),
    "django":      ("backend", "Django"),
    "gunicorn":    ("backend", "Django"),      # gunicorn is commonly paired with Django
    "starlette":   ("backend", "FastAPI"),
}

PYTHON_DB = {
    "pymongo":      ("database", "MongoDB"),
    "motor":        ("database", "MongoDB"),
    "sqlalchemy":   ("database", "SQLite"),    # generic; refined below
    "psycopg2":     ("database", "PostgreSQL"),
    "psycopg2-binary": ("database", "PostgreSQL"),
    "asyncpg":      ("database", "PostgreSQL"),
    "mysqlclient":  ("database", "MySQL"),
    "mysql-connector-python": ("database", "MySQL"),
    "pymysql":      ("database", "MySQL"),
    "redis":        ("database", "Redis"),
    "aioredis":     ("database", "Redis"),
    "databases":    ("database", "SQLite"),
    "tortoise-orm": ("database", "SQLite"),
    "beanie":       ("database", "MongoDB"),
    "mariadb":      ("database", "MariaDB"),
}

# ── package.json dependency → technology ─────────────────────────────────────
JS_FRONTEND = {
    "react":         ("frontend", "React"),
    "react-dom":     ("frontend", "React"),
    "vue":           ("frontend", "Vue"),
    "@vue/core":     ("frontend", "Vue"),
    "nuxt":          ("frontend", "Vue"),
    "@angular/core": ("frontend", "Angular"),
    "next":          ("frontend", "Next.js"),
    "svelte":        ("frontend", "Svelte"),
    "@sveltejs/kit": ("frontend", "Svelte"),
    "vite":          ("frontend", "React"),    # vite + react is the default
}

JS_BACKEND = {
    "express":   ("backend", "Express.js"),
    "fastify":   ("backend", "Express.js"),
    "koa":       ("backend", "Express.js"),
    "nest":      ("backend", "Express.js"),
    "@nestjs/core": ("backend", "Express.js"),
}

JS_DB = {
    "mongodb":    ("database", "MongoDB"),
    "mongoose":   ("database", "MongoDB"),
    "pg":         ("database", "PostgreSQL"),
    "postgres":   ("database", "PostgreSQL"),
    "mysql":      ("database", "MySQL"),
    "mysql2":     ("database", "MySQL"),
    "sqlite3":    ("database", "SQLite"),
    "better-sqlite3": ("database", "SQLite"),
    "redis":      ("database", "Redis"),
    "ioredis":    ("database", "Redis"),
    "mariadb":    ("database", "MariaDB"),
}


def _fetch_raw(repo_full_name: str, branch: str, path: str) -> str | None:
    """Fetch file content from raw.githubusercontent.com."""
    url = f"https://raw.githubusercontent.com/{repo_full_name}/{branch}/{path}"
    try:
        resp = requests.get(url, timeout=8)
        if resp.status_code == 200:
            return resp.text
    except Exception:
        pass
    return None


def _parse_requirements(content: str) -> list[str]:
    """Return list of package names from requirements.txt."""
    packages = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # strip version specifiers, extras, markers
        pkg = line.split(";")[0].split("[")[0]
        for op in (">=", "<=", "==", "!=", "~=", ">", "<"):
            pkg = pkg.split(op)[0]
        packages.append(pkg.strip().lower())
    return packages


def _parse_package_json(content: str) -> list[str]:
    """Return all dependency keys from package.json."""
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return []
    deps: dict = {}
    deps.update(data.get("dependencies", {}))
    deps.update(data.get("devDependencies", {}))
    return [k.lower() for k in deps.keys()]


def detect_technologies(all_file_paths: list[str], repo_full_name: str, branch: str) -> dict:
    """
    Given a flat list of file paths from the repository tree,
    return a structured dict of detected technologies.

    Args:
        all_file_paths: list of file paths (as strings) from the git tree
        repo_full_name: e.g. "OWASP/WebGoat"
        branch: default branch name
    Returns:
        {
            "language":  [...],
            "backend":   [...],
            "frontend":  [...],
            "database":  [...],
            "devops":    [...],
        }
    """
    paths_lower = {p.lower() for p in all_file_paths}
    result: dict[str, set] = {
        "language": set(),
        "backend":  set(),
        "frontend": set(),
        "database": set(),
        "devops":   set(),
    }

    # ── Language detection via file presence ─────────────────────────────────
    if any("requirements.txt" in p for p in paths_lower):
        result["language"].add("Python")
    if any("setup.py" in p or "pyproject.toml" in p or "pipfile" in p.lower() for p in paths_lower):
        result["language"].add("Python")
    if any("package.json" in p and "node_modules" not in p for p in paths_lower):
        result["language"].add("JavaScript")
    if any("tsconfig.json" in p for p in paths_lower):
        result["language"].add("TypeScript")
        result["language"].add("JavaScript")
    if any("pom.xml" in p or "build.gradle" in p for p in paths_lower):
        result["language"].add("Java")
    if any("go.mod" in p or "go.sum" in p for p in paths_lower):
        result["language"].add("Go")
    if any("composer.json" in p for p in paths_lower):
        result["language"].add("PHP")
    if any("gemfile" in p for p in paths_lower):
        result["language"].add("Ruby")
    if any(p.endswith(".cs") for p in paths_lower):
        result["language"].add("C#")

    # ── DevOps detection via file presence ────────────────────────────────────
    if any("dockerfile" in p for p in paths_lower):
        result["devops"].add("Docker")
    if any("docker-compose" in p for p in paths_lower):
        result["devops"].add("Docker Compose")
    if any(".github/workflows" in p for p in paths_lower):
        result["devops"].add("GitHub Actions")
    if any(
        "kubernetes/" in p or p.endswith("deployment.yaml") or p.endswith("deployment.yml")
        for p in paths_lower
    ):
        result["devops"].add("Kubernetes")
    if any("jenkinsfile" in p or "jenkins" in p for p in paths_lower):
        result["devops"].add("Jenkins")
    if any("nginx.conf" in p or "/nginx/" in p for p in paths_lower):
        result["devops"].add("Nginx")
    if any("apache" in p and ".conf" in p for p in paths_lower):
        result["devops"].add("Apache")

    # ── Java / Spring detection via pom.xml ───────────────────────────────────
    pom_path = next((p for p in all_file_paths if p.lower() == "pom.xml"), None)
    if pom_path:
        pom_content = _fetch_raw(repo_full_name, branch, pom_path) or ""
        if "spring-boot" in pom_content.lower():
            result["backend"].add("Spring Boot")
        if "laravel" in pom_content.lower():
            result["backend"].add("Laravel")

    # ── Python analysis via requirements.txt ─────────────────────────────────
    req_path = next(
        (p for p in all_file_paths if p.lower() in ("requirements.txt", "requirements/base.txt")),
        None
    )
    if req_path:
        req_content = _fetch_raw(repo_full_name, branch, req_path) or ""
        packages = _parse_requirements(req_content)
        for pkg in packages:
            if pkg in PYTHON_BACKEND:
                cat, name = PYTHON_BACKEND[pkg]
                result[cat].add(name)
            if pkg in PYTHON_DB:
                cat, name = PYTHON_DB[pkg]
                result[cat].add(name)

    # ── JavaScript analysis via package.json ─────────────────────────────────
    pkg_path = next(
        (p for p in all_file_paths if p.lower() == "package.json" and "node_modules" not in p.lower()),
        None
    )
    if pkg_path:
        pkg_content = _fetch_raw(repo_full_name, branch, pkg_path) or ""
        deps = _parse_package_json(pkg_content)
        for dep in deps:
            if dep in JS_FRONTEND:
                cat, name = JS_FRONTEND[dep]
                result[cat].add(name)
            if dep in JS_BACKEND:
                cat, name = JS_BACKEND[dep]
                result[cat].add(name)
            if dep in JS_DB:
                cat, name = JS_DB[dep]
                result[cat].add(name)

    # ── PHP / Laravel via composer.json ──────────────────────────────────────
    composer_path = next((p for p in all_file_paths if p.lower() == "composer.json"), None)
    if composer_path:
        composer_content = _fetch_raw(repo_full_name, branch, composer_path) or ""
        try:
            composer_data = json.loads(composer_content)
            require = composer_data.get("require", {})
            if "laravel/framework" in require:
                result["backend"].add("Laravel")
                result["language"].add("PHP")
        except Exception:
            pass

    # ── .env / application.properties DB detection ────────────────────────────
    config_files = [p for p in all_file_paths if p.lower() in (
        ".env", ".env.example", "application.properties", "application.yml", "application.yaml"
    )]
    for cfg_path in config_files:
        cfg_content = _fetch_raw(repo_full_name, branch, cfg_path) or ""
        cfg_lower = cfg_content.lower()
        if "mongodb" in cfg_lower or "mongo_uri" in cfg_lower:
            result["database"].add("MongoDB")
        if "postgresql" in cfg_lower or "postgres" in cfg_lower:
            result["database"].add("PostgreSQL")
        if "mysql" in cfg_lower:
            result["database"].add("MySQL")
        if "sqlite" in cfg_lower:
            result["database"].add("SQLite")
        if "redis" in cfg_lower:
            result["database"].add("Redis")
        if "mariadb" in cfg_lower:
            result["database"].add("MariaDB")

    # ── ASP.NET detection via .csproj files ───────────────────────────────────
    if any(p.endswith(".csproj") for p in paths_lower):
        result["language"].add("C#")
        result["backend"].add("ASP.NET")

    # ── Convert sets to sorted lists ─────────────────────────────────────────
    return {k: sorted(v) for k, v in result.items()}
