# api.py
from fastapi import FastAPI, HTTPException, BackgroundTasks, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
import tempfile
import logging
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
BUCKET_NAME = os.environ["BUCKET_NAME"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Import your detection function
from hybrid_3model_cv import detect_workout, MOCK_MODE

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Social Workout App - CV API",
    description="Computer Vision API for workout verification via image URL",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for mobile/web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========== REQUEST/RESPONSE MODELS ==========
class DetectRequest(BaseModel):
    """Request body for workout detection"""
    image_url: HttpUrl = Field(..., description="Public URL of the workout photo")
    mock: bool = Field(False, description="Use mock mode for demo safety")
    include_raw: bool = Field(False, description="Include raw model outputs in response")


class DetectResponse(BaseModel):
    success: bool
    status_code: int
    message: str
    data: Optional[Dict[str, Any]] = None   # ✅ Python 3.9 compatible
    error: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    mock_mode: bool
    version: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


# ========== HELPER FUNCTIONS ==========
def upload_to_supabase(file_bytes: bytes, user_id: str) -> str:
    """
    Upload image bytes to Supabase Storage.
    Returns the public URL of the uploaded file.
    """
    try:
        file_name = f"workouts/{user_id}_{int(datetime.now().timestamp())}.jpg"
        supabase.storage.from_(BUCKET_NAME).upload(
            file_name, file_bytes, {"content-type": "image/jpeg"}
        )
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_name)
        return public_url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase upload failed: {str(e)}")


def cleanup_temp_file(file_path: str):
    """Safely delete temp file"""
    try:
        Path(file_path).unlink(missing_ok=True)
    except Exception as e:
        logger.warning(f"Failed to cleanup {file_path}: {e}")


# ========== API ENDPOINTS ==========
@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="ok",
        mock_mode=MOCK_MODE,
        version="1.0.0"
    )


@app.post("/detect", response_model=DetectResponse, status_code=200, tags=["Detection"])
async def detect_workout_from_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Form("default"),
    mock: bool = Form(False),
    include_raw: bool = Form(False),
):
    """
    Accept an image upload, store it in Supabase, then run workout detection.
    """
    logger.info(f"Received detection request from user: {user_id}")

    try:
        file_bytes = await file.read()

        # 1. Upload to Supabase and get public URL
        public_url = upload_to_supabase(file_bytes, user_id)
        logger.info(f"Uploaded to Supabase: {public_url}")

        # 2. Save to temp file for CV model
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(file_bytes)
            temp_path = tmp.name

        background_tasks.add_task(cleanup_temp_file, temp_path)

        # 3. Override mock mode if requested
        original_mock = MOCK_MODE
        if mock:
            import hybrid_3model_cv
            hybrid_3model_cv.MOCK_MODE = True

        try:
            result = detect_workout(temp_path)
        finally:
            if mock:
                hybrid_3model_cv.MOCK_MODE = original_mock

        if not include_raw and "raw_outputs" in result:
            del result["raw_outputs"]

        result["image_url"] = public_url

        status_code = 200 if result.get("success") else 422
        message = "Detection successful" if result.get("success") else "Detection completed with warnings"

        return DetectResponse(
            success=result.get("success", False),
            status_code=status_code,
            message=message,
            data=result
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Detection failed: {e}", exc_info=True)
        return DetectResponse(
            success=False,
            status_code=500,
            message="Internal server error during detection",
            error=str(e)
        )


@app.get("/classes", tags=["Metadata"])
async def get_supported_classes():
    """Return all equipment classes this API recognizes"""
    from hybrid_3model_cv import GYM_CLASSES, COCO_FALLBACK_CLASSES, LOCATION_MAP
    
    # Group equipment by category
    equipment_by_category = {}
    for cls, category in {**GYM_CLASSES, **COCO_FALLBACK_CLASSES}.items():
        if category not in equipment_by_category:
            equipment_by_category[category] = []
        equipment_by_category[category].append(cls)
    
    return {
        "equipment": equipment_by_category,
        "locations": list(set(LOCATION_MAP.values())),
        "total_classes": len(GYM_CLASSES) + len(COCO_FALLBACK_CLASSES)
    }


@app.post("/detect/mock", response_model=DetectResponse, status_code=200, tags=["Testing"])
async def mock_detect_endpoint(request: DetectRequest):
    """
    Return mock detection results for frontend testing.
    Always returns success with fake but realistic data.
    """
    # Use filename from URL for mock matching
    image_name = Path(request.image_url.path).name.lower()
    
    # Simple mock logic (same as hybrid_3model_cv.py)
    if any(kw in image_name for kw in ["dumbbell", "weight", "bench"]):
        detections = [
            {"class": "Dumbbell", "confidence": 0.92, "category": "strength", "source": "mock"},
            {"class": "person", "confidence": 0.98, "category": "person", "source": "mock"}
        ]
        background = {"location": "commercial_gym", "confidence": 0.85, "source": "mock"}
        workout = "💪 Strength (Dumbbell)"
    elif any(kw in image_name for kw in ["treadmill", "elliptical", "bike"]):
        detections = [
            {"class": "Treadmill", "confidence": 0.89, "category": "cardio", "source": "mock"},
            {"class": "person", "confidence": 0.96, "category": "person", "source": "mock"}
        ]
        background = {"location": "commercial_gym", "confidence": 0.90, "source": "mock"}
        workout = "🏃 Cardio (Treadmill)"
    elif any(kw in image_name for kw in ["yoga", "mat", "stability"]):
        detections = [
            {"class": "Stability Ball", "confidence": 0.86, "category": "flexibility", "source": "mock"},
            {"class": "person", "confidence": 0.97, "category": "person", "source": "mock"}
        ]
        background = {"location": "home", "confidence": 0.70, "source": "mock"}
        workout = "🧘 Flexibility / Core"
    else:
        detections = [{"class": "person", "confidence": 0.99, "category": "person", "source": "mock"}]
        background = {"location": "unknown", "confidence": 0.30, "source": "mock"}
        workout = "🏋️ General Workout"
    
    return DetectResponse(
        success=True,
        status_code=200,
        message="Mock detection successful",
        data={
            "success": True,
            "image": Path(request.image_url.path).name,
            "mock_mode": True,
            "detections": detections,
            "background": background,
            "workout_type": workout,
            "verified": True
        }
    )


# ========== ERROR HANDLERS ==========
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(status_code=404, content={"success": False, "status_code": 404, "message": "Endpoint not found", "error": "The requested resource does not exist"})


@app.exception_handler(422)
async def validation_error_handler(request, exc):
    return JSONResponse(status_code=422, content={"success": False, "status_code": 422, "message": "Request validation failed", "error": str(exc)})


# ========== MAIN ==========
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload during development
        log_level="info"
    )