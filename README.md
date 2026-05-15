# TumorLens

## AI-Powered Clinical Decision Support for Brain Tumor Detection from CT and MRI Scans

TumorLens is a full-stack medical AI system that detects brain tumors from CT and MRI scans using three independent models: Convolutional Neural Network (CNN), Vision Transformer (ViT), and Radiomics-based Random Forest. The system provides explainable AI outputs including Grad-CAM heatmaps, ViT attention maps, and SHAP feature importance analysis, along with professional PDF reports.

---

# Live Demo

- **Frontend:** https://tumorlens.vercel.app
- **Backend API:** https://tumorlens-api.onrender.com/docs

---

# Key Features

- Multi-modality support: Works with both CT and MRI scans
- Three-model ensemble: CNN, Vision Transformer, and Radiomics Random Forest
- Consensus voting: 2/3 models agreement for final decision
- Explainable AI: Grad-CAM heatmaps, ViT attention maps, SHAP feature importance
- PDF report generation: Professional clinical-style reports with all predictions
- User authentication: Supabase authentication with scan history
- FastAPI backend: High-performance asynchronous API
- Next.js frontend: Modern, responsive web interface

---

# Model Performance

## CT Scan Models

| Model | Accuracy | AUC | Sensitivity | Specificity |
|-------|----------|-----|-------------|-------------|
| CNN | 98.1% | 0.996 | 97.2% | 98.9% |
| ViT | 97.2% | 0.991 | 96.6% | 97.8% |
| Random Forest | 89.2% | 0.925 | 88% | 91% |

## MRI Scan Models

| Model | Accuracy | AUC | Sensitivity | Specificity |
|-------|----------|-----|-------------|-------------|
| CNN | 98.5% | 0.998 | 99.2% | 97.5% |
| ViT | 97.3% | 0.989 | 98.3% | 95.8% |
| Random Forest | 92.7% | 0.962 | - | - |

---

# Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│                   Deployed on Vercel                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                    │
│                   Deployed on Render                        │
├─────────────────────────────────────────────────────────────┤
│  /predict      │ Single model prediction                   │
│  /predict-all  │ All three models                          │
│  /gradcam      │ CNN heatmap generation                    │
│  /attention    │ ViT attention maps                        │
│  /shap-single  │ SHAP feature importance                   │
│  /generate-report │ PDF report generation                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Model Layer                            │
├──────────────┬──────────────┬──────────────────────────────┤
│     CNN      │     ViT      │      Random Forest           │
│  4 conv      │  4 attention │      30 radiomics            │
│  layers      │  layers      │      features                │
│  2.6M params │  810K params │      interpretable           │
└──────────────┴──────────────┴──────────────────────────────┘
```

---

# Project Structure

```text
tumorlens/
├── backend/
│   ├── api/
│   │   └── prediction.py      # API endpoints
│   ├── models/
│   │   ├── loader.py          # Model loading
│   │   └── *.pth / *.pkl      # Trained models
│   ├── utils/
│   │   ├── preprocessing.py   # Image preprocessing
│   │   ├── feature_extractor.py # Radiomics features
│   │   └── report_generator.py   # PDF generation
│   ├── main.py                # FastAPI entry point
│   └── requirements.txt       # Python dependencies
│
├── frontend/
│   └── brain-tumor-classification/
│       ├── app/
│       │   ├── page.tsx       # Home page
│       │   ├── upload/
│       │   │   └── page.tsx   # Upload & analysis
│       │   ├── dashboard/
│       │   │   └── page.tsx   # Scan history
│       │   └── benchmarks/
│       │       └── page.tsx   # Model comparison
│       ├── components/
│       │   └── ExpandableBreakdown.tsx
│       ├── lib/
│       │   └── api.ts         # API client
│       └── package.json
│
└── README.md
```

---

# Installation

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

---

# Backend Setup

```bash
git clone https://github.com/sunaina88/ct-radiomics.git
cd ct-radiomics/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

---

# Frontend Setup

```bash
cd frontend/brain-tumor-classification
npm install
cp .env.example .env.local
# Add your API URL and Supabase credentials to .env.local
npm run dev
```

---

# Environment Variables

## Backend (.env)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Frontend (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

# API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/predict | Single model prediction |
| POST | /api/predict-all | All three models |
| POST | /api/gradcam | Grad-CAM heatmap |
| POST | /api/attention | ViT attention map |
| POST | /api/shap-single | SHAP feature analysis |
| POST | /api/generate-report | PDF report |
| GET | /api/models | Available models |
| GET | /api/health | Service health |

---

# Deployment

## Backend (Render)

1. Push your backend code to GitHub
2. Connect your repository to Render
3. Set Root Directory to `backend`
4. Build Command:

```bash
pip install -r requirements.txt
```

5. Start Command:

```bash
uvicorn main:app --host 0.0.0.0 --port 10000
```

---

## Frontend (Vercel)

1. Push your frontend code to GitHub
2. Import your repository to Vercel
3. Set Root Directory to `frontend/brain-tumor-classification`
4. Add environment variables
5. Deploy

---

# Technologies Used

## Backend

- FastAPI - REST API framework
- PyTorch - CNN and ViT models
- scikit-learn - Random Forest classifier
- SHAP - Model interpretability
- ReportLab - PDF report generation
- Supabase - Authentication and database

## Frontend

- Next.js 14 - React framework
- Tailwind CSS - Styling
- TypeScript - Type safety
- Axios - API client
- React Dropzone - File upload

## Deployment

- Render - Backend hosting
- Vercel - Frontend hosting
- Supabase - Database and authentication

---

# Training Details

## CNN Architecture

- 4 convolutional layers (32->64->128->256 filters)
- Batch normalization after each conv layer
- MaxPooling (2x2) after each conv block
- Dropout (0.3) for regularization
- 3 fully connected layers (512->256->2)

## ViT Architecture

- Patch size: 8x8 (64 patches per 64x64 image)
- Embedding dimension: 128
- 4 transformer layers
- 4 attention heads per layer
- MLP dimension: 512

## Radiomics Features (30 total)

- First-order (15): mean, std, skewness, kurtosis, percentiles, entropy, energy
- Texture (6): GLCM contrast, dissimilarity, homogeneity, energy, correlation, ASM
- Shape (9): area, perimeter, eccentricity, solidity, extent, roundness, aspect ratio

---

# Dataset

- CT scans: 4,618 images (2,300 Healthy, 2,318 Tumor)
- MRI scans: 4,981 images (1,997 Healthy, 2,984 Tumor)
- Source: Kaggle Brain Tumor CT and MRI datasets

---

# Model Loading Optimization

Due to Render free tier memory limitations (512MB), models are loaded on demand rather than all at startup:

- Random Forest models load immediately (lightweight)
- CNN and ViT models load only when requested
- SHAP analysis falls back to global feature importance when memory constrained

---

# Future Work

- External validation on clinical data from KIMS hospital
- Multi-modal fusion combining CT and MRI of same patient
- Real-time inference optimization for edge deployment
- Longitudinal analysis for tumor growth tracking

---

# Limitations

- Models trained on publicly available datasets only
- Not clinically validated
- Input images resized to 64x64 pixels (fine detail may be lost)
- SHAP analysis requires more memory than free tier provides
- System detects tumor presence only, not type or grade

---

# Disclaimer

This system is for research and educational purposes only. It is not FDA cleared or clinically validated. All predictions must be reviewed by a qualified radiologist before any clinical decision.

---

# License

MIT License

---

# Author

Sunaina

---

# Acknowledgments

- Kaggle for providing the brain tumor datasets
- PyTorch team for deep learning framework
- SHAP authors for model interpretability library
- Hugging Face for hosting resources

---

# Citation

```bibtex
@software{TumorLens2025,
  author = {Sunaina},
  title = {TumorLens: AI-Powered Brain Tumor Detection from CT and MRI Scans},
  year = {2025},
  url = {https://github.com/sunaina88/ct-radiomics}
}
```
