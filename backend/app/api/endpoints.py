from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from ..services.upload import UploadService
from ..services.analysis import FeatureExtractor
from ..services.audio import AudioProcessor
from ..models.schemas import AnalysisResponse, ProcessRequest, ProcessResponse

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        print(f"Received file: {file.filename}")
        file_path = await UploadService.save_upload(file)
        print(f"File saved to: {file_path}")
        return {"filename": file_path.name, "message": "File uploaded successfully"}
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_audio(filename: str):
    try:
        file_path = UploadService.get_file_path(filename)
        features = FeatureExtractor.analyze(file_path)
        return AnalysisResponse(filename=filename, features=features)
    except Exception as e:
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
