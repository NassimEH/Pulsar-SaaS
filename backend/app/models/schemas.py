from pydantic import BaseModel
from typing import Optional

class AnalysisResponse(BaseModel):
    filename: str
    features: dict

class ProcessRequest(BaseModel):
    filename: str
    speed: float = 1.0
    pitch: float = 0.0
    nightcore: bool = False

class ProcessResponse(BaseModel):
    download_url: str

class AIAnalysisRequest(BaseModel):
    features: dict

class AIAnalysisResponse(BaseModel):
    report: str
    source: str = "gemini-ai"