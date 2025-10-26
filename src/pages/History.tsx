import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, CheckCircle2, Share2 } from "lucide-react";
import { HistoryDetailModal } from "@/components/HistoryDetailModal";
import { InlineSheetViewer } from "@/components/InlineSheetViewer";
import { getSession, listRuns, listDrafts } from "@/lib/storage";

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
  sheetUrl?: string;
  status?: "sent" | "failed";
}

const History = () => {
  const [searches, setSearches] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSheetViewer, setShowSheetViewer] = useState(false);
  const [currentSheetUrl, setCurrentSheetUrl] = useState<string>("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const username = getSession()?.username;
      if (!username) return;
      const [runs, dr] = await Promise.all([
        listRuns(username, 20),
        listDrafts(username, 5),
      ]);
      const completed = runs.filter((r: any) => r.status === "sent");
      setSearches(completed);
      setDrafts(dr);
      setRecentSubmissions(completed.slice(0, 5));
    };
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  const handleViewParameters = (entry: any) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  const handleViewWeightsTable = (entry: any) => {
    const defaultSheetUrl = "https://docs.google.com/spreadsheets/d/1E73HW28r-7ddclj22OGNUNvo194FlLHX2zX50XY5I3w/edit?usp=sharing";
    setCurrentSheetUrl(entry.sheetUrl || defaultSheetUrl);
    setShowSheetViewer(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">History</h1>

      <Card className="shadow-md rounded-xl border border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Previous Searches</CardTitle>
          <CardDescription>Your recent completed runs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(expanded ? searches : recentSubmissions).length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">No completed searches yet.</div>
          ) : (
            (expanded ? searches : recentSubmissions).map((submission) => (
              <div 
                key={submission.id} 
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {submission.domains?.map((d: string) => d).join(", ") || "Untitled"}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(submission.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewParameters(submission)}
                    className="transition-all duration-200 hover:shadow-md"
                  >
                    View Parameters
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleViewWeightsTable(submission)}
                    className="transition-all duration-200 hover:shadow-lg"
                  >
                    Weights Table
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="transition-all duration-200"
                    onClick={() => {}}
                  >
                    Result
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="transition-all duration-200"
                    onClick={() => {}}
                  >
                    <Share2 className="mr-1" /> Share
                  </Button>
                </div>
              </div>
            ))
          )}
          <div className="pt-2">
            <Button variant="link" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded ? "Collapse" : "View all searches"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Drafts</h2>
        {drafts.length === 0 ? (
          <Card className="shadow-md rounded-xl">
            <CardContent className="py-6 text-center text-muted-foreground">
              No drafts yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {drafts.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card">
                <div className="text-sm">
                  <div className="font-medium text-foreground">{d.state?.domains?.join(", ") || "Untitled draft"}</div>
                  <div className="text-muted-foreground">Updated {new Date(d.updatedAt).toLocaleString()}</div>
                </div>
                <Button size="sm" onClick={() => window.location.href = "/dashboard/new-form"}>Resume</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Removed extra sections to keep exactly two blocks */}

      <HistoryDetailModal 
        open={showDetailModal} 
        onOpenChange={setShowDetailModal} 
        entry={selectedEntry} 
      />

      {showSheetViewer && (
        <div className="mt-8">
          <InlineSheetViewer 
            sheetUrl={currentSheetUrl}
            onClose={() => setShowSheetViewer(false)}
          />
        </div>
      )}
    </div>
  );
};

export default History;

