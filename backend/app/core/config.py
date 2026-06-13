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
LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "8192"))
INTEL_EXTRACT_MAX_TOKENS: int = int(os.getenv("INTEL_EXTRACT_MAX_TOKENS", str(LLM_MAX_TOKENS)))
INTEL_COMPRESS_MAX_TOKENS: int = int(os.getenv("INTEL_COMPRESS_MAX_TOKENS", str(LLM_MAX_TOKENS)))
BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Mod (b): canlı LLM yoksa mock ajanlar examples/ artifact'larını döndürür
USE_MOCK_AGENTS: bool = os.getenv("USE_MOCK_AGENTS", "auto") == "true" or (
    os.getenv("USE_MOCK_AGENTS", "auto") == "auto" and not LLM_API_KEY
)

def _resolve(name: str) -> Path:
    """schemas/ ve examples/ — repo kökünde (monorepo) ya da backend-local (deploy) olabilir."""
    root = REPO_ROOT / name
    return root if root.exists() else BACKEND_DIR / name


SCHEMAS_DIR = _resolve("schemas")
EXAMPLES_DIR = _resolve("examples")
ARTIFACTS_DIR = BACKEND_DIR / "artifacts"  # çalıştırma çıktıları buraya yazılır
REPORTS_DIR = BACKEND_DIR / "reports"      # Food Empire yıllık rapor PDF'leri

ARTIFACTS_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)
