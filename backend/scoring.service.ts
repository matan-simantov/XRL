/**
 * Scoring Engine for XRL Assessment
 * 
 * Implements the scoring logic from "ScoreCalculations" Excel:
 * 1. Inner Weighting: Calculate group scores from parameter scores
 * 2. Expert Aggregation: Average expert scores for each group
 * 3. RL Mapping: Map group scores to Readiness Levels
 */

import {
  ParameterGroup,
  ParameterDef,
  ParameterConfiguration,
  ExpertInput,
  ExpertWeights,
  GroupScore,
  ReadinessLevel,
  ReadinessLevelScore
} from './types.js';

export class ScoringEngine {
  /**
   * Default expert weights (equal weights for 8 experts)
   * H1, H2, H3, LLM1, LLM2, LLM3, LLM4, LLM5
   */
  private static readonly DEFAULT_EXPERT_WEIGHT = 1 / 8; // 0.125

  /**
   * Calculate scores for all parameter groups from expert inputs
   * 
   * Step A: Inner Weighting - For each expert, calculate group scores
   * Step B: Expert Aggregation - Average expert scores for each group
   * 
   * @param expertInputs Array of expert inputs with raw scores
   * @param parameterConfig Configuration defining parameters and their weights
   * @param expertWeights Optional custom weights for experts (defaults to equal)
   * @returns Array of group scores
   */
  calculateGroupScores(
    expertInputs: ExpertInput[],
    parameterConfig: ParameterConfiguration,
    expertWeights?: ExpertWeights
  ): GroupScore[] {
    // Step A: Calculate group scores for each expert
    const expertGroupScores: Map<ExpertID, Map<ParameterGroup, number>> = new Map();

    for (const expertInput of expertInputs) {
      const groupScores = this.calculateExpertGroupScores(expertInput, parameterConfig);
      expertGroupScores.set(expertInput.expertId, groupScores);
    }

    // Step B: Aggregate expert scores for each group
    const finalGroupScores: GroupScore[] = [];
    const contributingExperts: Map<ParameterGroup, ExpertID[]> = new Map();

    // Initialize contributing experts map
    Object.values(ParameterGroup).forEach(group => {
      contributingExperts.set(group, []);
    });

    // Calculate weighted average for each group
    for (const group of Object.values(ParameterGroup)) {
      let weightedSum = 0;
      let totalWeight = 0;
      const expertsForGroup: ExpertID[] = [];

      for (const expertInput of expertInputs) {
        const expertGroupMap = expertGroupScores.get(expertInput.expertId);
        if (!expertGroupMap) continue;

        const expertGroupScore = expertGroupMap.get(group);
        if (expertGroupScore === undefined || isNaN(expertGroupScore)) continue;

        // Get expert weight (custom or default)
        const expertWeight = expertWeights?.[expertInput.expertId] ?? ScoringEngine.DEFAULT_EXPERT_WEIGHT;

        weightedSum += expertGroupScore * expertWeight;
        totalWeight += expertWeight;
        expertsForGroup.push(expertInput.expertId);
      }

      // Calculate final score (avoid division by zero)
      const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      finalGroupScores.push({
        group,
        score: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
        contributingExperts: expertsForGroup
      });
    }

    return finalGroupScores;
  }

  /**
   * Calculate group scores for a single expert
   * 
   * Formula: Sum(ParameterScore * ParameterWeight) for all params in that group
   * 
   * @param expertInput Expert input with raw scores
   * @param parameterConfig Parameter configuration
   * @returns Map of ParameterGroup -> score
   */
  private calculateExpertGroupScores(
    expertInput: ExpertInput,
    parameterConfig: ParameterConfiguration
  ): Map<ParameterGroup, number> {
    const groupScores = new Map<ParameterGroup, number>();

    // Initialize all groups to 0
    Object.values(ParameterGroup).forEach(group => {
      groupScores.set(group, 0);
    });

    // Group parameters by their group
    const paramsByGroup = new Map<ParameterGroup, ParameterDef[]>();
    for (const param of parameterConfig.parameters) {
      if (!paramsByGroup.has(param.group)) {
        paramsByGroup.set(param.group, []);
      }
      paramsByGroup.get(param.group)!.push(param);
    }

    // Calculate weighted sum for each group
    for (const [group, params] of paramsByGroup.entries()) {
      let weightedSum = 0;
      let totalWeight = 0;

      for (const param of params) {
        const rawScore = expertInput.scores[param.id];
        if (rawScore === undefined || rawScore === null || isNaN(rawScore)) {
          continue; // Skip missing scores
        }

        // Normalize score to 0-100 range (assuming input is already 0-100)
        const normalizedScore = Math.max(0, Math.min(100, rawScore));
        weightedSum += normalizedScore * param.weight;
        totalWeight += param.weight;
      }

      // Calculate group score (avoid division by zero)
      const groupScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
      groupScores.set(group, groupScore);
    }

    return groupScores;
  }

  /**
   * Map parameter group scores to Readiness Levels
   * 
   * Mapping Logic:
   * - Competition & Companies -> CRL (Commercial)
   * - Global Funding & Financing -> CRL & ARL
   * - Human Capital -> TRL & PRL
   * - Other RLs (ERL, Societal, etc.) -> Average of all groups (placeholder)
   * 
   * @param groupScores Calculated group scores
   * @returns Array of readiness level scores (1-9 scale)
   */
  mapToReadinessLevels(groupScores: GroupScore[]): ReadinessLevelScore[] {
    // Create a map for quick lookup
    const groupScoreMap = new Map<ParameterGroup, number>();
    for (const gs of groupScores) {
      groupScoreMap.set(gs.group, gs.score);
    }

    // Helper to get group score or 0
    const getGroupScore = (group: ParameterGroup): number => {
      return groupScoreMap.get(group) ?? 0;
    };

    // Calculate average of all groups (for placeholder RLs)
    const avgAllGroups = groupScores.length > 0
      ? groupScores.reduce((sum, gs) => sum + gs.score, 0) / groupScores.length
      : 0;

    // Map to 1-9 scale (0-100 -> 1-9)
    const scaleTo1to9 = (score0to100: number): number => {
      // Linear mapping: 0 -> 1, 100 -> 9
      const scaled = 1 + (score0to100 / 100) * 8;
      return Math.round(scaled * 100) / 100; // Round to 2 decimal places
    };

    const rlScores: ReadinessLevelScore[] = [];

    // TRL (Technology Readiness Level)
    // Contributed by: Human Capital
    const trlScore = scaleTo1to9(getGroupScore(ParameterGroup.HumanCapital));
    rlScores.push({
      level: ReadinessLevel.TRL,
      score: trlScore,
      contributingGroups: [ParameterGroup.HumanCapital]
    });

    // MRL (Manufacturing Readiness Level)
    // Placeholder: Average of all groups
    rlScores.push({
      level: ReadinessLevel.MRL,
      score: scaleTo1to9(avgAllGroups),
      contributingGroups: Object.values(ParameterGroup)
    });

    // RRL (Regulatory Readiness Level)
    // Placeholder: Average of all groups
    rlScores.push({
      level: ReadinessLevel.RRL,
      score: scaleTo1to9(avgAllGroups),
      contributingGroups: Object.values(ParameterGroup)
    });

    // CRL (Commercial Readiness Level)
    // Contributed by: Competition, Companies, Global Funding, Financing
    const competitionScore = getGroupScore(ParameterGroup.Competition);
    const companiesScore = getGroupScore(ParameterGroup.Companies);
    const fundingScore = getGroupScore(ParameterGroup.GlobalFunding);
    const financingScore = getGroupScore(ParameterGroup.Financing);
    const crlAvg = (competitionScore + companiesScore + fundingScore + financingScore) / 4;
    rlScores.push({
      level: ReadinessLevel.CRL,
      score: scaleTo1to9(crlAvg),
      contributingGroups: [
        ParameterGroup.Competition,
        ParameterGroup.Companies,
        ParameterGroup.GlobalFunding,
        ParameterGroup.Financing
      ]
    });

    // ARL (Adoption Readiness Level)
    // Contributed by: Global Funding, Financing
    const arlAvg = (fundingScore + financingScore) / 2;
    rlScores.push({
      level: ReadinessLevel.ARL,
      score: scaleTo1to9(arlAvg),
      contributingGroups: [ParameterGroup.GlobalFunding, ParameterGroup.Financing]
    });

    // IRL (Integration Readiness Level)
    // Placeholder: Average of all groups
    rlScores.push({
      level: ReadinessLevel.IRL,
      score: scaleTo1to9(avgAllGroups),
      contributingGroups: Object.values(ParameterGroup)
    });

    // SRL (System Readiness Level)
    // Placeholder: Average of all groups
    rlScores.push({
      level: ReadinessLevel.SRL,
      score: scaleTo1to9(avgAllGroups),
      contributingGroups: Object.values(ParameterGroup)
    });

    // PRL (Process Readiness Level)
    // Contributed by: Human Capital
    rlScores.push({
      level: ReadinessLevel.PRL,
      score: scaleTo1to9(getGroupScore(ParameterGroup.HumanCapital)),
      contributingGroups: [ParameterGroup.HumanCapital]
    });

    // Societal RL
    // Placeholder: Average of all groups
    rlScores.push({
      level: ReadinessLevel.Societal,
      score: scaleTo1to9(avgAllGroups),
      contributingGroups: Object.values(ParameterGroup)
    });

    // ERL (Environmental Readiness Level)
    // Placeholder: Average of all groups
    rlScores.push({
      level: ReadinessLevel.ERL,
      score: scaleTo1to9(avgAllGroups),
      contributingGroups: Object.values(ParameterGroup)
    });

    return rlScores;
  }

  /**
   * Main entry point: Calculate all readiness level scores
   * 
   * @param expertInputs Array of expert inputs
   * @param parameterConfig Parameter configuration
   * @param expertWeights Optional expert weights
   * @returns Complete scoring results
   */
  calculateReadinessLevels(
    expertInputs: ExpertInput[],
    parameterConfig: ParameterConfiguration,
    expertWeights?: ExpertWeights
  ): {
    groupScores: GroupScore[];
    readinessLevelScores: ReadinessLevelScore[];
  } {
    // Step 1: Calculate group scores
    const groupScores = this.calculateGroupScores(expertInputs, parameterConfig, expertWeights);

    // Step 2: Map to readiness levels
    const readinessLevelScores = this.mapToReadinessLevels(groupScores);

    return {
      groupScores,
      readinessLevelScores
    };
  }
}


