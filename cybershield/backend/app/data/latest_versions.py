"""
app/data/latest_versions.py
Known latest stable versions for common packages.
Used for offline version comparison (no live registry required).
Covers a Final Year Project scope — can be upgraded to live PyPI/npm API later.
"""

LATEST_VERSIONS = {
    # Python — backend
    "fastapi":          "0.115.6",
    "uvicorn":          "0.34.0",
    "flask":            "3.1.0",
    "django":           "5.1.4",
    "starlette":        "0.41.3",
    "gunicorn":         "23.0.0",
    "pydantic":         "2.10.3",
    "sqlalchemy":       "2.0.36",
    "alembic":          "1.14.0",
    "celery":           "5.4.0",
    "aiohttp":          "3.11.11",
    "httpx":            "0.28.1",

    # Python — auth/security
    "python-jose":      "3.3.0",
    "passlib":          "1.7.4",
    "bcrypt":           "4.2.1",
    "cryptography":     "44.0.0",
    "pyopenssl":        "24.3.0",
    "pyjwt":            "2.10.1",

    # Python — database clients
    "pymongo":          "4.10.1",
    "motor":            "3.6.0",
    "psycopg2":         "2.9.10",
    "psycopg2-binary":  "2.9.10",
    "asyncpg":          "0.30.0",
    "mysqlclient":      "2.2.6",
    "pymysql":          "1.1.1",
    "redis":            "5.2.1",
    "aioredis":         "2.0.1",
    "beanie":           "1.27.0",

    # Python — parsing/misc
    "requests":         "2.32.3",
    "pyyaml":           "6.0.2",
    "yaml":             "6.0.2",
    "jinja2":           "3.1.5",
    "markupsafe":       "3.0.2",
    "python-dotenv":    "1.0.1",
    "paramiko":         "3.5.0",
    "pillow":           "11.0.0",
    "numpy":            "2.2.0",

    # JavaScript / Node — frontend
    "react":            "19.0.0",
    "react-dom":        "19.0.0",
    "vue":              "3.5.13",
    "@angular/core":    "19.0.5",
    "next":             "15.1.3",
    "nuxt":             "3.14.1592",
    "svelte":           "5.16.0",
    "vite":             "6.0.6",

    # JavaScript / Node — backend
    "express":          "5.0.1",
    "fastify":          "5.2.1",
    "koa":              "2.15.3",
    "@nestjs/core":     "10.4.7",

    # JavaScript / Node — tooling
    "webpack":          "5.97.1",
    "esbuild":          "0.24.2",
    "typescript":       "5.7.2",
    "eslint":           "9.17.0",
    "jest":             "29.7.0",

    # JavaScript / Node — packages
    "axios":            "1.7.9",
    "lodash":           "4.17.21",
    "moment":           "2.30.1",
    "jsonwebtoken":     "9.0.2",
    "bcryptjs":         "2.4.3",
    "dotenv":           "16.4.7",
    "mongoose":         "8.9.2",
    "pg":               "8.13.1",
    "mysql2":           "3.12.0",
    "sqlite3":          "5.1.7",
    "redis":            "4.7.0",
    "ioredis":          "5.4.1",
    "node-fetch":       "3.3.2",
    "cors":             "2.8.5",
    "helmet":           "8.0.0",
    "marked":           "15.0.4",
    "ejs":              "3.1.10",

    # Java (artifact-id only, lowercase)
    "spring-boot":      "3.4.1",
    "junit":            "5.11.4",
    "commons-lang3":    "3.17.0",
    "jackson-databind": "2.18.2",

    # PHP (composer package names)
    "laravel/framework": "11.x",
    "guzzlehttp/guzzle": "7.9.2",
    "phpunit/phpunit":   "11.5.3",
}
