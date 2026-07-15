import type { Pose } from "./pose";
import {
  angleAt,
  angleFromVertical,
  avgVisible,
  clamp,
  hipAngle,
  hipMid,
  kneeAngle,
  mid,
  shoulderMid,
  stddev,
} from "./geometry";
import { LM } from "./pose";

export type BodyRegion = "core" | "hips" | "legs" | "shoulders";

export const REGION_LABEL: Record<BodyRegion, string> = {
  core: "Core",
  hips: "Hips & glutes",
  legs: "Legs",
  shoulders: "Shoulders",
};

export interface MetricResult {
  activation: Partial<Record<BodyRegion, number>>;
  reps?: number;
  /** 0-1 pose-tracking confidence for this frame — low when the person is
   * partly out of frame or occluded, so noisy readings can be ignored. */
  confidence?: number;
}

export interface MetricEngine {
  update(pose: Pose): MetricResult;
}

const WINDOW = 24; // ~0.8s of frames at 30fps

/**
 * "Stability" engine — estimates trunk/pelvis control from lateral sway and
 * trunk lean. This stands in for the real EMG-from-motion-capture model:
 * a wobblier, more tilted trunk reads as lower core/hip engagement, which is
 * a reasonable proxy for "not bracing enough" in a balance hold.
 */
function createStabilityEngine(): MetricEngine {
  const shoulderX: number[] = [];
  const hipX: number[] = [];
  const trunkAngles: number[] = [];

  return {
    update(pose: Pose): MetricResult {
      const s = shoulderMid(pose);
      const h = hipMid(pose);
      shoulderX.push(s.x);
      hipX.push(h.x);
      trunkAngles.push(angleFromVertical(h, s));
      if (shoulderX.length > WINDOW) shoulderX.shift();
      if (hipX.length > WINDOW) hipX.shift();
      if (trunkAngles.length > WINDOW) trunkAngles.shift();

      const shoulderSway = stddev(shoulderX);
      const hipSway = stddev(hipX);
      const trunkTilt = trunkAngles.reduce((a, b) => a + b, 0) / trunkAngles.length;

      const coreInstability = shoulderSway * 900 + trunkTilt * 1.6;
      const hipInstability = hipSway * 1100 + trunkTilt * 1.1;

      return {
        activation: {
          core: clamp(100 - coreInstability, 0, 100),
          hips: clamp(100 - hipInstability, 0, 100),
        },
        confidence: avgVisible(pose[LM.L_SHOULDER], pose[LM.R_SHOULDER], pose[LM.L_HIP], pose[LM.R_HIP]),
      };
    },
  };
}

/**
 * "Alignment" engine — for side-plank-style holds, scores how close the
 * shoulder-hip-ankle line is to straight (180 degrees).
 */
function createAlignmentEngine(): MetricEngine {
  return {
    update(pose: Pose): MetricResult {
      const s = shoulderMid(pose);
      const h = hipMid(pose);
      const a = mid(pose[LM.L_ANKLE], pose[LM.R_ANKLE]);
      const lineAngle = angleAt(s, h, a);
      const deviation = Math.abs(180 - lineAngle);

      return {
        activation: {
          core: clamp(100 - deviation * 4, 0, 100),
          shoulders: clamp(100 - deviation * 3, 0, 100),
        },
        confidence: avgVisible(
          pose[LM.L_SHOULDER],
          pose[LM.R_SHOULDER],
          pose[LM.L_HIP],
          pose[LM.R_HIP],
          pose[LM.L_ANKLE],
          pose[LM.R_ANKLE]
        ),
      };
    },
  };
}

const VELOCITY_WINDOW = 6; // ~0.2s at 30fps — smooths the derivative so pose jitter isn't mistaken for movement

interface AngleSample {
  angle: number;
  t: number;
}

/** Angular velocity (deg/sec) over a short trailing window, not frame-to-frame —
 * a raw two-frame derivative of a noisy angle signal is mostly noise itself. */
function trackVelocity(history: AngleSample[], angle: number, now: number): number {
  history.push({ angle, t: now });
  if (history.length > VELOCITY_WINDOW) history.shift();
  if (history.length < 2) return 0;
  const oldest = history[0];
  const dt = (now - oldest.t) / 1000;
  return dt > 0 ? (angle - oldest.angle) / dt : 0;
}

const DEPTH_SMOOTH_WINDOW = 4; // rolling average for rep-phase detection only
const SQUAT_DOWN_THRESHOLD = 42; // combined knee+hip depth %, entering "down"
const SQUAT_UP_THRESHOLD = 18; // combined depth %, returning to "up"
const SQUAT_MIN_DOWN_MS = 200; // must stay down at least this long — filters noise-driven flicker

/**
 * "Squat" engine — for squat/sit-to-stand style reps. Legs come from knee
 * flexion and hips from a separate hip-flexion angle (shoulder-hip-knee), so
 * the two regions track genuinely different joints instead of one number
 * rescaled twice — someone who squats more knee-dominant vs. more hip-hinge
 * will actually show a different balance between the two.
 *
 * Position alone can't distinguish a held squat from actively driving out of
 * one, but real muscles work much harder in the latter — so activation also
 * factors in how fast the joint is extending (concentric, working against
 * gravity, weighted higher) or flexing (eccentric control, weighted lower).
 *
 * Rep counting uses a smoothed combination of knee AND hip depth (the whole
 * body descending and rising), not knee angle alone — more forgiving of an
 * imperfect lockout at the top, and more robust to a single landmark
 * (e.g. the ankle) briefly jittering.
 */
function createSquatEngine(): MetricEngine {
  let phase: "up" | "down" = "up";
  let reps = 0;
  let downSinceAt = 0;
  const kneeHistory: AngleSample[] = [];
  const hipHistory: AngleSample[] = [];
  const depthHistory: number[] = [];

  return {
    update(pose: Pose): MetricResult {
      const kAngle = (kneeAngle(pose, "L") + kneeAngle(pose, "R")) / 2;
      const hAngle = (hipAngle(pose, "L") + hipAngle(pose, "R")) / 2;
      const now = performance.now();
      const kVelocity = trackVelocity(kneeHistory, kAngle, now);
      const hVelocity = trackVelocity(hipHistory, hAngle, now);

      const kneeDepth = clamp(((175 - kAngle) / 95) * 100, 0, 100);
      const hipDepth = clamp(((168 - hAngle) / 85) * 100, 0, 100);

      depthHistory.push((kneeDepth + hipDepth) / 2);
      if (depthHistory.length > DEPTH_SMOOTH_WINDOW) depthHistory.shift();
      const bodyDepth = depthHistory.reduce((a, b) => a + b, 0) / depthHistory.length;

      if (phase === "up" && bodyDepth > SQUAT_DOWN_THRESHOLD) {
        phase = "down";
        downSinceAt = now;
      } else if (phase === "down" && bodyDepth < SQUAT_UP_THRESHOLD && now - downSinceAt > SQUAT_MIN_DOWN_MS) {
        phase = "up";
        reps += 1;
      }

      // extending (standing up) = concentric drive, boosted more than
      // flexing (sitting down) = eccentric control
      const kneeEffort = clamp(kVelocity * 0.5, 0, 25) + clamp(-kVelocity * 0.25, 0, 12);
      const hipEffort = clamp(hVelocity * 0.4, 0, 20) + clamp(-hVelocity * 0.2, 0, 10);

      const legs = clamp(kneeDepth * 0.75 + kneeEffort, 0, 100);
      const hips = clamp(hipDepth * 0.75 + hipEffort, 0, 100);

      return {
        activation: { legs, hips },
        reps,
        confidence: avgVisible(
          pose[LM.L_HIP],
          pose[LM.R_HIP],
          pose[LM.L_KNEE],
          pose[LM.R_KNEE],
          pose[LM.L_ANKLE],
          pose[LM.R_ANKLE],
          pose[LM.L_SHOULDER],
          pose[LM.R_SHOULDER]
        ),
      };
    },
  };
}

const SMOOTHING_ALPHA = 0.25;
/** Below this pose-tracking confidence, readings are too noisy to smooth in
 * or count toward adherence — a fairly cautious bar, since momentary dips are
 * common mid-movement (e.g. an ankle briefly self-occluded during a squat). */
export const CONFIDENCE_THRESHOLD = 0.4;
/** Below this (looser) confidence, sustained for a while, we tell the user we
 * genuinely can't see them. Deliberately lower than CONFIDENCE_THRESHOLD so
 * the same normal mid-movement dips that pause smoothing don't also trigger
 * a "step back" prompt. */
export const TRACKING_LOST_CONFIDENCE_THRESHOLD = 0.25;

/** Exponentially smooths each region's activation and freezes updates when
 * tracking confidence is too low, so a brief occlusion or edge-of-frame
 * moment doesn't show up as a wild, obviously-fake spike. */
function withSmoothing(engine: MetricEngine): MetricEngine {
  const smoothed: Partial<Record<BodyRegion, number>> = {};

  return {
    update(pose: Pose): MetricResult {
      const result = engine.update(pose);
      const confidence = result.confidence ?? 1;

      if (confidence >= CONFIDENCE_THRESHOLD) {
        for (const region of Object.keys(result.activation) as BodyRegion[]) {
          const raw = result.activation[region];
          if (raw === undefined) continue;
          const prev = smoothed[region];
          smoothed[region] = prev === undefined ? raw : prev + (raw - prev) * SMOOTHING_ALPHA;
        }
      }

      return { activation: { ...smoothed }, reps: result.reps, confidence };
    },
  };
}

export type MetricId = "stability" | "alignment" | "squat";

function createRawEngine(id: MetricId): MetricEngine {
  switch (id) {
    case "stability":
      return createStabilityEngine();
    case "alignment":
      return createAlignmentEngine();
    case "squat":
      return createSquatEngine();
  }
}

export function createMetricEngine(id: MetricId): MetricEngine {
  return withSmoothing(createRawEngine(id));
}
