import type { DashboardResponse, ScoringEngine } from "@/types/researcher";

/**
 * Mock service that simulates fetching dashboard data from a backend.
 * Returns hard-coded example data that looks realistic.
 * 
 * @param engine - The scoring engine to use (Human, LLM, or Hybrid)
 * @returns Promise that resolves to dashboard response data
 */
export async function getDashboardMock(engine: ScoringEngine): Promise<DashboardResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Different mock data based on engine type
  const mockData: Record<ScoringEngine, DashboardResponse> = {
    Human: {
      overallScore: 72,
      readinessLevels: [
        { id: "competition", name: "Competition", score: 68 },
        { id: "global-funding", name: "Global Funding", score: 75 },
        { id: "human-capital", name: "Human Capital", score: 82 },
        { id: "companies", name: "Companies", score: 65 },
        { id: "financing", name: "Financing", score: 70 },
        { id: "regulation", name: "Regulation", score: 73 },
        { id: "infrastructure", name: "Infrastructure", score: 69 },
        { id: "market-demand", name: "Market Demand", score: 76 },
      ],
    },
    LLM: {
      overallScore: 78,
      readinessLevels: [
        { id: "competition", name: "Competition", score: 72 },
        { id: "global-funding", name: "Global Funding", score: 80 },
        { id: "human-capital", name: "Human Capital", score: 85 },
        { id: "companies", name: "Companies", score: 70 },
        { id: "financing", name: "Financing", score: 75 },
        { id: "regulation", name: "Regulation", score: 78 },
        { id: "infrastructure", name: "Infrastructure", score: 74 },
        { id: "market-demand", name: "Market Demand", score: 81 },
      ],
    },
    Hybrid: {
      overallScore: 75,
      readinessLevels: [
        { id: "competition", name: "Competition", score: 70 },
        { id: "global-funding", name: "Global Funding", score: 77 },
        { id: "human-capital", name: "Human Capital", score: 83 },
        { id: "companies", name: "Companies", score: 67 },
        { id: "financing", name: "Financing", score: 72 },
        { id: "regulation", name: "Regulation", score: 75 },
        { id: "infrastructure", name: "Infrastructure", score: 71 },
        { id: "market-demand", name: "Market Demand", score: 78 },
      ],
    },
  };

  return mockData[engine];
}

