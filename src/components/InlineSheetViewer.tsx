import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, RefreshCw } from "lucide-react";

interface InlineSheetViewerProps {
  sheetUrl: string;
  onClose: () => void;
}

export function InlineSheetViewer({ sheetUrl, onClose }: InlineSheetViewerProps) {
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <Card className="shadow-lg rounded-xl border border-border/50 mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Weights Table</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="transition-all duration-200 hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <iframe
          key={iframeKey}
          src={sheetUrl}
          className="w-full rounded-lg border border-border/50 shadow-sm"
          style={{ height: "calc(100vh - 220px)" }}
          title="Google Sheets Weights Table"
        />
      </CardContent>
    </Card>
  );
}
