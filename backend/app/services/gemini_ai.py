import os
import warnings
from typing import Dict, Optional

# Essayer d'importer le nouveau package, sinon utiliser l'ancien
try:
    import google.genai as genai
    USE_NEW_PACKAGE = True
except ImportError:
    # Supprimer le warning FutureWarning pour l'ancien package
    warnings.filterwarnings('ignore', category=FutureWarning, message='.*google.generativeai.*')
    import google.generativeai as genai
    USE_NEW_PACKAGE = False

class GeminiAIService:
    """Service pour interagir avec l'API Gemini AI de Google"""
    
    @staticmethod
    def initialize():
        """Initialise l'API Gemini avec la clé API"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        
        if USE_NEW_PACKAGE:
            # Le nouveau package utilise Client
            return genai.Client(api_key=api_key)
        else:
            # L'ancien package utilise configure
            genai.configure(api_key=api_key)
            return None
    
    @staticmethod
    def generate_audio_analysis(features: Dict) -> str:
        """
        Génère une analyse audio professionnelle avec Gemini AI
        
        Args:
            features: Dictionnaire contenant les caractéristiques audio (bpm, key, rms_level, spectral_centroid)
        
        Returns:
            str: Rapport d'analyse généré par l'IA
        """
        try:
            # Charger la clé API depuis la configuration (qui charge le .env)
            from ..core.config import settings
            api_key = settings.GEMINI_API_KEY
            
            if not api_key:
                raise ValueError("GEMINI_API_KEY n'est pas configurée. Vérifiez votre fichier .env dans le dossier backend/")
            
            # Configurer l'API Gemini selon le package utilisé
            if USE_NEW_PACKAGE:
                client = genai.Client(api_key=api_key)
            else:
                genai.configure(api_key=api_key)
            
            # Obtenir la liste des modèles disponibles
            try:
                available_models = []
                if USE_NEW_PACKAGE:
                    # Nouveau package
                    models = client.models.list()
                    for m in models:
                        model_name = m.name
                        if model_name.startswith('models/'):
                            model_name = model_name.replace('models/', '')
                        available_models.append(model_name)
                else:
                    # Ancien package
                    for m in genai.list_models():
                        if 'generateContent' in m.supported_generation_methods:
                            model_name = m.name
                            if model_name.startswith('models/'):
                                model_name = model_name.replace('models/', '')
                            available_models.append(model_name)
                
                print(f"Modèles Gemini disponibles: {available_models}")
                
                if not available_models:
                    raise Exception("Aucun modèle Gemini disponible. Vérifiez votre clé API.")
                
            except Exception as list_error:
                # Si la liste des modèles échoue, utiliser les modèles par défaut
                print(f"Impossible de lister les modèles: {str(list_error)}. Utilisation des modèles par défaut.")
                available_models = ['gemini-2.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
            
            # Construire le prompt avec toutes les métriques
            prompt = f"""Tu es un ingénieur du son professionnel et critique musical exigeant. Analyse ces données audio techniques :

**MÉTRIQUES RYTHMIQUES & HARMONIQUES :**
- BPM: {features.get('bpm', 'N/A')}
- Stabilité du tempo: {features.get('tempo_stability', 'N/A')} (1.0 = parfaitement stable)
- Tonalité: {features.get('key', 'N/A')}

**MÉTRIQUES DE NIVEAU & DYNAMIQUE :**
- Niveau RMS: {features.get('rms_level', 'N/A')} (linéaire) / {features.get('rms_level_db', 'N/A')} dB
- Niveau Peak: {features.get('peak_level_db', 'N/A')} dB
- Crest Factor: {features.get('crest_factor', 'N/A')} ({features.get('crest_factor_db', 'N/A')} dB) - Ratio peak/RMS (indicateur de dynamique)
- Dynamic Range: {features.get('dynamic_range_db', 'N/A')} dB (différence peak-RMS)

**MÉTRIQUES SPECTRALES :**
- Centroïde spectral: {features.get('spectral_centroid', 'N/A')} Hz (brillance moyenne)
- Bande passante spectrale: {features.get('spectral_bandwidth', 'N/A')} Hz
- Spectral Rolloff: {features.get('spectral_rolloff', 'N/A')} Hz (fréquence où 85% de l'énergie est concentrée)
- Spectral Contrast: {features.get('spectral_contrast', 'N/A')} (contraste fréquentiel)
- Spectral Flatness: {features.get('spectral_flatness', 'N/A')} (0=tonal, 1=bruité)
- Taux de passage par zéro: {features.get('zero_crossing_rate', 'N/A')}

**ANALYSE PAR BANDES FRÉQUENTIELLES (pourcentages d'énergie) :**
- Basses (20-250 Hz): {features.get('bass_energy_pct', 'N/A')}%
- Bas-médiums (250-500 Hz): {features.get('low_mid_energy_pct', 'N/A')}%
- Médiums (500-2000 Hz): {features.get('mid_energy_pct', 'N/A')}%
- Hauts-médiums (2000-4000 Hz): {features.get('high_mid_energy_pct', 'N/A')}%
- Aigus (4000-20000 Hz): {features.get('treble_energy_pct', 'N/A')}%

**ANALYSE HARMONIQUE/PERCUSSIVE :**
- Ratio harmonique: {features.get('harmonic_ratio', 'N/A')} (1.0 = 100% harmonique)
- Ratio percussif: {features.get('percussive_ratio', 'N/A')} (1.0 = 100% percussif)

**INFORMATIONS STÉRÉO :**
- Format: {'Stéréo' if features.get('is_stereo', False) else 'Mono'}
- Largeur stéréo: {features.get('stereo_width', 'N/A')} (corrélation L/R, -1 à 1, proche de 1 = mono, proche de 0 = large)

**CONSIGNES D'ANALYSE :**
- Sois TRÈS critique et honnête
- **VULGARISATION IMPORTANTE** : Explique les concepts techniques de façon courante et accessible, tout en restant rigoureux et précis. Utilise des analogies et des termes compréhensibles pour un musicien ou producteur non-expert, mais garde la précision technique nécessaire.
- Utilise TOUTES les métriques fournies pour une analyse complète
- Identifie les problèmes de mixage, de mastering, d'équilibre fréquentiel, de dynamique
- Analyse l'équilibre fréquentiel en utilisant les pourcentages par bandes
- Évalue la dynamique avec le Crest Factor et Dynamic Range
- Vérifie la stabilité rythmique avec la stabilité du tempo
- Analyse la largeur stéréo si applicable
- Donne des recommandations PRÉCISES et techniques basées sur les valeurs réelles
- Compare aux standards professionnels de l'industrie musicale :
  * RMS cible: -9 à -6 dBFS pour streaming moderne
  * Crest Factor: 8-12 dB pour musique dynamique, 4-6 dB pour musique compressée
  * Dynamic Range: >6 dB minimum, idéalement 10-14 dB
  * Équilibre fréquentiel: distribution équilibrée entre les bandes
- Mentionne les points forts ET les faiblesses
- Utilise un ton professionnel mais accessible, avec des explications claires
- Sois concis mais complet (maximum 400 mots)
- **Exemple de vulgarisation** : Au lieu de dire "Le centroïde spectral est bas", dis "Le mix manque de brillance et d'éclat dans les aigus, ce qui le rend un peu terne" tout en mentionnant la valeur technique

**FORMAT DE RÉPONSE (en Markdown) :**
Utilise le format Markdown suivant avec une hiérarchie claire :

# Vue d'ensemble
[Texte de la vue d'ensemble]

## Points forts
[Description des points forts avec **gras** pour les éléments importants]

## Points à améliorer
### [Sous-section 1]
[Description détaillée avec **gras** pour les problèmes critiques]

### [Sous-section 2]
[Description détaillée]

## Recommandations techniques
### Niveaux & Mastering
- [Analyser RMS, Peak, Crest Factor, Dynamic Range]
- [Recommandations pour atteindre les standards de loudness]
- [Recommandations de compression/limitation si nécessaire]

### Équilibrage fréquentiel
- [Analyser la distribution par bandes (basses, médiums, aigus)]
- [Identifier les déséquilibres avec les pourcentages fournis]
- [Recommandations d'égalisation précises par bande]

### Dynamique & Compression
- [Analyser le Crest Factor et Dynamic Range]
- [Recommandations pour préserver ou ajuster la dynamique]

### Stéréo & Espacement
- [Si stéréo: analyser la largeur et donner des recommandations]
- [Recommandations de traitement stéréo si nécessaire]

### Mixage (si nécessaire)
- [Recommandations générales de mixage basées sur toutes les métriques]

**IMPORTANT :** 
- Utilise **gras** pour les termes techniques, valeurs importantes, et concepts clés
- Référence les valeurs exactes des métriques dans ton analyse
- Structure clairement avec des titres de niveaux appropriés
- Sois spécifique avec les valeurs numériques (ex: "Crest Factor de X dB indique..." en utilisant les valeurs réelles fournies)"""

            # Utiliser le premier modèle disponible (prioriser les modèles récents)
            # Ordre de priorité : flash (rapide) > pro (puissant) > autres
            preferred_order = ['gemini-2.0-flash-exp', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro']
            
            # Trier les modèles disponibles selon l'ordre de préférence
            sorted_models = []
            for preferred in preferred_order:
                for model in available_models:
                    if preferred in model.lower() and model not in sorted_models:
                        sorted_models.append(model)
            
            # Ajouter les autres modèles non listés
            for model in available_models:
                if model not in sorted_models:
                    sorted_models.append(model)
            
            if not sorted_models:
                raise Exception(f"Aucun modèle compatible trouvé. Modèles disponibles: {available_models}")
            
            # Essayer les modèles dans l'ordre de préférence
            response = None
            last_error = None
            used_model = None
            
            for model_name in sorted_models:
                try:
                    # Essayer avec et sans préfixe "models/"
                    for model_variant in [model_name, f'models/{model_name}']:
                        try:
                            if USE_NEW_PACKAGE:
                                # Nouveau package google.genai
                                response = client.models.generate_content(
                                    model=model_variant,
                                    contents=prompt
                                )
                            else:
                                # Ancien package google.generativeai
                                model = genai.GenerativeModel(model_variant)
                                response = model.generate_content(prompt)
                            
                            used_model = model_variant
                            print(f"Modèle utilisé avec succès: {model_variant}")
                            break
                        except Exception as e:
                            # Si ça échoue, essayer la variante suivante
                            last_error = e
                            continue
                    
                    if response:
                        break
                        
                except Exception as e:
                    last_error = e
                    print(f"Modèle {model_name} non disponible: {str(e)}")
                    continue
            
            if response is None:
                error_msg = f"Aucun modèle Gemini n'a pu être utilisé.\n"
                error_msg += f"Modèles disponibles détectés: {', '.join(available_models)}\n"
                error_msg += f"Modèles testés: {', '.join(sorted_models)}\n"
                error_msg += f"Dernière erreur: {str(last_error) if last_error else 'Inconnue'}"
                raise Exception(error_msg)
            
            # Extraire le texte de la réponse de manière robuste
            # Le nouveau package peut avoir une structure différente
            text_content = None
            
            # Méthode 1: Accès direct à .text
            if hasattr(response, 'text') and response.text:
                text_content = response.text
            # Méthode 2: Via candidates (ancien format)
            elif hasattr(response, 'candidates') and len(response.candidates) > 0:
                candidate = response.candidates[0]
                if hasattr(candidate, 'content'):
                    if hasattr(candidate.content, 'parts'):
                        # Extraire le texte de toutes les parts
                        parts_text = []
                        for part in candidate.content.parts:
                            if hasattr(part, 'text') and part.text:
                                parts_text.append(part.text)
                            elif isinstance(part, str):
                                parts_text.append(part)
                        if parts_text:
                            text_content = ' '.join(parts_text)
                    elif hasattr(candidate.content, 'text'):
                        text_content = candidate.content.text
                    elif isinstance(candidate.content, str):
                        text_content = candidate.content
            # Méthode 3: Nouveau format du package google.genai
            elif hasattr(response, 'candidates') and len(response.candidates) > 0:
                # Essayer d'accéder au texte via la nouvelle structure
                try:
                    text_content = response.candidates[0].content.parts[0].text
                except (AttributeError, IndexError):
                    pass
            
            # Si on n'a toujours pas de texte, convertir en string
            if not text_content:
                # Essayer de convertir l'objet en string de manière sécurisée
                try:
                    text_content = str(response)
                except:
                    text_content = "Erreur: Impossible d'extraire le texte de la réponse de l'IA."
            
            # S'assurer que c'est bien une string
            return str(text_content) if text_content else "Aucune analyse disponible."
            
        except Exception as e:
            raise Exception(f"Erreur lors de la génération de l'analyse IA: {str(e)}")




