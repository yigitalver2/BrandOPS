"""BaseAgent — LLM çağrısı + schema validation + retry (max 2) + token kaydı.

Her ajan `produce(input)` ile ham çıktı üretir (LLM ya da mock);
`run(input)` bunu şemaya karşı doğrular, gerekirse düzeltici istemle yeniden dener.
"""
import json
import time
from dataclasses import dataclass, field

from ..core.config import LLM_API_KEY, MODEL_NAME
from ..core.validation import validate_artifact

MAX_ATTEMPTS = 2


class ValidationFailure(Exception):
    """İki denemede de şema doğrulaması geçilemedi -> needs_review."""

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
    """Alt sınıflar `name` tanımlar ve `produce`yu (gerekirse `system_prompt`u) override eder."""

    name: str = ""  # validation.AGENT_SCHEMAS anahtarı

    def __init__(self):
        self._tokens = {"input": 0, "output": 0, "total": 0}

    # --- LLM yardımcıları -------------------------------------------------
    def _call_llm(self, system: str, user: str, max_tokens: int = 8192) -> str:
        """Anthropic API çağrısı; token sayaçlarını biriktirir."""
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
        return resp.content[0].text

    @staticmethod
    def _extract_json(text: str) -> dict:
        """Model yanıtından ilk JSON objesini ayıkla (```json bloklarına toleranslı)."""
        text = text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            text = text[4:] if text.startswith("json") else text
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("yanıtta JSON objesi bulunamadı")
        return json.loads(text[start : end + 1])

    # --- Ana akış ----------------------------------------------------------
    def produce(self, input_data: dict, feedback: list[str] | None = None) -> dict:
        """Ham artifact üret. feedback: önceki denemenin şema hataları (düzeltici istem)."""
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
            feedback = errors  # düzeltici istemle yeniden dene
        raise ValidationFailure(self.name, errors)
