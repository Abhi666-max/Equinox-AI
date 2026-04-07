# Equinox AI - Enterprise Bias Auditing

**Vercel Live Demo:** _Coming Soon_

Equinox AI is an enterprise-grade fairness and bias auditing platform designed for organizations that need transparent, accountable AI decisions. It enables teams to evaluate model outcomes across sensitive attributes, surface parity gaps, and generate decision-ready audit outputs. The system combines a production-style web experience with explainability-first workflows to support governance, compliance, and responsible deployment.

## Tech Stack

- Frontend: Next.js (App Router), React, TypeScript
- Backend: FastAPI, Python
- AI + Fairness: Google Gemini, Fairlearn, SMOTE
- Reporting + Visualization: PDF export pipeline, chart-based parity insights
- Deployment Targets: Vercel (frontend), cloud-hosted API runtime

## Local Run Instructions

### 1) Start Backend (`server`)

```bash
cd server
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `server/.env`:

```env
GEMINI_API_KEY=your_google_ai_key
```

Run API:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 2) Start Frontend (`client`)

```bash
cd client
npm install
npm run dev
```

Frontend default: `http://localhost:3001`  
Backend docs: `http://127.0.0.1:8000/docs`

## Security Note

- `.env` is ignored in root, `server`, and `client` to prevent secret leakage.
- Never commit API keys or credentials.

## Architect

Architect: Abhijeet Kangane
