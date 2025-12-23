import numpy as np
from typing import Dict, Tuple

class ComparisonService:
    """
    Service pour comparer deux fichiers audio et calculer leur ressemblance
    """
    
    @staticmethod
    def compare_features(original_features: Dict, reference_features: Dict) -> Dict:
        """
        Compare les métriques de deux fichiers audio et calcule la ressemblance
        
        Args:
            original_features: Métriques du fichier original
            reference_features: Métriques du fichier de référence
        
        Returns:
            Dict contenant les comparaisons détaillées et le score global
        """
        comparisons = {}
        scores = []
        
        # Liste des métriques à comparer avec leurs poids et seuils
        metrics_config = {
            # Métriques rythmiques
            'bpm': {'weight': 0.15, 'tolerance_pct': 5.0, 'name': 'BPM'},
            'tempo_stability': {'weight': 0.10, 'tolerance_pct': 10.0, 'name': 'Stabilité du tempo'},
            
            # Métriques de niveau
            'rms_level_db': {'weight': 0.12, 'tolerance_pct': 15.0, 'name': 'Niveau RMS'},
            'peak_level_db': {'weight': 0.08, 'tolerance_pct': 20.0, 'name': 'Niveau Peak'},
            'crest_factor_db': {'weight': 0.10, 'tolerance_pct': 25.0, 'name': 'Crest Factor'},
            'dynamic_range_db': {'weight': 0.10, 'tolerance_pct': 20.0, 'name': 'Dynamic Range'},
            
            # Métriques spectrales
            'spectral_centroid': {'weight': 0.12, 'tolerance_pct': 15.0, 'name': 'Centroïde spectral'},
            'spectral_bandwidth': {'weight': 0.08, 'tolerance_pct': 20.0, 'name': 'Bande passante spectrale'},
            'spectral_rolloff': {'weight': 0.08, 'tolerance_pct': 15.0, 'name': 'Spectral Rolloff'},
            'spectral_contrast': {'weight': 0.07, 'tolerance_pct': 25.0, 'name': 'Spectral Contrast'},
            
            # Énergie par bandes fréquentielles
            'bass_energy_pct': {'weight': 0.05, 'tolerance_pct': 20.0, 'name': 'Énergie Basses'},
            'low_mid_energy_pct': {'weight': 0.05, 'tolerance_pct': 20.0, 'name': 'Énergie Bas-médiums'},
            'mid_energy_pct': {'weight': 0.05, 'tolerance_pct': 20.0, 'name': 'Énergie Médiums'},
            'high_mid_energy_pct': {'weight': 0.05, 'tolerance_pct': 20.0, 'name': 'Énergie Hauts-médiums'},
            'treble_energy_pct': {'weight': 0.05, 'tolerance_pct': 20.0, 'name': 'Énergie Aigus'},
            
            # Métriques harmoniques
            'harmonic_ratio': {'weight': 0.08, 'tolerance_pct': 20.0, 'name': 'Ratio harmonique'},
            'percussive_ratio': {'weight': 0.08, 'tolerance_pct': 20.0, 'name': 'Ratio percussif'},
        }
        
        # Comparer chaque métrique
        for metric_key, config in metrics_config.items():
            original_value = original_features.get(metric_key)
            reference_value = reference_features.get(metric_key)
            
            if original_value is None or reference_value is None:
                continue
            
            # Calculer la différence relative en pourcentage
            if reference_value != 0:
                diff_pct = abs((original_value - reference_value) / reference_value) * 100
            else:
                # Si la valeur de référence est 0, utiliser la différence absolue
                diff_pct = abs(original_value - reference_value) * 100 if original_value != 0 else 0
            
            # Calculer le score de ressemblance (0-100)
            # Plus la différence est petite, plus le score est élevé
            tolerance = config['tolerance_pct']
            if diff_pct <= tolerance:
                # Dans la tolérance : score parfait à excellent
                score = 100 - (diff_pct / tolerance) * 20  # 100 à 80
            elif diff_pct <= tolerance * 2:
                # Proche : score bon à moyen
                score = 80 - ((diff_pct - tolerance) / tolerance) * 30  # 80 à 50
            elif diff_pct <= tolerance * 3:
                # Éloigné : score moyen à faible
                score = 50 - ((diff_pct - tolerance * 2) / tolerance) * 30  # 50 à 20
            else:
                # Très éloigné : score faible
                score = max(0, 20 - (diff_pct - tolerance * 3) / tolerance * 20)
            
            score = max(0, min(100, score))  # Clamp entre 0 et 100
            
            # Déterminer le statut
            if score >= 80:
                status = "très_proche"
                status_label = "Très proche"
            elif score >= 60:
                status = "proche"
                status_label = "Proche"
            elif score >= 40:
                status = "moyen"
                status_label = "Moyennement proche"
            elif score >= 20:
                status = "éloigné"
                status_label = "Éloigné"
            else:
                status = "très_éloigné"
                status_label = "Très éloigné"
            
            comparisons[metric_key] = {
                'name': config['name'],
                'original_value': round(float(original_value), 2),
                'reference_value': round(float(reference_value), 2),
                'difference_pct': round(diff_pct, 2),
                'score': round(score, 1),
                'status': status,
                'status_label': status_label,
                'weight': config['weight']
            }
            
            # Ajouter le score pondéré à la liste
            scores.append(score * config['weight'])
        
        # Calculer le score global de ressemblance
        # La somme des poids devrait être 1.0, mais on s'assure que le score ne dépasse pas 100
        total_weight = sum(config['weight'] for config in metrics_config.values())
        global_score = sum(scores) if scores else 0
        
        # Normaliser si nécessaire et s'assurer qu'on ne dépasse pas 100%
        if total_weight > 0:
            global_score = global_score / total_weight
        
        # Clamp entre 0 et 100
        global_score = max(0, min(100, global_score))
        
        # Déterminer le statut global
        if global_score >= 100:
            global_status = "identique"
            global_status_label = "Identique"
        elif global_score >= 80:
            global_status = "très_proche"
            global_status_label = "Très proche"
        elif global_score >= 60:
            global_status = "proche"
            global_status_label = "Proche"
        elif global_score >= 40:
            global_status = "moyen"
            global_status_label = "Moyennement proche"
        elif global_score >= 20:
            global_status = "éloigné"
            global_status_label = "Éloigné"
        else:
            global_status = "très_éloigné"
            global_status_label = "Très éloigné"
        
        return {
            'global_score': round(global_score, 1),
            'global_status': global_status,
            'global_status_label': global_status_label,
            'comparisons': comparisons,
            'original_key': original_features.get('key', 'N/A'),
            'reference_key': reference_features.get('key', 'N/A')
        }

