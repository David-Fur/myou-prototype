import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { computeBadges, computeStreak, loadSessions, saveSession, type SessionRecord } from "../lib/storage";

interface AppStateValue {
  sessions: SessionRecord[];
  streak: ReturnType<typeof computeStreak>;
  badges: ReturnType<typeof computeBadges>;
  recordSession: (record: Omit<SessionRecord, "id">) => SessionRecord;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<SessionRecord[]>(() => loadSessions());

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const badges = useMemo(() => computeBadges(sessions, streak), [sessions, streak]);

  const recordSession = useCallback((record: Omit<SessionRecord, "id">) => {
    const saved = saveSession(record);
    setSessions((prev) => [...prev, saved]);
    return saved;
  }, []);

  const value = useMemo(() => ({ sessions, streak, badges, recordSession }), [sessions, streak, badges, recordSession]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
