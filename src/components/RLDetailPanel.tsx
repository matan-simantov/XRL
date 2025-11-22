import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReadinessLevelScore } from "@/types/researcher";

/**
 * Props for the RLDetailPanel component.
 */
interface RLDetailPanelProps {
  /**
   * The currently selected readiness level to display details for.
   * If null, shows a placeholder message prompting the user to select a level.
   */
  level: ReadinessLevelScore | null;
}

/**
 * Determines the textual interpretation of a readiness level score.
 * 
 * @param score - The readiness level score (0-100)
 * @returns A string describing the readiness level
 */
function getReadinessInterpretation(score: number): string {
  if (score >= 0 && score < 40) {
    return "Low readiness";
  } else if (score >= 40 && score < 70) {
    return "Medium readiness";
  } else {
    return "High readiness";
  }
}

/**
 * Gets the color variant for the badge based on the score.
 * 
 * @param score - The readiness level score (0-100)
 * @returns Badge variant string
 */
function getBadgeVariant(score: number): "destructive" | "default" | "secondary" {
  if (score >= 0 && score < 40) {
    return "destructive";
  } else if (score >= 40 && score < 70) {
    return "default";
  } else {
    return "secondary";
  }
}

/**
 * RLDetailPanel component displays detailed information about a selected readiness level.
 * 
 * Data flow:
 * - User clicks on a readiness level in the chart or list
 * - ResearcherHome calls onSelectLevel(id) which updates selectedLevelId state
 * - The selected level object is found and passed to this component via the level prop
 * - This component displays the level's details including name, score, and interpretation
 * 
 * Future enhancements will include:
 * - Parameter tables showing detailed breakdown
 * - Historical trends and comparisons
 * - Related metrics and context
 */
export function RLDetailPanel({ level }: RLDetailPanelProps) {
  // Show placeholder when no level is selected
  if (!level) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selected Level</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select a readiness level from the chart or list to see more details.
          </p>
        </CardContent>
      </Card>
    );
  }

  const interpretation = getReadinessInterpretation(level.score);
  const badgeVariant = getBadgeVariant(level.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{level.name}</span>
          <Badge variant={badgeVariant}>{interpretation}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Score</p>
          <p className="text-2xl font-bold">{level.score} / 100</p>
        </div>

        <div className="pt-2">
          <p className="text-sm text-muted-foreground">
            <strong>Interpretation:</strong> {interpretation}
            {level.score >= 0 && level.score < 40 && " - This area requires significant development and attention."}
            {level.score >= 40 && level.score < 70 && " - This area shows moderate progress with room for improvement."}
            {level.score >= 70 && " - This area demonstrates strong readiness and maturity."}
          </p>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Key parameters (coming soon)</h4>
          <p className="text-sm text-muted-foreground">
            A detailed breakdown of parameters contributing to this readiness level score will be displayed here.
            This will include specific metrics, indicators, and sub-scores that make up the overall assessment.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

