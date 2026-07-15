import { Link } from "react-router-dom";
import { useAppState } from "../context/AppState";
import { EXERCISES } from "../lib/exercises";
import { dayKey } from "../lib/storage";
import { Mascot, type MascotMood } from "../components/Mascot";

export function Home() {
  const { sessions, streak } = useAppState();
  const todayDone = sessions.some((s) => s.dayKey === dayKey());

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = sessions.filter((s) => new Date(s.dateISO).getTime() >= weekAgo);
  const avgAdherence = thisWeek.length
    ? Math.round(thisWeek.reduce((a, s) => a + s.adherencePct, 0) / thisWeek.length)
    : null;

  let mood: MascotMood = "happy";
  let message = "Ready when you are — let's move today.";
  if (todayDone) {
    mood = "cheer";
    message = "You've completed today's session. Nice work!";
  } else if (streak.current > 0) {
    mood = "happy";
    message = `You're on a ${streak.current}-day streak! Keep it alive today.`;
  }

  return (
    <div className="screen">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p className="text-muted" style={{ fontSize: 13 }}>
            Welcome back
          </p>
          <h1 style={{ fontSize: 24 }}>Myou</h1>
        </div>
        <div className="pill" style={{ fontSize: 13 }}>
          🔥 {streak.current} day{streak.current === 1 ? "" : "s"}
        </div>
      </div>

      <div className="card" style={{ marginTop: 18, display: "flex", gap: 14, alignItems: "center" }}>
        <Mascot mood={mood} size={64} />
        <p style={{ fontSize: 14, flex: 1 }}>{message}</p>
      </div>

      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ fontSize: 16 }}>Today's plan</h2>
        <Link to="/exercises" className="text-secondary" style={{ fontSize: 13, textDecoration: "none" }}>
          See all
        </Link>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {EXERCISES.map((ex) => (
          <Link
            key={ex.id}
            to={`/exercise/${ex.id}`}
            className="card"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit" }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{ex.name}</div>
              <div className="text-secondary" style={{ fontSize: 12, marginTop: 2 }}>
                {ex.kind === "hold" ? `${ex.durationSec}s hold` : `${ex.targetReps} reps`}
              </div>
            </div>
            <span className="pill">Start</span>
          </Link>
        ))}
      </div>

      <Link
        to="/progress"
        className="card"
        style={{ marginTop: 20, display: "block", textDecoration: "none", color: "inherit" }}
      >
        <div className="text-secondary" style={{ fontSize: 12 }}>
          This week
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            {thisWeek.length} session{thisWeek.length === 1 ? "" : "s"}
          </span>
          {avgAdherence !== null && (
            <span className="text-secondary" style={{ fontSize: 13 }}>
              {avgAdherence}% avg form
            </span>
          )}
        </div>
      </Link>

      <Link
        to="/share"
        className="pill"
        style={{
          marginTop: 14,
          justifyContent: "center",
          textDecoration: "none",
          padding: "10px 16px",
        }}
      >
        📱 Invite someone to try Myou
      </Link>
    </div>
  );
}
