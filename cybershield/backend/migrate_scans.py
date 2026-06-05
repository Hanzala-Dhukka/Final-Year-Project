"""
Migration script: fixes old github_scans that use the old field names
(repo_name -> repository, findings_count -> vulnerabilities_found)
and adds missing scanned_files field.

Run from backend directory: python migrate_scans.py
"""
import asyncio
from app.database.db import database


async def main():
    scan_collection = database["github_scans"]
    all_scans = await scan_collection.find({}).to_list(length=1000)

    print(f"Found {len(all_scans)} scan(s) to check...\n")

    updated = 0
    for scan in all_scans:
        update_fields = {}

        if "repo_name" in scan and "repository" not in scan:
            update_fields["repository"] = scan["repo_name"]

        if "findings_count" in scan and "vulnerabilities_found" not in scan:
            update_fields["vulnerabilities_found"] = scan["findings_count"]

        if "scanned_files" not in scan:
            update_fields["scanned_files"] = 0  # unknown for old records

        if update_fields:
            await scan_collection.update_one(
                {"_id": scan["_id"]},
                {"$set": update_fields}
            )
            print(f"  Updated scan {scan['_id']}: {list(update_fields.keys())}")
            updated += 1
        else:
            print(f"  Scan {scan['_id']}: already up to date")

    print(f"\nMigration complete. {updated} scan(s) updated.")


asyncio.run(main())
