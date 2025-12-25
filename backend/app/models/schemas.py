from pydantic import BaseModel, EmailStr, validator
from typing import Optional

# Authentification
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Le mot de passe doit contenir au moins 6 caractères')
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Le mot de passe ne peut pas dépasser 72 caractères')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    plan: str
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    
    @classmethod
    def from_orm(cls, obj):
        """Convertit un objet User en UserResponse"""
        return cls(
            id=obj.id,
            email=obj.email,
            full_name=obj.full_name,
            plan=obj.plan.value if hasattr(obj.plan, 'value') else str(obj.plan),
            is_active=obj.is_active,
            is_verified=obj.is_verified,
            avatar_url=getattr(obj, 'avatar_url', None),
            bio=getattr(obj, 'bio', None),
            phone=getattr(obj, 'phone', None),
            location=getattr(obj, 'location', None),
            website=getattr(obj, 'website', None)
        )
    
    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    avatar_url: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class AnalysisResponse(BaseModel):
    filename: str
    features: dict

class ProcessRequest(BaseModel):
    filename: str
    speed: float = 1.0
    pitch: float = 0.0
    nightcore: bool = False
    reverb: float = 0.0  # Niveau de reverb (0.0 à 1.0)
    gain: float = 0.0  # Gain en dB
    low_pass: float = 20000.0  # Fréquence de coupure low-pass en Hz
    high_pass: float = 20.0  # Fréquence de coupure high-pass en Hz
    delay: float = 0.0  # Intensité du delay (0.0 à 1.0)
    delay_time: float = 250.0  # Temps de delay en ms
    delay_feedback: float = 0.3  # Feedback du delay (0.0 à 0.9)
    chorus: float = 0.0  # Intensité du chorus (0.0 à 1.0)
    chorus_rate: float = 1.5  # Taux du chorus en Hz
    chorus_depth: float = 0.3  # Profondeur du chorus (0.0 à 1.0)
    flanger: float = 0.0  # Intensité du flanger (0.0 à 1.0)
    flanger_rate: float = 0.5  # Taux du flanger en Hz
    flanger_depth: float = 0.5  # Profondeur du flanger (0.0 à 1.0)
    phaser: float = 0.0  # Intensité du phaser (0.0 à 1.0)
    phaser_rate: float = 0.5  # Taux du phaser en Hz
    distortion: float = 0.0  # Intensité de la distorsion (0.0 à 1.0)
    compression: float = 0.0  # Intensité de la compression (0.0 à 1.0)
    compression_ratio: float = 4.0  # Ratio de compression
    compression_threshold: float = -12.0  # Seuil de compression en dB
    normalize: bool = False  # Normaliser le signal
    reverse: bool = False  # Inverser le signal
    fade_in: float = 0.0  # Fade in en secondes
    fade_out: float = 0.0  # Fade out en secondes
    pan: float = 0.0  # Pan stéréo (-1.0 à 1.0)
    eq_bass: float = 0.0  # EQ basses en dB
    eq_low_mid: float = 0.0  # EQ bas-médiums en dB
    eq_mid: float = 0.0  # EQ médiums en dB
    eq_high_mid: float = 0.0  # EQ hauts-médiums en dB
    eq_treble: float = 0.0  # EQ aigus en dB

class ProcessResponse(BaseModel):
    download_url: str

class AIAnalysisRequest(BaseModel):
    features: dict

class AIAnalysisResponse(BaseModel):
    report: str
    source: str = "gemini-ai"

class ComparisonRequest(BaseModel):
    original_filename: str
    reference_filename: str

class ComparisonResponse(BaseModel):
    global_score: float
    global_status: str
    global_status_label: str
    comparisons: dict
    original_key: str
    reference_key: str