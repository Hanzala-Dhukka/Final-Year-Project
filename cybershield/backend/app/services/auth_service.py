import bcrypt
from sqlalchemy.orm import Session
from app.models.user import User


def hash_password(password: str) -> str:
    """Hash a password using bcrypt directly (passlib-free)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, username: str, email: str, password: str) -> User:
    hashed = hash_password(password)
    user = User(username=username, email=email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
