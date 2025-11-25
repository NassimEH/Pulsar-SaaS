import os
from pathlib import Path

class Settings:
    PROJECT_NAME: str = "Brainwave Audio API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Base directory
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    
    # Uploads directory
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "processed"
    
    ALLOWED_EXTENSIONS: set = {"mp3", "wav", "ogg", "flac"}
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50 MB

    def __init__(self):
        # Ensure directories exist
        self.UPLOAD_DIR.mkdir(exist_ok=True)
        self.PROCESSED_DIR.mkdir(exist_ok=True)

settings = Settings()
