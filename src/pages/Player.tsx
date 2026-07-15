import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getExercise } from "../lib/exercises";
import {
  createMetricEngine,
  CONFIDENCE_THRESHOLD,
  TRACKING_LOST_CONFIDENCE_THRESHOLD,
  type BodyRegion,
} from "../lib/metrics";
import { getPoseLandmarker, type Pose } from "../lib/pose";
import { FeedbackSpeaker } from "../lib/speech";
import { useAppState } from "../context/AppState";
import { dayKey } from "../lib/storage";
import { ActivationMeter } from "../components/ActivationMeter";
import { Mascot } from "../components/Mascot";

type Phase = "intro" | "starting" | "active" | "summary" | "error";

const TRACKING_LOST_MS = 2600;

const SKELETON_EDGES: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

export function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const exercise = id ? getExercise(id) : undefined;
  const { recordSession } = useAppState();

  const [phase, setPhase] = useState<Phase>("intro");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [reps, setReps] = useState(0);
  const [liveActivation, setLiveActivation] = useState<Partial<Record<BodyRegion, number>>>({});
  const [audioOn, setAudioOn] = useState(true);
  const [trackingLost, setTrackingLost] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [summary, setSummary] = useState<{ adherencePct: number; durationSec: number; reps?: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speakerRef = useRef(new FeedbackSpeaker());
  const startTimeRef = useRef(0);
  const lastFeedbackTickRef = useRef(0);
  const bandCountersRef = useRef<Record<string, { inBand: number; total: number }>>({});
  const repsRef = useRef(0);
  const lastGoodPoseAtRef = useRef(0);
  const trackingLostRef = useRef(false);

  useEffect(() => {
    speakerRef.current.setEnabled(audioOn);
  }, [audioOn]);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const meters = useMemo(
    () =>
      (exercise?.regions ?? []).map((region) => {
        const band = exercise!.targetBand[region];
        if (!band) return null;
        return <ActivationMeter key={region} region={region} value={liveActivation[region] ?? 0} band={band} />;
      }),
    [exercise, liveActivation]
  );

  if (!exercise) {
    return (
      <div className="screen">
        <p>Exercise not found.</p>
        <Link to="/exercises">Back to exercises</Link>
      </div>
    );
  }

  const startSession = async () => {
    setErrorMsg("");
    setPhase("starting");
    setCountdown(3);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      await getPoseLandmarker();
    } catch (err) {
      console.error(err);
      setErrorMsg(
        "Couldn't access the camera. Make sure you're on a secure (https) connection and allow camera permission."
      );
      setPhase("error");
      return;
    }

    let count = 3;
    const tick = () => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        beginActive();
      } else {
        setTimeout(tick, 800);
      }
    };
    setTimeout(tick, 800);
  };

  const beginActive = () => {
    if (!exercise) return;
    bandCountersRef.current = {};
    exercise.regions.forEach((r) => (bandCountersRef.current[r] = { inBand: 0, total: 0 }));
    repsRef.current = 0;
    setReps(0);
    setElapsed(0);
    startTimeRef.current = performance.now();
    lastFeedbackTickRef.current = 0;
    lastGoodPoseAtRef.current = performance.now();
    trackingLostRef.current = false;
    setTrackingLost(false);
    speakerRef.current.start(exercise.name);
    setPhase("active");
    runLoop();
  };

  const runLoop = async () => {
    const landmarker = await getPoseLandmarker();
    const engine = createMetricEngine(exercise!.metricId);
    const canvas = canvasRef.current;
    const video = videoRef.current;

    const frame = () => {
      if (!video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      const result = landmarker.detectForVideo(video, performance.now());
      const pose: Pose | undefined = result.landmarks?.[0];

      if (canvas && video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (pose) drawSkeleton(ctx, pose, canvas.width, canvas.height);
        }
      }

      let currentConfidence = 0;

      if (pose) {
        const { activation, reps: repCount, confidence } = engine.update(pose);
        currentConfidence = confidence ?? 1;
        const tracked = currentConfidence >= CONFIDENCE_THRESHOLD;

        if (tracked) {
          for (const region of exercise!.regions) {
            const band = exercise!.targetBand[region];
            const value = activation[region];
            if (band && value !== undefined) {
              const counter = bandCountersRef.current[region];
              counter.total += 1;
              if (value >= band[0] && value <= band[1]) counter.inBand += 1;
            }
          }
        }

        if (repCount !== undefined && repCount !== repsRef.current) {
          repsRef.current = repCount;
          setReps(repCount);
          speakerRef.current.rep(repCount);
        }

        const now = performance.now();
        if (now - lastFeedbackTickRef.current > 1500) {
          lastFeedbackTickRef.current = now;
          setLiveActivation(activation);

          if (tracked) {
            let worstRegion: BodyRegion | null = null;
            let worstDeviation = 0;
            let worstDirection: "low" | "high" = "low";
            for (const region of exercise!.regions) {
              const band = exercise!.targetBand[region];
              const value = activation[region];
              if (!band || value === undefined) continue;
              const deviation = value < band[0] ? band[0] - value : value > band[1] ? value - band[1] : 0;
              if (deviation > worstDeviation) {
                worstDeviation = deviation;
                worstRegion = region;
                worstDirection = value < band[0] ? "low" : "high";
              }
            }

            if (worstRegion && worstDeviation > 8) {
              if (worstDirection === "low") speakerRef.current.regionLow(worstRegion);
              else speakerRef.current.regionHigh(worstRegion);
            } else if (Math.random() < 0.35) {
              speakerRef.current.encouragement();
            }
          }
        }
      }

      const trackingNow = performance.now();
      if (currentConfidence >= TRACKING_LOST_CONFIDENCE_THRESHOLD) {
        lastGoodPoseAtRef.current = trackingNow;
      }
      const isLostNow = trackingNow - lastGoodPoseAtRef.current > TRACKING_LOST_MS;
      if (isLostNow !== trackingLostRef.current) {
        trackingLostRef.current = isLostNow;
        setTrackingLost(isLostNow);
        if (isLostNow) speakerRef.current.lostTracking();
      }

      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      setElapsed(elapsedSec);

      const holdDone = exercise!.kind === "hold" && elapsedSec >= exercise!.durationSec;
      const repsDone = exercise!.kind === "reps" && repsRef.current >= (exercise!.targetReps ?? Infinity);
      const capReached = elapsedSec >= exercise!.durationSec;

      if (holdDone || repsDone || capReached) {
        finishSession(elapsedSec);
        return;
      }

      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
  };

  const finishSession = (durationSec: number) => {
    stopCamera();
    speakerRef.current.complete();

    const counters = Object.values(bandCountersRef.current);
    const pcts = counters.filter((c) => c.total > 0).map((c) => (c.inBand / c.total) * 100);
    const adherencePct = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;

    const record = {
      exerciseId: exercise!.id,
      exerciseName: exercise!.name,
      dateISO: new Date().toISOString(),
      dayKey: dayKey(),
      durationSec: Math.round(durationSec),
      adherencePct,
      reps: exercise!.kind === "reps" ? repsRef.current : undefined,
    };
    recordSession(record);
    setSummary({ adherencePct, durationSec: Math.round(durationSec), reps: record.reps });
    setPhase("summary");
  };

  const stopEarly = () => {
    if (phase === "active") finishSession(elapsed);
  };

  return (
    <div className="screen" style={{ paddingBottom: phase === "active" ? 24 : undefined }}>
      {phase === "intro" && (
        <>
          <Link to="/exercises" className="text-secondary" style={{ fontSize: 13, textDecoration: "none" }}>
            ← Back to exercises
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <Mascot mood="teaching" size={56} />
            <h2 style={{ fontSize: 22 }}>{exercise.name}</h2>
          </div>
          <p className="text-secondary" style={{ marginTop: 8 }}>
            {exercise.shortDescription}
          </p>
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 14, marginBottom: 10 }}>How to do it</h3>
            <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
              {exercise.instructions.map((step, i) => (
                <li key={i} style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <p className="text-muted" style={{ fontSize: 12, marginTop: 12 }}>
            Myou watches through your camera to estimate how your muscles are working, and gives you spoken cues.
            Nothing is recorded or uploaded — everything happens on your device.
          </p>
          <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={startSession}>
            Start with camera
          </button>
        </>
      )}

      {phase === "error" && (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Mascot mood="thinking" size={80} />
          <p style={{ marginTop: 16 }}>{errorMsg}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={startSession}>
            Try again
          </button>
        </div>
      )}

      {(phase === "starting" || phase === "active") && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            maxWidth: 480,
            margin: "0 auto",
            background: "#000",
          }}
        >
          <div style={{ position: "absolute", inset: 0, transform: "scaleX(-1)" }}>
            <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          </div>

          {phase === "starting" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.35)",
              }}
            >
              <span style={{ fontSize: 72, fontWeight: 700, color: "white" }}>{countdown > 0 ? countdown : "Go!"}</span>
            </div>
          )}

          {phase === "active" && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: "calc(16px + env(safe-area-inset-top))",
                  left: 16,
                  right: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  className="pill"
                  style={{ background: "rgba(0,0,0,0.45)", color: "white", fontVariantNumeric: "tabular-nums" }}
                >
                  {exercise.kind === "hold"
                    ? `${Math.max(0, Math.ceil(exercise.durationSec - elapsed))}s left`
                    : `${reps} / ${exercise.targetReps} reps`}
                </span>
                <button
                  onClick={() => setAudioOn((v) => !v)}
                  className="pill"
                  style={{ background: "rgba(0,0,0,0.45)", color: "white", border: "none", cursor: "pointer" }}
                >
                  {audioOn ? "🔊 On" : "🔇 Off"}
                </button>
              </div>

              {trackingLost && (
                <div
                  style={{
                    position: "absolute",
                    top: "32%",
                    left: 20,
                    right: 20,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(0,0,0,0.6)",
                    borderRadius: 20,
                    padding: "18px 18px 14px",
                  }}
                >
                  <Mascot mood="thinking" size={52} />
                  <p style={{ color: "white", textAlign: "center", fontSize: 13.5, margin: 0 }}>
                    I can't see you fully — step back so your whole body is in frame.
                  </p>
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "var(--surface)",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  padding: "16px 18px calc(20px + env(safe-area-inset-bottom))",
                }}
              >
                {meters}
                <button className="btn btn-ghost btn-block" onClick={stopEarly}>
                  End session
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === "summary" && summary && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Mascot mood={summary.adherencePct >= 70 ? "cheer" : "head-in-sand"} size={96} />
          <h2 style={{ marginTop: 12 }}>{summary.adherencePct >= 70 ? "Great work!" : "Session complete"}</h2>
          <p className="text-secondary" style={{ marginTop: 6 }}>
            {exercise.name} · {summary.durationSec}s{summary.reps !== undefined ? ` · ${summary.reps} reps` : ""}
          </p>
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Form adherence</div>
            <div style={{ fontSize: 40, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {summary.adherencePct}%
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
              Share of the session your estimated muscle activation stayed in the target range.
            </p>
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
            <button className="btn btn-primary btn-block" onClick={() => navigate("/progress")}>
              See my progress
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => navigate("/exercises")}>
              Back to exercises
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function drawSkeleton(ctx: CanvasRenderingContext2D, pose: Pose, width: number, height: number) {
  ctx.lineWidth = Math.max(2, width * 0.006);
  ctx.strokeStyle = "#eb6834";
  ctx.beginPath();
  for (const [a, b] of SKELETON_EDGES) {
    const pa = pose[a];
    const pb = pose[b];
    if (!pa || !pb) continue;
    ctx.moveTo(pa.x * width, pa.y * height);
    ctx.lineTo(pb.x * width, pb.y * height);
  }
  ctx.stroke();

  ctx.fillStyle = "#fff3e6";
  for (const p of pose) {
    if (p.visibility !== undefined && p.visibility < 0.4) continue;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, Math.max(3, width * 0.008), 0, Math.PI * 2);
    ctx.fill();
  }
}
