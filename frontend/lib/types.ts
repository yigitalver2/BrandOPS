// Aşamalar arası veri sözleşmeleri — schemas/*.schema.json ile birebir.

export type Trend = "up" | "down" | "flat" | "n/a";

export interface YearRecord {
  year: number;
  data_available?: boolean;
  key_events: string[];
  geographic_markets: string[];
  stated_strategy: string;
  financials: {
    revenue: number | string | null;
    profit: number | string | null;
    currency?: string;
    key_ratios: { name: string; value: number | string }[];
  };
  risks: string[];
  kpis: { name: string; value: number | string; trend?: Trend }[];
}

export interface ConsolidatedTimeline {
  company: string;
  generated_at?: string;
  records: YearRecord[];
}

export interface Period {
  name: string;
  start_year: number;
  end_year: number;
  geographic_focus: string[];
  strategy: string;
  initiatives: string[];
  transition_in: string;
  transition_out: string;
  financial_summary: string;
  brand_product_evolution: string;
  kpi_movement: string;
}

export interface StrategicAnalysis {
  generated_at?: string;
  periods: Period[];
  synthesis_narrative: string;
}

export interface MarketCandidate {
  market: string;
  bull_case: string;
  bear_case: string;
  cfo_score: number;
}

export type EntryMode = "export" | "joint_venture" | "wholly_owned" | "franchise";

export interface MarketRecommendation {
  generated_at?: string;
  candidates: MarketCandidate[];
  recommended_market: string;
  rationale: string;
  success_factors: string[];
  risks: { risk: string; mitigation: string }[];
  entry_mode: EntryMode;
  entry_mode_justification: string;
  foodempire_adaptations: string[];
}

export interface CampaignProposal {
  generated_at?: string;
  target_audience: {
    demographics: string;
    psychographics: string;
    consumption_habits: string;
    unmet_needs: string[];
  };
  value_proposition: string;
  positioning_statement: string;
  core_message: string;
  marketing_mix: { product: string; price: string; place: string; promotion: string };
  budget: {
    total: number;
    currency?: string;
    line_items: { name: string; amount: number; justification: string }[];
  };
  gantt: { activity: string; start_month: number; end_month: number }[];
  kpis: { kpi: string; method: string; target: string; cadence: string }[];
}

export type AgentName = "intelligence" | "strategy" | "market" | "campaign";
export type StageStatus =
  | "pending" | "running" | "completed" | "failed" | "needs_review";

export interface Stage {
  agent: AgentName;
  status: StageStatus;
  started_at: string | null;
  finished_at: string | null;
  tokens: { input: number; output: number; total: number };
  latency_ms: number | null;
  attempts: number;
  validation_passed: boolean;
  error: string | null;
}

export interface RunState {
  run_id: string;
  status: StageStatus;
  started_at: string | null;
  finished_at: string | null;
  stages: Stage[];
}

export const AGENT_META: Record<
  AgentName,
  { index: string; title: string; subtitle: string; artifact: string; href: string }
> = {
  intelligence: {
    index: "01", title: "IntelligenceAgent", subtitle: "alım · sıkıştırma",
    artifact: "consolidated_timeline.json", href: "/intelligence",
  },
  strategy: {
    index: "02", title: "StrategyAgent", subtitle: "dönemleştirme · sentez",
    artifact: "strategic_analysis.json", href: "/strategy",
  },
  market: {
    index: "03", title: "MarketDebateAgent", subtitle: "tartışma · karar",
    artifact: "market_recommendation.json", href: "/market",
  },
  campaign: {
    index: "04", title: "CampaignAgent", subtitle: "planlama · maliyetlendirme",
    artifact: "campaign_proposal.json", href: "/campaign",
  },
};
