import { Link } from "react-router-dom";
import { EXERCISES } from "../lib/exercises";
import { REGION_LABEL } from "../lib/metrics";

export function Library() {
  return (
    <div className="screen">
      <h1 style={{ fontSize: 22 }}>Your exercises</h1>
      <p className="text-secondary" style={{ marginTop: 4 }}>
        Prescribed by your physiotherapist. Myou will guide you through each one.
      </p>

      <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
        {EXERCISES.map((ex) => (
          <div key={ex.id} className="card">
            <div style={{ fontWeight: 700, fontSize: 16 }}>{ex.name}</div>
            <p className="text-secondary" style={{ fontSize: 13, marginTop: 4 }}>
              {ex.shortDescription}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {ex.regions.map((r) => (
                <span key={r} className="pill">
                  {REGION_LABEL[r]}
                </span>
              ))}
              <span className="pill">{ex.kind === "hold" ? `${ex.durationSec}s hold` : `${ex.targetReps} reps`}</span>
            </div>
            <Link to={`/exercise/${ex.id}`} className="btn btn-primary btn-block" style={{ marginTop: 14, textDecoration: "none" }}>
              Start
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
