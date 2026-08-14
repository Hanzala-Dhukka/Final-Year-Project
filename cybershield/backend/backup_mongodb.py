"""
MongoDB Backup & Restore Script.

Exports every collection in the configured database to timestamped JSON files
inside a `backups/` directory, so the project's data can never be lost.

Usage:
    python backup_mongodb.py            # create a full backup
    python backup_mongodb.py --restore  # restore the most recent backup
    python backup_mongodb.py --restore --path backups/backup_2026-01-01_120000
"""
import argparse
import asyncio
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path
from bson import ObjectId
from bson.json_util import dumps, loads

from app.database.db import database


BACKUP_DIR = Path(__file__).resolve().parent / "backups"


class _Encoder:
    """Bson-aware encoder that survives JSON round-trips."""


def _default(obj):
    if isinstance(obj, ObjectId):
        return {"$oid": str(obj)}
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


async def _dump_collection(name: str, out_dir: Path) -> int:
    """Write one collection to a JSON-lines file. Returns document count."""
    docs = []
    async for doc in database[name].find({}):
        docs.append(doc)
    file = out_dir / f"{name}.json"
    with open(file, "w", encoding="utf-8") as f:
        for doc in docs:
            f.write(dumps(doc) + "\n")
    return len(docs)


async def _load_collection(name: str, file: Path) -> int:
    """Restore one collection from a JSON-lines file. Returns doc count."""
    collection = database[name]
    count = 0
    with open(file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            doc = loads(line)
            await collection.replace_one({"_id": doc["_id"]}, doc, upsert=True)
            count += 1
    return count


async def _backup() -> Path:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    out_dir = BACKUP_DIR / f"backup_{stamp}"
    out_dir.mkdir(parents=True, exist_ok=True)

    names = await database.list_collection_names()
    totals = {"collections": 0, "documents": 0}

    for name in sorted(names):
        try:
            n = await _dump_collection(name, out_dir)
            totals["collections"] += 1
            totals["documents"] += n
            print(f"  ok   {name:<40} {n:>6} docs")
        except Exception as e:
            print(f"  FAIL {name:<40} {e}")

    # Write a manifest for easy inspection / restore.
    (out_dir / "MANIFEST.json").write_text(
        json.dumps(totals, indent=2), encoding="utf-8"
    )

    print("\n=== Backup complete ===")
    print(f"  Directory : {out_dir}")
    print(f"  Collections: {totals['collections']}")
    print(f"  Documents : {totals['documents']}")
    return out_dir


def _find_latest_backup() -> Path:
    if not BACKUP_DIR.exists():
        sys.exit("No backups directory found.")
    backups = sorted([p for p in BACKUP_DIR.iterdir() if p.is_dir()])
    if not backups:
        sys.exit("No backups found.")
    return backups[-1]


async def _restore(path: Path) -> None:
    if not path.is_dir():
        sys.exit(f"Backup directory not found: {path}")
    print(f"=== Restoring from {path} ===")
    files = sorted(path.glob("*.json"))
    totals = {"collections": 0, "documents": 0}
    for file in files:
        if file.name == "MANIFEST.json":
            continue
        name = file.stem
        try:
            n = await _load_collection(name, file)
            totals["collections"] += 1
            totals["documents"] += n
            print(f"  ok   {name:<40} {n:>6} docs")
        except Exception as e:
            print(f"  FAIL {name:<40} {e}")
    print(f"\n=== Restore complete: {totals['documents']} docs in {totals['collections']} collections ===")


async def _main() -> None:
    parser = argparse.ArgumentParser(description="MongoDB backup / restore")
    parser.add_argument("--restore", action="store_true", help="Restore the latest backup")
    parser.add_argument("--path", type=str, default=None, help="Backup directory to restore")
    args = parser.parse_args()

    if args.restore:
        path = Path(args.path) if args.path else _find_latest_backup()
        await _restore(path)
    else:
        out_dir = await _backup()
        # Keep only the latest 5 backups to avoid unbounded disk growth.
        backups = sorted([p for p in BACKUP_DIR.iterdir() if p.is_dir()])
        for old in backups[:-5]:
            shutil.rmtree(old, ignore_errors=True)
            print(f"  pruned old backup: {old}")


if __name__ == "__main__":
    try:
        asyncio.run(_main())
    except KeyboardInterrupt:
        sys.exit(130)