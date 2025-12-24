from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Brainwave Audio API",
    description="Backend for Brainwave Audio Micro-SaaS",
    version="1.0.0"
)

# CORS Configuration
origins = [
    "http://localhost:5173",  # Vite Dev Server
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialiser la base de données au démarrage
from app.core.database import init_db
init_db()

from app.api.endpoints import router as api_router
from app.api.auth import router as auth_router

app.include_router(api_router, prefix="/api")
app.include_router(auth_router, prefix="/api")  # Le router auth a déjà le prefix "/auth", donc ça devient "/api/auth"

@app.get("/")
async def root():
    return {"message": "Brainwave Audio API is running"}
