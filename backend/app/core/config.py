import os
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables d'environnement depuis le fichier .env
# Le fichier .env doit être dans la racine du projet (brainwave/)
ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent / ".env"
env_loaded = load_dotenv(dotenv_path=ENV_PATH)

# Afficher un message si le fichier .env n'existe pas
if not ENV_PATH.exists():
    print(f"⚠️  Fichier .env non trouvé à: {ENV_PATH}")
    print(f"   Créez un fichier .env dans le dossier backend/ avec DATABASE_URL et SECRET_KEY")
else:
    # Vérifier ce qui a été chargé (pour débogage)
    supabase_url = os.getenv("SUPABASE_URL", "")
    if supabase_url:
        print(f"✅ SUPABASE_URL chargée depuis .env")
    else:
        print(f"⚠️  SUPABASE_URL non trouvée dans .env ou vide")
        print(f"   Vérifiez que le fichier .env contient bien: SUPABASE_URL=...")

class Settings:
    PROJECT_NAME: str = "Brainwave Audio API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Base directory
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    
    # Supabase Configuration (OBLIGATOIRE)
    # URL de l'API Supabase (ex: https://xxx.supabase.co)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    # Clé anonyme Supabase (service_role key pour les opérations serveur)
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # Uploads directory
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "processed"
    
    def __init__(self):
        # Vérifier que SUPABASE_URL est définie
        if not self.SUPABASE_URL:
            env_path_str = str(ENV_PATH)
            error_msg = (
                f"❌ SUPABASE_URL est requise dans le fichier .env\n"
                f"   Fichier .env recherché à: {env_path_str}\n"
                f"   Le fichier existe: {'Oui' if ENV_PATH.exists() else 'Non'}\n"
                f"   Veuillez créer ou modifier le fichier .env avec:\n"
                f"   SUPABASE_URL=https://votre-projet.supabase.co\n"
                f"   SUPABASE_KEY=votre-service-role-key\n"
                f"   SECRET_KEY=votre-cle-secrete-ici"
            )
            raise ValueError(error_msg)
        
        # Vérifier que SUPABASE_KEY est définie
        if not self.SUPABASE_KEY:
            raise ValueError(
                f"❌ SUPABASE_KEY est requise dans le fichier .env\n"
                f"   Obtenez votre clé depuis Supabase: Settings > API > service_role key"
            )
        
        # Vérifier que c'est bien une URL Supabase
        if not (self.SUPABASE_URL.startswith("https://") and "supabase.co" in self.SUPABASE_URL):
            raise ValueError(
                f"❌ SUPABASE_URL doit être une URL Supabase valide\n"
                f"   Format attendu: https://xxx.supabase.co\n"
                f"   Reçu: {self.SUPABASE_URL[:50]}..."
            )
        
        # Ensure directories exist
        self.UPLOAD_DIR.mkdir(exist_ok=True)
        self.PROCESSED_DIR.mkdir(exist_ok=True)
        (self.UPLOAD_DIR / "avatars").mkdir(exist_ok=True)
    
    ALLOWED_EXTENSIONS: set = {"mp3", "wav", "ogg", "flac"}
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50 MB
    
    # Gemini AI Configuration
    # Charge depuis .env ou variable d'environnement système
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # JWT Secret Key (OBLIGATOIRE)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")

settings = Settings()
