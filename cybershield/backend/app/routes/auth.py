from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User

from app.models.user_model import UserCreate
from app.utils.security import hash_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/debug-bcrypt")
def debug_bcrypt():
    import bcrypt
    import sys
    try:
        hashed = hash_password("testpassword")
        hash_status = "success"
    except Exception as e:
        import traceback
        hashed = traceback.format_exc()
        hash_status = "failed"
    return {
        "python_exe": sys.executable,
        "bcrypt_file": bcrypt.__file__,
        "bcrypt_version": bcrypt.__version__,
        "hash_status": hash_status,
        "hash_result": hashed
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already registered
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create new user
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role,
        is_active=True,
        is_admin=False
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User registered successfully"}


@router.post("/login")
def login(db: Session = Depends(get_db)):
    # TODO: implement login logic
    return {"message": "Login endpoint"}


@router.post("/logout")
def logout():
    # TODO: implement logout logic
    return {"message": "Logout endpoint"}
