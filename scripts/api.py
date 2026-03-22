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
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from PIL import Image

# Load environment variables from .env file
load_dotenv()

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
BUCKET_NAME = os.environ["BUCKET_NAME"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Import your detection function
from hybrid_3model_cv import MOCK_MODE, detect_workout

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ========== SUPABASE CLIENT ==========
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

logger.info(f"Supabase client initialized: {supabase_url is not None}")


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
    user_id: str = Field("00000000-0000-0000-0000-000000000000", description="User ID for tracking the workout")
    mock: bool = Field(False, description="Use mock mode for demo safety")
    include_raw: bool = Field(False, description="Include raw model outputs in response")


class DetectResponse(BaseModel):
    success: bool
    status_code: int
    message: str
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    mock_mode: bool
    version: str
    supabase_connected: bool
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
    from hybrid_3model_cv import MOCK_MODE
    return HealthResponse(
        status="ok",
        mock_mode=MOCK_MODE,
        version="1.0.0",
        supabase_connected=supabase_url is not None and supabase_key is not None
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

        if status_code == 200 and not mock:
            # Insert workout record to Supabase
            data, error = supabase.table('workouts').insert({
                "user_id": "00000000-0000-0000-0000-000000000000",
                "photo_url": public_url,
                "status": "passed",
                "cv_detected_items": [item["class"] for item in result["detections"]],
                "cv_result_json": result  # Python dict will auto-serialize to JSON
            }).execute()
            
            if error:
                logger.error(f"❌ Failed to save workout to database: {error}")
            else:
                logger.info(f"✅ Workout saved to database: {data}")

        return DetectResponse(
            success=result.get("success", False),
            status_code=status_code,
            message=message,
            data=result
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Critical error in detection endpoint: {e}", exc_info=True)
        return DetectResponse(
            success=False,
            status_code=500,
            message="An internal server error occurred during detection.",
            error=str(e)
        )


@app.get("/classes", tags=["Metadata"])
async def get_supported_classes():
    """Return all equipment classes this API recognizes"""
    from hybrid_3model_cv import GYM_CLASSES, COCO_FALLBACK_CLASSES, LOCATION_MAP
    
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
    result = detect_workout("", mock=True)
    return DetectResponse(
        success=True,
        status_code=200,
        message="Mock detection successful",
        data=result
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
        reload=True,
        log_level="info"
    )