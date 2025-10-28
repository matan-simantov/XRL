import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, CheckCircle2, Share2, Trash2, X } from "lucide-react";
import { HistoryDetailModal } from "@/components/HistoryDetailModal";
import { InlineSheetViewer } from "@/components/InlineSheetViewer";
import { WeightsTable } from "@/components/WeightsTable";
import { getSession, listRuns, listDrafts, clearAllHistory, deleteRun } from "@/lib/storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useButtonColor } from "@/hooks/use-button-color";

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
  const [expanded, setExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteSingleDialog, setShowDeleteSingleDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const { getButtonClasses, getTextClass, getBgLightClass } = useButtonColor();

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
    setSelectedEntry(entry);
    setShowSheetViewer(true);
  };

  const handleDeleteHistory = async () => {
    const username = getSession()?.username;
    if (!username) return;
    
    await clearAllHistory(username);
    setSearches([]);
    setDrafts([]);
    setRecentSubmissions([]);
    setShowDeleteDialog(false);
    
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event("storage"));
  };

  const handleDeleteSingleEntry = async () => {
    const username = getSession()?.username;
    if (!username || !entryToDelete) return;
    
    await deleteRun(username, entryToDelete);
    
    // Reload the lists
    const [runs, dr] = await Promise.all([
      listRuns(username, 20),
      listDrafts(username, 5),
    ]);
    const completed = runs.filter((r: any) => r.status === "sent");
    setSearches(completed);
    setDrafts(dr);
    setRecentSubmissions(completed.slice(0, 5));
    
    setShowDeleteSingleDialog(false);
    setEntryToDelete(null);
    
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">History</h1>
        {(searches.length > 0 || drafts.length > 0) && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All History
          </Button>
        )}
      </div>

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
                  <div className={`w-10 h-10 rounded-lg ${getBgLightClass()} flex items-center justify-center flex-shrink-0`}>
                    <CheckCircle2 className={`h-5 w-5 ${getTextClass()}`} />
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
                    className={`transition-all duration-200 hover:shadow-lg ${getButtonClasses()}`}
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
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="transition-all duration-200 hover:bg-destructive/10"
                    onClick={() => {
                      setEntryToDelete(submission.id);
                      setShowDeleteSingleDialog(true);
                    }}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
          <div className="pt-2">
            <Button variant="link" size="sm" onClick={() => setExpanded(!expanded)} className={getTextClass()}>
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
                <Button size="sm" onClick={() => window.location.href = "/dashboard/new-form"} className={getButtonClasses()}>Resume</Button>
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

      {showSheetViewer && selectedEntry && (
        <div className="mt-8">
          <WeightsTable
            llms={selectedEntry.llm || []}
            participants={selectedEntry.participants || []}
            domains={selectedEntry.domains || []}
            initialLlmWeight={selectedEntry.llm_weight_percent || 50}
            formData={selectedEntry}
            onClose={() => setShowSheetViewer(false)}
          />
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all your search history
              and drafts from local storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHistory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteSingleDialog} onOpenChange={setShowDeleteSingleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this search entry
              from your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingleEntry}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default History;

