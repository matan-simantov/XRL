/**
 * Domain Definitions for XRL - Technology Readiness Assessment Engine
 * 
 * This file contains all type definitions, enums, and interfaces
 * used throughout the assessment system.
 */

/**
 * The 10 Readiness Levels (RLs) based on product specifications
 */
export enum ReadinessLevel {
  TRL = "TRL",           // Technology Readiness Level
  MRL = "MRL",           // Manufacturing Readiness Level
  RRL = "RRL",           // Regulatory Readiness Level
  CRL = "CRL",           // Commercial Readiness Level
  ARL = "ARL",           // Adoption Readiness Level
  IRL = "IRL",           // Integration Readiness Level
  SRL = "SRL",           // System Readiness Level
  PRL = "PRL",           // Process Readiness Level
  Societal = "Societal RL", // Societal Readiness Level
  ERL = "ERL"            // Environmental Readiness Level
}

/**
 * Parameter Groups - Input categories for scoring
 */
export enum ParameterGroup {
  Competition = "Competition",
  GlobalFunding = "Global Funding",
  HumanCapital = "Human Capital",
  Companies = "Companies",
  Financing = "Financing"
}

/**
 * Expert Identifiers
 * H1-H3: Human Experts
 * LLM1-LLM5: LLM Experts
 */
export type ExpertID = 'H1' | 'H2' | 'H3' | 'LLM1' | 'LLM2' | 'LLM3' | 'LLM4' | 'LLM5';

/**
 * Expert Type Classification
 */
export type ExpertType = 'Human' | 'LLM';

/**
 * Parameter Definition
 * Defines a single parameter with its metadata
 */
export interface ParameterDef {
  id: string;                    // Unique parameter identifier
  name: string;                   // Human-readable name
  group: ParameterGroup;         // Which group this parameter belongs to
  weight: number;                // Weight for scoring (0-1)
}

/**
 * Parameter Configuration
 * Collection of all parameters with their definitions
 */
export interface ParameterConfiguration {
  parameters: ParameterDef[];
}

/**
 * Expert Input
 * Raw scores from a single expert for multiple parameters
 */
export interface ExpertInput {
  expertId: ExpertID;
  expertType: ExpertType;
  scores: Record<string, number>; // parameterId -> score (0-100)
  timestamp?: string;
}

/**
 * Assessment Configuration
 * Configuration extracted from user chat/input
 */
export interface AssessmentConfig {
  sectorName: string;            // e.g., "Solar Energy"
  subSectorRegex: string;         // e.g., "solar|pv"
  selectedExperts: ExpertID[];    // Which experts to use
  runId?: string;                 // Unique run identifier
}

/**
 * Group Score
 * Calculated score for a parameter group
 */
export interface GroupScore {
  group: ParameterGroup;
  score: number;                  // Final score (0-100)
  contributingExperts: ExpertID[];
}

/**
 * Readiness Level Score
 * Final score for a readiness level
 */
export interface ReadinessLevelScore {
  level: ReadinessLevel;
  score: number;                  // Final score (1-9 scale)
  contributingGroups: ParameterGroup[];
}

/**
 * Expert Weights Configuration
 * Optional weights for expert aggregation (defaults to equal weights)
 */
export interface ExpertWeights {
  [expertId: string]: number;     // ExpertID -> weight (should sum to 1.0)
}

/**
 * Raw Metrics
 * Quantitative data fetched from BigQuery
 */
export interface RawMetrics {
  ipos?: number;
  acquisitions?: number;
  activeCompanies?: number;
  newCompanies?: number;
  preSeedRounds?: number;
  seedRounds?: number;
  seriesARounds?: number;
  seriesBRounds?: number;
  seriesCRounds?: number;
  seriesASeedRatio?: number;
  avgCompanyAge?: number;
  funding?: number;
  [key: string]: number | undefined; // Allow additional metrics
}

/**
 * Expert Status
 * Status of each expert in the assessment
 */
export interface ExpertStatus {
  [expertId: string]: 'Task Complete' | 'Pending' | 'In Progress' | 'Error';
}

/**
 * Sector Tree
 * Taxonomy tree structure for visualization
 */
export interface SectorTree {
  root: string;                   // Top-level category (e.g., "Energy")
  branch: string;                 // Mid-level category (e.g., "Solar")
  leaf: string;                   // Specific technology (e.g., "Perovskite")
}

/**
 * Journey Information
 * Metadata about the assessment journey
 */
export interface JourneyInfo {
  sector_tree: SectorTree;
  chatHistory?: string[];         // Original chat messages
  config?: AssessmentConfig;      // Configuration used
}

/**
 * Spider Graph Dataset
 * Data for visualization in spider/radar chart
 */
export interface SpiderGraphDataset {
  label: string;
  data: number[];                 // Array of 10 scores (one per RL)
  backgroundColor?: string;
  borderColor?: string;
}

/**
 * Spider Graph Data
 * Complete spider graph structure
 */
export interface SpiderGraphData {
  labels: string[];               // Array of 10 RL names
  datasets: SpiderGraphDataset[];
}

/**
 * Final Response
 * Complete assessment result matching frontend requirements
 */
export interface FinalResponse {
  meta: {
    runId: string;
    timestamp: string;
    version?: string;
  };
  journey: JourneyInfo;
  results: {
    spider_graph: SpiderGraphData;
    raw_metrics: RawMetrics;
    expert_status: ExpertStatus;
    readiness_levels?: ReadinessLevelScore[]; // Detailed RL scores
    group_scores?: GroupScore[];              // Detailed group scores
  };
}

/**
 * Mock Data Fetcher Response
 * Structure for mock quantitative data
 */
export interface MockDataResponse {
  metrics: RawMetrics;
  parameters: Record<string, number>; // parameterId -> value
}


