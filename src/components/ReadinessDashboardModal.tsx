import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ResearcherHome from "@/pages/ResearcherHome";

/**
 * Props for the ReadinessDashboardModal component.
 */
interface ReadinessDashboardModalProps {
  /**
   * Whether the modal is open or closed.
   */
  open: boolean;

  /**
   * Callback function called when the modal should be closed.
   */
  onOpenChange: (open: boolean) => void;
}

/**
 * ReadinessDashboardModal component displays the Researcher Home dashboard
 * in a full-screen modal dialog.
 * 
 * The modal takes up almost the entire screen and includes:
 * - A close button (X) in the top right corner
 * - The full ResearcherHome component with filters, charts, and readiness levels
 * 
 * This modal is opened from the WeightsTable when the user clicks the "Readiness" button
 * after viewing numerical results.
 */
export function ReadinessDashboardModal({
  open,
  onOpenChange,
}: ReadinessDashboardModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 overflow-hidden flex flex-col"
        style={{
          maxWidth: "95vw",
          maxHeight: "95vh",
        }}
      >
        {/* Close button in top right */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 bg-background/80 hover:bg-background"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* ResearcherHome content - takes full space */}
        <div className="flex-1 overflow-y-auto">
          <ResearcherHome />
        </div>
      </DialogContent>
    </Dialog>
  );
}

