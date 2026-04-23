"""
AgriNova ML Server — FastAPI Application
Serves crop recommendation and fertilizer prediction models.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.routes import predict, health
import os


# Rate limiter: 10 requests per minute per IP
limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models at startup, cleanup at shutdown."""
    print("🌱 AgriNova ML Server starting...")
    # Models are automatically loaded synchronously via predictor.py & shap_explainer.py
    print("✅ Models synchronized via global cache")
    yield
    print("🛑 AgriNova ML Server shutting down...")


app = FastAPI(
    title="AgriNova ML Server",
    description="Crop recommendation and fertilizer prediction API for AgriNova",
    version="1.0.0",
    lifespan=lifespan,
)

# Attach rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router, tags=["Health"])
app.include_router(predict.router, prefix="/predict", tags=["Prediction"])
