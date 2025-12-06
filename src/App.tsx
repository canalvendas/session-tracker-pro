import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseSessionStore } from "@/hooks/useSupabaseSessionStore";
import { usePWAUpdate } from "@/hooks/usePWAUpdate";
import { BottomNav } from "@/components/BottomNav";
import { AddSessionSheet } from "@/components/AddSessionSheet";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Dashboard } from "@/pages/Dashboard";
import { CalendarPage } from "@/pages/CalendarPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { MonthDetailPage } from "@/pages/MonthDetailPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AuthPage } from "@/pages/AuthPage";
import { LandingPage } from "@/pages/LandingPage";
import { PendingAccessPage } from "@/pages/PendingAccessPage";
import { AdminPage } from "@/pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  usePWAUpdate(); // Monitora atualizações do PWA
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  
  const {
    settings,
    profile,
    clinics,
    addSession,
    deleteSession,
    updateSession,
    getSessionsForDate,
    getTotalForDate,
    getStats,
    getMonthlyHistory,
    getWeeklyHistory,
    getYearlyHistory,
    updateSettings,
    hasSessionsOnDate,
    isLoaded,
    addClinic,
    updateClinic,
    deleteClinic,
    getDefaultClinic,
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
      <>
        <PWAInstallPrompt />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage signIn={signIn} signUp={signUp} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  // Authenticated but not paid
  if (!profile.is_paid) {
    return (
      <>
        <PWAInstallPrompt />
        <PendingAccessPage signOut={signOut} userEmail={user.email} />
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <PWAInstallPrompt />
      <Routes>
        <Route path="/" element={<Dashboard stats={stats} therapistName={profile.full_name} />} />
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
          path="/history/month/:year/:month"
          element={
            <MonthDetailPage
              getMonthlyHistory={getMonthlyHistory}
              getSessionsForDate={getSessionsForDate}
              deleteSession={deleteSession}
              updateSession={updateSession}
              sessionValue={settings.sessionValue}
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
              clinics={clinics}
              onAddClinic={addClinic}
              onUpdateClinic={updateClinic}
              onDeleteClinic={deleteClinic}
            />
          }
        />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <BottomNav onAddClick={() => setAddSheetOpen(true)} />
      
      <AddSessionSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        onAddSession={addSession}
        sessionValue={settings.sessionValue}
        clinics={clinics}
        defaultClinic={getDefaultClinic()}
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
