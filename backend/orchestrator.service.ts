/**
 * Assessment Orchestrator
 * 
 * Main service that orchestrates the full assessment flow:
 * 1. Chat Simulation (extract config from user input)
 * 2. Data Fetching (quantitative + expert scores)
 * 3. Calculation (using ScoringEngine)
 * 4. Final Output Construction
 */

import { randomUUID } from 'crypto';
import {
  AssessmentConfig,
  ExpertID,
  ExpertInput,
  ExpertType,
  FinalResponse,
  JourneyInfo,
  ParameterConfiguration,
  ParameterDef,
  ParameterGroup,
  RawMetrics,
  ExpertStatus,
  SectorTree,
  ReadinessLevel,
  MockDataResponse
} from './types.js';
import { ScoringEngine } from './scoring.service.js';

/**
 * Mock Data Fetcher
 * Simulates fetching quantitative data from BigQuery
 */
class MockDataFetcher {
  /**
   * Fetch quantitative metrics (mock implementation)
   * 
   * @param config Assessment configuration
   * @returns Mock metrics data
   */
  async fetchQuantitativeData(config: AssessmentConfig): Promise<MockDataResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate mock metrics based on sector
    const baseMetrics: RawMetrics = {
      ipos: Math.floor(Math.random() * 100) + 10,
      acquisitions: Math.floor(Math.random() * 50) + 5,
      activeCompanies: Math.floor(Math.random() * 500) + 100,
      newCompanies: Math.floor(Math.random() * 100) + 10,
      preSeedRounds: Math.floor(Math.random() * 200) + 20,
      seedRounds: Math.floor(Math.random() * 150) + 15,
      seriesARounds: Math.floor(Math.random() * 100) + 10,
      seriesBRounds: Math.floor(Math.random() * 80) + 8,
      seriesCRounds: Math.floor(Math.random() * 50) + 5,
      seriesASeedRatio: Math.random() * 2 + 0.5,
      avgCompanyAge: Math.random() * 10 + 2,
      funding: Math.floor(Math.random() * 10000000) + 1000000
    };

    // Generate parameter values (BigQuery Params 1-16)
    const parameters: Record<string, number> = {};
    for (let i = 1; i <= 16; i++) {
      parameters[`param_${i}`] = Math.floor(Math.random() * 100);
    }

    return {
      metrics: baseMetrics,
      parameters
    };
  }

  /**
   * Fetch expert scores (mock implementation)
   * 
   * @param config Assessment configuration
   * @param parameterIds List of parameter IDs to score
   * @returns Array of expert inputs with scores
   */
  async fetchExpertScores(
    config: AssessmentConfig,
    parameterIds: string[]
  ): Promise<ExpertInput[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const expertInputs: ExpertInput[] = [];

    for (const expertId of config.selectedExperts) {
      const expertType: ExpertType = expertId.startsWith('H') ? 'Human' : 'LLM';
      const scores: Record<string, number> = {};

      // Generate random scores for each parameter (0-100)
      for (const paramId of parameterIds) {
        // Add some variance: Human experts tend to be more conservative
        const baseScore = expertType === 'Human'
          ? Math.random() * 70 + 15  // 15-85 range
          : Math.random() * 80 + 10;  // 10-90 range
        
        scores[paramId] = Math.round(baseScore);
      }

      expertInputs.push({
        expertId,
        expertType,
        scores,
        timestamp: new Date().toISOString()
      });
    }

    return expertInputs;
  }
}

/**
 * Chat Analyzer
 * Analyzes user chat history to extract assessment configuration
 */
class ChatAnalyzer {
  /**
   * Analyze chat history and extract configuration
   * 
   * @param userChatHistory Array of chat messages
   * @returns Assessment configuration and sector tree
   */
  analyzeChat(userChatHistory: string[]): {
    config: AssessmentConfig;
    sectorTree: SectorTree;
  } {
    // Mock implementation: Extract keywords from chat
    const chatText = userChatHistory.join(' ').toLowerCase();

    // Simple keyword matching for sector detection
    let sectorName = 'Technology';
    let subSectorRegex = '.*';
    let root = 'Technology';
    let branch = 'General';
    let leaf = 'Innovation';

    if (chatText.includes('solar') || chatText.includes('pv') || chatText.includes('photovoltaic')) {
      sectorName = 'Solar Energy';
      subSectorRegex = 'solar|pv|photovoltaic';
      root = 'Energy';
      branch = 'Solar';
      leaf = 'Photovoltaic';
    } else if (chatText.includes('battery') || chatText.includes('energy storage')) {
      sectorName = 'Energy Storage';
      subSectorRegex = 'battery|storage|energy storage';
      root = 'Energy';
      branch = 'Storage';
      leaf = 'Battery';
    } else if (chatText.includes('ai') || chatText.includes('artificial intelligence')) {
      sectorName = 'Artificial Intelligence';
      subSectorRegex = 'ai|artificial intelligence|machine learning';
      root = 'Technology';
      branch = 'AI';
      leaf = 'Machine Learning';
    } else if (chatText.includes('biotech') || chatText.includes('biotechnology')) {
      sectorName = 'Biotechnology';
      subSectorRegex = 'biotech|biotechnology|pharma';
      root = 'Healthcare';
      branch = 'Biotech';
      leaf = 'Pharmaceuticals';
    }

    // Select experts (default: all 8 experts)
    const selectedExperts: ExpertID[] = ['H1', 'H2', 'H3', 'LLM1', 'LLM2', 'LLM3', 'LLM4', 'LLM5'];

    const config: AssessmentConfig = {
      sectorName,
      subSectorRegex,
      selectedExperts,
      runId: randomUUID()
    };

    const sectorTree: SectorTree = {
      root,
      branch,
      leaf
    };

    return { config, sectorTree };
  }
}

/**
 * Assessment Orchestrator
 * Main service that coordinates the assessment process
 */
export class AssessmentOrchestrator {
  private scoringEngine: ScoringEngine;
  private dataFetcher: MockDataFetcher;
  private chatAnalyzer: ChatAnalyzer;

  constructor() {
    this.scoringEngine = new ScoringEngine();
    this.dataFetcher = new MockDataFetcher();
    this.chatAnalyzer = new ChatAnalyzer();
  }

  /**
   * Get default parameter configuration
   * Defines all 16 parameters with their groups and weights
   */
  private getDefaultParameterConfig(): ParameterConfiguration {
    const parameters: ParameterDef[] = [
      // Competition Group
      { id: 'param_1', name: 'Market Competition Intensity', group: ParameterGroup.Competition, weight: 0.25 },
      { id: 'param_2', name: 'Competitive Landscape', group: ParameterGroup.Competition, weight: 0.25 },
      { id: 'param_3', name: 'Market Saturation', group: ParameterGroup.Competition, weight: 0.25 },
      { id: 'param_4', name: 'Barrier to Entry', group: ParameterGroup.Competition, weight: 0.25 },

      // Global Funding Group
      { id: 'param_5', name: 'Global Investment Volume', group: ParameterGroup.GlobalFunding, weight: 0.2 },
      { id: 'param_6', name: 'Funding Growth Rate', group: ParameterGroup.GlobalFunding, weight: 0.2 },
      { id: 'param_7', name: 'VC Activity', group: ParameterGroup.GlobalFunding, weight: 0.2 },
      { id: 'param_8', name: 'Government Funding', group: ParameterGroup.GlobalFunding, weight: 0.2 },
      { id: 'param_9', name: 'Corporate Investment', group: ParameterGroup.GlobalFunding, weight: 0.2 },

      // Human Capital Group
      { id: 'param_10', name: 'Talent Availability', group: ParameterGroup.HumanCapital, weight: 0.33 },
      { id: 'param_11', name: 'Expertise Density', group: ParameterGroup.HumanCapital, weight: 0.33 },
      { id: 'param_12', name: 'Research Activity', group: ParameterGroup.HumanCapital, weight: 0.34 },

      // Companies Group
      { id: 'param_13', name: 'Active Company Count', group: ParameterGroup.Companies, weight: 0.33 },
      { id: 'param_14', name: 'New Company Formation', group: ParameterGroup.Companies, weight: 0.33 },
      { id: 'param_15', name: 'Company Growth Rate', group: ParameterGroup.Companies, weight: 0.34 },

      // Financing Group
      { id: 'param_16', name: 'Financing Availability', group: ParameterGroup.Financing, weight: 1.0 }
    ];

    return { parameters };
  }

  /**
   * Generate expert status based on selected experts
   */
  private generateExpertStatus(selectedExperts: ExpertID[]): ExpertStatus {
    const status: ExpertStatus = {};
    
    // All selected experts are "Task Complete"
    for (const expertId of selectedExperts) {
      status[expertId] = 'Task Complete';
    }

    // Mark non-selected experts as "Pending"
    const allExperts: ExpertID[] = ['H1', 'H2', 'H3', 'LLM1', 'LLM2', 'LLM3', 'LLM4', 'LLM5'];
    for (const expertId of allExperts) {
      if (!selectedExperts.includes(expertId)) {
        status[expertId] = 'Pending';
      }
    }

    return status;
  }

  /**
   * Main method: Run full assessment
   * 
   * @param userChatHistory Array of user chat messages
   * @returns Complete assessment response
   */
  async runFullAssessment(userChatHistory: string[]): Promise<FinalResponse> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    // Phase 1: Chat Simulation
    console.log('Phase 1: Analyzing chat history...');
    const { config, sectorTree } = this.chatAnalyzer.analyzeChat(userChatHistory);
    config.runId = runId;

    // Phase 2: Data Fetching
    console.log('Phase 2: Fetching data...');
    const parameterConfig = this.getDefaultParameterConfig();
    const parameterIds = parameterConfig.parameters.map(p => p.id);

    const [quantitativeData, expertInputs] = await Promise.all([
      this.dataFetcher.fetchQuantitativeData(config),
      this.dataFetcher.fetchExpertScores(config, parameterIds)
    ]);

    // Phase 3: Calculation
    console.log('Phase 3: Calculating scores...');
    const scoringResults = this.scoringEngine.calculateReadinessLevels(
      expertInputs,
      parameterConfig
    );

    // Phase 4: Final Output Construction
    console.log('Phase 4: Constructing response...');

    // Build spider graph data
    const rlLabels = Object.values(ReadinessLevel);
    const rlScores = scoringResults.readinessLevelScores.sort((a, b) => {
      return rlLabels.indexOf(a.level) - rlLabels.indexOf(b.level);
    });

    const finalScores = rlScores.map(rls => rls.score);

    // Generate benchmark scores (slightly lower for comparison)
    const benchmarkScores = finalScores.map(score => Math.max(1, score * 0.85));

    const spiderGraph = {
      labels: rlLabels,
      datasets: [
        {
          label: 'Final Score',
          data: finalScores,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)'
        },
        {
          label: 'Benchmark',
          data: benchmarkScores,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)'
        }
      ]
    };

    // Build journey info
    const journey: JourneyInfo = {
      sector_tree: sectorTree,
      chatHistory: userChatHistory,
      config
    };

    // Build expert status
    const expertStatus = this.generateExpertStatus(config.selectedExperts);

    // Construct final response
    const response: FinalResponse = {
      meta: {
        runId,
        timestamp,
        version: '1.0.0'
      },
      journey,
      results: {
        spider_graph: spiderGraph,
        raw_metrics: quantitativeData.metrics,
        expert_status: expertStatus,
        readiness_levels: rlScores,
        group_scores: scoringResults.groupScores
      }
    };

    console.log('Assessment complete:', runId);
    return response;
  }
}

