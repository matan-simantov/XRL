/**
 * Represents a single readiness level, such as Competition, Global Funding, Human Capital, etc.
 * Each readiness level has an ID, name, and a score from 0-100.
 */
export type ReadinessLevelScore = {
  id: string;
  name: string;
  score: number; // 0–100
};

/**
 * Assessment step types that represent the high-level XRL process stages.
 */
export type AssessmentStep =
  | "Technology Identification"
  | "Pulse Check KPIs"
  | "TRL Assessment"
  | "All RLs Assessment"
  | "Dashboard Ready";

/**
 * Status of an assessment step.
 */
export type AssessmentStepStatus = "not_started" | "in_progress" | "completed";

/**
 * Status tracking for the assessment process.
 * Contains information about which steps have been completed.
 */
export type DashboardStatus = {
  steps: {
    id: AssessmentStep;
    status: AssessmentStepStatus;
  }[];
};

/**
 * Represents the whole dashboard response for one sector + technology + engine combination.
 * Contains an overall score, an array of readiness level scores, and optional status tracking.
 */
export type DashboardResponse = {
  overallScore: number; // 0–100
  readinessLevels: ReadinessLevelScore[];
  status?: DashboardStatus; // Optional status tracking for the assessment process
};

/**
 * Scoring engine types available for the dashboard.
 */
export type ScoringEngine = "Human" | "LLM" | "Hybrid";

/**
 * Sector options for filtering the dashboard.
 */
export type Sector = "Fintech" | "Energy" | "Healthcare" | "Manufacturing" | "Retail";

/**
 * Technology options (can be sector-specific or general).
 */
export type Technology = string;

