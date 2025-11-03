import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewForm from "./pages/NewForm";
import History from "./pages/History";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { getSession } from "@/lib/storage";
import { useThemeColor } from "@/hooks/use-theme-color";

const queryClient = new QueryClient();

const App = () => {
  useThemeColor(); // Initialize theme colors
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={getSession() ? <Dashboard /> : <Navigate to="/auth" replace />}>
              <Route index element={<Navigate to="new-form" replace />} />
              <Route path="new-form" element={getSession() ? <NewForm /> : <Navigate to="/auth" replace />} />
              <Route path="history" element={getSession() ? <History /> : <Navigate to="/auth" replace />} />
              <Route path="settings" element={getSession() ? <Settings /> : <Navigate to="/auth" replace />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
