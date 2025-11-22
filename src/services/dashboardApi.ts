import type { DashboardResponse, ScoringEngine, DashboardStatus } from "@/types/researcher";

/**
 * Options for fetching dashboard data.
 */
export type FetchDashboardOptions = {
  sector: string;
  technology: string;
  engine: ScoringEngine;
};

/**
 * Fetches dashboard data from the backend API.
 * 
 * Currently implemented as a mock function that simulates API behavior.
 * In the future, this will be replaced with a real HTTP call to n8n or another backend service.
 * 
 * The function signature is designed to match what a real API endpoint would expect:
 * - Takes sector, technology, and engine as parameters
 * - Returns a Promise that resolves to DashboardResponse
 * - Simulates network delay
 * 
 * @param options - Configuration object containing sector, technology, and engine
 * @returns Promise that resolves to dashboard response data
 */
export async function fetchDashboard(
  options: FetchDashboardOptions
): Promise<DashboardResponse> {
  const { sector, technology, engine } = options;

  // Simulate network delay (realistic API call timing)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock status: Up to TRL Assessment = completed, All RLs Assessment = in_progress, Dashboard Ready = not_started
  const mockStatus: DashboardStatus = {
    steps: [
      { id: "Technology Identification", status: "completed" },
      { id: "Pulse Check KPIs", status: "completed" },
      { id: "TRL Assessment", status: "completed" },
      { id: "All RLs Assessment", status: "in_progress" },
      { id: "Dashboard Ready", status: "not_started" },
    ],
  };

  // Different mock data based on engine type to make the UI feel alive
  // Scores vary slightly between engines to demonstrate the difference
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
      status: mockStatus,
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
      status: mockStatus,
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
      status: mockStatus,
    },
  };

  // Return data for the selected engine
  // Note: In a real implementation, sector and technology would also affect the response
  return mockData[engine];
}

