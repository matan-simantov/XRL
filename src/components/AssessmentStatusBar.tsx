import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardStatus, AssessmentStep } from "@/types/researcher";

/**
 * Props for the AssessmentStatusBar component.
 */
interface AssessmentStatusBarProps {
  /**
   * The dashboard status containing information about assessment steps.
   * If null, shows a default status where all steps except the last are in_progress.
   */
  status: DashboardStatus | null;
}

/**
 * Default status to show when no status is provided.
 * All steps are in_progress except the last which is not_started.
 */
const defaultStatus: DashboardStatus = {
  steps: [
    { id: "Technology Identification", status: "in_progress" },
    { id: "Pulse Check KPIs", status: "in_progress" },
    { id: "TRL Assessment", status: "in_progress" },
    { id: "All RLs Assessment", status: "in_progress" },
    { id: "Dashboard Ready", status: "not_started" },
  ],
};

/**
 * Gets the icon component for a given step status.
 * 
 * @param status - The status of the assessment step
 * @returns React component for the status icon
 */
function getStatusIcon(status: "not_started" | "in_progress" | "completed") {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case "in_progress":
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    case "not_started":
      return <Circle className="h-5 w-5 text-gray-400" />;
  }
}

/**
 * Gets the text color class for a given step status.
 * 
 * @param status - The status of the assessment step
 * @returns Tailwind CSS class for text color
 */
function getStatusTextColor(status: "not_started" | "in_progress" | "completed"): string {
  switch (status) {
    case "completed":
      return "text-green-600";
    case "in_progress":
      return "text-blue-600";
    case "not_started":
      return "text-gray-400";
  }
}

/**
 * AssessmentStatusBar component displays the progress of the assessment process.
 * 
 * Shows a visual representation of the high-level XRL steps:
 * - Technology Identification
 * - Pulse Check KPIs
 * - TRL Assessment
 * - All RLs Assessment
 * - Dashboard Ready
 * 
 * Each step is displayed with:
 * - Step name
 * - Visual indicator (icon) showing status:
 *   - Grey circle = not_started
 *   - Blue spinning loader = in_progress
 *   - Green checkmark = completed
 */
export function AssessmentStatusBar({ status }: AssessmentStatusBarProps) {
  // Use provided status or default
  const displayStatus = status || defaultStatus;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayStatus.steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
            >
              {/* Status icon */}
              <div className="flex-shrink-0">{getStatusIcon(step.status)}</div>
              
              {/* Step name */}
              <div className="flex-1">
                <p className={cn("text-sm font-medium", getStatusTextColor(step.status))}>
                  {step.id}
                </p>
              </div>
              
              {/* Status label */}
              <div className="flex-shrink-0">
                <span className={cn("text-xs capitalize", getStatusTextColor(step.status))}>
                  {step.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

