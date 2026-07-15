import type { Pose } from "./pose";
import { LM } from "./pose";

export interface Point {
  x: number;
  y: number;
}

export function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / (values.length || 1);
}

export function stddev(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

/** Angle (degrees) of vector a->b measured from vertical "up" (0,-1). */
export function angleFromVertical(a: Point, b: Point): number {
  const v = { x: b.x - a.x, y: b.y - a.y };
  const angle = Math.atan2(v.x, -v.y) * (180 / Math.PI);
  return Math.abs(angle);
}

/** Interior angle (degrees) at point b, formed by rays b->a and b->c. */
export function angleAt(a: Point, b: Point, c: Point): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1;
  const cos = clamp(dot / mag, -1, 1);
  return Math.acos(cos) * (180 / Math.PI);
}

export function shoulderMid(pose: Pose): Point {
  return mid(pose[LM.L_SHOULDER], pose[LM.R_SHOULDER]);
}

export function hipMid(pose: Pose): Point {
  return mid(pose[LM.L_HIP], pose[LM.R_HIP]);
}

export function kneeAngle(pose: Pose, side: "L" | "R"): number {
  const hip = pose[side === "L" ? LM.L_HIP : LM.R_HIP];
  const knee = pose[side === "L" ? LM.L_KNEE : LM.R_KNEE];
  const ankle = pose[side === "L" ? LM.L_ANKLE : LM.R_ANKLE];
  return angleAt(hip, knee, ankle);
}

export function avgVisible(...vals: number[]): number {
  return mean(vals);
}
