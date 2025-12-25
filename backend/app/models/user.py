from typing import Optional
from datetime import datetime
import enum

class PlanType(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    STUDIO = "studio"

class User:
    """Modèle utilisateur pour Supabase"""
    
    def __init__(
        self,
        id: int,
        email: str,
        hashed_password: str,
        full_name: Optional[str] = None,
        is_active: bool = True,
        is_verified: bool = False,
        plan: PlanType = PlanType.FREE,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self.id = id
        self.email = email
        self.hashed_password = hashed_password
        self.full_name = full_name
        self.is_active = is_active
        self.is_verified = is_verified
        self.plan = plan if isinstance(plan, PlanType) else PlanType(plan)
        self.created_at = created_at
        self.updated_at = updated_at
    
    @classmethod
    def from_dict(cls, data: dict) -> "User":
        """Crée un User depuis un dictionnaire (retourné par Supabase)"""
        # S'assurer que l'ID est un int (Supabase peut retourner un str pour BIGSERIAL)
        user_id = data.get("id")
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except (ValueError, TypeError):
                pass
        
        return cls(
            id=user_id,
            email=data.get("email"),
            hashed_password=data.get("hashed_password"),
            full_name=data.get("full_name"),
            is_active=data.get("is_active", True),
            is_verified=data.get("is_verified", False),
            plan=PlanType(data.get("plan", "free")),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at")
        )
    
    def to_dict(self) -> dict:
        """Convertit le User en dictionnaire pour Supabase"""
        return {
            "id": self.id,
            "email": self.email,
            "hashed_password": self.hashed_password,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "plan": self.plan.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, plan={self.plan})>"
