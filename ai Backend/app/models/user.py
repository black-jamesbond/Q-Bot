"""
User model for authentication and user management.
"""
from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import EmailStr, Field
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(Document):
    """User document model."""
    
    email: Indexed(EmailStr, unique=True)
    username: Indexed(str, unique=True)
    full_name: Optional[str] = None
    hashed_password: str
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # User preferences
    preferred_language: str = "en"
    conversation_settings: dict = Field(default_factory=dict)
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "username",
            "created_at",
        ]
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)
    
    def verify_password(self, password: str) -> bool:
        """Verify a password against the hash."""
        return pwd_context.verify(password, self.hashed_password)
    
    def update_timestamp(self):
        """Update the updated_at timestamp."""
        self.updated_at = datetime.utcnow()


class UserCreate(Document):
    """Schema for user creation."""
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    password: str


class UserResponse(Document):
    """Schema for user response (without sensitive data)."""
    id: str
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    preferred_language: str
