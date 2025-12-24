from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.user import User, PlanType
from app.core.config import settings
import secrets
import os
import bcrypt

# Configuration du hachage de mot de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuration JWT
# En production, utiliser une variable d'environnement
# Pour le développement, on génère une clé persistante pour éviter les problèmes de redémarrage
SECRET_KEY_FILE = Path(__file__).parent.parent.parent / ".secret_key"

def _get_or_create_secret_key():
    """Récupère ou crée une clé secrète persistante"""
    if SECRET_KEY_FILE.exists():
        return SECRET_KEY_FILE.read_text().strip()
    else:
        key = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
        SECRET_KEY_FILE.write_text(key)
        return key

SECRET_KEY = _get_or_create_secret_key()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 jours

def _truncate_password(password: str) -> bytes:
    """Tronque un mot de passe à 72 bytes maximum pour bcrypt"""
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    return password_bytes

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe en clair contre un hash"""
    # Tronquer le mot de passe à 72 bytes pour la vérification
    password_bytes = _truncate_password(plain_password)
    # Utiliser bcrypt directement pour éviter la vérification de longueur de passlib
    try:
        # Le hash peut être déjà une string ou bytes
        if isinstance(hashed_password, str):
            hashed_bytes = hashed_password.encode('utf-8')
        else:
            hashed_bytes = hashed_password
        result = bcrypt.checkpw(password_bytes, hashed_bytes)
        print(f"Password verification result: {result}")
        return result
    except Exception as e:
        print(f"bcrypt checkpw failed: {e}, trying passlib fallback")
        # Fallback sur passlib si bcrypt échoue
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e2:
            print(f"passlib verify also failed: {e2}")
            return False

def get_password_hash(password: str) -> str:
    """Hash un mot de passe"""
    # bcrypt a une limitation de 72 bytes, on tronque si nécessaire
    # Utiliser bcrypt directement pour éviter la vérification de longueur de passlib
    password_bytes = _truncate_password(password)
    # Générer le salt et hasher
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crée un token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    print(f"Creating token with data: {to_encode}, SECRET_KEY length: {len(SECRET_KEY)}")
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Token created (length: {len(encoded_jwt)})")
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Vérifie et décode un token JWT"""
    try:
        print(f"Verifying token (length: {len(token)}), SECRET_KEY length: {len(SECRET_KEY)}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Token verified successfully, payload: {payload}")
        return payload
    except JWTError as e:
        print(f"JWT Error: {str(e)}")
        print(f"Token (first 50 chars): {token[:50] if len(token) > 50 else token}")
        return None
    except Exception as e:
        print(f"Error verifying token: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Récupère un utilisateur par son email"""
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Récupère un utilisateur par son ID"""
    return db.query(User).filter(User.id == user_id).first()

def create_user(db: Session, email: str, password: str, full_name: Optional[str] = None) -> User:
    """Crée un nouvel utilisateur"""
    hashed_password = get_password_hash(password)
    db_user = User(
        email=email,
        hashed_password=hashed_password,
        full_name=full_name,
        plan=PlanType.FREE
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authentifie un utilisateur"""
    print(f"Authenticating user: {email}")
    user = get_user_by_email(db, email)
    if not user:
        print(f"User not found: {email}")
        return None
    print(f"User found: {user.email}, checking password...")
    if not verify_password(password, user.hashed_password):
        print(f"Password verification failed for user: {email}")
        return None
    print(f"Password verified successfully for user: {email}")
    if not user.is_active:
        print(f"User is not active: {email}")
        return None
    print(f"User authenticated successfully: {email}")
    return user

