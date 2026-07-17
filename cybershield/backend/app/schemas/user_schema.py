def user_serializer(user) -> dict:
    return {
        "id": str(user["_id"]),
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"],
        "is_verified": user["is_verified"],
        "is_active": user["is_active"],
    }
