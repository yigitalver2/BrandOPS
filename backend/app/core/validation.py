"""Validation katmanı — her ajan çıktısı ilgili JSON şemasına karşı kontrol edilir."""
import json
from functools import lru_cache

from jsonschema import Draft7Validator

from .config import SCHEMAS_DIR

# agent adı -> şema dosyası
AGENT_SCHEMAS = {
    "intelligence": "consolidated_timeline.schema.json",
    "strategy": "strategic_analysis.schema.json",
    "market": "market_recommendation.schema.json",
    "campaign": "campaign_proposal.schema.json",
    "run_state": "run_state.schema.json",
}


@lru_cache(maxsize=None)
def _validator(schema_file: str) -> Draft7Validator:
    with open(SCHEMAS_DIR / schema_file) as f:
        return Draft7Validator(json.load(f))


def validate_artifact(agent: str, data: dict) -> list[str]:
    """Şema hatalarının listesini döndürür; boş liste = valid."""
    v = _validator(AGENT_SCHEMAS[agent])
    return [
        f"{'/'.join(map(str, e.path)) or '<root>'}: {e.message}"
        for e in sorted(v.iter_errors(data), key=lambda e: list(e.path))
    ]
