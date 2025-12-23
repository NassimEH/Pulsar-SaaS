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
    reverb: float = 0.0  # Niveau de reverb (0.0 à 1.0)

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