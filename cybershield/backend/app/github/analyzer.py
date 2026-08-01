"""
Repository analyzer — detects dependencies, computes statistics, and builds analysis.
"""
import os
from app.github.utils import classify_file, DEPENDENCY_FILES


def detect_dependency_files(file_paths: list) -> list:
    """Identify dependency manifest files in the repository."""
    found = []
    for fp in file_paths:
        basename = os.path.basename(fp)
        if basename in DEPENDENCY_FILES:
            found.append(fp)
        # Also catch subdirectory package.json (e.g. frontend/package.json)
        elif basename == "package.json" and fp.count("/") > 0:
            found.append(fp)
    return found


def extract_dependency_names(file_paths: list) -> list:
    """Extract package names from dependency files (simplified)."""
    deps = []
    dep_basename_map = {
        "requirements.txt": "python",
        "Pipfile": "python",
        "pyproject.toml": "python",
        "package.json": "node",
        "package-lock.json": "node",
        "yarn.lock": "node",
        "pom.xml": "java",
        "build.gradle": "java",
        "build.gradle.kts": "java",
        "composer.json": "php",
        "Gemfile": "ruby",
        "Cargo.toml": "rust",
        "go.mod": "go",
        "pubspec.yaml": "dart",
        "Podfile": "ios",
        "Package.swift": "swift",
    }
    for fp in file_paths:
        basename = os.path.basename(fp)
        if basename in dep_basename_map:
            ecosystem = dep_basename_map[basename]
            if ecosystem not in deps:
                deps.append(ecosystem)
    return deps


def compute_file_statistics(file_paths: list) -> dict:
    """Compute file and directory statistics."""
    dirs = set()
    files = 0
    for fp in file_paths:
        files += 1
        parts = fp.split("/")
        if len(parts) > 1:
            for i in range(1, len(parts)):
                dirs.add("/".join(parts[:i]))

    return {
        "files": files,
        "directories": len(dirs),
    }


def build_analysis(
    metadata: dict,
    branches: list,
    languages: dict,
    file_paths: list,
    contributors: int,
) -> dict:
    """Build the complete analysis result."""
    dep_files = detect_dependency_files(file_paths)
    ecosystems = extract_dependency_names(file_paths)
    stats = compute_file_statistics(file_paths)

    return {
        "owner": metadata["owner"],
        "repository": metadata["full_name"],
        "default_branch": metadata["default_branch"],
        "language": metadata["language"],
        "languages": languages,
        "branches": branches,
        "files": stats["files"],
        "directories": stats["directories"],
        "size": metadata["size"],
        "dependencies": ecosystems,
        "dependency_files": dep_files,
        "stars": metadata["stars"],
        "forks": metadata["forks"],
        "open_issues": metadata["open_issues"],
        "description": metadata["description"],
        "topics": metadata["topics"],
        "visibility": metadata["visibility"],
        "last_commit": metadata.get("updated_at", ""),
        "contributors": contributors,
        "file_tree": file_paths[:500],  # Limit for response size
    }
