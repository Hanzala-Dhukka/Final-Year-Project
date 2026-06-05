"""
Debug script to inspect github_scans in MongoDB.
Run from backend directory: python debug_scans.py
"""
import asyncio
from app.database.db import database
from bson import ObjectId


async def main():
    scan_collection = database["github_scans"]
    
    # Get ALL scans (no filter)
    all_scans = await scan_collection.find({}).to_list(length=1000)
    
    print(f"\n=== Total github_scans in DB: {len(all_scans)} ===\n")
    
    for i, scan in enumerate(all_scans):
        uid = scan.get("user_id")
        uid_type = type(uid).__name__
        fields = list(scan.keys())
        print(f"Scan {i+1}:")
        print(f"  _id        : {scan['_id']}")
        print(f"  user_id    : {uid}  (type: {uid_type})")
        print(f"  repository : {scan.get('repository') or scan.get('repo_name', 'N/A')}")
        print(f"  fields     : {fields}")
        print()

    # Show distinct user_ids
    print("\n=== Distinct user_id values ===")
    user_ids = {}
    for scan in all_scans:
        uid = scan.get("user_id")
        key = str(uid)
        user_ids[key] = user_ids.get(key, 0) + 1
    for uid_str, count in user_ids.items():
        print(f"  user_id={uid_str!r}  ({count} scans)")


asyncio.run(main())
