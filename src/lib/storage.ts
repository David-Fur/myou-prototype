export interface SessionRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  dateISO: string;
  dayKey: string;
  durationSec: number;
  adherencePct: number;
  reps?: number;
}

const SESSIONS_KEY = "myou.sessions.v1";

export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loadSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(record: Omit<SessionRecord, "id">): SessionRecord {
  const full: SessionRecord = { ...record, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  const all = [...loadSessions(), full];
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
  return full;
}

export interface StreakInfo {
  current: number;
  longest: number;
}

export function computeStreak(sessions: SessionRecord[]): StreakInfo {
  const days = Array.from(new Set(sessions.map((s) => s.dayKey))).sort();
  if (days.length === 0) return { current: 0, longest: 0 };

  const dayMs = 24 * 60 * 60 * 1000;
  const toDate = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    if (toDate(days[i]) - toDate(days[i - 1]) === dayMs) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  const today = dayKey();
  const yesterday = dayKey(new Date(Date.now() - dayMs));
  const lastDay = days[days.length - 1];
  let current = 0;
  if (lastDay === today || lastDay === yesterday) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (toDate(days[i]) - toDate(days[i - 1]) === dayMs) {
        current += 1;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export function computeBadges(sessions: SessionRecord[], streak: StreakInfo): Badge[] {
  const bestAdherence = sessions.reduce((max, s) => Math.max(max, s.adherencePct), 0);

  return [
    {
      id: "first-session",
      label: "First Step",
      description: "Complete your first session.",
      earned: sessions.length >= 1,
    },
    {
      id: "three-streak",
      label: "3-Day Streak",
      description: "Train three days in a row.",
      earned: streak.longest >= 3,
    },
    {
      id: "seven-streak",
      label: "7-Day Streak",
      description: "A full week of consistency.",
      earned: streak.longest >= 7,
    },
    {
      id: "ten-sessions",
      label: "10 Sessions",
      description: "Complete ten sessions in total.",
      earned: sessions.length >= 10,
    },
    {
      id: "perfect-form",
      label: "Great Form",
      description: "Score 90%+ adherence in a session.",
      earned: bestAdherence >= 90,
    },
  ];
}
