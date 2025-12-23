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