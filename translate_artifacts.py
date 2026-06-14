"""
Translates existing pipeline artifact JSON files from Turkish to English.
Reads from backend/artifacts/<run_id>/, translates with Claude,
writes back in place, and pushes all artifacts to the Next.js DB in one call.

Usage (backend venv active):
    python translate_artifacts.py [--run-id run_b4ec1f2a] [--no-db]

    --no-db   skip pushing to the Next.js DB (only update local files)
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import anthropic
import requests

# ── paths ──────────────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).parent
BACKEND_DIR = REPO_ROOT / "backend"
ARTIFACTS_DIR = BACKEND_DIR / "artifacts"
DOTENV_PATH = REPO_ROOT / ".env"


def _load_env() -> None:
    if not DOTENV_PATH.exists():
        return
    with open(DOTENV_PATH) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k not in os.environ:
                os.environ[k] = v


_load_env()

API_KEY  = os.environ.get("LLM_API_KEY", "")
MODEL    = os.environ.get("MODEL_NAME", "claude-sonnet-4-6")
FRONTEND = os.environ.get("FRONTEND_URL", "http://localhost:3000")

if not API_KEY:
    sys.exit("LLM_API_KEY not set in .env")

client = anthropic.Anthropic(api_key=API_KEY)

AGENTS: list[str] = ["intelligence", "strategy", "market", "campaign"]
FILE_NAMES: dict[str, str] = {
    "intelligence": "consolidated_timeline.json",
    "strategy":     "strategic_analysis.json",
    "market":       "market_recommendation.json",
    "campaign":     "campaign_proposal.json",
}

# ── translation ────────────────────────────────────────────────────────────

TRANSLATE_SYSTEM = """You are a precise JSON translator.
You will receive a JSON object whose string values may be in Turkish.
Translate ONLY the Turkish string values to natural English. Rules:
- Keep ALL JSON keys exactly as-is (never translate key names).
- Keep all numbers, booleans, and null values unchanged.
- Keep proper nouns unchanged: brand names, company names, country/city names
  (e.g. Food Empire, CDSG, Myanmar, Russia, Vietnam, Kazakhstan, CIS, Caffe Bene,
   Indochina, Singapore, India, Vietnam).
- Keep financial units and codes unchanged (USD, SGD, %, etc.),
  but translate any Turkish surrounding text.
- trend values like "up", "down", "flat", "n/a" are already English — keep them.
- entry_mode values like "joint_venture", "export", etc. are keys — keep them.
- Output ONLY valid JSON — no markdown fences, no explanation.
"""


def translate_artifact(agent: str, data: dict) -> dict:
    payload = json.dumps(data, ensure_ascii=False)
    print(f"  → translating [{agent}] ({len(payload):,} chars) …", flush=True)

    msg = client.messages.create(
        model=MODEL,
        max_tokens=8192,
        system=TRANSLATE_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": (
                    "Translate all Turkish string values to English in this JSON "
                    "(keep structure, keys, and proper nouns intact):\n\n" + payload
                ),
            }
        ],
    )
    raw = msg.content[0].text.strip()

    # strip markdown code fences if model wrapped the JSON
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:])
        if raw.rstrip().endswith("```"):
            raw = raw.rstrip()[:-3].rstrip()

    translated = json.loads(raw)
    usage = msg.usage
    print(
        f"     ✓ done  ({usage.input_tokens:,} in / {usage.output_tokens:,} out  "
        f"| model: {MODEL})"
    )
    return translated


# ── DB push via /api/pipeline/import ──────────────────────────────────────

def get_session_cookie(frontend: str) -> str | None:
    """Authenticate as demo user, return cookie string."""
    try:
        r = requests.post(
            f"{frontend}/api/auth/login",
            json={"email": "demo@brandops.ai", "password": "demo1234"},
            timeout=10,
        )
        if not r.ok:
            print(f"  ✗ login failed: {r.status_code} {r.text[:300]}")
            return None
        cookie = "; ".join(f"{k}={v}" for k, v in r.cookies.items())
        print("  ✓ authenticated as demo@brandops.ai")
        return cookie
    except Exception as exc:
        print(f"  ✗ cannot reach frontend at {frontend}: {exc}")
        return None


def push_all_to_db(
    frontend: str,
    run_id: str,
    artifacts: dict[str, dict],
    cookie: str,
) -> bool:
    """Call POST /api/pipeline/import with all translated artifacts at once."""
    try:
        r = requests.post(
            f"{frontend}/api/pipeline/import",
            json={"runId": run_id, "artifacts": artifacts},
            headers={"Cookie": cookie, "Content-Type": "application/json"},
            timeout=60,
        )
        if r.ok:
            data = r.json()
            print(f"  ✓ saved to DB: {data.get('saved', [])}")
            return True
        print(f"  ✗ DB push failed: {r.status_code}  {r.text[:300]}")
        return False
    except Exception as exc:
        print(f"  ✗ DB push exception: {exc}")
        return False


# ── main ───────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Translate pipeline artifact JSONs to English.")
    parser.add_argument("--run-id", default=None, help="Run directory name, e.g. run_b4ec1f2a")
    parser.add_argument("--no-db",  action="store_true", help="Skip Next.js DB push")
    args = parser.parse_args()

    # ── resolve run dir ────────────────────────────────────────────────────
    if args.run_id:
        run_dir = ARTIFACTS_DIR / args.run_id
        if not run_dir.is_dir():
            sys.exit(f"Run directory not found: {run_dir}")
    else:
        dirs = sorted(
            (d for d in ARTIFACTS_DIR.iterdir() if d.is_dir()),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        if not dirs:
            sys.exit(f"No artifact runs found in {ARTIFACTS_DIR}")
        run_dir = dirs[0]

    run_id = run_dir.name
    print(f"\n📂  Run : {run_id}")
    print(f"    Dir : {run_dir}\n")

    # ── auth ───────────────────────────────────────────────────────────────
    cookie: str | None = None
    if not args.no_db:
        print("🔐 Authenticating with frontend …")
        cookie = get_session_cookie(FRONTEND)
        if not cookie:
            print("   ⚠️  Will skip DB push.\n")

    # ── translate each artifact ────────────────────────────────────────────
    translated_artifacts: dict[str, dict] = {}

    for agent in AGENTS:
        fname = FILE_NAMES[agent]
        fpath = run_dir / fname
        if not fpath.exists():
            print(f"⚠️  {fname} not found — skipping {agent}")
            continue

        print(f"\n🌐 [{agent}]  {fname}")
        with open(fpath, encoding="utf-8") as f:
            original = json.load(f)

        translated = translate_artifact(agent, original)
        translated_artifacts[agent] = translated

        # write back to disk immediately
        with open(fpath, "w", encoding="utf-8") as f:
            json.dump(translated, f, ensure_ascii=False, indent=2)
        print(f"     ✓ written → {fpath}")

        time.sleep(0.3)   # gentle pacing

    # ── push all to DB ─────────────────────────────────────────────────────
    db_ok = False
    if cookie and translated_artifacts:
        print(f"\n💾 Pushing {len(translated_artifacts)} artifact(s) to DB …")
        db_ok = push_all_to_db(FRONTEND, run_id, translated_artifacts, cookie)

    # ── summary ────────────────────────────────────────────────────────────
    print("\n" + "─" * 60)
    print(f"✅  Translation complete.")
    print(f"    Files updated : {run_dir}")
    if db_ok:
        print(f"    DB updated    : {FRONTEND} (run {run_id})")
    else:
        print(f"    DB            : ⚠️  not updated")

    print("\n📋  Next steps:")
    print("    1. In your browser, open DevTools → Application → Local Storage")
    print("       → delete the 4 keys:  bo_artifact_intelligence  bo_artifact_strategy")
    print("                              bo_artifact_market        bo_artifact_campaign")
    print("    2. Reload any Results page — it will now read English content from the DB.")
    if not db_ok:
        print("    3. Alternatively, run the pipeline again — new runs use English prompts.")
    print()


if __name__ == "__main__":
    main()
