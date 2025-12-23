from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from ..services.upload import UploadService
from ..services.analysis import FeatureExtractor
from ..services.audio import AudioProcessor
from ..services.gemini_ai import GeminiAIService
from ..services.comparison import ComparisonService
from ..models.schemas import AnalysisResponse, ProcessRequest, ProcessResponse, AIAnalysisRequest, AIAnalysisResponse, ComparisonRequest, ComparisonResponse

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        print(f"Received file: {file.filename}")
        file_path = await UploadService.save_upload(file)
        print(f"File saved to: {file_path}")
        return {"filename": file_path.name, "message": "File uploaded successfully"}
    except HTTPException:
        # Re-raise HTTP exceptions (400, 413, etc.) as-is
        raise
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_audio(filename: str = Query(...)):
    try:
        print(f"Analyzing file: {filename}")
        file_path = UploadService.get_file_path(filename)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {filename}")
        features = FeatureExtractor.analyze(file_path)
        print(f"Analysis complete for {filename}")
        return AnalysisResponse(filename=filename, features=features)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process", response_model=ProcessResponse)
async def process_audio(request: ProcessRequest):
    try:
        file_path = UploadService.get_file_path(request.filename)
        output_path = AudioProcessor.process_audio(
            file_path, 
            speed=request.speed, 
            pitch=request.pitch, 
            nightcore=request.nightcore,
            reverb=request.reverb,
            gain=getattr(request, 'gain', 0.0),
            low_pass=getattr(request, 'low_pass', 20000.0),
            high_pass=getattr(request, 'high_pass', 20.0),
            delay=getattr(request, 'delay', 0.0),
            delay_time=getattr(request, 'delay_time', 250.0),
            delay_feedback=getattr(request, 'delay_feedback', 0.3),
            chorus=getattr(request, 'chorus', 0.0),
            chorus_rate=getattr(request, 'chorus_rate', 1.5),
            chorus_depth=getattr(request, 'chorus_depth', 0.3),
            flanger=getattr(request, 'flanger', 0.0),
            flanger_rate=getattr(request, 'flanger_rate', 0.5),
            flanger_depth=getattr(request, 'flanger_depth', 0.5),
            phaser=getattr(request, 'phaser', 0.0),
            phaser_rate=getattr(request, 'phaser_rate', 0.5),
            distortion=getattr(request, 'distortion', 0.0),
            compression=getattr(request, 'compression', 0.0),
            compression_ratio=getattr(request, 'compression_ratio', 4.0),
            compression_threshold=getattr(request, 'compression_threshold', -12.0),
            normalize=getattr(request, 'normalize', False),
            reverse=getattr(request, 'reverse', False),
            fade_in=getattr(request, 'fade_in', 0.0),
            fade_out=getattr(request, 'fade_out', 0.0),
            pan=getattr(request, 'pan', 0.0),
            eq_bass=getattr(request, 'eq_bass', 0.0),
            eq_low_mid=getattr(request, 'eq_low_mid', 0.0),
            eq_mid=getattr(request, 'eq_mid', 0.0),
            eq_high_mid=getattr(request, 'eq_high_mid', 0.0),
            eq_treble=getattr(request, 'eq_treble', 0.0)
        )
        return ProcessResponse(download_url=f"/api/download/{output_path.name}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{filename}")
async def download_file(filename: str):
    from ..core.config import settings
    # Chercher d'abord dans processed, puis dans uploads
    file_path = settings.PROCESSED_DIR / filename
    if not file_path.exists():
        file_path = settings.UPLOAD_DIR / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="audio/wav", filename=filename)

@router.post("/compare", response_model=ComparisonResponse)
async def compare_audio(request: ComparisonRequest):
    """
    Compare deux fichiers audio et retourne un score de ressemblance
    """
    try:
        # Récupérer les chemins des fichiers
        original_path = UploadService.get_file_path(request.original_filename)
        reference_path = UploadService.get_file_path(request.reference_filename)
        
        if not original_path.exists():
            raise HTTPException(status_code=404, detail=f"Fichier original non trouvé: {request.original_filename}")
        if not reference_path.exists():
            raise HTTPException(status_code=404, detail=f"Fichier de référence non trouvé: {request.reference_filename}")
        
        # Analyser les deux fichiers
        print(f"Analyzing original file: {request.original_filename}")
        original_features = FeatureExtractor.analyze(original_path)
        
        print(f"Analyzing reference file: {request.reference_filename}")
        reference_features = FeatureExtractor.analyze(reference_path)
        
        # Comparer les métriques
        comparison_result = ComparisonService.compare_features(original_features, reference_features)
        
        print(f"Comparison complete. Global score: {comparison_result['global_score']}%")
        
        return ComparisonResponse(**comparison_result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Comparison error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la comparaison: {str(e)}")

@router.post("/analyze-ai", response_model=AIAnalysisResponse)
async def analyze_with_ai(request: AIAnalysisRequest):
    """
    Génère un rapport d'analyse audio avec Gemini AI
    """
    try:
        # Vérifier que la clé API est configurée
        from ..core.config import settings
        if not settings.GEMINI_API_KEY:
            raise HTTPException(
                status_code=500, 
                detail="GEMINI_API_KEY n'est pas configurée. Veuillez définir la variable d'environnement GEMINI_API_KEY."
            )
        
        # Générer l'analyse avec Gemini AI
        report = GeminiAIService.generate_audio_analysis(request.features)
        
        # S'assurer que report est une string
        if not isinstance(report, str):
            report = str(report) if report else "Erreur: L'analyse n'a pas pu être générée."
        
        return AIAnalysisResponse(report=report, source="gemini-ai")
    except HTTPException:
        raise
    except Exception as e:
        print(f"AI Analysis error: {str(e)}")
        error_message = str(e) if e else "Erreur inconnue"
        raise HTTPException(status_code=500, detail=f"Erreur lors de la génération de l'analyse IA: {error_message}")
