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
            
            # Construire le prompt
            prompt = f"""Tu es un ingénieur du son professionnel et critique musical exigeant. Analyse ces données audio techniques :

BPM: {features.get('bpm', 'N/A')}
Tonalité: {features.get('key', 'N/A')}
Niveau RMS: {features.get('rms_level', 'N/A')}
Centroïde spectral: {features.get('spectral_centroid', 'N/A')} Hz
Bande passante spectrale: {features.get('spectral_bandwidth', 'N/A')} Hz
Taux de passage par zéro: {features.get('zero_crossing_rate', 'N/A')}

CONSIGNES :
- Sois TRÈS critique et honnête
- Identifie les problèmes de mixage, de mastering, d'équilibre fréquentiel
- Donne des recommandations PRÉCISES et techniques
- Compare aux standards professionnels de l'industrie musicale
- Mentionne les points forts ET les faiblesses
- Utilise un ton professionnel mais direct
- Sois concis (maximum 300 mots)

Format ta réponse en sections claires :
1. Vue d'ensemble
2. Points forts
3. Points à améliorer
4. Recommandations techniques

Réponds uniquement avec le contenu de l'analyse, sans préambule."""

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




