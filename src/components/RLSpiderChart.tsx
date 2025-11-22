import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ReadinessLevelScore } from "@/types/researcher";

/**
 * Props for the RLSpiderChart component.
 */
interface RLSpiderChartProps {
  /**
   * Array of readiness level scores to display on the radar chart.
   * Each readiness level will appear as an axis on the chart.
   */
  levels: ReadinessLevelScore[];

  /**
   * Callback function called when a user clicks on a specific readiness level.
   * @param levelId - The ID of the clicked readiness level
   */
  onSelectLevel?: (id: string) => void;
}

/**
 * RLSpiderChart component renders a radar/spider chart visualization of readiness levels.
 * 
 * How it works:
 * - Each readiness level (Competition, Global Funding, etc.) becomes one axis on the radar
 * - The score (0-100) determines the radial position along that axis
 * - All scores are connected to form a polygon shape (the "spider web")
 * 
 * Data transformation:
 * - The `levels` prop is transformed into an array where each object has:
 *   - `name`: the level name (used for axis labels)
 *   - `value`: the score (used for the radial position)
 *   - `id`: the level ID (used for click handling)
 * 
 * Click interaction:
 * - When user clicks on the chart, Recharts provides an `activeLabel` with the clicked axis name
 * - We find the corresponding level object and call onSelectLevel with its ID
 * 
 * Visual configuration:
 * - PolarGrid: Shows concentric circles and radial lines
 * - PolarAngleAxis: Displays level names around the chart (one per axis)
 * - PolarRadiusAxis: Shows score scale from 0 to 100 with ticks at 0, 20, 40, 60, 80, 100
 * - Radar: Single Radar component that plots all scores as a polygon
 */
export function RLSpiderChart({ levels, onSelectLevel }: RLSpiderChartProps) {
  // Transform readiness levels into the format expected by Recharts RadarChart
  // Recharts RadarChart expects an array of objects, each with 'name' and 'value' properties
  // Example: [{ name: "Competition", value: 70, id: "competition" }, ...]
  const chartData = levels.map((level) => ({
    name: level.name,
    value: level.score,
    id: level.id,
  }));

  // Debug: log chart data to console
  console.log("RLSpiderChart - levels:", levels);
  console.log("RLSpiderChart - chartData:", chartData);

  // Create a mapping of level names to level objects for click and tooltip handling
  const levelNameToLevel = levels.reduce(
    (acc, level) => {
      acc[level.name] = level;
      return acc;
    },
    {} as Record<string, ReadinessLevelScore>
  );

  if (levels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] text-muted-foreground">
        <p>No readiness level data available</p>
      </div>
    );
  }

  /**
   * Handles click events on the radar chart.
   * Extracts the clicked level from Recharts' activeLabel and calls onSelectLevel.
   */
  const handleClick = (data: any, index: number, e: any) => {
    if (!onSelectLevel) return;

    // Recharts provides activeLabel in the event which contains the level name
    const clickedLabel = e?.activeLabel;
    if (!clickedLabel) return;

    // Find the level by name
    const level = levelNameToLevel[clickedLabel];
    if (level) {
      onSelectLevel(level.id);
    }
  };

  /**
   * Custom tooltip that shows level name and score.
   */
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    // Extract level data from the payload
    const data = payload[0]?.payload;
    if (!data || !data.id) return null;

    const level = levelNameToLevel[data.name];
    if (!level) return null;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-foreground">{level.name}</p>
        <p className="text-sm text-muted-foreground">
          Score: {level.score} / 100
        </p>
      </div>
    );
  };

  return (
    <div className="w-full border border-border rounded-lg bg-card p-4" style={{ height: "500px" }}>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={chartData}
            onClick={handleClick}
            style={{ cursor: onSelectLevel ? "pointer" : "default" }}
          >
            {/* Grid lines: concentric circles and radial lines */}
            <PolarGrid stroke="#e5e7eb" />

            {/* Angle axis: displays level names around the chart */}
            <PolarAngleAxis
              dataKey="name"
              tick={{
                fill: "#1f2937",
                fontSize: 13,
                fontWeight: 500,
              }}
            />

            {/* Radius axis: shows score scale from 0 to 100 */}
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tickCount={6}
              ticks={[0, 20, 40, 60, 80, 100]}
              tick={{
                fill: "#6b7280",
                fontSize: 11,
              }}
            />

            {/* Single Radar component that plots all readiness levels as a polygon */}
            <Radar
              name="Readiness"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={{ r: 5, fill: "#3b82f6" }}
              activeDot={{ r: 7, fill: "#3b82f6" }}
            />

            {/* Tooltip shows level name and score on hover */}
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>No data to display</p>
        </div>
      )}
    </div>
  );
}
