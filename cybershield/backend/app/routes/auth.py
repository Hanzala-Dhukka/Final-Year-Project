from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(db: Session = Depends(get_db)):
    # TODO: implement registration logic
    return {"message": "Register endpoint"}


@router.post("/login")
def login(db: Session = Depends(get_db)):
    # TODO: implement login logic
    return {"message": "Login endpoint"}


@router.post("/logout")
def logout():
    # TODO: implement logout logic
    return {"message": "Logout endpoint"}
