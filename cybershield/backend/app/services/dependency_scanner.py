"""
Module 1.3 — Dependency Scanner Service
Scans dependency files from a GitHub repository, parses package lists,
checks for missing versions, risky packages and outdated versions,
and returns a structured dependency report.
"""

import json
import re
import requests as http_requests

from app.data.risky_packages import RISKY_PACKAGES
from app.data.latest_versions import LATEST_VERSIONS

# ── Supported dependency file names (case-insensitive) ────────────────────────
DEPENDENCY_FILES = {
    "requirements.txt",
    "package.json",
    "package-lock.json",
    "poetry.lock",
    "pipfile",
    "pom.xml",
    "build.gradle",
    "composer.json",
    "gemfile",
}


def _fetch_raw(repo_full_name: str, branch: str, path: str) -> str | None:
    url = f"https://raw.githubusercontent.com/{repo_full_name}/{branch}/{path}"
    try:
        resp = http_requests.get(url, timeout=8)
        if resp.status_code == 200:
            return resp.text
    except Exception:
        pass
    return None


# ── Parsers ───────────────────────────────────────────────────────────────────

def _parse_requirements_txt(content: str) -> list[dict]:
    """Parse requirements.txt and return list of {package, version}."""
    packages = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        # Strip environment markers  e.g.  requests>=2; python_version>="3"
        line = line.split(";")[0].strip()
        # Strip extras  e.g.  pydantic[email]
        line = line.split("[")[0].strip()

        version = "Unknown"
        name = line
        # Detect version specifiers
        ver_match = re.search(r"[><=!~]+\s*([\d.]+)", line)
        if ver_match:
            version = ver_match.group(1)
            name = re.split(r"[><=!~]", line)[0].strip()

        packages.append({"package": name.lower(), "version": version})
    return packages


def _parse_package_json(content: str) -> list[dict]:
    """Parse package.json and return list of {package, version}."""
    packages = []
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return packages
    for section in ("dependencies", "devDependencies", "peerDependencies"):
        for name, ver in data.get(section, {}).items():
            # Strip semver range prefixes e.g. ^18.2.0  →  18.2.0
            clean_ver = re.sub(r"^[\^~>=<]+", "", str(ver)).strip() or "Unknown"
            packages.append({"package": name.lower(), "version": clean_ver})
    return packages


def _parse_poetry_lock(content: str) -> list[dict]:
    """Parse poetry.lock  [[package]] blocks."""
    packages = []
    current: dict | None = None
    for line in content.splitlines():
        if line.strip() == "[[package]]":
            if current:
                packages.append(current)
            current = {"package": "Unknown", "version": "Unknown"}
        elif current is not None:
            name_m = re.match(r'^name\s*=\s*"(.+)"', line)
            ver_m  = re.match(r'^version\s*=\s*"(.+)"', line)
            if name_m:
                current["package"] = name_m.group(1).lower()
            if ver_m:
                current["version"] = ver_m.group(1)
    if current:
        packages.append(current)
    return packages


def _parse_gemfile(content: str) -> list[dict]:
    """Parse Gemfile gem lines."""
    packages = []
    for line in content.splitlines():
        line = line.strip()
        m = re.match(r"""gem\s+['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?""", line)
        if m:
            name = m.group(1).lower()
            ver  = m.group(2) or "Unknown"
            packages.append({"package": name, "version": ver})
    return packages


def _parse_pom_xml(content: str) -> list[dict]:
    """Extract artifactId + version from pom.xml dependency blocks."""
    packages = []
    dep_blocks = re.findall(
        r"<dependency>(.*?)</dependency>", content, re.DOTALL | re.IGNORECASE
    )
    for block in dep_blocks:
        artifact_m = re.search(r"<artifactId>(.*?)</artifactId>", block, re.IGNORECASE)
        version_m  = re.search(r"<version>(.*?)</version>",    block, re.IGNORECASE)
        if artifact_m:
            name = artifact_m.group(1).strip().lower()
            ver  = version_m.group(1).strip() if version_m else "Unknown"
            packages.append({"package": name, "version": ver})
    return packages


def _parse_build_gradle(content: str) -> list[dict]:
    """Extract dependencies from build.gradle."""
    packages = []
    # Matches:  implementation 'group:artifact:version'  or  "group:artifact:version"
    for m in re.finditer(
        r"""(?:implementation|compile|testImplementation|api)\s+['"]([^'"]+)['"]""",
        content
    ):
        parts = m.group(1).split(":")
        if len(parts) >= 2:
            name = parts[1].lower()
            ver  = parts[2] if len(parts) >= 3 else "Unknown"
            packages.append({"package": name, "version": ver})
    return packages


def _parse_composer_json(content: str) -> list[dict]:
    """Parse composer.json require section."""
    packages = []
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return packages
    for section in ("require", "require-dev"):
        for name, ver in data.get(section, {}).items():
            if name == "php":
                continue
            clean_ver = re.sub(r"^[\^~>=<v]+", "", str(ver)).strip() or "Unknown"
            packages.append({"package": name.lower(), "version": clean_ver})
    return packages


# ── Dispatcher ────────────────────────────────────────────────────────────────

def _parse_file(filename: str, content: str) -> list[dict]:
    fn = filename.split("/")[-1].lower()
    if fn == "requirements.txt":
        return _parse_requirements_txt(content)
    if fn == "package.json":
        return _parse_package_json(content)
    if fn == "poetry.lock":
        return _parse_poetry_lock(content)
    if fn == "gemfile":
        return _parse_gemfile(content)
    if fn == "pom.xml":
        return _parse_pom_xml(content)
    if fn == "build.gradle":
        return _parse_build_gradle(content)
    if fn == "composer.json":
        return _parse_composer_json(content)
    return []


# ── Package analysis ──────────────────────────────────────────────────────────

def _compare_versions(repo_ver: str, latest_ver: str) -> bool:
    """Return True if repo_ver is older than latest_ver (simple tuple compare)."""
    if repo_ver in ("Unknown", "") or latest_ver in ("Unknown", ""):
        return False
    try:
        r = tuple(int(x) for x in re.sub(r"[^\d.]", "", repo_ver).split(".") if x)
        l = tuple(int(x) for x in re.sub(r"[^\d.]", "", latest_ver).split(".") if x)
        return r < l
    except Exception:
        return False


def _analyze_package(pkg: dict) -> dict:
    """
    Enrich a {package, version} dict with status, severity, reason,
    and recommendation fields.
    """
    name    = pkg["package"]
    version = pkg["version"]

    # Defaults
    status         = "Safe"
    severity       = "Safe"
    reason         = ""
    recommendation = ""

    # 1. Check missing version pin
    unpinned = (version == "Unknown")
    if unpinned:
        status         = "Unpinned"
        severity       = "Low"
        reason         = "No version pinned — unpredictable upgrades"
        recommendation = "Pin an explicit version to ensure reproducible builds"

    # 2. Check risky packages (overrides unpinned if worse)
    if name in RISKY_PACKAGES:
        risk_info = RISKY_PACKAGES[name]
        risk_sev  = risk_info["severity"]  # Critical > High > Medium > Low
        sev_order = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1, "Safe": 0}
        if sev_order.get(risk_sev, 0) > sev_order.get(severity, 0):
            status         = f"{risk_sev} Risk"
            severity       = risk_sev
            reason         = risk_info["reason"]
            recommendation = _risky_recommendation(name, risk_sev)

    # 3. Check outdated (only if not already flagged as risky/unpinned with higher sev)
    if name in LATEST_VERSIONS and version != "Unknown":
        latest = LATEST_VERSIONS[name]
        if _compare_versions(version, latest):
            if severity in ("Safe", "Low"):
                if status not in ("Unpinned",):
                    status         = "Outdated"
                    severity       = "Low"
                    reason         = f"Version {version} is older than latest {latest}"
                    recommendation = f"Upgrade to {latest}"
                else:
                    # Already unpinned — just add outdated note
                    recommendation += f"; latest available is {latest}"

    return {
        "package":        name,
        "version":        version,
        "status":         status,
        "severity":       severity,
        "reason":         reason,
        "recommendation": recommendation,
    }


def _risky_recommendation(name: str, severity: str) -> str:
    msgs = {
        "Critical": f"Replace or update {name} immediately — critical known vulnerability",
        "High":     f"Avoid using {name} with untrusted input; review usage carefully",
        "Medium":   f"Follow secure usage patterns for {name}; keep updated",
        "Low":      f"Keep {name} updated and follow security best practices",
    }
    return msgs.get(severity, f"Review usage of {name}")


# ── Main entry point ──────────────────────────────────────────────────────────

def scan_dependencies(
    all_file_paths: list[str],
    repo_full_name: str,
    branch: str,
) -> dict:
    """
    Scan all dependency files in the repository.

    Returns:
        {
            "dependency_report": {
                "total_packages": int,
                "outdated": int,
                "risky": int,
                "unpinned": int,
                "files_scanned": [str, ...],
            },
            "dependency_findings": [
                {"package", "version", "status", "severity", "reason", "recommendation"}
            ]
        }
    """
    # Find dependency files in the tree
    dep_file_paths = [
        p for p in all_file_paths
        if p.split("/")[-1].lower() in DEPENDENCY_FILES
        # Exclude lock files inside node_modules or vendor dirs
        and "node_modules" not in p
        and "/vendor/" not in p
    ]

    all_packages: list[dict] = []
    files_scanned: list[str] = []

    # Limit to 5 dependency files to keep things fast
    for path in dep_file_paths[:5]:
        content = _fetch_raw(repo_full_name, branch, path)
        if content is None:
            continue
        parsed = _parse_file(path, content)
        if parsed:
            all_packages.extend(parsed)
            files_scanned.append(path)

    # Deduplicate by package name (keep last occurrence)
    seen: dict[str, dict] = {}
    for pkg in all_packages:
        seen[pkg["package"]] = pkg
    unique_packages = list(seen.values())

    # Analyse every package
    analyzed = [_analyze_package(p) for p in unique_packages]

    # Build summary counters
    outdated = sum(1 for p in analyzed if p["status"] == "Outdated")
    risky    = sum(1 for p in analyzed if "Risk" in p["status"])
    unpinned = sum(1 for p in analyzed if p["status"] == "Unpinned")

    # Sort: Critical → High → Medium → Low → Safe
    sev_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3, "Safe": 4}
    analyzed.sort(key=lambda p: sev_order.get(p["severity"], 5))

    return {
        "dependency_report": {
            "total_packages": len(analyzed),
            "outdated":       outdated,
            "risky":          risky,
            "unpinned":       unpinned,
            "files_scanned":  files_scanned,
        },
        "dependency_findings": analyzed,
    }
