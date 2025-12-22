from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from ..services.upload import UploadService
from ..services.analysis import FeatureExtractor
from ..services.audio import AudioProcessor
from ..services.gemini_ai import GeminiAIService
from ..models.schemas import AnalysisResponse, ProcessRequest, ProcessResponse, AIAnalysisRequest, AIAnalysisResponse

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
            nightcore=request.nightcore
        )
        return ProcessResponse(download_url=f"/api/download/{output_path.name}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{filename}")
async def download_file(filename: str):
    from ..core.config import settings
    file_path = settings.PROCESSED_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="audio/wav", filename=filename)

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
