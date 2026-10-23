from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.vision_model import analyze_image_buffer, explain_object_name, generate_quiz, generate_review_quiz, generate_story
from app.schemas.vision import VisionRecognitionResponse, QuizResponse, StoryResponse

ALLOWED_QUESTION_COUNTS = {3, 5, 10}

app = FastAPI(title="KinderLens AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "kinderlens-ai-service"}

@app.post("/api/vision/recognize", response_model=VisionRecognitionResponse)
async def recognize_object(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Image file is empty.")

    language = file.headers.get("x-kinderlens-language", "english")
    result = analyze_image_buffer(image_bytes=image_bytes, mime_type=file.content_type, language=language)
    return result


@app.post("/api/explain/object", response_model=VisionRecognitionResponse)
async def explain_object(payload: dict):
    object_name = payload.get("object_name") if isinstance(payload, dict) else None
    if not isinstance(object_name, str) or not object_name.strip():
        raise HTTPException(status_code=400, detail="Object name is required.")
    return explain_object_name(object_name.strip(), payload.get("language", "english"))


@app.post("/api/quiz", response_model=QuizResponse)
async def create_quiz(payload: dict):
    object_name = payload.get("object_name") if isinstance(payload, dict) else None
    question_count = payload.get("question_count", 3) if isinstance(payload, dict) else 3
    if not isinstance(object_name, str) or not object_name.strip():
        raise HTTPException(status_code=400, detail="Object name is required.")
    if question_count not in ALLOWED_QUESTION_COUNTS:
        raise HTTPException(status_code=400, detail="Question count must be 3, 5, or 10.")
    return generate_quiz(object_name.strip(), question_count, payload.get("language", "english"))


@app.post("/api/quiz/review", response_model=QuizResponse)
async def create_review_quiz(payload: dict):
    object_names = payload.get("object_names") if isinstance(payload, dict) else None
    question_count = payload.get("question_count", 3) if isinstance(payload, dict) else 3
    if not isinstance(object_names, list):
        raise HTTPException(status_code=400, detail="Object names are required.")
    if question_count not in ALLOWED_QUESTION_COUNTS:
        raise HTTPException(status_code=400, detail="Question count must be 3, 5, or 10.")
    return generate_review_quiz(object_names, question_count, payload.get("language", "english"))


@app.post("/api/story", response_model=StoryResponse)
async def create_story(payload: dict):
    object_name = payload.get("object_name") if isinstance(payload, dict) else None
    if not isinstance(object_name, str) or not object_name.strip():
        raise HTTPException(status_code=400, detail="Object name is required.")
    return generate_story(object_name.strip(), payload.get("language", "english"))