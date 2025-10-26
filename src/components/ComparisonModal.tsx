import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DomainSelector } from "@/components/DomainSelector";
import { SecondaryCategorySelector } from "@/components/SecondaryCategorySelector";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface XrlState {
  sector: string;
  domain: string | null;
  secondary_category: string[];
  goals: string[];
  users: string[];
  geography: string[];
  compliance: string[];
  time_horizon: string | null;
  risk_posture: string | null;
  llm: string[];
  participants_count: number;
  participants: { name: string; email: string }[];
}

interface ComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentData: XrlState;
}

export function ComparisonModal({ open, onOpenChange, currentData }: ComparisonModalProps) {
  const navigate = useNavigate();
  const [comparisonDomain, setComparisonDomain] = useState<string | null>(null);
  const [comparisonCategories, setComparisonCategories] = useState<string[]>(
    currentData?.secondary_category ?? []
  );
  const [queuedComparisons, setQueuedComparisons] = useState<string[]>([]);

  const handleQuickCompare = () => {
    if (!comparisonDomain) {
      toast.error("Please select a domain for comparison");
      return;
    }

    if (comparisonCategories.length === 0) {
      toast.error("Please select at least one secondary category");
      return;
    }

    // Add to queue
    const newComparison = `${comparisonDomain} (${comparisonCategories.length} categories)`;
    if (queuedComparisons.length >= 5) {
      toast.error("Maximum 5 queued comparisons");
      return;
    }

    setQueuedComparisons([...queuedComparisons, newComparison]);
    toast.success(`Comparison queued: ${comparisonDomain}`);

    // Reset for next comparison
    setComparisonDomain(null);
    setComparisonCategories(currentData?.secondary_category ?? []);

    // Telemetry stub
    console.log("comparison_started", {
      domain: comparisonDomain,
      categories: comparisonCategories,
    });
  };

  const handleStartNew = () => {
    onOpenChange(false);
    navigate("/dashboard/new-form");
    window.location.reload();
  };

  const handleClose = () => {
    onOpenChange(false);
    navigate("/dashboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Run a side-by-side?</DialogTitle>
          <DialogDescription>
            Quickly compare with another Energy technology.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Option A: Quick Compare */}
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <h3 className="font-medium mb-2">Option A: Quick Compare</h3>
              <p className="text-sm text-muted-foreground">
                Reuse all the same goals, users, geographies, compliance, horizon, risk, and
                LLMs.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Domain</label>
                <DomainSelector value={comparisonDomain} onChange={setComparisonDomain} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Secondary Category (required)
                </label>
                <SecondaryCategorySelector
                  value={comparisonCategories}
                  onChange={setComparisonCategories}
                />
              </div>

              <Button onClick={handleQuickCompare} className="w-full">
                Run Comparison
              </Button>
            </div>

            {queuedComparisons.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Queued ({queuedComparisons.length}/5):</p>
                <div className="flex flex-wrap gap-2">
                  {queuedComparisons.map((comp, idx) => (
                    <Badge key={idx} variant="secondary">
                      {comp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Option B: Start New */}
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <h3 className="font-medium mb-2">Option B: Start a Fresh Assessment</h3>
              <p className="text-sm text-muted-foreground">
                Begin a completely new intake with Energy preselected.
              </p>
            </div>

            <Button variant="outline" onClick={handleStartNew} className="w-full">
              Start New
            </Button>
          </div>

          <div className="pt-4 border-t">
            <Button variant="ghost" onClick={handleClose} className="w-full">
              Close and View Dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
