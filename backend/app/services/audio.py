import librosa
import soundfile as sf
import numpy as np
from pathlib import Path
from ..core.config import settings
import uuid

class AudioProcessor:
    @staticmethod
    def process_audio(file_path: Path, speed: float = 1.0, pitch: float = 0.0, nightcore: bool = False) -> Path:
        # Load audio
        y, sr = librosa.load(file_path, sr=None)
        
        # Apply Nightcore (Speed up + Pitch up)
        if nightcore:
            speed = 1.25
            pitch = 3.0  # Semitones
            
        # Time stretch
        if speed != 1.0:
            y = librosa.effects.time_stretch(y, rate=speed)
            
        # Pitch shift
        if pitch != 0.0:
            y = librosa.effects.pitch_shift(y, sr=sr, n_steps=pitch)
            
        # Save processed file
        output_filename = f"processed_{uuid.uuid4()}.wav"
        output_path = settings.PROCESSED_DIR / output_filename
        
        sf.write(output_path, y, sr)
        
        return output_path
