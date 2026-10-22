from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.vision_model import analyze_image_buffer
from app.schemas.vision import VisionRecognitionResponse

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

    result = analyze_image_buffer(image_bytes=image_bytes, mime_type=file.content_type)
    return result