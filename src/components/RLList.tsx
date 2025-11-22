import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ReadinessLevelScore } from "@/types/researcher";

/**
 * Props for the RLList component.
 */
interface RLListProps {
  /**
   * Array of readiness level scores to display in the list.
   */
  readinessLevels: ReadinessLevelScore[];
  
  /**
   * ID of the currently selected readiness level (if any).
   */
  selectedId: string | null;
  
  /**
   * Callback function called when a user clicks on a readiness level card.
   * @param id - The ID of the clicked readiness level
   */
  onSelect: (id: string) => void;
}

/**
 * RLList component displays a list of readiness levels as cards.
 * Each card shows:
 * - The readiness level name
 * - The numeric score (0-100)
 * - A visual progress bar indicating the score proportionally
 * 
 * When a card is clicked, it becomes selected (visually highlighted)
 * and triggers the onSelect callback.
 */
export function RLList({ readinessLevels, selectedId, onSelect }: RLListProps) {
  if (readinessLevels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground">
        <p>No readiness levels available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {readinessLevels.map((level) => {
        const isSelected = selectedId === level.id;
        
        return (
          <Card
            key={level.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:bg-accent/50",
              isSelected && "ring-2 ring-primary ring-offset-2 bg-accent/30"
            )}
            onClick={() => onSelect(level.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center justify-between">
                <span>{level.name}</span>
                <span className="text-lg font-semibold text-primary">
                  {level.score}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={level.score} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Score: {level.score} / 100
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

