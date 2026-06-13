"""Agent prompts — contains the brief's guiding questions (PRD Sections 1 & 2)."""

# ============================ IntelligenceAgent =============================
# Brief Section 1.A — targeted extraction per annual report + iterative summarization.

INTEL_SYSTEM = """You are a senior investment analyst specializing in the analysis of Food Empire \
Holdings' annual reports. Your task: read a single annual report and produce a decision-quality \
summary focused on the coffee business. No speculation — rely only on evidence in the report. \
Your output will be the sole input for the next agent (strategic periodization), so be concise \
but complete."""

# Pass 1: targeted extraction (brief's guiding questions)
INTEL_EXTRACT = """Below is the text of Food Empire's {year} annual report. Extract information \
from the sections requested by the brief and answer each heading in bullet points:

1. MD&A — overall strategy, market conditions, performance highlights, future outlook
2. Segment reporting — coffee segment revenue, profit, geographic breakdown
3. Financials — total revenue, net profit, key ratios (gross/net margin, etc.)
4. Risk factors — coffee and market-related challenges and opportunities
5. Notes — significant transactions, investments, acquisitions, accounting policies
6. KPIs — key indicators for the year and their direction vs. prior year (up/down/flat)

Write only information that appears in the report. State figures with their currency.
Keep output compact: at most 4 bullets per heading, each bullet one sentence.
Do not make long quotations; retain only numerical/strategic information that improves decision quality.

--- REPORT TEXT ({year}) ---
{report_text}
--- END OF TEXT ---"""

# Pass 2: summary of the summary (compression) + structured JSON
INTEL_COMPRESS = """Below is information extracted from Food Empire's {year} report. \
Compress it to minimum viable text and produce EXACTLY one year record in the JSON schema below \
(write nothing else, only JSON):

{{
  "year": {year},
  "data_available": true,
  "key_events": ["..."],
  "geographic_markets": ["..."],
  "stated_strategy": "single paragraph",
  "financials": {{
    "revenue": <number or "string">,
    "profit": <number or "string">,
    "currency": "USD million etc.",
    "key_ratios": [{{"name": "...", "value": "..."}}]
  }},
  "risks": ["..."],
  "kpis": [{{"name": "...", "value": "...", "trend": "up|down|flat|n/a"}}]
}}

--- EXTRACTED INFORMATION ({year}) ---
{extracted}
--- END ---"""

INTEL_RETRY_SUFFIX = """\n\nIMPORTANT: Your previous response produced the following schema errors — fix them:\n{errors}\n\
Return only valid JSON."""


# ============================== StrategyAgent ==============================
# Brief Section 1.B — three internal passes: period detection, isolated deep analysis, synthesis.

STRAT_SYSTEM = """You are a senior strategy consultant specializing in corporate strategy. \
Your task is to identify strategic periods from Food Empire's consolidated timeline, \
analyze each period separately, and weave them into a single coherent narrative. \
Ground all claims solely on evidence in the provided timeline."""

# Pass 1 — Strategic period detection
STRAT_PASS1 = """Below is Food Empire's year-by-year consolidated timeline (JSON). \
Identify strategic periods. For each period provide:
- name: a short, distinctive label that characterizes the period
- start_year / end_year
- geographic_focus: geographic priorities of that period (list)
- strategy: the period's overall strategy (1-2 sentences)
- initiatives: key initiatives of the period (list)
- transition_in: the event/decision that opened this period (what evidence?)
- transition_out: the event/decision that closed this period (what evidence?)

Justify each period boundary with CONCRETE evidence from the timeline (event, financial break, \
strategy shift). Periods must be chronological and non-overlapping.

Return ONLY JSON in this format (no other text):
{{"periods": [{{"name": "...", "start_year": 2023, "end_year": 2024, "geographic_focus": ["..."], "strategy": "...", "initiatives": ["..."], "transition_in": "...", "transition_out": "..."}}]}}

--- CONSOLIDATED TIMELINE ---
{timeline}
--- END ---"""

# Pass 2 — Isolated deep analysis of a single period
STRAT_PASS2 = """Below is Food Empire's consolidated timeline and ONE strategic period to focus on. \
Analyze ONLY this period in depth and answer the brief's questions:
- financial_summary: geographic focus, specific strategy, financial performance (successes, challenges, trends) — single paragraph
- brand_product_evolution: changes in strategy, market focus, product offering, and branding — single paragraph
- kpi_movement: evolution of brand/product strategy and movement of KPIs — single paragraph

Return ONLY this JSON (no other text):
{{"financial_summary": "...", "brand_product_evolution": "...", "kpi_movement": "..."}}

--- FOCUS PERIOD ---
{period}

--- CONTEXT: CONSOLIDATED TIMELINE ---
{timeline}
--- END ---"""

# Pass 3 — synthesis (through-line; not a concatenation)
STRAT_PASS3 = """Below are Food Empire's strategic periods with their analyses. Weave them into \
ONE coherent narrative — not a combined summary of the periods, but a story with a THROUGH-LINE. \
Reveal the core logic, recurring pattern, and strategic evolution in Food Empire's trajectory. \
1-3 paragraphs, flowing prose.

Return ONLY this JSON: {{"synthesis_narrative": "..."}}

--- PERIODS AND THEIR ANALYSES ---
{periods}
--- END ---"""


# =============================== CDSG context ==============================
# Brief's consulting fiction — fixed context for MarketDebate and Campaign agents.

CDSG_CONTEXT = """CDSG (Capital Diamond Star Group) is a large Myanmar-based conglomerate \
with strong local presence in food, distribution, FMCG, and retail. CDSG wants to grow a \
regional coffee business modeled on publicly listed Singaporean Food Empire and achieve \
sustainable profitability. Consulting question: 'What strategic framework and action plan \
should CDSG adopt to achieve sustainable profitability in the regional coffee market?' \
CDSG's strongest assets are its deep distribution network in Myanmar, regulatory knowledge, \
and consumer reach."""


# ============================ MarketDebateAgent ============================
# Brief Section 1.C — candidate markets, advocate/challenger/CFO, decision.

MARKET_SYSTEM = """You are a senior strategy consultant chairing an investment committee. \
Drawing on Food Empire's strategic analysis and CDSG's Myanmar-based context, you will \
produce a single, defensible market recommendation for CDSG's initial regional coffee expansion. \
Run a structured internal debate: for each candidate balance the advocate (bull), challenger \
(bear), and CFO (financial discipline) perspectives."""

# Pass 1 — candidate markets + bull/bear + CFO score
MARKET_DEBATE = """Below is Food Empire's strategic analysis and CDSG's context. \
Generate 3-4 candidate markets for CDSG's first coffee market expansion (from strategic \
analysis + CDSG Myanmar context). Run a structured debate for each candidate:
- market: market name
- bull_case: Advocate — the strongest positive case for entering this market (1 paragraph)
- bear_case: Challenger — risks, barriers, failure scenarios (1 paragraph)
- cfo_score: CFO Filter — a score from 0-10 based on entry cost, payback period, and risk \
tolerance (10 = most attractive)

Keep it brief: bull_case and bear_case at most 2 sentences; generate no more than 3 candidates.

Return ONLY this JSON (no other text):
{{"candidates": [{{"market": "...", "bull_case": "...", "bear_case": "...", "cfo_score": 7.5}}]}}

--- FOOD EMPIRE STRATEGIC ANALYSIS ---
{analysis}

--- CDSG CONTEXT ---
{cdsg}
--- END ---"""

# Pass 2 — decision
MARKET_DECISION = """Below is the debate on candidate markets (bull/bear/CFO score) and CDSG context. \
Select a single winning market and produce a complete decision:
- recommended_market: winning market
- rationale: justification grounded in both Food Empire history and current environment (why this market, why not the others)
- success_factors: critical success factors derived from Food Empire's wins and losses (list)
- risks: risk + mitigation list, each as {{"risk": "...", "mitigation": "..."}}
- entry_mode: ONLY one of: "export" | "joint_venture" | "wholly_owned" | "franchise"
- entry_mode_justification: justification for the entry mode
- foodempire_adaptations: adaptations of the Food Empire playbook to CDSG's Myanmar base (list)

Keep it brief: rationale and entry_mode_justification at most 3 sentences; lists at most 5 items.

Return ONLY this JSON (do not restate candidates):
{{"recommended_market": "...", "rationale": "...", "success_factors": ["..."], "risks": [{{"risk": "...", "mitigation": "..."}}], "entry_mode": "joint_venture", "entry_mode_justification": "...", "foodempire_adaptations": ["..."]}}

--- CANDIDATES (DEBATE) ---
{candidates}

--- CDSG CONTEXT ---
{cdsg}
--- END ---"""


# ============================== CampaignAgent =============================
# Brief Section 2 — full, costed campaign for the selected market.

CAMPAIGN_SYSTEM = """You are a senior integrated marketing communications (IMC) strategist. \
You will convert the selected market recommendation into a complete, costed marketing campaign: \
target audience, value proposition/positioning, 4Ps, justified budget + Gantt, KPIs/measurement. \
Be concrete, actionable, and faithful to the realities of the selected market."""

# Pass 1 — audience + positioning + 4Ps
CAMPAIGN_PLAN = """Below is the market entry recommendation for CDSG (selected market, rationale, \
entry mode, Food Empire adaptations). Produce the strategic core of the campaign for this market:

A) target_audience: {{"demographics": "...", "psychographics": "...", "consumption_habits": "...", "unmet_needs": ["..."]}}
B) value_proposition (single paragraph), positioning_statement (single sentence), core_message (tagline/core message)
C) marketing_mix: {{"product": "formats/local adaptation/packaging", "price": "premium|value|competitive rationale", "place": "distribution channels", "promotion": "channels/tactics/message"}}

Stay faithful to the realities of the selected market (income level, channel structure, culture). Use Myanmar origin/CDSG advantage in positioning.
Keep it brief: each text field at most 2 sentences; unmet_needs at most 4 items.

Return ONLY this JSON:
{{"target_audience": {{...}}, "value_proposition": "...", "positioning_statement": "...", "core_message": "...", "marketing_mix": {{...}}}}

--- MARKET ENTRY RECOMMENDATION ---
{recommendation}
--- END ---"""

# Pass 2 — budget + Gantt + KPIs
CAMPAIGN_OPS = """Below is the campaign's strategic core (audience, positioning, 4Ps) and market \
recommendation. Produce the operational plan for execution:

D) budget: {{"total": <number>, "currency": "USD", "line_items": [{{"name": "...", "amount": <number>, "justification": "justification"}}]}}
   - The sum of line_items amounts MUST EQUAL total (mathematical consistency required).
E) gantt: 12-month activity schedule — [{{"activity": "...", "start_month": 1-12, "end_month": 1-12}}]
F) kpis: [{{"kpi": "...", "method": "measurement method", "target": "target", "cadence": "reporting frequency"}}]

Budget line items must be consistent with the selected 4Ps and channels. Add totals carefully.
Keep it brief: line_items at most 6 items, gantt at most 8 activities, kpis at most 6 items.

Return ONLY this JSON:
{{"budget": {{"total": 1500000, "currency": "USD", "line_items": [...]}}, "gantt": [...], "kpis": [...]}}

--- CAMPAIGN CORE (4Ps) ---
{core}

--- MARKET RECOMMENDATION (summary) ---
{recommendation}
--- END ---"""
