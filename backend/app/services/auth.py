from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path
from jose import JWTError, jwt
from passlib.context import CryptContext
from supabase import Client
from app.models.user import User, PlanType
from app.core.config import settings
from app.core.database import get_supabase
import secrets
import os
import bcrypt

# Configuration du hachage de mot de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuration JWT
# Utiliser la SECRET_KEY depuis les settings (chargée depuis .env)
if settings.SECRET_KEY:
    SECRET_KEY = settings.SECRET_KEY
    print("✅ SECRET_KEY chargée depuis les variables d'environnement")
else:
    # Fallback pour le développement local
    SECRET_KEY_FILE = Path(__file__).resolve().parent.parent.parent.parent / ".secret_key"
    if SECRET_KEY_FILE.exists():
        SECRET_KEY = SECRET_KEY_FILE.read_text().strip()
        print("⚠️  SECRET_KEY chargée depuis le fichier local (.secret_key)")
    else:
        SECRET_KEY = secrets.token_urlsafe(32)
        SECRET_KEY_FILE.write_text(SECRET_KEY)
        print("⚠️  SECRET_KEY générée et sauvegardée localement (développement uniquement)")

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
    password_bytes = _truncate_password(plain_password)
    try:
        if isinstance(hashed_password, str):
            hashed_bytes = hashed_password.encode('utf-8')
        else:
            hashed_bytes = hashed_password
        result = bcrypt.checkpw(password_bytes, hashed_bytes)
        print(f"Password verification result: {result}")
        return result
    except Exception as e:
        print(f"bcrypt checkpw failed: {e}, trying passlib fallback")
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e2:
            print(f"passlib verify also failed: {e2}")
            return False

def get_password_hash(password: str) -> str:
    """Hash un mot de passe"""
    password_bytes = _truncate_password(password)
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crée un token JWT"""
    to_encode = data.copy()
    # S'assurer que 'sub' est une string (requis par JWT)
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
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

def get_user_by_email(email: str) -> Optional[User]:
    """Récupère un utilisateur par son email depuis Supabase"""
    supabase = get_supabase()
    try:
        result = supabase.table("users").select("*").eq("email", email).limit(1).execute()
        if result.data and len(result.data) > 0:
            return User.from_dict(result.data[0])
        return None
    except Exception as e:
        print(f"Error fetching user by email: {e}")
        return None

def get_user_by_id(user_id: int) -> Optional[User]:
    """Récupère un utilisateur par son ID depuis Supabase"""
    supabase = get_supabase()
    try:
        print(f"Fetching user with ID: {user_id} (type: {type(user_id)})")
        result = supabase.table("users").select("*").eq("id", user_id).limit(1).execute()
        print(f"Supabase query result: {result}")
        print(f"Result data: {result.data}")
        if result.data and len(result.data) > 0:
            print(f"User found: {result.data[0]}")
            return User.from_dict(result.data[0])
        print(f"No user found with ID: {user_id}")
        return None
    except Exception as e:
        print(f"Error fetching user by id: {e}")
        import traceback
        traceback.print_exc()
        return None

def create_user(email: str, password: str, full_name: Optional[str] = None) -> User:
    """Crée un nouvel utilisateur dans Supabase"""
    supabase = get_supabase()
    hashed_password = get_password_hash(password)
    
    user_data = {
        "email": email,
        "hashed_password": hashed_password,
        "full_name": full_name,
        "plan": PlanType.FREE.value,
        "is_active": True,
        "is_verified": False
    }
    
    try:
        print(f"Attempting to insert user with email: {email}")
        result = supabase.table("users").insert(user_data).execute()
        print(f"Insert result: {result}")
        if result.data and len(result.data) > 0:
            print(f"User created successfully: {result.data[0]}")
            return User.from_dict(result.data[0])
        raise Exception("No data returned from insert")
    except Exception as e:
        error_msg = str(e)
        print(f"Error creating user: {error_msg}")
        # Afficher plus de détails sur l'erreur
        if hasattr(e, 'args') and e.args:
            print(f"Error args: {e.args}")
        if hasattr(e, 'message'):
            print(f"Error message: {e.message}")
        # Si c'est une erreur Supabase/PostgREST, donner plus de contexte
        if "PGRST" in error_msg or "permission" in error_msg.lower() or "row-level security" in error_msg.lower():
            raise Exception(
                f"Erreur de permissions Supabase. Vérifiez que:\n"
                f"1. RLS est désactivé sur la table users (ALTER TABLE users DISABLE ROW LEVEL SECURITY)\n"
                f"2. Vous utilisez la clé service_role (pas anon) dans SUPABASE_KEY\n"
                f"Erreur: {error_msg}"
            )
        raise

def authenticate_user(email: str, password: str) -> Optional[User]:
    """Authentifie un utilisateur"""
    print(f"Authenticating user: {email}")
    user = get_user_by_email(email)
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

def update_user_profile(user_id: int, update_data: dict) -> Optional[User]:
    """Met à jour le profil d'un utilisateur"""
    supabase = get_supabase()
    try:
        # Filtrer les valeurs None
        filtered_data = {k: v for k, v in update_data.items() if v is not None}
        if not filtered_data:
            return get_user_by_id(user_id)
        
        filtered_data["updated_at"] = datetime.utcnow().isoformat()
        
        result = supabase.table("users").update(filtered_data).eq("id", user_id).execute()
        if result.data and len(result.data) > 0:
            return User.from_dict(result.data[0])
        return None
    except Exception as e:
        print(f"Error updating user profile: {e}")
        import traceback
        traceback.print_exc()
        return None

def update_user_password(user_id: int, new_password: str) -> bool:
    """Met à jour le mot de passe d'un utilisateur"""
    supabase = get_supabase()
    try:
        hashed_password = get_password_hash(new_password)
        result = supabase.table("users").update({
            "hashed_password": hashed_password,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()
        return result.data is not None and len(result.data) > 0
    except Exception as e:
        print(f"Error updating password: {e}")
        return False
