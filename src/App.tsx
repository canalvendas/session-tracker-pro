import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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
import { ManagerDashboard } from "@/pages/ManagerDashboard";
import { ManagerProfessionalDetail } from "@/pages/ManagerProfessionalDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  usePWAUpdate();
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { role, loading: roleLoading, isAdmin, isManager } = useUserRole(user);
  
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
    getClinicById,
    getClinicBreakdown,
  } = useSupabaseSessionStore(user);

  const stats = getStats();

  // Loading state
  if (authLoading || (!isLoaded && user) || (user && roleLoading)) {
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

  // Authenticated but not paid (only for non-admin/manager users)
  if (!profile.is_paid && !isAdmin && !isManager) {
    return (
      <>
        <PWAInstallPrompt />
        <PendingAccessPage signOut={signOut} userEmail={user.email} />
      </>
    );
  }

  // Check if user should see the add session button (professionals and admins can add sessions)
  const canAddSessions = !isManager || isAdmin;

  return (
    <div className="min-h-screen">
      <PWAInstallPrompt />
      <Routes>
        {/* Common routes for all authenticated users */}
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
              clinics={clinics}
              getClinicById={getClinicById}
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
              getClinicBreakdown={getClinicBreakdown}
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
              clinics={clinics}
              getClinicById={getClinicById}
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

        {/* Admin routes */}
        {isAdmin && <Route path="/admin" element={<AdminPage />} />}

        {/* Manager routes */}
        {(isManager || isAdmin) && (
          <>
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/manager/professional/:userId" element={<ManagerProfessionalDetail />} />
          </>
        )}

        {/* Fallback */}
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <BottomNav 
        onAddClick={() => setAddSheetOpen(true)} 
        isAdmin={isAdmin}
        isManager={isManager}
        canAddSessions={canAddSessions}
      />
      
      {canAddSessions && (
        <AddSessionSheet
          open={addSheetOpen}
          onOpenChange={setAddSheetOpen}
          onAddSession={addSession}
          sessionValue={settings.sessionValue}
          clinics={clinics}
          defaultClinic={getDefaultClinic()}
        />
      )}
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
