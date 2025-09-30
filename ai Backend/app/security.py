"""
Security utilities and middleware.
"""
import time
from typing import Dict, Optional
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog

logger = structlog.get_logger()


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = {}
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed for the given identifier."""
        current_time = time.time()
        
        # Clean old requests
        if identifier in self.requests:
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier]
                if current_time - req_time < self.window_seconds
            ]
        else:
            self.requests[identifier] = []
        
        # Check if under limit
        if len(self.requests[identifier]) >= self.max_requests:
            return False
        
        # Add current request
        self.requests[identifier].append(current_time)
        return True


class SecurityMiddleware:
    """Security middleware for API protection."""
    
    def __init__(self):
        self.rate_limiter = RateLimiter(max_requests=1000, window_seconds=3600)
        self.chat_rate_limiter = RateLimiter(max_requests=100, window_seconds=3600)
    
    async def __call__(self, request: Request, call_next):
        """Process request through security checks."""
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Apply rate limiting
        if not self.rate_limiter.is_allowed(client_ip):
            logger.warning("Rate limit exceeded", client_ip=client_ip, path=request.url.path)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # Special rate limiting for chat endpoints
        if "/chat" in request.url.path:
            if not self.chat_rate_limiter.is_allowed(client_ip):
                logger.warning("Chat rate limit exceeded", client_ip=client_ip)
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Chat rate limit exceeded. Please slow down."
                )
        
        # Add security headers
        response = await call_next(request)
        
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request."""
        # Check for forwarded headers (when behind proxy)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection
        return request.client.host if request.client else "unknown"


class APIKeyAuth(HTTPBearer):
    """API Key authentication for service-to-service communication."""
    
    def __init__(self, api_keys: Optional[Dict[str, str]] = None):
        super().__init__()
        self.api_keys = api_keys or {}
    
    async def __call__(self, request: Request) -> Optional[str]:
        """Validate API key from request."""
        # Check for API key in header
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return None
        
        # Validate API key
        if api_key in self.api_keys:
            return self.api_keys[api_key]
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )


def validate_password_strength(password: str) -> bool:
    """Validate password strength."""
    if len(password) < 8:
        return False
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
    
    return sum([has_upper, has_lower, has_digit, has_special]) >= 3


def sanitize_input(text: str, max_length: int = 1000) -> str:
    """Sanitize user input."""
    if not text:
        return ""
    
    # Remove null bytes and control characters
    sanitized = "".join(char for char in text if ord(char) >= 32 or char in "\n\r\t")
    
    # Truncate to max length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized.strip()


class InputValidator:
    """Input validation utilities."""
    
    @staticmethod
    def validate_conversation_message(content: str) -> str:
        """Validate and sanitize conversation message."""
        if not content or not content.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content cannot be empty"
            )
        
        sanitized = sanitize_input(content, max_length=2000)
        
        if len(sanitized) < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content is too short"
            )
        
        return sanitized
    
    @staticmethod
    def validate_conversation_title(title: str) -> str:
        """Validate and sanitize conversation title."""
        if not title:
            return "Untitled Conversation"
        
        sanitized = sanitize_input(title, max_length=100)
        return sanitized if sanitized else "Untitled Conversation"
    
    @staticmethod
    def validate_username(username: str) -> str:
        """Validate username format."""
        if not username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is required"
            )
        
        # Remove whitespace and convert to lowercase
        username = username.strip().lower()
        
        # Check length
        if len(username) < 3 or len(username) > 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must be between 3 and 30 characters"
            )
        
        # Check format (alphanumeric and underscores only)
        if not username.replace("_", "").isalnum():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username can only contain letters, numbers, and underscores"
            )
        
        return username


# Global security middleware instance
security_middleware = SecurityMiddleware()

# Global input validator instance
input_validator = InputValidator()
