from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/")
def get_users(db: Session = Depends(get_db)):
    # TODO: return list of users
    return {"message": "Get all users"}


@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    # TODO: return single user
    return {"message": f"Get user {user_id}"}


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    # TODO: delete user
    return {"message": f"Delete user {user_id}"}
