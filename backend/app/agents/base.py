"""BaseAgent — LLM call + schema validation + retry (max 2) + token tracking.

Each agent produces raw output via `produce(input)` (LLM or mock);
`run(input)` validates it against the schema and retries with corrective
feedback if needed.
"""
import json
import re
import time
from dataclasses import dataclass, field

from ..core.config import LLM_API_KEY, LLM_MAX_ATTEMPTS, MODEL_NAME
from ..core.validation import validate_artifact

MAX_ATTEMPTS = max(1, LLM_MAX_ATTEMPTS)


class ValidationFailure(Exception):
    """Schema validation failed after all attempts -> needs_review."""

    def __init__(self, agent: str, errors: list[str]):
        super().__init__(f"{agent}: schema validation failed after {MAX_ATTEMPTS} attempts")
        self.errors = errors


@dataclass
class AgentResult:
    output: dict
    tokens: dict = field(default_factory=lambda: {"input": 0, "output": 0, "total": 0})
    latency_ms: float = 0.0
    attempts: int = 1


class BaseAgent:
    """Subclasses define `name` and override `produce` (and optionally `system_prompt`)."""

    name: str = ""  # key in validation.AGENT_SCHEMAS

    def __init__(self):
        self._tokens = {"input": 0, "output": 0, "total": 0}

    # --- LLM helpers -------------------------------------------------
    def _call_llm(self, system: str, user: str, max_tokens: int = 8192) -> str:
        """Anthropic API call; accumulates token counts."""
        import anthropic

        client = anthropic.Anthropic(api_key=LLM_API_KEY)
        resp = client.messages.create(
            model=MODEL_NAME,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        self._tokens["input"] += resp.usage.input_tokens
        self._tokens["output"] += resp.usage.output_tokens
        self._tokens["total"] = self._tokens["input"] + self._tokens["output"]
        # A response truncated by max_tokens produces broken JSON; raise a clear error
        # (not a cryptic "Expecting ',' delimiter") so the limit can be increased.
        if resp.stop_reason == "max_tokens":
            raise ValueError(
                f"{self.name}: LLM response hit max_tokens={max_tokens} limit, "
                "output was truncated. Increase max_tokens."
            )
        return resp.content[0].text

    @staticmethod
    def _extract_json(text: str) -> dict:
        """Extract the first JSON object from model output (tolerant of ```json fences)."""
        text = text.strip()
        if text.startswith("```"):
            parts = text.split("```")
            if len(parts) >= 2:
                text = parts[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("no JSON object found in response")
        blob = text[start : end + 1]
        try:
            return json.loads(blob)
        except json.JSONDecodeError:
            # Common LLM quirk: trailing comma before closing brace/bracket.
            repaired = re.sub(r",(\s*[}\]])", r"\1", blob)
            return json.loads(repaired)

    # --- Main flow ----------------------------------------------------------
    def produce(self, input_data: dict, feedback: list[str] | None = None) -> dict:
        """Produce a raw artifact. feedback: schema errors from the previous attempt (corrective prompt)."""
        raise NotImplementedError

    def run(self, input_data: dict) -> AgentResult:
        started = time.monotonic()
        self._tokens = {"input": 0, "output": 0, "total": 0}
        feedback: list[str] | None = None
        errors: list[str] = []
        for attempt in range(1, MAX_ATTEMPTS + 1):
            output = self.produce(input_data, feedback=feedback)
            errors = validate_artifact(self.name, output)
            if not errors:
                return AgentResult(
                    output=output,
                    tokens=dict(self._tokens),
                    latency_ms=(time.monotonic() - started) * 1000,
                    attempts=attempt,
                )
            feedback = errors  # retry with corrective prompt
        raise ValidationFailure(self.name, errors)
