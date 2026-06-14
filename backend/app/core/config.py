"""Environment configuration — reads from .env (BYOK)."""
import os
from pathlib import Path

from dotenv import load_dotenv

# Monorepo root: backend/app/core/config.py -> 3 levels up = backend, 4 = root
BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent

load_dotenv(REPO_ROOT / ".env")
load_dotenv(BACKEND_DIR / ".env")

LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
MODEL_NAME: str = os.getenv("MODEL_NAME", "claude-opus-4-8")
LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "8192"))
INTEL_EXTRACT_MAX_TOKENS: int = int(os.getenv("INTEL_EXTRACT_MAX_TOKENS", str(LLM_MAX_TOKENS)))
INTEL_COMPRESS_MAX_TOKENS: int = int(os.getenv("INTEL_COMPRESS_MAX_TOKENS", str(LLM_MAX_TOKENS)))
LLM_MAX_ATTEMPTS: int = int(os.getenv("LLM_MAX_ATTEMPTS", "1"))
REPORT_TEXT_MAX_CHARS: int = int(os.getenv("REPORT_TEXT_MAX_CHARS", "40000"))
BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Mode (b): if no live LLM is available, mock agents return examples/ artifacts
USE_MOCK_AGENTS: bool = os.getenv("USE_MOCK_AGENTS", "auto") == "true" or (
    os.getenv("USE_MOCK_AGENTS", "auto") == "auto" and not LLM_API_KEY
)

def _resolve(name: str) -> Path:
    """schemas/ and examples/ may live at the repo root (monorepo) or backend-local (deploy)."""
    root = REPO_ROOT / name
    return root if root.exists() else BACKEND_DIR / name


SCHEMAS_DIR = _resolve("schemas")
EXAMPLES_DIR = _resolve("examples")
ARTIFACTS_DIR = BACKEND_DIR / "artifacts"  # run outputs are written here
REPORTS_DIR = BACKEND_DIR / "reports"      # Food Empire annual report PDFs

ARTIFACTS_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)
