from fastapi import APIRouter 
from fastapi import Depends 
from bson import ObjectId 

from app.database.db import database 
from app.dependencies.admin_auth import ( 
    admin_required 
) 

router = APIRouter() 

# GET ALL USERS 
@router.get("/users") 
async def get_users( 
    current_user = Depends( 
        admin_required 
    ) 
): 

    users = await database["users"]\
        .find().to_list(100) 

    for user in users: 

        user["_id"] = str( 
            user["_id"] 
        ) 

        user.pop("password", None) 

    return users

# DELETE USER 
@router.delete("/users/{user_id}") 
async def delete_user( 
    user_id: str, 
    current_user = Depends( 
        admin_required 
    ) 
): 

    await database["users"].delete_one( 
        { 
            "_id": ObjectId(user_id) 
        } 
    ) 

    return { 
        "message": "User deleted" 
    }
