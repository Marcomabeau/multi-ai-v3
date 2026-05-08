// ─────────────────────────────────────────────────────────────
// MULTI Ai — Core Types
// ─────────────────────────────────────────────────────────────

export type Plan = 'free' | 'pro' | 'pro_max';
export type SubscriptionStatus = 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
export type QueryStatus = 'pending' | 'processing' | 'complete' | 'error';
export type ModelAgreement = 'agree' | 'disagree' | 'partial' | 'error';
export type SourceReliability = 'high' | 'medium' | 'low';

// ── Profile ───────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

// ── AI Provider Response ──────────────────────────────────────
export interface ProviderResponse {
  provider: 'openai' | 'gemini' | 'claude' | 'perplexity' | 'llama';
  model: string;
  rawAnswer: string;
  citations?: Citation[];
  latencyMs: number;
  error?: string;
  tokenInput?: number;
  tokenOutput?: number;
  costEstimateUsd?: number;
}

// ── Source / Citation ─────────────────────────────────────────
export interface Citation {
  claim: string;
  source: string;
  url: string;
  reliability: SourceReliability;
}

// ── Judge Output ──────────────────────────────────────────────
export interface JudgeResult {
  final_answer: string;
  confidence_score: number;
  confidence_reason: string;
  key_facts: string[];
  contradictions: string[];
  unsupported_claims: string[];
  source_trail: Citation[];
  model_agreement: {
    openai: ModelAgreement;
    gemini: ModelAgreement;
    claude: ModelAgreement;
    perplexity: ModelAgreement;
    llama: ModelAgreement;
  };
  final_warning: string | null;
}

// ── Query ─────────────────────────────────────────────────────
export interface Query {
  id: string;
  user_id: string;
  question: string;
  final_answer: string | null;
  confidence_score: number | null;
  status: QueryStatus;
  model_set: string[] | null;
  source_trail: Citation[] | null;
  judge_result: JudgeResult | null;
  latency_ms: number | null;
  cost_estimate_usd: number | null;
  created_at: string;
}

// ── Model Response (DB row) ───────────────────────────────────
export interface ModelResponse {
  id: string;
  query_id: string;
  provider: string;
  model: string | null;
  raw_answer: string | null;
  citations: Citation[] | null;
  latency_ms: number | null;
  error: string | null;
  token_input: number | null;
  token_output: number | null;
  cost_estimate_usd: number | null;
  created_at: string;
}

// ── Feedback ──────────────────────────────────────────────────
export interface Feedback {
  id: string;
  user_id: string;
  query_id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

// ── Usage ─────────────────────────────────────────────────────
export interface UsageWindow {
  id: string;
  user_id: string;
  window_start: string;
  window_end: string;
  query_count: number;
  created_at: string;
}

export interface UsageStatus {
  plan: Plan;
  queriesUsed: number;
  queriesLimit: number;
  windowResetsAt: string | null;
  canQuery: boolean;
}

// ── API Request/Response shapes ───────────────────────────────
export interface QueryRequest {
  question: string;
}

export interface QueryResponse {
  queryId: string;
  question: string;
  judgeResult: JudgeResult;
  providerResponses: ProviderResponse[];
  latencyMs: number;
}

export interface HistoryResponse {
  queries: Query[];
}

export interface FeedbackRequest {
  queryId: string;
  rating: number;
  comment?: string;
}

// ── Loading Pipeline State ────────────────────────────────────
export type LoadingStage =
  | 'idle'
  | 'querying_models'
  | 'comparing_answers'
  | 'verifying_sources'
  | 'generating_answer'
  | 'complete'
  | 'error';
