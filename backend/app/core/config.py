"""Ortam yapılandırması — .env'den okur (BYOK)."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Monorepo kökü: backend/app/core/config.py -> 3 seviye yukarı = backend, 4 = kök
BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent

load_dotenv(REPO_ROOT / ".env")
load_dotenv(BACKEND_DIR / ".env")

LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
MODEL_NAME: str = os.getenv("MODEL_NAME", "claude-opus-4-8")
BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Mod (b): canlı LLM yoksa mock ajanlar examples/ artifact'larını döndürür
USE_MOCK_AGENTS: bool = os.getenv("USE_MOCK_AGENTS", "auto") == "true" or (
    os.getenv("USE_MOCK_AGENTS", "auto") == "auto" and not LLM_API_KEY
)

SCHEMAS_DIR = REPO_ROOT / "schemas"
EXAMPLES_DIR = REPO_ROOT / "examples"
ARTIFACTS_DIR = BACKEND_DIR / "artifacts"  # çalıştırma çıktıları buraya yazılır
REPORTS_DIR = BACKEND_DIR / "reports"      # Food Empire yıllık rapor PDF'leri

ARTIFACTS_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)
