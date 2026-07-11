"""
OWASP simulator repository for MongoDB operations.
Contains all database operations for OWASP simulations.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from bson import ObjectId
from pymongo.collection import Collection

from app.core.database import get_collection


class OWASPSimulationRepository:
    """Repository class for OWASP simulation database operations."""
    
    def __init__(self):
        self._collection: Optional[Collection] = None
    
    def _get_collection(self) -> Collection:
        """Get the owasp_simulations collection."""
        if self._collection is None:
            self._collection = get_collection("owasp_simulations")
        return self._collection
    
    async def create_simulation(self, simulation_data: Dict[str, Any]) -> str:
        """Create a new OWASP simulation record."""
        collection = self._get_collection()
        simulation_data["created_at"] = datetime.now(timezone.utc)
        result = await collection.insert_one(simulation_data)
        return str(result.inserted_id)
    
    async def get_simulation(self, simulation_id: str) -> Optional[Dict[str, Any]]:
        """Get a simulation by ID."""
        collection = self._get_collection()
        try:
            return await collection.find_one({"_id": ObjectId(simulation_id)})
        except Exception:
            return None
    
    async def get_user_simulations(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all simulations for a user."""
        collection = self._get_collection()
        cursor = collection.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        simulations = await cursor.to_list(length=limit)
        for sim in simulations:
            sim["_id"] = str(sim["_id"])
        return simulations
    
    async def update_simulation(self, simulation_id: str, update_data: Dict[str, Any]) -> bool:
        """Update a simulation."""
        collection = self._get_collection()
        update_data["updated_at"] = datetime.now(timezone.utc)
        try:
            result = await collection.update_one(
                {"_id": ObjectId(simulation_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception:
            return False

    async def get_attempts_by_user(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Async alias for get_user_simulations, used by dashboard routes.

        Args:
            user_id: User's MongoDB ObjectId as string
            limit: Maximum number of simulations to return

        Returns:
            List of simulation documents
        """
        return await self.get_user_simulations(user_id, limit)


# Create a singleton instance
owasp_simulation_repository = OWASPSimulationRepository()

# Alias for backward compatibility
owasp_repository = owasp_simulation_repository