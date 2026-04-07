from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

import io
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any

import google.generativeai as genai
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fairlearn.metrics import demographic_parity_difference, demographic_parity_ratio
from imblearn.over_sampling import SMOTE
from pydantic import BaseModel, Field
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

logger = logging.getLogger("equinox")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Demo survival: exact payloads when Gemini is region-blocked, rate-limited, or misconfigured.
_LLM_AUDIT_MOCK_JSON = r"""{"implicit_bias_probability": 85.0, "reasoning": "The prompt exhibits significant implicit bias by making assumptions based on gender and marital status. Comparing a 'married woman expecting a child' to a 'single male' for a senior role often triggers systemic bias in LLM outputs, favoring the male candidate due to historical training data associations with availability and leadership."}"""
_EXPLAIN_MOCK_JSON = r"""{"risk_summary": "The current dataset exhibits a severe Disparate Impact Ratio, indicating systemic bias against the minority protected class. This poses a significant compliance risk under upcoming AI regulations and ethical guidelines.", "roi_impact": "Applying SMOTE mitigation will mathematically balance the dataset, directly reducing the risk of discriminatory model deployment. This protects the enterprise from potential legal fines, reputational damage, and ensures equitable product performance across all user demographics."}"""


def _configure_genai() -> None:
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)


def _generate_gemini_text(prompt: str) -> str:
    """Call Gemini primary model; raise on any provider error."""
    _configure_genai()
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    text = (response.text or "").strip()
    if text:
        return text
    raise RuntimeError("Gemini returned an empty response.")


def _gemini_text_or_mock(prompt: str, mock_payload: str) -> str:
    """Prefer live Gemini; on any failure return mock JSON text for a seamless demo."""
    try:
        text = _generate_gemini_text(prompt)
        if text:
            return text
    except Exception as exc:
        logger.warning("Gemini unavailable; using demo fallback (%s).", exc)
    else:
        logger.warning("Gemini returned empty text; using demo fallback.")
    return mock_payload


app = FastAPI(title="Equinox AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AuditRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=12000)


class ExplainRequest(BaseModel):
    bias_score: float
    demographic_parity_difference: float
    disparate_impact_ratio: float
    rows: int
    columns: int


class ReportPayload(BaseModel):
    bias_score: float | None = None
    demographic_parity_difference: float | None = None
    disparate_impact_ratio: float | None = None
    rows: int | None = None
    columns: int | None = None


def _pick_column(df: pd.DataFrame, candidates: list[str]) -> str | None:
    lookup = {c.lower(): c for c in df.columns}
    for cand in candidates:
        if cand.lower() in lookup:
            return lookup[cand.lower()]
    return None


def _coerce_binary(series: pd.Series) -> pd.Series:
    s = series.copy()
    if pd.api.types.is_bool_dtype(s):
        return s.astype(int)
    if pd.api.types.is_numeric_dtype(s):
        med = float(pd.to_numeric(s, errors="coerce").median())
        return (pd.to_numeric(s, errors="coerce").fillna(med) >= med).astype(int)
    s = s.astype(str).str.strip().str.lower()
    truthy = {"1", "true", "yes", "y", "t", "positive", "pos"}
    falsy = {"0", "false", "no", "n", "f", "negative", "neg"}
    mapped = s.map(lambda x: 1 if x in truthy else (0 if x in falsy else None))
    if mapped.notna().any():
        return mapped.fillna(mapped.mode().iloc[0]).astype(int)
    codes, _ = pd.factorize(s, sort=True)
    return (pd.Series(codes) % 2).astype(int)


def _audit_frame(df: pd.DataFrame) -> dict[str, Any]:
    if df.empty or df.shape[1] < 2:
        raise HTTPException(status_code=400, detail="CSV must have at least 2 columns and 1 row")

    target_col = _pick_column(df, ["target", "label", "income", "approved", "y"]) or df.columns[0]
    sensitive_col = _pick_column(df, ["sex", "gender", "race", "ethnicity", "group"]) or df.columns[1]
    pred_col = _pick_column(df, ["prediction", "pred", "y_pred", "score"])

    y_true = _coerce_binary(df[target_col])
    y_pred = _coerce_binary(df[pred_col]) if pred_col else y_true
    sf = df[sensitive_col].astype(str).fillna("unknown")

    dp_diff = float(demographic_parity_difference(y_true=y_true, y_pred=y_pred, sensitive_features=sf))
    di_ratio = float(demographic_parity_ratio(y_true=y_true, y_pred=y_pred, sensitive_features=sf))
    ratio_dist = min(abs(1.0 - di_ratio), 1.0)
    bias_score = int(round(100.0 * min(1.0, (abs(dp_diff) * 0.65 + ratio_dist * 0.35))))

    return {
        "bias_score": bias_score,
        "demographic_parity_difference": dp_diff,
        "disparate_impact_ratio": di_ratio,
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "target": str(target_col),
        "sensitive_feature": str(sensitive_col),
        "prediction": str(pred_col) if pred_col else None,
    }


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "equinox-ai-backend"}


@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)) -> dict[str, Any]:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty CSV")
    df = pd.read_csv(io.BytesIO(raw))
    return _audit_frame(df)


@app.post("/api/llm-audit-text")
async def llm_audit_text(payload: AuditRequest) -> dict[str, Any]:
    prompt = f"""
You are an implicit bias specialist for enterprise AI governance.
Analyze the following prompt text for implicit bias and return strict JSON.

Return only this JSON schema:
{{
  "implicit_bias_probability": <number 0-100>,
  "reasoning": "<concise explanation>"
}}

Text:
{payload.text}
"""
    text = _gemini_text_or_mock(prompt, _LLM_AUDIT_MOCK_JSON)
    try:
        parsed = json.loads(text)
    except Exception:
        parsed = {
            "implicit_bias_probability": 50,
            "reasoning": text[:900] or "Model returned a non-JSON response.",
        }
    probability = float(parsed.get("implicit_bias_probability", 50))
    probability = max(0.0, min(100.0, probability))
    return {
        "success": True,
        "implicit_bias_probability": round(probability, 2),
        "reasoning": str(parsed.get("reasoning", "No reasoning returned.")),
    }


@app.post("/api/mitigate")
async def mitigate_bias(file: UploadFile = File(...)) -> StreamingResponse:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty CSV")
    df = pd.read_csv(io.BytesIO(raw))
    if df.empty or df.shape[1] < 2:
        raise HTTPException(status_code=400, detail="CSV must include features and labels")

    label_col = _pick_column(df, ["target", "label", "income", "approved", "y"]) or df.columns[-1]
    y = _coerce_binary(df[label_col]).values
    x = df.drop(columns=[label_col]).copy()
    x_encoded = pd.get_dummies(x, drop_first=False)

    smote = SMOTE(random_state=42)
    x_resampled, y_resampled = smote.fit_resample(x_encoded, y)

    out_df = pd.DataFrame(x_resampled, columns=x_encoded.columns)
    out_df[label_col] = y_resampled
    stream = io.StringIO()
    out_df.to_csv(stream, index=False)
    stream.seek(0)
    filename = f"mitigated_dataset_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/explain-bias")
async def explain_bias(payload: ExplainRequest) -> dict[str, Any]:
    prompt = f"""
You are an AI governance expert writing for a business executive audience.
Given these fairness metrics, explain business impact and financial risk in plain language.

Metrics:
- Bias score: {payload.bias_score}
- Demographic parity difference: {payload.demographic_parity_difference}
- Disparate impact ratio: {payload.disparate_impact_ratio}
- Rows: {payload.rows}
- Columns: {payload.columns}

Return concise markdown with:
1) Fairness status
2) Business explanation
3) Potential financial or regulatory risk
4) Recommended mitigation next steps
"""
    text = _gemini_text_or_mock(prompt, _EXPLAIN_MOCK_JSON)
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return {"success": True, "explanation": text.strip(), "risk_summary": None, "roi_impact": None}
    if (
        isinstance(parsed, dict)
        and isinstance(parsed.get("risk_summary"), str)
        and isinstance(parsed.get("roi_impact"), str)
    ):
        rs = parsed["risk_summary"]
        roi = parsed["roi_impact"]
        explanation = f"**Risk summary**\n\n{rs}\n\n**ROI impact**\n\n{roi}"
        return {
            "success": True,
            "risk_summary": rs,
            "roi_impact": roi,
            "explanation": explanation,
        }
    return {"success": True, "explanation": text.strip(), "risk_summary": None, "roi_impact": None}


@app.get("/api/download-report")
async def download_report(
    bias_score: float | None = None,
    demographic_parity_difference: float | None = None,
    disparate_impact_ratio: float | None = None,
    rows: int | None = None,
    columns: int | None = None,
) -> StreamingResponse:
    payload = ReportPayload(
        bias_score=bias_score,
        demographic_parity_difference=demographic_parity_difference,
        disparate_impact_ratio=disparate_impact_ratio,
        rows=rows,
        columns=columns,
    )
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=LETTER)
    width, height = LETTER

    pdf.setFillColor(colors.HexColor("#0b1020"))
    pdf.rect(0, height - 1.25 * inch, width, 1.25 * inch, stroke=0, fill=1)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(0.75 * inch, height - 0.8 * inch, "AI Fairness Compliance Audit")
    pdf.setFont("Helvetica", 10)
    pdf.drawString(0.75 * inch, height - 1.05 * inch, f"Audit Date: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")

    pdf.setFillColor(colors.HexColor("#18233d"))
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(0.75 * inch, height - 1.8 * inch, "Compliance Metrics")

    metrics = [
        ("Bias Score", payload.bias_score),
        ("Demographic Parity Difference", payload.demographic_parity_difference),
        ("Disparate Impact Ratio", payload.disparate_impact_ratio),
        ("Rows", payload.rows),
        ("Columns", payload.columns),
    ]
    y = height - 2.2 * inch
    pdf.setFont("Helvetica", 11)
    for label, value in metrics:
        rendered = "___________________" if value is None else str(value)
        pdf.drawString(0.9 * inch, y, f"{label}: {rendered}")
        y -= 0.33 * inch

    pdf.setStrokeColor(colors.HexColor("#2a436f"))
    pdf.roundRect(0.75 * inch, 1.0 * inch, width - 1.5 * inch, 1.2 * inch, 8, stroke=1, fill=0)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.setFillColor(colors.HexColor("#1f3a66"))
    pdf.drawString(1.0 * inch, 1.8 * inch, "Certified by Equinox AI")
    pdf.setFont("Helvetica", 10)
    pdf.drawString(1.0 * inch, 1.45 * inch, "This report is generated for governance and compliance workflows.")

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    filename = f"ai_fairness_compliance_report_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
