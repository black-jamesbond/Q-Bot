"""
User management API endpoints.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt
from pydantic import BaseModel, EmailStr

from app.config import settings
from app.models.user import User, UserCreate, UserResponse
from app.api.dependencies import get_current_active_user
import structlog

logger = structlog.get_logger()

router = APIRouter()


class Token(BaseModel):
    """Token response model."""
    access_token: str
    token_type: str


class UserRegistration(BaseModel):
    """User registration request model."""
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    password: str


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserRegistration):
    """Register a new user."""
    try:
        # Check if user already exists
        existing_user = await User.find_one(
            {"$or": [{"email": user_data.email}, {"username": user_data.username}]}
        )
        
        if existing_user:
            if existing_user.email == user_data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # Create new user
        hashed_password = User.hash_password(user_data.password)
        user = User(
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            hashed_password=hashed_password
        )
        
        await user.insert()
        
        logger.info("User registered successfully", user_id=str(user.id), email=user.email)
        
        return UserResponse(
            id=str(user.id),
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            preferred_language=user.preferred_language
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to register user", error=str(e), email=user_data.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user"
        )


@router.post("/login", response_model=Token)
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate user and return access token."""
    try:
        # Find user by username or email
        user = await User.find_one(
            {"$or": [{"username": form_data.username}, {"email": form_data.username}]}
        )
        
        if not user or not user.verify_password(form_data.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username/email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        logger.info("User logged in successfully", user_id=str(user.id), username=user.username)
        
        return {"access_token": access_token, "token_type": "bearer"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to login user", error=str(e), username=form_data.username)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to login"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
        preferred_language=current_user.preferred_language
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Update current user information."""
    try:
        # Update allowed fields
        allowed_fields = ["full_name", "preferred_language", "conversation_settings"]
        
        for field, value in user_update.items():
            if field in allowed_fields:
                setattr(current_user, field, value)
        
        current_user.update_timestamp()
        await current_user.save()
        
        logger.info("User updated successfully", user_id=str(current_user.id))
        
        return UserResponse(
            id=str(current_user.id),
            email=current_user.email,
            username=current_user.username,
            full_name=current_user.full_name,
            is_active=current_user.is_active,
            is_verified=current_user.is_verified,
            created_at=current_user.created_at,
            preferred_language=current_user.preferred_language
        )
        
    except Exception as e:
        logger.error("Failed to update user", error=str(e), user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.post("/change-password")
async def change_password(
    password_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Change user password."""
    try:
        current_password = password_data.get("current_password")
        new_password = password_data.get("new_password")
        
        if not current_password or not new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password and new password are required"
            )
        
        # Verify current password
        if not current_user.verify_password(current_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password"
            )
        
        # Update password
        current_user.hashed_password = User.hash_password(new_password)
        current_user.update_timestamp()
        await current_user.save()
        
        logger.info("Password changed successfully", user_id=str(current_user.id))
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to change password", error=str(e), user_id=str(current_user.id))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )
