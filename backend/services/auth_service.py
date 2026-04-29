"""
Authentication service handling password hashing and JWT tokens.
"""
from datetime import datetime, timedelta
import bcrypt
from jose import JWTError, jwt
from typing import Optional

from config import settings
from database import SessionLocal
from models import User

# Authentication configuration
SECRET_KEY = getattr(settings, "JWT_SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

class AuthService:
    """Service for handling authentication and authorization."""
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hash."""
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

    def get_password_hash(self, password: str) -> str:
        """Hash a plain password."""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create a new JWT access token."""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt

    def seed_initial_users(self):
        """Seed the database with default users if none exist."""
        db = SessionLocal()
        try:
            # Check if users already exist
            if db.query(User).first():
                return
                
            print("Seeding initial users...")
            user1 = User(
                username="user1",
                hashed_password=self.get_password_hash("password123")
            )
            
            db.add(user1)
            db.commit()
            print("Initial user created: user1/password123")
        except Exception as e:
            print(f"Error seeding users: {e}")
        finally:
            db.close()

auth_service = AuthService()
