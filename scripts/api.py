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
def download_image(url: str, timeout: int = 10) -> str:
    """
    Download image from URL to temp file.
    Returns path to downloaded file.
    Raises HTTPException on failure.
    """
    try:
        # Validate URL is an image
        response = requests.head(url, timeout=5, allow_redirects=True)
        content_type = response.headers.get("content-type", "").lower()
        if not content_type.startswith("image/"):
            raise ValueError(f"URL does not point to an image: {content_type}")
        
        # Download the image
        response = requests.get(url, timeout=timeout, stream=True)
        response.raise_for_status()
        
        # Save to temp file
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
    return HealthResponse(
        status="ok",
        mock_mode=MOCK_MODE,
        version="1.0.0"
    )


@app.post("/detect", response_model=DetectResponse, status_code=200, tags=["Detection"])
async def detect_workout_from_url(
    request: DetectRequest,
    background_tasks: BackgroundTasks
):
    """
    Detect workout equipment and background from an image URL.
    
    - **image_url**: Public URL of the workout photo (must be accessible)
    - **mock**: Use mock mode for demo safety (returns fake but consistent results)
    - **include_raw**: Include raw model outputs in response (debugging)
    
    Returns detection results with equipment, background location, and workout type.
    """
    logger.info(f"Received detection request for: {request.image_url}")
    
    try:
        # Download image to temp file
        temp_path = download_image(str(request.image_url))
        
        # Schedule cleanup after response
        background_tasks.add_task(cleanup_temp_file, temp_path)
        
        # Override mock mode if requested
        original_mock = MOCK_MODE
        if request.mock:
            import hybrid_3model_cv
            hybrid_3model_cv.MOCK_MODE = True
        
        try:
            # Run detection
            result = detect_workout(temp_path)
            
        finally:
            # Restore original mock mode
            if request.mock:
                hybrid_3model_cv.MOCK_MODE = original_mock
        
        # Remove raw outputs if not requested
        if not request.include_raw and "raw_outputs" in result:
            del result["raw_outputs"]
        
        # Determine status code
        status_code = 200 if result.get("success") else 422
        message = "Detection successful" if result.get("success") else "Detection completed with warnings"
        
        return DetectResponse(
            success=result.get("success", False),
            status_code=status_code,
            message=message,
            data=result
        )
        
    except HTTPException as e:
        # Re-raise FastAPI HTTP exceptions
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
        reload=True,  # Auto-reload during development
        log_level="info"
    )