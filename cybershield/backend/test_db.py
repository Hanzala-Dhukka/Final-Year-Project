"""
Test script for MongoDB connection.
Run this script to verify MongoDB is working correctly.
"""
import asyncio
from app.core.database import get_database, connect_to_mongo, close_mongo_connection


async def test_connection():
    """Test MongoDB connection."""
    try:
        # Connect to MongoDB
        await connect_to_mongo()
        
        # Get database
        database = get_database()
        
        # Test ping
        result = await database.command("ping")
        print(f"✓ MongoDB ping successful: {result}")
        
        # List collections
        collections = await database.list_collection_names()
        print(f"✓ Database: {database.name}")
        print(f"✓ Collections ({len(collections)}):")
        for collection in collections:
            print(f"  - {collection}")
        
        # Close connection
        await close_mongo_connection()
        
        print("\n✓ All tests passed!")
        return True
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_connection())
    exit(0 if success else 1)