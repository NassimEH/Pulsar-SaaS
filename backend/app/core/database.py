from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from pathlib import Path
import os

# Chemin vers la base de données SQLite
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATABASE_URL = f"sqlite:///{BASE_DIR / 'database.db'}"

# Créer le moteur SQLite avec configuration pour le développement
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Nécessaire pour SQLite
    poolclass=StaticPool,
    echo=False  # Mettre à True pour voir les requêtes SQL
)

# Créer la session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Fonction pour obtenir une session de base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Fonction pour créer toutes les tables
def init_db():
    from app.models.user import Base
    Base.metadata.create_all(bind=engine)

