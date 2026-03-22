# api.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, Field
from pathlib import Path
import tempfile
import requests
import shutil
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from PIL import Image

# Load environment variables from .env file
load_dotenv()

# Import your detection function
from hybrid_3model_cv import detect_workout

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
def resize_image(image_path: str, max_size: int = 1024):
    """
    Resize an image to a maximum size while maintaining aspect ratio.
    Overwrites the original file.
    """
    try:
        img = Image.open(image_path)
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size))
            img.save(image_path, "JPEG", quality=90)
            logger.info(f"Image resized to fit within a {max_size}x{max_size} box.")
    except Exception as e:
        logger.warning(f"Could not resize image {image_path}: {e}")


def download_image(url: str, timeout: int = 10) -> str:
    """
    Download image from URL to temp file.
    Returns path to downloaded file.
    Raises HTTPException on failure.
    """
    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        content_type = response.headers.get("content-type", "").lower()
        if not content_type.startswith("image/"):
            raise ValueError(f"URL does not point to an image: {content_type}")
        
        response = requests.get(url, timeout=timeout, stream=True)
        response.raise_for_status()
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            for chunk in response.iter_content(chunk_size=8192):
                tmp.write(chunk)
            return tmp.name
            
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=408, detail="Image download timed out")
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=400, detail="Could not connect to image URL")
    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch image: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")


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
async def detect_workout_from_url(
    request: DetectRequest,
    background_tasks: BackgroundTasks
):
    """
    Detect workout equipment from an image URL and save the result to the database.
    """
    logger.info(f"Received detection request for user '{request.user_id}' with URL: {request.image_url}")
    
    try:
        # 1. Download image to a temporary file
        temp_path = download_image(str(request.image_url))
        background_tasks.add_task(cleanup_temp_file, temp_path)
        
        # 2. Resize the image to prevent "413 Entity Too Large" errors from detection APIs
        resize_image(temp_path)
        
        # 3. Run the detection model
        result = detect_workout(temp_path, mock=request.mock)
        
        # 4. Save the workout record to Supabase
        status = "passed" if result.get("success") else "failed"
        detected_items = result.get("detected_items", [])
        
        try:
            workout_record = {
                "user_id": request.user_id,
                "photo_url": str(request.image_url),
                "cv_detected_items": detected_items,
                "status": status,
                "cv_result_json": result
            }
            supabase.table("workouts").insert(workout_record).execute()
            logger.info(f"Successfully saved workout for user '{request.user_id}' to Supabase.")
        except Exception as e:
            logger.error(f"Supabase insert failed: {e}", exc_info=True)

        # 5. Prepare and return the API response
        if not request.include_raw and "raw_outputs" in result:
            del result["raw_outputs"]
            
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
    return DetectResponse(
        success=False,
        status_code=404,
        message="Endpoint not found",
        error="The requested resource does not exist"
    )


@app.exception_handler(422)
async def validation_error_handler(request, exc):
    return DetectResponse(
        success=False,
        status_code=422,
        message="Request validation failed",
        error=str(exc)
    )


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