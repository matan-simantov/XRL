import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RLSpiderChart } from "@/components/RLSpiderChart";
import { RLList } from "@/components/RLList";
import { RLDetailPanel } from "@/components/RLDetailPanel";
import { AssessmentStatusBar } from "@/components/AssessmentStatusBar";
import { fetchDashboard } from "@/services/dashboardApi";
import type { DashboardResponse, ScoringEngine, Sector, Technology } from "@/types/researcher";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * ResearcherHome is the main landing page for researchers after login.
 * 
 * This page displays:
 * - A control panel with filters (Sector, Technology, Scoring Engine)
 * - A spider/radar chart visualization of readiness levels
 * - A list of readiness levels as cards
 * - A detail panel showing information about the selected readiness level
 * 
 * The page fetches data from a mock service and updates when filters change.
 * The layout is responsive: on mobile, filters are stacked on top,
 * while on larger screens, the chart and list are side by side.
 */
export default function ResearcherHome() {
  // State for filters
  const [selectedSector, setSelectedSector] = useState<Sector>("Fintech");
  const [selectedTechnology, setSelectedTechnology] = useState<Technology>("AI/ML");
  const [selectedEngine, setSelectedEngine] = useState<ScoringEngine>("Hybrid");

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  // Sector options
  const sectorOptions: Sector[] = ["Fintech", "Energy", "Healthcare", "Manufacturing", "Retail"];

  // Technology options (can be made sector-specific later)
  const technologyOptions: Technology[] = [
    "AI/ML",
    "Blockchain",
    "IoT",
    "Cloud Computing",
    "Cybersecurity",
    "Quantum Computing",
  ];

  // Fetch dashboard data when filters change
  // Data flow: user changes filters → fetchDashboard called → updates dashboardData state → UI re-renders
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDashboard({
          sector: selectedSector,
          technology: selectedTechnology,
          engine: selectedEngine,
        });
        setDashboardData(data);
        // Auto-select first level if none selected
        if (data.readinessLevels.length > 0 && !selectedLevelId) {
          setSelectedLevelId(data.readinessLevels[0].id);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load dashboard";
        setError(errorMessage);
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [selectedSector, selectedTechnology, selectedEngine]);

  /**
   * Handles readiness level selection from either the chart or list.
   * 
   * Data flow:
   * - User clicks on a readiness level in RLSpiderChart or RLList
   * - Component calls onSelectLevel(id) callback
   * - This function updates selectedLevelId state
   * - The selected level object is found and passed to RLDetailPanel
   * - RLDetailPanel displays the level's details
   */
  const handleSelectLevel = (levelId: string) => {
    setSelectedLevelId(levelId);
  };

  /**
   * Retries loading the dashboard data.
   */
  const handleRetry = () => {
    setError(null);
    // Trigger useEffect by updating a dependency (using a small state change)
    setSelectedEngine((prev) => prev);
  };

  // Get the selected readiness level object
  const selectedLevel = dashboardData?.readinessLevels.find(
    (level) => level.id === selectedLevelId
  ) || null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar / header - hide when in modal */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">XRL Readiness Dashboard</h1>
          <div className="flex items-center gap-4">
            {/* User menu or logo can go here */}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filters section */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Filters</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sector Select */}
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Select
                    value={selectedSector}
                    onValueChange={(value) => setSelectedSector(value as Sector)}
                  >
                    <SelectTrigger id="sector">
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectorOptions.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Technology Select */}
                <div className="space-y-2">
                  <Label htmlFor="technology">Technology</Label>
                  <Select
                    value={selectedTechnology}
                    onValueChange={(value) => setSelectedTechnology(value)}
                  >
                    <SelectTrigger id="technology">
                      <SelectValue placeholder="Select technology" />
                    </SelectTrigger>
                    <SelectContent>
                      {technologyOptions.map((tech) => (
                        <SelectItem key={tech} value={tech}>
                          {tech}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Scoring Engine Radio Group */}
                <div className="space-y-2">
                  <Label>Scoring Engine</Label>
                  <RadioGroup
                    value={selectedEngine}
                    onValueChange={(value) => setSelectedEngine(value as ScoringEngine)}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Human" id="engine-human" />
                      <Label htmlFor="engine-human" className="cursor-pointer">
                        Human
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="LLM" id="engine-llm" />
                      <Label htmlFor="engine-llm" className="cursor-pointer">
                        LLM
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Hybrid" id="engine-hybrid" />
                      <Label htmlFor="engine-hybrid" className="cursor-pointer">
                        Hybrid
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Assessment Status section */}
        {!loading && dashboardData && (
          <section className="mb-6">
            <AssessmentStatusBar status={dashboardData.status || null} />
          </section>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    Failed to load dashboard, please try again
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{error}</p>
                </div>
                <Button onClick={handleRetry} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main content area */}
        {!loading && dashboardData && (
          <>
            {/* Overall Score */}
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overall Readiness Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">{dashboardData.overallScore}</div>
                  <p className="text-sm text-muted-foreground mt-2">out of 100</p>
                </CardContent>
              </Card>
            </div>

            {/* Readiness Overview Section */}
            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Readiness Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 
                  Layout explanation:
                  - On mobile: Chart stacks on top, list below
                  - On large screens: Chart on left, list on right
                  - Both components share the same selectedLevelId state for synchronized selection
                */}
                {/* Left side: Spider Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Readiness Overview (Spider Chart)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6" style={{ minHeight: "500px" }}>
                    {/* 
                      Data flow for selection:
                      - User clicks on a point/area in the radar chart
                      - RLSpiderChart calls onSelectLevel(levelId)
                      - handleSelectLevel updates selectedLevelId state
                      - The selected level object is found and passed to RLDetailPanel
                      - RLList also uses the same selectedLevelId for visual synchronization
                    */}
                    <RLSpiderChart
                      levels={dashboardData.readinessLevels}
                      onSelectLevel={handleSelectLevel}
                    />
                  </CardContent>
                </Card>

                {/* Right side: RL List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Readiness Levels</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RLList
                      readinessLevels={dashboardData.readinessLevels}
                      selectedId={selectedLevelId}
                      onSelect={handleSelectLevel}
                    />
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Selected Level Details Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4 text-foreground">Selected Level</h2>
              <RLDetailPanel level={selectedLevel} />
            </section>
          </>
        )}

        {/* Empty state */}
        {!loading && !dashboardData && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No dashboard data available.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

