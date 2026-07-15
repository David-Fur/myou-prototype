import { Mascot } from "../components/Mascot";

export function Onboarding({ onDone }: { onDone: () => void }) {
  return (
    <div
      className="screen"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 6,
        minHeight: "100dvh",
      }}
    >
      <Mascot mood="cheer" size={140} />
      <h1 style={{ fontSize: 30, marginTop: 8 }}>Meet Myou</h1>
      <p className="text-secondary" style={{ maxWidth: 320, marginTop: 4 }}>
        Your balance-training companion. Myou watches your exercises through your phone's camera and estimates how
        your muscles are working — coaching you in real time, just like a physio would.
      </p>

      <div className="card" style={{ marginTop: 24, textAlign: "left", width: "100%", maxWidth: 340 }}>
        <FeatureRow emoji="🎯" title="Do exercises correctly" text="Live spoken cues if a muscle group is under- or over-activating." />
        <FeatureRow emoji="📈" title="See your progress" text="Every session builds your streak and your history." />
        <FeatureRow emoji="🤝" title="Never alone" text="Myou is in your corner, cheering you on at home." />
      </div>

      <p className="text-muted" style={{ fontSize: 12, maxWidth: 320, marginTop: 20 }}>
        Myou needs camera access during exercises. Video stays on your device — nothing is uploaded.
      </p>

      <button className="btn btn-primary btn-block" style={{ marginTop: 20, maxWidth: 340 }} onClick={onDone}>
        Let's get moving
      </button>
      <p className="text-muted" style={{ fontSize: 11, marginTop: 14 }}>
        Myou · by MyoInsight
      </p>
    </div>
  );
}

function FeatureRow({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{text}</div>
      </div>
    </div>
  );
}
