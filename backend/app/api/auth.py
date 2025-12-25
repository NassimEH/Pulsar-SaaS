from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Optional
from app.models.schemas import UserRegister, UserLogin, Token, UserResponse
from app.services.auth import (
    authenticate_user,
    create_user,
    create_access_token,
    get_user_by_email,
    get_user_by_id,
    verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_token_from_header(request: Request) -> Optional[str]:
    """Extrait le token depuis le header Authorization"""
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    
    if auth_header:
        if auth_header.startswith("Bearer "):
            extracted_token = auth_header[7:].strip()
            print(f"Token extracted from request.headers (length: {len(extracted_token)})")
            print(f"Token preview: {extracted_token[:50]}...")
            return extracted_token
        else:
            print(f"Auth header doesn't start with 'Bearer ': {auth_header[:50]}")
    else:
        print("No Authorization header found in request")
        print(f"Available headers: {list(request.headers.keys())}")
    
    return None

async def get_current_user(request: Request):
    """Dépendance pour obtenir l'utilisateur actuel depuis le token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Extraire le token depuis le header
        token = await get_token_from_header(request)
        
        print(f"get_current_user called with token (length: {len(token) if token else 0})")
        if token:
            print(f"Token preview: {token[:50]}...")
        if not token:
            print("No token provided to get_current_user")
            raise credentials_exception
        payload = verify_token(token)
        if payload is None:
            print(f"Token verification failed: payload is None")
            raise credentials_exception
        user_id = payload.get("sub")
        if user_id is None:
            print(f"Token verification failed: user_id is None in payload {payload}")
            raise credentials_exception
        print(f"Looking for user with ID: {user_id} (type: {type(user_id)})")
        # Convertir user_id en int si nécessaire
        try:
            user_id_int = int(user_id) if not isinstance(user_id, int) else user_id
        except (ValueError, TypeError) as e:
            print(f"Error converting user_id to int: {e}, user_id: {user_id}")
            raise credentials_exception
        user = get_user_by_id(user_id_int)
        if user is None:
            print(f"User not found with ID: {user_id_int}")
            raise credentials_exception
        print(f"User found: {user.email}")
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_current_user: {str(e)}")
        import traceback
        traceback.print_exc()
        raise credentials_exception

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """Inscription d'un nouvel utilisateur"""
    try:
        print(f"Register request received for email: {user_data.email}")
        
        # Vérifier si l'email existe déjà
        existing_user = get_user_by_email(user_data.email)
        if existing_user:
            print(f"Email {user_data.email} already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Créer l'utilisateur
        print(f"Creating user: {user_data.email}")
        user = create_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name
        )
        print(f"User created successfully with ID: {user.id}")
        
        # Convertir l'enum plan en string pour la réponse
        plan_value = user.plan.value if hasattr(user.plan, 'value') else str(user.plan)
        response_data = UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            plan=plan_value,
            is_active=user.is_active,
            is_verified=user.is_verified
        )
        print(f"Returning user response: {response_data}")
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Register error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Connexion d'un utilisateur"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login-json", response_model=Token)
async def login_json(user_data: UserLogin):
    """Connexion avec JSON (alternative à OAuth2PasswordRequestForm)"""
    user = authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires
    )
    print(f"Login successful for user {user.email}, token created (length: {len(access_token)})")
    print(f"Token preview: {access_token[:50]}...")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(request: Request):
    """Obtenir les informations de l'utilisateur connecté"""
    current_user = await get_current_user(request)
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        plan=current_user.plan.value if hasattr(current_user.plan, 'value') else str(current_user.plan),
        is_active=current_user.is_active,
        is_verified=current_user.is_verified
    )

@router.get("/verify-token")
async def verify_user_token(request: Request):
    """Vérifier si un token est valide"""
    token = await get_token_from_header(request)
    print(f"verify-token called with token length: {len(token) if token else 0}")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No token provided"
        )
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    return {"valid": True, "user_id": payload.get("sub")}

@router.get("/test-token")
async def test_token(authorization: str = None):
    """Endpoint de test pour vérifier l'extraction du token"""
    print(f"Authorization header: {authorization}")
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        print(f"Extracted token (length: {len(token)}): {token[:20]}...")
        payload = verify_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                user = get_user_by_id(int(user_id))
                return {
                    "token_extracted": True,
                    "token_length": len(token),
                    "payload": payload,
                    "user_found": user is not None,
                    "user_id": user_id
                }
        return {"token_extracted": True, "token_length": len(token), "payload": payload}
    return {"token_extracted": False, "authorization": authorization}

@router.get("/debug/users")
async def debug_users():
    """Endpoint de debug pour lister tous les utilisateurs (développement uniquement)"""
    from app.services.auth import get_user_by_email
    from app.core.database import get_supabase
    
    try:
        supabase = get_supabase()
        result = supabase.table("users").select("id, email, plan, is_active").limit(10).execute()
        return {
            "users_count": len(result.data) if result.data else 0,
            "users": result.data if result.data else []
        }
    except Exception as e:
        return {"error": str(e)}
