import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from ..core.config import settings

class UploadService:
    @staticmethod
    async def save_upload(file: UploadFile) -> Path:
        # Validate extension
        filename = file.filename
        if not filename:
            raise HTTPException(status_code=400, detail="Filename is missing")
            
        ext = filename.split(".")[-1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}"
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        saved_filename = f"{file_id}.{ext}"
        file_path = settings.UPLOAD_DIR / saved_filename
        
        # Save file
        try:
            # Read file content asynchronously
            content = await file.read()
            
            # Check file size
            if len(content) > settings.MAX_UPLOAD_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
                )
            
            # Write to disk
            with open(file_path, "wb") as buffer:
                buffer.write(content)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not save file: {str(e)}")
            
        return file_path

    @staticmethod
    def get_file_path(filename: str) -> Path:
        path = settings.UPLOAD_DIR / filename
        if not path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        return path
