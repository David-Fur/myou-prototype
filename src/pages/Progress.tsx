import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { useAppState } from "../context/AppState";
import { Mascot } from "../components/Mascot";
import { dayKey } from "../lib/storage";

interface AdherencePoint {
  label: string;
  fullLabel: string;
  adherence: number;
}

function AdherenceTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as AdherencePoint;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "8px 12px",
        boxShadow: "var(--shadow)",
        fontSize: 12,
      }}
    >
      <div style={{ color: "var(--text-secondary)" }}>{point.fullLabel}</div>
      <div style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{point.adherence}% form</div>
    </div>
  );
}

function StreakCalendar({ sessionDays }: { sessionDays: Set<string> }) {
  const days: { key: string; label: number; isToday: boolean }[] = [];
  const today = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    days.push({ key, label: d.getDate(), isToday: i === 0 });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
      {days.map((d) => {
        const done = sessionDays.has(d.key);
        return (
          <div
            key={d.key}
            title={d.key}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 7,
              background: done ? "var(--good)" : "var(--surface-2)",
              border: d.isToday ? "2px solid var(--brand)" : "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 600,
              color: done ? "#fff" : "var(--text-muted)",
            }}
          >
            {d.label}
          </div>
        );
      })}
    </div>
  );
}

export function Progress() {
  const { sessions, streak, badges } = useAppState();

  const sessionDays = new Set(sessions.map((s) => s.dayKey));
  const chartData = sessions
    .slice()
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .slice(-14)
    .map((s) => {
      const d = new Date(s.dateISO);
      return {
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        fullLabel: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        adherence: s.adherencePct,
      };
    });

  const avgAdherence = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + s.adherencePct, 0) / sessions.length)
    : 0;

  return (
    <div className="screen">
      <h1 style={{ fontSize: 22 }}>Your progress</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        <StatTile label="Current streak" value={`${streak.current}`} suffix="days" />
        <StatTile label="Longest streak" value={`${streak.longest}`} suffix="days" />
        <StatTile label="Total sessions" value={`${sessions.length}`} />
        <StatTile label="Avg. form" value={sessions.length ? `${avgAdherence}` : "—"} suffix={sessions.length ? "%" : undefined} />
      </div>

      <h2 style={{ fontSize: 15, marginTop: 24, marginBottom: 10 }}>Last 4 weeks</h2>
      <div className="card">
        <StreakCalendar sessionDays={sessionDays} />
      </div>

      <h2 style={{ fontSize: 15, marginTop: 24, marginBottom: 10 }}>Form adherence trend</h2>
      <div className="card">
        {chartData.length >= 2 ? (
          <div style={{ width: "100%", height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  width={34}
                />
                <Tooltip cursor={{ stroke: "var(--border)" }} content={AdherenceTooltip} />
                <Line
                  type="monotone"
                  dataKey="adherence"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--brand)", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <Mascot mood="clipboard" size={56} />
            <p className="text-secondary" style={{ fontSize: 13, marginTop: 8 }}>
              Complete a couple more sessions to see your trend here.
            </p>
          </div>
        )}
      </div>

      <h2 style={{ fontSize: 15, marginTop: 24, marginBottom: 10 }}>Badges</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {badges.map((b) => (
          <div
            key={b.id}
            className="card"
            style={{ opacity: b.earned ? 1 : 0.45, display: "flex", flexDirection: "column", gap: 4 }}
          >
            <span style={{ fontSize: 22 }}>{b.earned ? "🏅" : "🔒"}</span>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{b.label}</span>
            <span className="text-muted" style={{ fontSize: 11 }}>
              {b.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="card">
      <div className="text-muted" style={{ fontSize: 12 }}>
        {label}
      </div>
      <div style={{ marginTop: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</span>
        {suffix && (
          <span className="text-secondary" style={{ fontSize: 13 }}>
            {" "}
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
