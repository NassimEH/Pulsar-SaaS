import librosa
import soundfile as sf
import numpy as np
from pathlib import Path
from ..core.config import settings
import uuid
from scipy import signal

class AudioProcessor:
    @staticmethod
    def process_audio(file_path: Path, speed: float = 1.0, pitch: float = 0.0, nightcore: bool = False, reverb: float = 0.0) -> Path:
        # Load audio
        y, sr = librosa.load(file_path, sr=None)
        
        # Gérer le stéréo/mono
        is_stereo = y.ndim > 1
        if is_stereo:
            # Traiter chaque canal séparément
            y_left = y[0] if y.shape[0] > 0 else y
            y_right = y[1] if y.shape[0] > 1 else y_left
        else:
            y_left = y
            y_right = y
        
        # Apply Nightcore (Speed up + Pitch up)
        if nightcore:
            speed = 1.25
            pitch = 3.0  # Semitones
            
        # Time stretch
        if speed != 1.0:
            y_left = librosa.effects.time_stretch(y_left, rate=speed)
            if is_stereo:
                y_right = librosa.effects.time_stretch(y_right, rate=speed)
            
        # Pitch shift
        if pitch != 0.0:
            y_left = librosa.effects.pitch_shift(y_left, sr=sr, n_steps=pitch)
            if is_stereo:
                y_right = librosa.effects.pitch_shift(y_right, sr=sr, n_steps=pitch)
        
        # Apply reverb
        if reverb > 0.0:
            y_left = AudioProcessor._apply_reverb(y_left, sr, reverb)
            if is_stereo:
                y_right = AudioProcessor._apply_reverb(y_right, sr, reverb)
        
        # Reconstruire le signal stéréo si nécessaire
        if is_stereo:
            y = np.vstack([y_left, y_right])
        else:
            y = y_left
            
        # Save processed file
        output_filename = f"processed_{uuid.uuid4()}.wav"
        output_path = settings.PROCESSED_DIR / output_filename
        
        sf.write(output_path, y, sr)
        
        return output_path
    
    @staticmethod
    def _apply_reverb(audio: np.ndarray, sr: int, reverb_amount: float) -> np.ndarray:
        """
        Applique une reverb atmosphérique réaliste avec plusieurs réflexions
        reverb_amount: 0.0 (pas de reverb) à 1.0 (reverb maximale)
        """
        if reverb_amount <= 0.0:
            return audio
        
        # Durée de la reverb en secondes (proportionnelle à reverb_amount)
        # Plus la reverb est forte, plus elle dure longtemps
        reverb_duration = 1.0 + (reverb_amount * 3.0)  # Entre 1s et 4s
        reverb_length = int(reverb_duration * sr)
        
        # Créer une réponse impulsionnelle réaliste avec plusieurs composantes
        
        # 1. Early reflections (premiers échos, 0-50ms)
        early_reflections_length = int(0.05 * sr)  # 50ms
        early_reflections = np.zeros(early_reflections_length)
        
        # Ajouter plusieurs réflexions précoces avec des délais différents
        reflection_delays = [int(0.01 * sr), int(0.02 * sr), int(0.03 * sr), int(0.04 * sr)]
        reflection_amplitudes = [0.3, 0.2, 0.15, 0.1]
        
        for delay, amp in zip(reflection_delays, reflection_amplitudes):
            if delay < early_reflections_length:
                early_reflections[delay] = amp * reverb_amount
        
        # 2. Late reverb (réverbération diffuse, après 50ms)
        late_reverb_length = reverb_length - early_reflections_length
        t_late = np.linspace(0, reverb_duration - 0.05, late_reverb_length)
        
        # Créer une décroissance exponentielle avec des modulations pour un son naturel
        # Utiliser plusieurs fréquences de modulation pour créer de la richesse
        decay_rate = 2.0 + (reverb_amount * 3.0)  # Plus rapide pour moins de reverb
        
        # Composante principale avec décroissance exponentielle
        late_reverb = np.exp(-t_late * decay_rate)
        
        # Ajouter des modulations pour créer de la texture (simulation de réflexions multiples)
        modulation1 = 1.0 + 0.3 * np.sin(2 * np.pi * 0.8 * t_late)
        modulation2 = 1.0 + 0.2 * np.sin(2 * np.pi * 1.3 * t_late)
        modulation3 = 1.0 + 0.15 * np.sin(2 * np.pi * 2.1 * t_late)
        
        late_reverb = late_reverb * modulation1 * modulation2 * modulation3
        
        # Ajouter du bruit filtré pour simuler la diffusion naturelle
        # Utiliser un bruit blanc filtré passe-bas pour créer de la texture
        noise = np.random.normal(0, 0.05, late_reverb_length)
        # Filtrer le bruit avec un filtre passe-bas simple (moyenne mobile)
        window_size = int(0.01 * sr)  # 10ms
        if window_size > 0:
            noise_filtered = np.convolve(noise, np.ones(window_size)/window_size, mode='same')
        else:
            noise_filtered = noise
        
        late_reverb = late_reverb * (1.0 + noise_filtered * reverb_amount)
        
        # Normaliser la composante late
        if np.max(np.abs(late_reverb)) > 0:
            late_reverb = late_reverb / np.max(np.abs(late_reverb))
        
        # Combiner early reflections et late reverb
        impulse_response = np.concatenate([early_reflections, late_reverb * reverb_amount])
        
        # S'assurer que la longueur est correcte
        if len(impulse_response) > reverb_length:
            impulse_response = impulse_response[:reverb_length]
        elif len(impulse_response) < reverb_length:
            padding = np.zeros(reverb_length - len(impulse_response))
            impulse_response = np.concatenate([impulse_response, padding])
        
        # Normaliser la réponse impulsionnelle
        if np.max(np.abs(impulse_response)) > 0:
            impulse_response = impulse_response / np.max(np.abs(impulse_response))
        
        # Appliquer la reverb avec convolution
        reverb_signal = signal.convolve(audio, impulse_response, mode='same')
        
        # Mélanger l'audio original avec la reverb
        # reverb_amount contrôle le mix : 0.0 = original seulement, 1.0 = beaucoup de reverb
        # Pour une reverb atmosphérique, on peut aller jusqu'à 60% de wet signal
        wet_amount = reverb_amount * 0.6  # Jusqu'à 60% de reverb
        dry_amount = 1.0 - wet_amount
        
        result = dry_amount * audio + wet_amount * reverb_signal
        
        # Normaliser pour éviter le clipping
        max_val = np.max(np.abs(result))
        if max_val > 1.0:
            result = result / max_val
        
        return result
