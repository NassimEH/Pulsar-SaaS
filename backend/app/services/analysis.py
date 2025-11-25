import librosa
import numpy as np
from pathlib import Path

class FeatureExtractor:
    @staticmethod
    def analyze(file_path: Path):
        y, sr = librosa.load(file_path, duration=30)  # Analyze first 30s for speed
        
        # Extract features
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        spectral_bandwidth = np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr))
        rms = np.mean(librosa.feature.rms(y=y))
        zero_crossing_rate = np.mean(librosa.feature.zero_crossing_rate(y))
        
        # Key detection (chroma)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        key_index = np.argmax(np.sum(chroma, axis=1))
        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        detected_key = keys[key_index]

        return {
            "bpm": round(float(tempo), 1),
            "key": detected_key,
            "spectral_centroid": float(spectral_centroid),
            "spectral_bandwidth": float(spectral_bandwidth),
            "rms_level": float(rms),
            "zero_crossing_rate": float(zero_crossing_rate),
            "duration": librosa.get_duration(y=y, sr=sr)
        }
