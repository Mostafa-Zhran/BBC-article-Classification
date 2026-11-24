from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import os, joblib, re, html, string, time
import numpy as np
import pandas as pd
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Pre-fetch NLTK resources
for pkg in ['punkt', 'punkt_tab', 'stopwords', 'wordnet', 'omw-1.4']:
    nltk.download(pkg, quiet=True)

# ── Paths & Model Loading ────────────────────────────────────
BASE_DIR   = Path(__file__).resolve().parent.parent
MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "models" / "bbc_best_model.pkl"))
RAW_DATA   = BASE_DIR / "data" / "bbc-text.csv"
CLEAN_DATA = BASE_DIR / "data" / "bbc_cleaned.csv"

model      = joblib.load(MODEL_PATH)
tfidf_step = model.named_steps['tfidf']
clf_step   = model.named_steps['clf']
classes    = list(clf_step.classes_)

STOP_WORDS = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

SECTOR_META = {
    "business": {
        "title": "Business",
        "icon": "TrendingUp",
        "color": "#00E5FF",
        "accent": "cyan",
        "description": "Global markets, equities, enterprise finance & macroeconomic policy"
    },
    "entertainment": {
        "title": "Entertainment",
        "icon": "Film",
        "color": "#FF007F",
        "accent": "pink",
        "description": "Cinema, streaming, pop culture, music & performing arts"
    },
    "politics": {
        "title": "Politics",
        "icon": "Landmark",
        "color": "#A855F7",
        "accent": "purple",
        "description": "Government policy, diplomatic treaties, legislation & parliament"
    },
    "sport": {
        "title": "Sport",
        "icon": "Trophy",
        "color": "#00FF88",
        "accent": "emerald",
        "description": "Professional leagues, tournaments, transfers & team competitions"
    },
    "tech": {
        "title": "Tech",
        "icon": "Cpu",
        "color": "#FF9100",
        "accent": "amber",
        "description": "Artificial intelligence, computing hardware, consumer tech & cloud"
    },
}

# ── Security & Allowed Frontend Origins ──────────────────────
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

cors_env = os.getenv("CORS_ORIGINS", "")
if cors_env and cors_env.strip() != "*":
    ALLOWED_ORIGINS = [o.strip() for o in cors_env.split(",") if o.strip()]
else:
    ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS

CLIENT_API_KEY = os.getenv("CLIENT_API_KEY", "bbc-nlp-secure-frontend-key-2026")

app = FastAPI(title="BBC News Classifier API")

# Strict CORS: Only allow verified frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Middleware: Restrict requests strictly to the frontend client
@app.middleware("http")
async def verify_frontend_client(request: Request, call_next):
    # 1. Allow preflight OPTIONS requests without blocking
    if request.method == "OPTIONS":
        return await call_next(request)

    # 2. Allow public health probe for deployment orchestrators
    if request.url.path in ["/api/health", "/docs", "/openapi.json"]:
        return await call_next(request)

    # 3. Check Origin / Referer if sent by a web browser
    origin = request.headers.get("origin")
    if origin and origin not in ALLOWED_ORIGINS:
        return JSONResponse(
            status_code=403,
            content={
                "detail": f"Access forbidden: Origin '{origin}' is not authorized. Requests are only accepted from the frontend application."
            }
        )

    # 4. Check Frontend Client Signature / Secret Key
    client_secret = request.headers.get("x-client-secret")
    if client_secret != CLIENT_API_KEY:
        return JSONResponse(
            status_code=403,
            content={
                "detail": "Access forbidden: Missing or unauthorized frontend client key. Direct unauthorized access is denied."
            }
        )

    return await call_next(request)

class PredictRequest(BaseModel):
    text: str

def preprocess(text: str) -> str:
    text = html.unescape(text)
    text = re.sub(r'http\S+|www\.\S+|\S+@\S+', '', text)
    text = text.encode('ascii', errors='ignore').decode()
    text = re.sub(r'\s+', ' ', text).strip().lower()
    tokens = word_tokenize(text)
    result = []
    for t in tokens:
        if all(ch in string.punctuation for ch in t): continue
        if t in STOP_WORDS: continue
        if t.isdigit(): result.append('<NUM>'); continue
        result.append(lemmatizer.lemmatize(t))
    return ' '.join(result)

def compute_probabilities(decision_scores, temperature=0.5):
    exp_s = np.exp((decision_scores - np.max(decision_scores)) / temperature)
    return exp_s / np.sum(exp_s)

def get_feature_attribution(processed_text, predicted_class, top_k=8):
    vec = tfidf_step.transform([processed_text])
    cls_idx = classes.index(predicted_class)
    weights = clf_step.coef_[cls_idx]
    
    indices = vec.indices
    names = tfidf_step.get_feature_names_out()
    
    contributions = []
    for i in indices:
        score = float(vec[0, i] * weights[i])
        contributions.append({"word": names[i], "weight": round(score, 4)})
    
    contributions.sort(key=lambda x: x["weight"], reverse=True)
    return contributions[:top_k]

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "engine": "Linear SVM + TF-IDF",
        "macro_f1": 0.9905,
        "classes": classes
    }

@app.get("/api/analytics")
def get_analytics():
    # If raw/cleaned data files exist on disk, compute live; otherwise use precomputed verified metrics
    if RAW_DATA.exists() and CLEAN_DATA.exists():
        df_raw = pd.read_csv(RAW_DATA)
        df_clean = pd.read_csv(CLEAN_DATA)
        raw_counts = df_raw['category'].value_counts().to_dict()
        clean_counts = df_clean['category'].value_counts().to_dict()
        total_raw = len(df_raw)
        total_cleaned = len(df_clean)
        char_lens = df_clean['text_clean'].str.len()
        word_lens = df_clean['text_clean'].str.split().apply(len)
        avg_chars = round(float(char_lens.mean()), 1)
        avg_words = round(float(word_lens.mean()), 1)
    else:
        raw_counts = {"sport": 511, "business": 510, "politics": 417, "tech": 401, "entertainment": 386}
        clean_counts = {"sport": 504, "business": 503, "politics": 403, "entertainment": 369, "tech": 347}
        total_raw = 2225
        total_cleaned = 2126
        avg_chars = 2232.4
        avg_words = 384.2

    feature_names = tfidf_step.get_feature_names_out()
    top_words = {}
    for i, cls in enumerate(clf_step.classes_):
        top_idx = np.argsort(clf_step.coef_[i])[-8:][::-1]
        top_words[cls] = [{"word": feature_names[j], "weight": round(float(clf_step.coef_[i][j]), 3)} for j in top_idx]

    # Detailed class comparison table
    class_table = []
    for cat in ['sport', 'business', 'politics', 'tech', 'entertainment']:
        r_cnt = raw_counts.get(cat, 0)
        c_cnt = clean_counts.get(cat, 0)
        class_table.append({
            "category": cat.capitalize(),
            "raw_count": r_cnt,
            "raw_pct": round(r_cnt / total_raw * 100, 1),
            "clean_count": c_cnt,
            "clean_pct": round(c_cnt / total_cleaned * 100, 1),
            "duplicates_removed": r_cnt - c_cnt,
            "color": SECTOR_META[cat]["color"]
        })

    return {
        "summary": {
            "total_raw": total_raw,
            "total_cleaned": total_cleaned,
            "duplicates_removed": total_raw - total_cleaned,
            "avg_chars": avg_chars,
            "avg_words": avg_words,
            "avg_sentences": 17.8,
            "vocabulary_reduction": "47.0%",
            "best_f1": "99.05%"
        },
        "raw_distribution": {
            "Sport": raw_counts.get("sport", 511),
            "Business": raw_counts.get("business", 510),
            "Politics": raw_counts.get("politics", 417),
            "Tech": raw_counts.get("tech", 401),
            "Entertainment": raw_counts.get("entertainment", 386)
        },
        "clean_distribution": {
            "Sport": clean_counts.get("sport", 504),
            "Business": clean_counts.get("business", 503),
            "Politics": clean_counts.get("politics", 403),
            "Entertainment": clean_counts.get("entertainment", 369),
            "Tech": clean_counts.get("tech", 347)
        },
        "class_table": class_table,
        "model_benchmarks": [
            {"model": "Linear SVM", "f1": 0.9905, "accuracy": 0.9906, "color": "#00FF88"},
            {"model": "Logistic Regression", "f1": 0.9810, "accuracy": 0.9812, "color": "#00E5FF"},
            {"model": "Naive Bayes", "f1": 0.9779, "accuracy": 0.9781, "color": "#A855F7"}
        ],
        "confusion_matrix": {
            "labels": ["Business", "Entertainment", "Politics", "Sport", "Tech"],
            "matrix": [
                [76, 0, 0, 0, 0],
                [2, 53, 0, 0, 0],
                [0, 0, 61, 0, 0],
                [0, 0, 0, 75, 0],
                [1, 0, 0, 0, 51]
            ],
            "total_test": 319,
            "correct_test": 316,
            "accuracy_pct": 99.06
        },
        "top_words": top_words,
        "token_funnel": [
            {"stage": "Raw Text Tokens", "count": 773, "pct": 100},
            {"stage": "Normalized (Clean)", "count": 520, "pct": 67.2},
            {"stage": "Lemmatized & Filtered", "count": 410, "pct": 53.0}
        ]
    }

@app.post("/api/predict")
def predict_article(req: PredictRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty")
    
    t0 = time.perf_counter()
    raw_text = req.text.strip()
    processed = preprocess(raw_text)
    
    if not processed.strip():
        raise HTTPException(status_code=400, detail="Text did not contain enough valid tokens")

    # Predict
    predicted_cat = model.predict([processed])[0]
    decision_scores = model.decision_function([processed])[0]
    probs = compute_probabilities(decision_scores)
    prob_dict = {cls: round(float(p) * 100, 2) for cls, p in zip(classes, probs)}
    
    latency_ms = round((time.perf_counter() - t0) * 1000, 2)
    
    # Feature Attribution (Explainable AI)
    keywords = get_feature_attribution(processed, predicted_cat, top_k=8)

    # Detailed metrics
    words = raw_text.split()
    processed_tokens = processed.split()
    unique_tokens = len(set(processed_tokens))
    lexical_diversity = round((unique_tokens / max(1, len(processed_tokens))) * 100, 1)

    return {
        "category": predicted_cat,
        "meta": SECTOR_META[predicted_cat],
        "confidence": prob_dict[predicted_cat],
        "probabilities": prob_dict,
        "latency_ms": latency_ms,
        "keywords": keywords,
        "metrics": {
            "word_count": len(words),
            "char_count": len(raw_text),
            "token_count": len(processed_tokens),
            "unique_tokens": unique_tokens,
            "lexical_diversity": lexical_diversity,
            "model_benchmark_f1": "99.05%"
        }
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.api:app", host=host, port=port, reload=False)
