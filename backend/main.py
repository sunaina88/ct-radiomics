## FastAPI Server for CT Scan and MRI Brain Tumor detection.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api import predict_router

app = FastAPI(title="Radiomics", description="Biomedical Image Processing", version="1.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, 
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(predict_router, prefix="/api", tags=["prediction"])

@app.get("/")
def root():
    return {
        "message": "FastAPI server is running",
        "status": "healthy",
        "version": "1.1.0",
        "endpoints": {
            "predict": "/api/predict",
            "models": "/api/models",
            "health": "/health"
        }
    }

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded":"False"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)