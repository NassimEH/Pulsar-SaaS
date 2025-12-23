import librosa
import soundfile as sf
import numpy as np
from pathlib import Path
from ..core.config import settings
import uuid
from scipy import signal

class AudioProcessor:
    @staticmethod
    def process_audio(
        file_path: Path, 
        speed: float = 1.0, 
        pitch: float = 0.0, 
        nightcore: bool = False, 
        reverb: float = 0.0,
        gain: float = 0.0,
        low_pass: float = 20000.0,
        high_pass: float = 20.0,
        delay: float = 0.0,
        delay_time: float = 250.0,
        delay_feedback: float = 0.3,
        chorus: float = 0.0,
        chorus_rate: float = 1.5,
        chorus_depth: float = 0.3,
        flanger: float = 0.0,
        flanger_rate: float = 0.5,
        flanger_depth: float = 0.5,
        phaser: float = 0.0,
        phaser_rate: float = 0.5,
        distortion: float = 0.0,
        compression: float = 0.0,
        compression_ratio: float = 4.0,
        compression_threshold: float = -12.0,
        normalize: bool = False,
        reverse: bool = False,
        fade_in: float = 0.0,
        fade_out: float = 0.0,
        pan: float = 0.0,
        eq_bass: float = 0.0,
        eq_low_mid: float = 0.0,
        eq_mid: float = 0.0,
        eq_high_mid: float = 0.0,
        eq_treble: float = 0.0
    ) -> Path:
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
        
        # Apply gain
        if gain != 0.0:
            gain_linear = 10 ** (gain / 20.0)
            y_left = y_left * gain_linear
            if is_stereo:
                y_right = y_right * gain_linear
        
        # Apply EQ
        if eq_bass != 0.0 or eq_low_mid != 0.0 or eq_mid != 0.0 or eq_high_mid != 0.0 or eq_treble != 0.0:
            y_left = AudioProcessor._apply_eq(y_left, sr, eq_bass, eq_low_mid, eq_mid, eq_high_mid, eq_treble)
            if is_stereo:
                y_right = AudioProcessor._apply_eq(y_right, sr, eq_bass, eq_low_mid, eq_mid, eq_high_mid, eq_treble)
        
        # Apply filters
        if low_pass < 20000.0:
            y_left = AudioProcessor._apply_lowpass(y_left, sr, low_pass)
            if is_stereo:
                y_right = AudioProcessor._apply_lowpass(y_right, sr, low_pass)
        
        if high_pass > 20.0:
            y_left = AudioProcessor._apply_highpass(y_left, sr, high_pass)
            if is_stereo:
                y_right = AudioProcessor._apply_highpass(y_right, sr, high_pass)
        
        # Apply delay
        if delay > 0.0:
            y_left = AudioProcessor._apply_delay(y_left, sr, delay, delay_time, delay_feedback)
            if is_stereo:
                y_right = AudioProcessor._apply_delay(y_right, sr, delay, delay_time, delay_feedback)
        
        # Apply chorus
        if chorus > 0.0:
            y_left = AudioProcessor._apply_chorus(y_left, sr, chorus, chorus_rate, chorus_depth)
            if is_stereo:
                y_right = AudioProcessor._apply_chorus(y_right, sr, chorus, chorus_rate, chorus_depth)
        
        # Apply flanger
        if flanger > 0.0:
            y_left = AudioProcessor._apply_flanger(y_left, sr, flanger, flanger_rate, flanger_depth)
            if is_stereo:
                y_right = AudioProcessor._apply_flanger(y_right, sr, flanger, flanger_rate, flanger_depth)
        
        # Apply phaser
        if phaser > 0.0:
            y_left = AudioProcessor._apply_phaser(y_left, sr, phaser, phaser_rate)
            if is_stereo:
                y_right = AudioProcessor._apply_phaser(y_right, sr, phaser, phaser_rate)
        
        # Apply distortion
        if distortion > 0.0:
            y_left = AudioProcessor._apply_distortion(y_left, distortion)
            if is_stereo:
                y_right = AudioProcessor._apply_distortion(y_right, distortion)
        
        # Apply compression
        if compression > 0.0:
            y_left = AudioProcessor._apply_compression(y_left, sr, compression, compression_ratio, compression_threshold)
            if is_stereo:
                y_right = AudioProcessor._apply_compression(y_right, sr, compression, compression_ratio, compression_threshold)
        
        # Apply pan
        if pan != 0.0 and is_stereo:
            y_left, y_right = AudioProcessor._apply_pan(y_left, y_right, pan)
        
        # Apply reverse
        if reverse:
            y_left = np.flip(y_left)
            if is_stereo:
                y_right = np.flip(y_right)
        
        # Apply fade in/out
        if fade_in > 0.0 or fade_out > 0.0:
            y_left = AudioProcessor._apply_fade(y_left, sr, fade_in, fade_out)
            if is_stereo:
                y_right = AudioProcessor._apply_fade(y_right, sr, fade_in, fade_out)
        
        # Normalize
        if normalize:
            max_val = np.max(np.abs(y_left))
            if max_val > 0:
                y_left = y_left / max_val
            if is_stereo:
                max_val = np.max(np.abs(y_right))
                if max_val > 0:
                    y_right = y_right / max_val
        
        # Reconstruire le signal stéréo si nécessaire
        if is_stereo:
            y = np.vstack([y_left, y_right])
        else:
            y = y_left
        
        # Normalisation finale pour éviter le clipping
        max_val = np.max(np.abs(y))
        if max_val > 1.0:
            y = y / max_val
            
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
    
    @staticmethod
    def _apply_eq(audio: np.ndarray, sr: int, bass: float, low_mid: float, mid: float, high_mid: float, treble: float) -> np.ndarray:
        """Applique un égaliseur 5 bandes"""
        if bass == 0.0 and low_mid == 0.0 and mid == 0.0 and high_mid == 0.0 and treble == 0.0:
            return audio
        
        # Utiliser des filtres IIR pour chaque bande
        nyquist = sr / 2.0
        
        result = audio.copy()
        
        # Basses (20-250 Hz)
        if bass != 0.0:
            low = 20.0 / nyquist
            high = 250.0 / nyquist
            b, a = signal.butter(4, [low, high], btype='band')
            filtered = signal.filtfilt(b, a, result)
            result = result + filtered * (10 ** (bass / 20.0) - 1.0)
        
        # Bas-médiums (250-500 Hz)
        if low_mid != 0.0:
            low = 250.0 / nyquist
            high = 500.0 / nyquist
            b, a = signal.butter(4, [low, high], btype='band')
            filtered = signal.filtfilt(b, a, result)
            result = result + filtered * (10 ** (low_mid / 20.0) - 1.0)
        
        # Médiums (500-2000 Hz)
        if mid != 0.0:
            low = 500.0 / nyquist
            high = 2000.0 / nyquist
            b, a = signal.butter(4, [low, high], btype='band')
            filtered = signal.filtfilt(b, a, result)
            result = result + filtered * (10 ** (mid / 20.0) - 1.0)
        
        # Hauts-médiums (2000-4000 Hz)
        if high_mid != 0.0:
            low = 2000.0 / nyquist
            high = 4000.0 / nyquist
            b, a = signal.butter(4, [low, high], btype='band')
            filtered = signal.filtfilt(b, a, result)
            result = result + filtered * (10 ** (high_mid / 20.0) - 1.0)
        
        # Aigus (4000-20000 Hz)
        if treble != 0.0:
            low = 4000.0 / nyquist
            high = min(20000.0 / nyquist, 0.99)
            b, a = signal.butter(4, [low, high], btype='band')
            filtered = signal.filtfilt(b, a, result)
            result = result + filtered * (10 ** (treble / 20.0) - 1.0)
        
        return result
    
    @staticmethod
    def _apply_lowpass(audio: np.ndarray, sr: int, cutoff: float) -> np.ndarray:
        """Applique un filtre passe-bas"""
        if cutoff >= 20000.0:
            return audio
        nyquist = sr / 2.0
        normal_cutoff = min(cutoff / nyquist, 0.99)
        b, a = signal.butter(4, normal_cutoff, btype='low')
        return signal.filtfilt(b, a, audio)
    
    @staticmethod
    def _apply_highpass(audio: np.ndarray, sr: int, cutoff: float) -> np.ndarray:
        """Applique un filtre passe-haut"""
        if cutoff <= 20.0:
            return audio
        nyquist = sr / 2.0
        normal_cutoff = max(cutoff / nyquist, 0.001)
        b, a = signal.butter(4, normal_cutoff, btype='high')
        return signal.filtfilt(b, a, audio)
    
    @staticmethod
    def _apply_delay(audio: np.ndarray, sr: int, amount: float, delay_time_ms: float, feedback: float) -> np.ndarray:
        """Applique un effet de delay"""
        if amount <= 0.0:
            return audio
        
        delay_samples = int((delay_time_ms / 1000.0) * sr)
        if delay_samples <= 0:
            return audio
        
        result = audio.copy()
        delayed = np.zeros_like(audio)
        
        # Créer le signal retardé
        if delay_samples < len(audio):
            delayed[delay_samples:] = audio[:-delay_samples]
        
        # Ajouter le feedback
        if feedback > 0.0 and delay_samples * 2 < len(audio):
            delayed[delay_samples * 2:] += audio[:-delay_samples * 2] * feedback
        
        # Mixer avec l'original
        result = result + delayed * amount
        
        # Normaliser pour éviter le clipping
        max_val = np.max(np.abs(result))
        if max_val > 1.0:
            result = result / max_val
        
        return result
    
    @staticmethod
    def _apply_chorus(audio: np.ndarray, sr: int, amount: float, rate: float, depth: float) -> np.ndarray:
        """Applique un effet chorus"""
        if amount <= 0.0:
            return audio
        
        length = len(audio)
        t = np.arange(length) / sr
        
        # Créer une modulation de délai avec LFO
        delay_base = int(0.01 * sr)  # 10ms de base
        delay_mod = depth * delay_base * np.sin(2 * np.pi * rate * t)
        delay_samples = (delay_base + delay_mod).astype(int)
        
        result = np.zeros_like(audio)
        
        for i in range(length):
            delay_idx = i - delay_samples[i]
            if delay_idx >= 0 and delay_idx < length:
                result[i] = audio[i] + audio[delay_idx] * amount * 0.5
            else:
                result[i] = audio[i]
        
        return result
    
    @staticmethod
    def _apply_flanger(audio: np.ndarray, sr: int, amount: float, rate: float, depth: float) -> np.ndarray:
        """Applique un effet flanger"""
        if amount <= 0.0:
            return audio
        
        length = len(audio)
        t = np.arange(length) / sr
        
        # Délai très court avec modulation
        delay_base = int(0.001 * sr)  # 1ms de base
        delay_mod = depth * delay_base * np.sin(2 * np.pi * rate * t)
        delay_samples = (delay_base + delay_mod).astype(int)
        
        result = np.zeros_like(audio)
        
        for i in range(length):
            delay_idx = i - delay_samples[i]
            if delay_idx >= 0 and delay_idx < length:
                result[i] = audio[i] + audio[delay_idx] * amount * 0.7
            else:
                result[i] = audio[i]
        
        return result
    
    @staticmethod
    def _apply_phaser(audio: np.ndarray, sr: int, amount: float, rate: float) -> np.ndarray:
        """Applique un effet phaser"""
        if amount <= 0.0:
            return audio
        
        # Utiliser un filtre passe-all avec modulation
        length = len(audio)
        t = np.arange(length) / sr
        
        # Fréquence de modulation
        mod_freq = rate
        mod_depth = amount * 2000.0  # Hz
        
        # Créer un filtre passe-all modulé
        center_freq = 1000.0 + mod_depth * np.sin(2 * np.pi * mod_freq * t)
        
        result = np.zeros_like(audio)
        nyquist = sr / 2.0
        
        # Appliquer le filtre par blocs
        block_size = int(0.01 * sr)  # 10ms
        for i in range(0, length, block_size):
            end = min(i + block_size, length)
            block = audio[i:end]
            
            if len(block) > 0:
                freq = center_freq[i]
                if freq > 20 and freq < nyquist:
                    normal_freq = freq / nyquist
                    # Filtre passe-all approximé avec un filtre passe-bande étroit
                    b, a = signal.butter(2, [normal_freq * 0.9, min(normal_freq * 1.1, 0.99)], btype='band')
                    filtered = signal.filtfilt(b, a, block)
                    result[i:end] = block + filtered * amount * 0.5
                else:
                    result[i:end] = block
        
        return result
    
    @staticmethod
    def _apply_distortion(audio: np.ndarray, amount: float) -> np.ndarray:
        """Applique une distorsion"""
        if amount <= 0.0:
            return audio
        
        # Distorsion soft clipping
        result = np.tanh(audio * (1.0 + amount * 9.0))
        return result
    
    @staticmethod
    def _apply_compression(audio: np.ndarray, sr: int, amount: float, ratio: float, threshold_db: float) -> np.ndarray:
        """Applique une compression"""
        if amount <= 0.0:
            return audio
        
        threshold_linear = 10 ** (threshold_db / 20.0)
        
        # Convertir en dB pour le traitement
        audio_db = np.abs(audio)
        audio_db = np.maximum(audio_db, 1e-10)  # Éviter log(0)
        audio_db = 20 * np.log10(audio_db)
        
        # Appliquer la compression
        compressed_db = audio_db.copy()
        above_threshold = audio_db > threshold_db
        
        if np.any(above_threshold):
            excess = audio_db[above_threshold] - threshold_db
            compressed_db[above_threshold] = threshold_db + excess / ratio
        
        # Convertir back en linéaire
        compressed_linear = 10 ** (compressed_db / 20.0)
        compressed_linear = np.sign(audio) * compressed_linear
        
        # Mixer avec l'original selon amount
        result = audio * (1.0 - amount) + compressed_linear * amount
        
        return result
    
    @staticmethod
    def _apply_pan(left: np.ndarray, right: np.ndarray, pan: float) -> tuple:
        """Applique un pan stéréo"""
        if pan == 0.0:
            return left, right
        
        # Pan law: -1 (gauche) à 1 (droite)
        # À gauche: left = 1.0, right = 0.0
        # À droite: left = 0.0, right = 1.0
        # Centre: left = 0.707, right = 0.707 (pan law)
        
        if pan < 0.0:  # Pan à gauche
            left_gain = 1.0
            right_gain = (1.0 + pan) * 0.707  # Pan law
        else:  # Pan à droite
            left_gain = (1.0 - pan) * 0.707  # Pan law
            right_gain = 1.0
        
        return left * left_gain, right * right_gain
    
    @staticmethod
    def _apply_fade(audio: np.ndarray, sr: int, fade_in: float, fade_out: float) -> np.ndarray:
        """Applique un fade in et/ou fade out"""
        result = audio.copy()
        length = len(audio)
        
        # Fade in
        if fade_in > 0.0:
            fade_in_samples = int(fade_in * sr)
            fade_in_samples = min(fade_in_samples, length)
            if fade_in_samples > 0:
                fade_curve = np.linspace(0, 1, fade_in_samples)
                result[:fade_in_samples] *= fade_curve
        
        # Fade out
        if fade_out > 0.0:
            fade_out_samples = int(fade_out * sr)
            fade_out_samples = min(fade_out_samples, length)
            if fade_out_samples > 0:
                fade_curve = np.linspace(1, 0, fade_out_samples)
                result[-fade_out_samples:] *= fade_curve
        
        return result
