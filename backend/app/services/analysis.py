import librosa
import numpy as np
from pathlib import Path

class FeatureExtractor:
    @staticmethod
    def analyze(file_path: Path):
        y, sr = librosa.load(file_path, duration=30)  # Analyze first 30s for speed
        
        # === Métriques de base ===
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
        
        # === Nouvelles métriques de niveau ===
        # Peak level (dB)
        peak_level = np.max(np.abs(y))
        peak_level_db = 20 * np.log10(peak_level + 1e-10)  # Éviter log(0)
        
        # RMS level (dB)
        rms_db = 20 * np.log10(rms + 1e-10)
        
        # Crest Factor (ratio peak/RMS) - indicateur de dynamique
        crest_factor = peak_level / (rms + 1e-10)
        crest_factor_db = 20 * np.log10(crest_factor + 1e-10)
        
        # Dynamic Range (différence entre peak et RMS en dB)
        dynamic_range = peak_level_db - rms_db
        
        # === Nouvelles métriques spectrales ===
        # Spectral Rolloff - fréquence où 85% de l'énergie est concentrée
        spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85))
        
        # Spectral Contrast - contraste entre pics et vallées fréquentielles
        spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
        spectral_contrast_mean = np.mean(spectral_contrast)
        
        # Spectral Flatness - mesure de la "pureté tonale" vs "bruit"
        stft = librosa.stft(y)
        magnitude = np.abs(stft)
        spectral_flatness = np.mean(librosa.feature.spectral_flatness(S=magnitude))
        
        # === Analyse par bandes fréquentielles ===
        # Calculer l'énergie dans différentes bandes
        stft = librosa.stft(y)
        magnitude = np.abs(stft)
        freqs = librosa.fft_frequencies(sr=sr)
        
        # Basses (20-250 Hz)
        bass_mask = (freqs >= 20) & (freqs < 250)
        bass_energy = np.mean(np.sum(magnitude[bass_mask, :], axis=0))
        
        # Bas-médiums (250-500 Hz)
        low_mid_mask = (freqs >= 250) & (freqs < 500)
        low_mid_energy = np.mean(np.sum(magnitude[low_mid_mask, :], axis=0))
        
        # Médiums (500-2000 Hz)
        mid_mask = (freqs >= 500) & (freqs < 2000)
        mid_energy = np.mean(np.sum(magnitude[mid_mask, :], axis=0))
        
        # Hauts-médiums (2000-4000 Hz)
        high_mid_mask = (freqs >= 2000) & (freqs < 4000)
        high_mid_energy = np.mean(np.sum(magnitude[high_mid_mask, :], axis=0))
        
        # Aigus (4000-20000 Hz)
        treble_mask = (freqs >= 4000) & (freqs <= 20000)
        treble_energy = np.mean(np.sum(magnitude[treble_mask, :], axis=0))
        
        # Total energy pour normaliser
        total_energy = bass_energy + low_mid_energy + mid_energy + high_mid_energy + treble_energy
        
        # === Analyse harmonique/percussive ===
        y_harmonic, y_percussive = librosa.effects.hpss(y)
        harmonic_ratio = np.sum(np.abs(y_harmonic)) / (np.sum(np.abs(y_harmonic)) + np.sum(np.abs(y_percussive)) + 1e-10)
        
        # === Tempo stability ===
        # Analyser la variation du tempo sur plusieurs segments
        tempo_variations = []
        segment_length = len(y) // 4
        for i in range(4):
            segment = y[i * segment_length:(i + 1) * segment_length]
            if len(segment) > 0:
                tempo_seg, _ = librosa.beat.beat_track(y=segment, sr=sr)
                tempo_variations.append(tempo_seg)
        tempo_stability = 1.0 - (np.std(tempo_variations) / (np.mean(tempo_variations) + 1e-10)) if len(tempo_variations) > 1 else 1.0
        
        # === Stéréo (si disponible) ===
        is_stereo = len(y.shape) > 1 and y.shape[0] > 1
        stereo_width = 0.0
        if is_stereo and y.shape[0] == 2:
            # Calculer la corrélation stéréo (largeur)
            left = y[0]
            right = y[1]
            min_len = min(len(left), len(right))
            if min_len > 0:
                correlation = np.corrcoef(left[:min_len], right[:min_len])[0, 1]
                stereo_width = float(correlation) if not np.isnan(correlation) else 0.0
        else:
            # Mono - utiliser le signal unique
            y = y.flatten() if len(y.shape) > 1 else y

        return {
            # Métriques de base
            "bpm": round(float(tempo), 1),
            "key": detected_key,
            "spectral_centroid": float(spectral_centroid),
            "spectral_bandwidth": float(spectral_bandwidth),
            "rms_level": float(rms),
            "zero_crossing_rate": float(zero_crossing_rate),
            "duration": librosa.get_duration(y=y, sr=sr),
            
            # Nouvelles métriques de niveau
            "peak_level_db": round(float(peak_level_db), 2),
            "rms_level_db": round(float(rms_db), 2),
            "crest_factor": round(float(crest_factor), 2),
            "crest_factor_db": round(float(crest_factor_db), 2),
            "dynamic_range_db": round(float(dynamic_range), 2),
            
            # Nouvelles métriques spectrales
            "spectral_rolloff": round(float(spectral_rolloff), 1),
            "spectral_contrast": round(float(spectral_contrast_mean), 2),
            "spectral_flatness": round(float(spectral_flatness), 3),
            
            # Analyse par bandes fréquentielles (pourcentages)
            "bass_energy_pct": round(float((bass_energy / (total_energy + 1e-10)) * 100), 1),
            "low_mid_energy_pct": round(float((low_mid_energy / (total_energy + 1e-10)) * 100), 1),
            "mid_energy_pct": round(float((mid_energy / (total_energy + 1e-10)) * 100), 1),
            "high_mid_energy_pct": round(float((high_mid_energy / (total_energy + 1e-10)) * 100), 1),
            "treble_energy_pct": round(float((treble_energy / (total_energy + 1e-10)) * 100), 1),
            
            # Analyse harmonique/percussive
            "harmonic_ratio": round(float(harmonic_ratio), 3),
            "percussive_ratio": round(float(1 - harmonic_ratio), 3),
            
            # Stabilité
            "tempo_stability": round(float(tempo_stability), 3),
            
            # Stéréo
            "is_stereo": is_stereo,
            "stereo_width": round(float(stereo_width), 3) if is_stereo else 0.0,
        }
