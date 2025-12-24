from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.core.database import get_db
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Dépendance pour obtenir l'utilisateur actuel depuis le token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"get_current_user called with token (length: {len(token) if token else 0})")
        if not token:
            print("No token provided")
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
        user = get_user_by_id(db, user_id=int(user_id))
        if user is None:
            print(f"User not found with ID: {user_id}")
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
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Inscription d'un nouvel utilisateur"""
    try:
        print(f"Register request received for email: {user_data.email}")
        
        # Vérifier si l'email existe déjà
        existing_user = get_user_by_email(db, user_data.email)
        if existing_user:
            print(f"Email {user_data.email} already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Créer l'utilisateur
        print(f"Creating user: {user_data.email}")
        user = create_user(
            db,
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
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Connexion d'un utilisateur"""
    user = authenticate_user(db, form_data.username, form_data.password)
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
async def login_json(user_data: UserLogin, db: Session = Depends(get_db)):
    """Connexion avec JSON (alternative à OAuth2PasswordRequestForm)"""
    user = authenticate_user(db, user_data.email, user_data.password)
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

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Obtenir les informations de l'utilisateur connecté"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        plan=current_user.plan.value if hasattr(current_user.plan, 'value') else str(current_user.plan),
        is_active=current_user.is_active,
        is_verified=current_user.is_verified
    )

@router.get("/verify-token")
async def verify_user_token(token: str = Depends(oauth2_scheme)):
    """Vérifier si un token est valide"""
    print(f"verify-token called with token length: {len(token) if token else 0}")
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
        return {"token_extracted": True, "token_length": len(token), "payload": payload}
    return {"token_extracted": False, "authorization": authorization}

