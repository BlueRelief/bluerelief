from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
import logging

logger = logging.getLogger(__name__)

ph = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash a password using Argon2"""
    try:
        return ph.hash(password)
    except Exception as e:
        logger.error(f"Error hashing password: {e}")
        raise


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash"""
    if not password_hash:
        return False
    
    try:
        ph.verify(password_hash, password)
        return True
    except (VerifyMismatchError, InvalidHashError):
        return False
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False

