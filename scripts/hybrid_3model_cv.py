# hybrid_3model_cv.py
from inference_sdk import InferenceHTTPClient
from ultralytics import YOLO
from pathlib import Path
import json
import time
from datetime import datetime
import torch
from torchvision import models, transforms
from PIL import Image
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

print("🏋️  Hybrid CV: Equipment + Background + yolo26n + COCO Fallback")
print("=" * 70)

# ========== CONFIG ==========
MOCK_MODE = False  # ← Set True for demo safety
API_KEY = os.getenv("ROBOFLOW_API_KEY", "")

# Model 1: Your custom gym objects (PRIMARY)
CUSTOM_MODEL = {
    "api_url": "https://serverless.roboflow.com",
    "api_key": API_KEY,
    "model_id": "detect-gym-objects/1",
    "min_confidence": 0.1,
    "priority": 1
}

# Model 2: General gym equipment (FALLBACK)
FALLBACK_MODEL = {
    "api_url": "https://detect.roboflow.com", 
    "api_key": API_KEY,
    "model_id": "all-gym-equipment/2",
    "min_confidence": 0.1,
    "priority": 2
}

# Model 3: Local YOLO for person + COCO fallback (FALLBACK)
YOLO_LOCAL = {
    "model_path": "yolo26n.pt",
    "min_confidence": 0.25,
    "enabled": True,
    "priority": 3
}

# Model 4: Places365 Scene Classification (CONTEXT) - disabled by default
SCENE_MODEL = {
    "enabled": False,
    "min_confidence": 0.15,
    "priority": 4
}

# ===== YOUR CUSTOM GYM CLASSES (PRIMARY) =====
GYM_CLASSES = {
    # Strength Equipment
    "Bench": "strength",
    "Ab Crunch Machine": "strength",
    "Ab Roller": "strength",
    "Abdominal Bench": "strength",
    "Back Extension Machine": "strength",
    "Barbell": "strength",
    "Chest Fly Machine": "strength",
    "Chest Press Machine": "strength",
    "Dumbbell": "strength",
    "Functional Trainer": "strength",
    "GHD Machine": "strength",
    "Hack Squat Machine": "strength",
    "Kettlebells": "strength",
    "Lat Pull Down Machine": "strength",
    "Lateral Raises Machine": "strength",
    "Leg Curl Machine": "strength",
    "Leg Extension Machine": "strength",
    "Leg Press Machine": "strength",
    "Leg Raise Tower": "strength",
    "Preacher Curl": "strength",
    "Seated Dip Machine": "strength",
    "Seated Row Machine": "strength",
    "Shoulder Press Machine": "strength",
    "Smith Machine": "strength",
    
    # Cardio Equipment
    "Elliptical": "cardio",
    "Stationary Bike": "cardio",
    "Stepmill": "cardio",
    "Treadmill": "cardio",
    
    # Flexibility / Core
    "Stability Ball": "flexibility",
}

# ===== COCO FALLBACK CLASSES (Context/Secondary Detection) =====
COCO_FALLBACK_CLASSES = {
    # Strength/Outdoor context
    "bench": "strength",  # Gym bench OR park bench
    
    # Context clues (boost location/workout inference)
    "backpack": "context",  # Gym bag nearby
    "bottle": "context",    # Water bottle = hydration
    
    # Sports/Cardio equipment (COCO has these!)
    "sports ball": "sports",
    "frisbee": "sports",
    "skateboard": "sports",
    "surfboard": "sports",
    "tennis racket": "sports",
    "baseball bat": "sports",
    "baseball glove": "sports",
    "skis": "sports",
    "snowboard": "sports",
    
    # Cardio
    "bicycle": "cardio",
    
    # Home workout context
    "chair": "home_context",
    "couch": "home_context",
    "potted plant": "home_context",
}

# ===== COMBINED CLASS MAPPING (Custom + COCO) =====
ALL_CLASSES = {**GYM_CLASSES, **COCO_FALLBACK_CLASSES}

# Places365 → Our location categories
LOCATION_MAP = {
    # Commercial Gym
    "gym/indoor": "commercial_gym",
    "weight_room": "commercial_gym",
    "locker_room": "commercial_gym",
    
    # Studio
    "yoga_studio": "studio",
    "dance_studio": "studio",
    "pilates_studio": "studio",
    
    # Home
    "living_room": "home",
    "bedroom": "home",
    "home_office": "home",
    "kitchen": "home",
    
    # Outdoor
    "park": "outdoor",
    "beach": "outdoor",
    "playingfield": "outdoor",
    "basketball_court/indoor": "indoor_court",
    "tennis_court/indoor": "indoor_court",
    "running_track": "outdoor",
    "playground": "outdoor",
}

# Equipment → Location hints (fallback)
EQUIPMENT_LOCATION_HINTS = {
    # Definitely commercial gym
    "Smith Machine": "commercial_gym",
    "Leg Press Machine": "commercial_gym",
    "Hack Squat Machine": "commercial_gym",
    "Functional Trainer": "commercial_gym",
    "Lat Pull Down Machine": "commercial_gym",
    "Chest Press Machine": "commercial_gym",
    "Shoulder Press Machine": "commercial_gym",
    "Seated Row Machine": "commercial_gym",
    "Leg Extension Machine": "commercial_gym",
    "Leg Curl Machine": "commercial_gym",
    "Preacher Curl": "commercial_gym",
    "GHD Machine": "commercial_gym",
    "Leg Raise Tower": "commercial_gym",
    "Seated Dip Machine": "commercial_gym",
    "Lateral Raises Machine": "commercial_gym",
    "Chest Fly Machine": "commercial_gym",
    "Ab Crunch Machine": "commercial_gym",
    
    # Could be gym or home
    "Treadmill": "could_be_gym_or_home",
    "Elliptical": "could_be_gym_or_home",
    "Stationary Bike": "could_be_gym_or_home",
    "Stepmill": "could_be_gym_or_home",
    "Bench": "could_be_gym_or_home",
    "Abdominal Bench": "could_be_gym_or_home",
    "Back Extension Machine": "could_be_gym_or_home",
    "Barbell": "could_be_gym_or_home",
    "Dumbbell": "could_be_gym_or_home",
    "Kettlebells": "could_be_gym_or_home",
    
    # More likely home
    "Ab Roller": "likely_home",
    "Stability Ball": "likely_home",
    
    # COCO context clues
    "backpack": "gym_context",
    "bottle": "gym_context",
}
# ===========================


# ========== PLACES365 SETUP ==========
places365_model = None
places365_classes = None

def load_places365_model():
    """Load Places365 model (downloaded once, cached)"""
    global places365_model, places365_classes
    
    if places365_model is not None:
        return places365_model, places365_classes
    
    print("  📦 Loading Places365 model (first time downloads ~50MB)...")
    
    try:
        places365_model = models.resnet18(pretrained=False)
        places365_model.fc = torch.nn.Linear(512, 365)
        
        try:
            checkpoint = torch.hub.load_state_dict_from_url(
                'http://places2.csail.mit.edu/models_places365/resnet18_places365.pth.tar',
                progress=True,
                map_location='cpu'
            )
            places365_model.load_state_dict(checkpoint['state_dict'])
        except Exception as e:
            print(f"  ⚠️ Could not download Places365 weights: {e}")
            return None, None
        
        places365_model.eval()
        
        try:
            classes_url = 'http://places2.csail.mit.edu/places365/categories.txt'
            import urllib.request
            with urllib.request.urlopen(classes_url) as f:
                places365_classes = [line.decode('utf-8').strip().split(' ')[0] for line in f]
        except:
            places365_classes = [
                "gym/indoor", "weight_room", "locker_room", "living_room", 
                "bedroom", "kitchen", "office", "park", "beach", "playground",
                "basketball_court/indoor", "tennis_court/indoor", "running_track",
                "yoga_studio", "dance_studio", "home_office", "playingfield"
            ]
        
        print("  ✅ Places365 model loaded!")
        return places365_model, places365_classes
        
    except Exception as e:
        print(f"  ❌ Failed to load Places365: {e}")
        return None, None


def run_places365(image_path: str) -> dict:
    """Run Places365 scene classification"""
    global places365_model, places365_classes
    
    if not SCENE_MODEL.get("enabled"):
        return {"location": "unknown", "scene_class": None, "confidence": 0.0, "source": "disabled"}
    
    model, classes = load_places365_model()
    if model is None or classes is None:
        return {"location": "unknown", "scene_class": None, "confidence": 0.0, "source": "disabled"}
    
    print("  🔍 Running Places365 scene classification...")
    
    try:
        transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        img = Image.open(image_path).convert('RGB')
        img_t = transform(img).unsqueeze(0)
        
        with torch.no_grad():
            output = model(img_t)
            prob = torch.nn.functional.softmax(output[0], dim=0)
            top5 = prob.topk(5)
        
        top_idx = top5.indices[0].item()
        top_conf = top5.values[0].item()
        top_class = classes[top_idx] if top_idx < len(classes) else "unknown"
        location = LOCATION_MAP.get(top_class, "unknown")
        
        return {
            "location": location,
            "scene_class": top_class,
            "confidence": round(top_conf, 3),
            "source": "places365",
            "top_5": [
                {"class": classes[idx.item()] if idx.item() < len(classes) else "unknown", 
                 "confidence": round(conf.item(), 3)}
                for idx, conf in zip(top5.indices, top5.values)
            ]
        }
        
    except Exception as e:
        print(f"    ❌ Places365 failed: {e}")
        return {"location": "unknown", "scene_class": None, "confidence": 0.0, "source": "error"}
# ===========================


def run_roboflow_model(image_path: str, model_config: dict) -> list:
    """Run a Roboflow model and filter by confidence manually"""
    if MOCK_MODE:
        return []
    
    print(f"  🔍 Running: {model_config['model_id']}")
    try:
        client = InferenceHTTPClient(
            api_url=model_config["api_url"].strip(),
            api_key=model_config["api_key"]
        )
        
        result = client.infer(image_path, model_id=model_config["model_id"])
        predictions = result.get("predictions", [])
        
        min_conf = model_config.get("min_confidence", 0.1)
        filtered = [p for p in predictions if p.get("confidence", 0) >= min_conf]
        
        print(f"    ✓ {len(filtered)}/{len(predictions)} detections (≥{min_conf:.1%})")
        return filtered
        
    except Exception as e:
        print(f"    ❌ {model_config['model_id']} failed: {e}")
        return []


def run_yolo26n(image_path: str, min_confidence: float = 0.25) -> list:
    """Run local yolo26n.pt model for person + COCO fallback detections"""
    if MOCK_MODE or not YOLO_LOCAL.get("enabled"):
        return []
    
    print(f"  🔍 Running local YOLO: {YOLO_LOCAL['model_path']}")
    try:
        model = YOLO(YOLO_LOCAL["model_path"])
        results = model(image_path, conf=min_confidence, verbose=False)
        
        detections = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            class_name = model.names[cls_id]
            conf = float(box.conf[0])
            
            # Match against COCO fallback classes
            if class_name.lower() in ALL_CLASSES:
                detections.append({
                    "class": class_name,
                    "confidence": round(conf, 3),
                    "category": ALL_CLASSES[class_name.lower()],
                    "source": "yolo26n-coco"
                })
        
        print(f"    ✓ Found {len(detections)} COCO detections")
        return detections
        
    except Exception as e:
        print(f"    ❌ yolo26n failed: {e}")
        return []


def process_equipment_detections(predictions: list, class_mapping: dict) -> list:
    """Filter and categorize equipment detections (supports custom + COCO classes)"""
    detections = []
    
    for pred in predictions:
        class_name = pred.get("class", "")
        confidence = pred.get("confidence", 0)
        
        # Match against known classes (case-insensitive)
        matched_category = None
        for known_class, category in class_mapping.items():
            if class_name.lower() == known_class.lower():
                matched_category = category
                break
        
        if matched_category:
            detections.append({
                "class": class_name,
                "confidence": round(confidence, 3),
                "category": matched_category,
                "source": pred.get("source", "unknown")
            })
    
    return detections


def infer_background_from_equipment(equipment_detections: list) -> dict:
    """Fallback: infer background/location from detected equipment + COCO context"""
    classes = [d["class"].lower() for d in equipment_detections]
    categories = [d["category"] for d in equipment_detections]
    
    location_scores = {"commercial_gym": 0, "home": 0, "outdoor": 0}
    
    for eq_class in classes:
        hint = EQUIPMENT_LOCATION_HINTS.get(eq_class)
        if hint == "commercial_gym":
            location_scores["commercial_gym"] += 2
        elif hint == "could_be_gym_or_home":
            location_scores["commercial_gym"] += 1
            location_scores["home"] += 1
        elif hint in ["likely_home", "home"]:
            location_scores["home"] += 2
        elif hint == "gym_context":  # COCO context clues
            location_scores["commercial_gym"] += 1
    
    # Outdoor detection via COCO sports classes
    if any(x in classes for x in ["park", "beach", "playingfield"]):
        location_scores["outdoor"] += 3
    if any(x in categories for x in ["sports"]) and "person" in classes:
        location_scores["outdoor"] += 1
    
    if location_scores["commercial_gym"] > location_scores["home"] and location_scores["commercial_gym"] >= location_scores["outdoor"]:
        return {
            "location": "commercial_gym",
            "confidence": min(0.85, 0.5 + location_scores["commercial_gym"] * 0.1),
            "source": "equipment_inference",
            "reasoning": "Detected commercial gym equipment"
        }
    elif location_scores["outdoor"] > location_scores["commercial_gym"] and location_scores["outdoor"] >= location_scores["home"]:
        return {
            "location": "outdoor",
            "confidence": min(0.80, 0.5 + location_scores["outdoor"] * 0.1),
            "source": "equipment_inference",
            "reasoning": "Detected outdoor/sports context"
        }
    elif location_scores["home"] > location_scores["commercial_gym"]:
        return {
            "location": "home",
            "confidence": min(0.75, 0.5 + location_scores["home"] * 0.1),
            "source": "equipment_inference", 
            "reasoning": "Detected home-friendly equipment"
        }
    
    return {
        "location": "unknown",
        "confidence": 0.30,
        "source": "fallback",
        "reasoning": "Insufficient context to determine location"
    }


def infer_workout_type(equipment_detections: list) -> str:
    """Map equipment + COCO context to workout category"""
    if not equipment_detections:
        return "❓ No equipment detected"
    
    classes = [d["class"].lower() for d in equipment_detections]
    categories = [d["category"] for d in equipment_detections]
    
    # Must have person for verification
    if "person" not in classes:
        return "❓ No person detected"
    
    # === STRENGTH ===
    if "strength" in categories:
        items = [d["class"] for d in equipment_detections if d["category"] == "strength"]
        return f"💪 Strength ({', '.join(items[:2])})"
    
    # === CARDIO ===
    if "cardio" in categories or "bicycle" in classes:
        items = [d["class"] for d in equipment_detections if d["category"] in ["cardio", "sports"]]
        return f"🏃 Cardio ({', '.join(items[:2])})" if items else "🏃 Cardio"
    
    # === SPORTS/OUTDOOR ===
    if "sports" in categories:
        items = [d["class"] for d in equipment_detections if d["category"] == "sports"]
        return f"⚽ Sports ({', '.join(items[:2])})"
    
    # === FLEXIBILITY ===
    if "flexibility" in categories:
        return "🧘 Flexibility / Core"
    
    # === HOME WORKOUT (context-based) ===
    home_context = ["chair", "couch", "potted plant"]
    if any(ctx in classes for ctx in home_context) and "person" in classes:
        home_equipment = ["resistance band", "stability ball", "ab roller", "yoga mat"]
        if any(eq in classes for eq in home_equipment):
            return "🏠 Home Workout"
    
    # === GYM CONTEXT (backpack + bottle = likely gym) ===
    if "backpack" in classes and "bottle" in classes:
        return "🏋️ Gym Session"
    
    return "🏃 General Workout"


def mock_detect_all(image_path: str) -> dict:
    """Return mock results for demo safety"""
    print("  🎭 Using mock detections (DEMO MODE)")
    image_name = Path(image_path).name.lower()
    
    equipment_map = {
        "dumbbell": [
            {"class": "Dumbbell", "confidence": 0.92, "category": "strength", "source": "mock"},
            {"class": "Bench", "confidence": 0.85, "category": "strength", "source": "mock"},
            {"class": "person", "confidence": 0.98, "category": "person", "source": "mock"}
        ],
        "treadmill": [
            {"class": "Treadmill", "confidence": 0.89, "category": "cardio", "source": "mock"},
            {"class": "person", "confidence": 0.96, "category": "person", "source": "mock"}
        ],
        "elliptical": [
            {"class": "Elliptical", "confidence": 0.87, "category": "cardio", "source": "mock"},
            {"class": "person", "confidence": 0.94, "category": "person", "source": "mock"}
        ],
        "smith": [
            {"class": "Smith Machine", "confidence": 0.91, "category": "strength", "source": "mock"},
            {"class": "person", "confidence": 0.95, "category": "person", "source": "mock"}
        ],
        "leg press": [
            {"class": "Leg Press Machine", "confidence": 0.88, "category": "strength", "source": "mock"},
            {"class": "person", "confidence": 0.93, "category": "person", "source": "mock"}
        ],
        "stability": [
            {"class": "Stability Ball", "confidence": 0.86, "category": "flexibility", "source": "mock"},
            {"class": "person", "confidence": 0.97, "category": "person", "source": "mock"}
        ],
        "park": [
            {"class": "person", "confidence": 0.99, "category": "person", "source": "mock"},
            {"class": "sports ball", "confidence": 0.78, "category": "sports", "source": "mock"},
            {"class": "bench", "confidence": 0.65, "category": "strength", "source": "mock"}
        ],
        "home": [
            {"class": "person", "confidence": 0.98, "category": "person", "source": "mock"},
            {"class": "couch", "confidence": 0.82, "category": "home_context", "source": "mock"},
            {"class": "potted plant", "confidence": 0.71, "category": "home_context", "source": "mock"}
        ],
    }
    
    background_map = {
        "dumbbell": {"location": "commercial_gym", "scene_class": "gym/indoor", "confidence": 0.85, "source": "mock"},
        "treadmill": {"location": "commercial_gym", "scene_class": "gym/indoor", "confidence": 0.90, "source": "mock"},
        "elliptical": {"location": "commercial_gym", "scene_class": "gym/indoor", "confidence": 0.88, "source": "mock"},
        "smith": {"location": "commercial_gym", "scene_class": "weight_room", "confidence": 0.92, "source": "mock"},
        "leg press": {"location": "commercial_gym", "scene_class": "weight_room", "confidence": 0.91, "source": "mock"},
        "stability": {"location": "home", "scene_class": "living_room", "confidence": 0.70, "source": "mock"},
        "living": {"location": "home", "scene_class": "living_room", "confidence": 0.75, "source": "mock"},
        "park": {"location": "outdoor", "scene_class": "park", "confidence": 0.80, "source": "mock"},
        "home": {"location": "home", "scene_class": "living_room", "confidence": 0.75, "source": "mock"},
    }
    
    equipment = [{"class": "person", "confidence": 0.99, "category": "person", "source": "mock"}]
    for keyword, eq_list in equipment_map.items():
        if keyword in image_name:
            equipment = eq_list
            break
    
    background = {"location": "unknown", "scene_class": None, "confidence": 0.30, "source": "fallback", "reasoning": "Insufficient context"}
    for keyword, bg in background_map.items():
        if keyword in image_name:
            background = bg
            break
    
    return {
        "equipment": equipment,
        "background": background,
        "workout_type": infer_workout_type(equipment)
    }


def detect_workout(image_path: str, mock: bool = False) -> dict:
    """
    Main detection function.
    Accepts a 'mock' parameter to override global MOCK_MODE.
    
    Returns JSON with SEPARATE fields:
    - "detections": list of equipment detected (custom + COCO classes)
    - "background": object with location/scene info
    """
    print(f"\n📸 Processing: {Path(image_path).name}")
    print("-" * 70)
    
    # Prioritize the 'mock' parameter passed to the function
    is_mock = mock or MOCK_MODE
    
    if is_mock:
        mock_result = mock_detect_all(image_path)
        equipment_detections = mock_result["equipment"]
        background_info = mock_result["background"]
        workout_type = mock_result["workout_type"]
    else:
        # === STEP 1: Run custom equipment model (PRIMARY) ===
        custom_preds = run_roboflow_model(image_path, CUSTOM_MODEL)
        equipment_detections = process_equipment_detections(custom_preds, GYM_CLASSES)
        
        # === STEP 2: Run fallback equipment model if needed ===
        if len(equipment_detections) < 2:
            fallback_preds = run_roboflow_model(image_path, FALLBACK_MODEL)
            fallback_dets = process_equipment_detections(fallback_preds, GYM_CLASSES)
            
            existing = {d["class"].lower() for d in equipment_detections}
            for det in fallback_dets:
                if det["class"].lower() not in existing:
                    equipment_detections.append(det)
        
        # === STEP 3: Run local yolo26n for person + COCO fallback ===
        yolo_dets = run_yolo26n(image_path, min_confidence=YOLO_LOCAL.get("min_confidence", 0.25))
        existing = {d["class"].lower() for d in equipment_detections}
        for det in yolo_dets:
            if det["class"].lower() not in existing:
                equipment_detections.append(det)
        
        # === STEP 4: Run Places365 scene classification (if enabled) ===
        background_info = {"location": "unknown", "scene_class": None, "confidence": 0.0, "source": "disabled"}
        if SCENE_MODEL.get("enabled"):
            background_info = run_places365(image_path)
        
        # Fallback: infer background from equipment + COCO context
        if background_info["location"] == "unknown":
            background_info = infer_background_from_equipment(equipment_detections)
        
        # === STEP 5: Infer workout type ===
        workout_type = infer_workout_type(equipment_detections)
    
    # === BUILD FINAL RESULT WITH SEPARATE FIELDS ===
    # ✅ NEW: Create a simple list of detected item names for Supabase
    detected_item_names = sorted(list(set([d.get("class") for d in equipment_detections])))

    result = {
        "success": True,
        "image": Path(image_path).name,
        "timestamp": datetime.now().isoformat(),
        "mock_mode": is_mock,
        
        # The original, detailed list of detection objects
        "detections": sorted(
            equipment_detections, 
            key=lambda x: -x["confidence"]
        ),
        
        # ✅ NEW: The simple list of strings for Supabase
        "detected_items": detected_item_names,
        
        "background": background_info,
        "workout_type": workout_type,
        "verified": any(d["class"].lower() == "person" for d in equipment_detections)
    }
    
    # Print summary
    if equipment_detections:
        print("\n🎯 Equipment Detected:")
        for det in result["detections"]:
            emoji = {"strength": "💪", "cardio": "🏃", "flexibility": "🧘", "person": "👤", "sports": "⚽", "context": "🎒", "home_context": "🏠"}.get(det["category"], "🎯")
            print(f"  {emoji} {det['class']} ({det['confidence']:.1%}) [{det.get('source', 'unknown')}]")
        
        bg = result["background"]
        print(f"\n🖼️  Background: {bg['location']} ({bg['confidence']:.1%}) [{bg['source']}]")
        if bg.get("scene_class"):
            print(f"     Scene class: {bg['scene_class']}")
        if bg.get("reasoning"):
            print(f"     Reason: {bg['reasoning']}")
        
        print(f"✅ Workout: {workout_type}")
    else:
        print("⚠️ No equipment detected")
    
    return result


# ========== MAIN ==========
if __name__ == "__main__":
    image_folder = Path("test-images/")
    output_folder = Path("output/")
    output_folder.mkdir(exist_ok=True)
    
    images = list(image_folder.glob("*.jpg"))
    if not images:
        print("❌ No .jpg images found in test-images/")
        exit()
    
    print(f"🔍 Found {len(images)} images\n")
    
    all_results = {
        "timestamp": datetime.now().isoformat(),
        "mock_mode": MOCK_MODE,
        "models_used": {
            "primary": CUSTOM_MODEL["model_id"],
            "fallback": FALLBACK_MODEL["model_id"],
            "local_yolo": YOLO_LOCAL["model_path"] if YOLO_LOCAL["enabled"] else "disabled",
            "scene": "places365-resnet18" if SCENE_MODEL["enabled"] else "disabled"
        },
        "total_images": len(images),
        "results": []
    }
    
    for img_path in images:
        result = detect_workout(str(img_path))
        all_results["results"].append(result)
        
        # Save individual JSON with separate detections + background
        individual_file = output_folder / f"{img_path.stem}_result.json"
        with open(individual_file, "w") as f:
            json.dump(result, f, indent=2)
        print(f"💾 Saved: {individual_file.name}\n")
        
        time.sleep(0.5)
    
    # Save summary
    summary_file = output_folder / "all_results.json"
    with open(summary_file, "w") as f:
        json.dump(all_results, f, indent=2)
    
    print("=" * 70)
    verified = sum(1 for r in all_results["results"] if r.get("verified"))
    print(f"✅ Processed: {len(images)} images")
    print(f"📊 Verified workouts: {verified}/{len(images)}")
    print(f"📁 Output: {output_folder.absolute()}")