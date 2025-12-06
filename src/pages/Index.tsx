import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { useSessionStore } from "@/hooks/useSessionStore";
import { BottomNav } from "@/components/BottomNav";
import { AddSessionSheet } from "@/components/AddSessionSheet";
import { Dashboard } from "@/pages/Dashboard";
import { CalendarPage } from "@/pages/CalendarPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { SettingsPage } from "@/pages/SettingsPage";

const Index = () => {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
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
  } = useSessionStore();

  const stats = getStats();

  if (!isLoaded) {
    return (
      <div className="min-h-screen gradient-surface flex items-center justify-center">
        <div className="animate-pulse-soft text-primary">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Dashboard stats={stats} />
      
      <BottomNav onAddClick={() => setAddSheetOpen(true)} />
      
      <AddSessionSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        onAddSession={addSession}
        sessionValue={settings.sessionValue}
      />
    </div>
  );
};

export default Index;
