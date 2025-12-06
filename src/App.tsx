import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseSessionStore } from "@/hooks/useSupabaseSessionStore";
import { BottomNav } from "@/components/BottomNav";
import { AddSessionSheet } from "@/components/AddSessionSheet";
import { Dashboard } from "@/pages/Dashboard";
import { CalendarPage } from "@/pages/CalendarPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AuthPage } from "@/pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  
  const {
    settings,
    addSession,
    deleteSession,
    getSessionsForDate,
    getTotalForDate,
    getStats,
    getMonthlyHistory,
    getWeeklyHistory,
    getYearlyHistory,
    updateSettings,
    hasSessionsOnDate,
    isLoaded,
  } = useSupabaseSessionStore(user);

  const stats = getStats();

  // Loading state
  if (authLoading || (!isLoaded && user)) {
    return (
      <div className="min-h-screen gradient-surface flex items-center justify-center">
        <div className="animate-pulse-soft text-primary">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage signIn={signIn} signUp={signUp} />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Dashboard stats={stats} />} />
        <Route
          path="/calendar"
          element={
            <CalendarPage
              hasSessionsOnDate={hasSessionsOnDate}
              getSessionsForDate={getSessionsForDate}
              getTotalForDate={getTotalForDate}
              addSession={addSession}
              deleteSession={deleteSession}
              sessionValue={settings.sessionValue}
            />
          }
        />
        <Route
          path="/history"
          element={
            <HistoryPage
              getMonthlyHistory={getMonthlyHistory}
              getWeeklyHistory={getWeeklyHistory}
              getYearlyHistory={getYearlyHistory}
              therapistName={user?.user_metadata?.full_name}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <SettingsPage
              settings={settings}
              updateSettings={updateSettings}
              signOut={signOut}
            />
          }
        />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <BottomNav onAddClick={() => setAddSheetOpen(true)} />
      
      <AddSessionSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        onAddSession={addSession}
        sessionValue={settings.sessionValue}
      />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
