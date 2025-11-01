import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface HistoryEntry {
  id: number;
  userEmail: string;
  sector: string;
  domains: string[];
  secondary_category?: string[];
  goals?: string[];
  users?: string[];
  geography?: string[];
  compliance?: string[];
  time_horizon?: string;
  risk_posture?: string;
  llm?: string[];
  participants_count?: number;
  llm_weight_percent?: number;
  date: string;
}

interface HistoryDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: HistoryEntry | null;
}

export function HistoryDetailModal({ open, onOpenChange, entry }: HistoryDetailModalProps) {
  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assessment Parameters</DialogTitle>
          <DialogDescription>
            Created on {new Date(entry.date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Sector & Domains */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[#111111] text-sm uppercase tracking-wide">
              Step 1: Sector & Domains
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-[#111111]">Sector</p>
                <p className="text-muted-foreground">{entry.sector}</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium text-[#111111]">Domains</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {entry.domains?.map(d => (
                    <Badge key={d} variant="secondary">{d}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {entry.secondary_category && entry.secondary_category.length > 0 && (
              <div className="text-sm">
                <p className="font-medium text-[#111111]">Secondary Categories</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {entry.secondary_category.map(c => (
                    <Badge key={c} variant="outline">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Goals, Users, Geography, Compliance */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-[#111111] text-sm uppercase tracking-wide">
              Step 2: Goals & Context
            </h3>
            
            {entry.goals && entry.goals.length > 0 && (
              <div className="text-sm">
                <p className="font-medium text-[#111111]">Goals</p>
                <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                  {entry.goals.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}

            {entry.users && entry.users.length > 0 && (
              <div className="text-sm">
                <p className="font-medium text-[#111111]">Primary Users</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {entry.users.map((u, i) => (
                    <Badge key={i} variant="secondary">{u}</Badge>
                  ))}
                </div>
              </div>
            )}

            {entry.geography && entry.geography.length > 0 && (
              <div className="text-sm">
                <p className="font-medium text-[#111111]">Geography</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {entry.geography.map((g, i) => (
                    <Badge key={i} variant="secondary">{g}</Badge>
                  ))}
                </div>
              </div>
            )}

            {entry.compliance && entry.compliance.length > 0 && (
              <div className="text-sm">
                <p className="font-medium text-[#111111]">Compliance</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {entry.compliance.map((c, i) => (
                    <Badge key={i} variant="secondary">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Time Horizon, Risk, LLMs, Participants, Influence */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="font-semibold text-[#111111] text-sm uppercase tracking-wide">
              Step 3: Configuration
            </h3>

            <div className="grid grid-cols-3 gap-4 text-sm">
              {entry.time_horizon && (
                <div>
                  <p className="font-medium text-[#111111]">Time Horizon</p>
                  <p className="text-muted-foreground">{entry.time_horizon}</p>
                </div>
              )}
              {entry.risk_posture && (
                <div>
                  <p className="font-medium text-[#111111]">Risk Posture</p>
                  <p className="text-muted-foreground">{entry.risk_posture}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-[#111111]">Participants</p>
                <p className="text-muted-foreground">{entry.participants_count || 0} humans</p>
              </div>
            </div>

            {entry.llm && entry.llm.length > 0 && (
              <div className="text-sm">
                <p className="font-medium text-[#111111]">LLMs Selected</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {entry.llm.map(l => (
                    <Badge key={l} variant="default">{l}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm">
              <p className="font-medium text-[#111111]">Influence Balance</p>
              <p className="text-muted-foreground mt-1">
                LLM {entry.llm_weight_percent || 50}% / Human {100 - (entry.llm_weight_percent || 50)}%
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
