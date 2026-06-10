"""Mock ajanlar — mod (b): examples/ altındaki donmuş, doğrulanmış artifact'ları döndürür.

Pipeline'ı LLM anahtarı olmadan uçtan uca çalıştırır; canlı akış efekti için
küçük bir gecikme simüle eder.
"""
import json
import time

from ..core.config import EXAMPLES_DIR
from .base import BaseAgent

_ARTIFACT_FILES = {
    "intelligence": "consolidated_timeline.json",
    "strategy": "strategic_analysis.json",
    "market": "market_recommendation.json",
    "campaign": "campaign_proposal.json",
}

# Demo akışının gerçekçi hissetmesi için aşama başına saniye
_SIMULATED_DELAY_S = 1.5


class MockAgent(BaseAgent):
    def __init__(self, name: str):
        super().__init__()
        self.name = name

    def produce(self, input_data: dict, feedback=None) -> dict:
        time.sleep(_SIMULATED_DELAY_S)
        with open(EXAMPLES_DIR / _ARTIFACT_FILES[self.name]) as f:
            return json.load(f)


def make_mock_agents() -> dict[str, BaseAgent]:
    return {name: MockAgent(name) for name in _ARTIFACT_FILES}
