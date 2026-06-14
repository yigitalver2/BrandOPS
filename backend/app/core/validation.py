"""Validation layer — each agent output is checked against its JSON schema."""
import json
from functools import lru_cache

from jsonschema import Draft7Validator

from .config import SCHEMAS_DIR

# agent name -> schema file
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
    """Returns a list of schema errors; empty list means valid."""
    v = _validator(AGENT_SCHEMAS[agent])
    return [
        f"{'/'.join(map(str, e.path)) or '<root>'}: {e.message}"
        for e in sorted(v.iter_errors(data), key=lambda e: list(e.path))
    ]
