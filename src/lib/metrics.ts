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

/**
 * "Knee depth" engine — for sit-to-stand style reps. Legs come from knee
 * flexion and hips from a separate hip-flexion angle (shoulder-hip-knee), so
 * the two regions track genuinely different joints instead of one number
 * rescaled twice — someone who squats more knee-dominant vs. more hip-hinge
 * will actually show a different balance between the two.
 */
function createKneeDepthEngine(): MetricEngine {
  let phase: "up" | "down" = "up";
  let reps = 0;

  return {
    update(pose: Pose): MetricResult {
      const kAngle = (kneeAngle(pose, "L") + kneeAngle(pose, "R")) / 2;
      const hAngle = (hipAngle(pose, "L") + hipAngle(pose, "R")) / 2;

      if (phase === "up" && kAngle < 120) {
        phase = "down";
      } else if (phase === "down" && kAngle > 160) {
        phase = "up";
        reps += 1;
      }

      const legs = clamp(((175 - kAngle) / 95) * 100, 0, 100);
      const hips = clamp(((168 - hAngle) / 85) * 100, 0, 100);

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
/** Below this pose-tracking confidence, readings are treated as unreliable —
 * exported so the UI can show a "step back" prompt using the same bar. */
export const CONFIDENCE_THRESHOLD = 0.4;

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

export type MetricId = "stability" | "alignment" | "kneeDepth";

function createRawEngine(id: MetricId): MetricEngine {
  switch (id) {
    case "stability":
      return createStabilityEngine();
    case "alignment":
      return createAlignmentEngine();
    case "kneeDepth":
      return createKneeDepthEngine();
  }
}

export function createMetricEngine(id: MetricId): MetricEngine {
  return withSmoothing(createRawEngine(id));
}
