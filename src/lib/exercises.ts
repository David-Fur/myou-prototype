import type { BodyRegion, MetricId } from "./metrics";

export type ExerciseKind = "hold" | "reps";

export interface Exercise {
  id: string;
  name: string;
  prescribedBy: string;
  shortDescription: string;
  instructions: string[];
  kind: ExerciseKind;
  durationSec: number; // hold target, or session cap for rep exercises
  targetReps?: number;
  regions: BodyRegion[];
  metricId: MetricId;
  targetBand: Partial<Record<BodyRegion, [number, number]>>;
}

export const EXERCISES: Exercise[] = [
  {
    id: "single-leg-stance",
    name: "Single-Leg Stance",
    prescribedBy: "Physio plan",
    shortDescription: "Balance on one leg, hips level, gaze forward.",
    instructions: [
      "Stand facing your phone, about two arm-lengths away.",
      "Shift your weight onto one leg and lift the other foot slightly off the floor.",
      "Keep your hips level and your core gently braced.",
      "Hold steady — Myou will tell you if you're swaying too much.",
    ],
    kind: "hold",
    durationSec: 30,
    regions: ["core", "hips"],
    metricId: "stability",
    targetBand: { core: [55, 95], hips: [55, 95] },
  },
  {
    id: "side-plank",
    name: "Side Plank (knees or full)",
    prescribedBy: "Physio plan",
    shortDescription: "Hold a straight line from shoulder to ankle.",
    instructions: [
      "Turn sideways to your phone so it can see your full body line.",
      "Prop yourself up on your forearm, hips lifted off the ground.",
      "Keep shoulders, hips and ankles in one straight line.",
      "Breathe steadily and hold the position.",
    ],
    kind: "hold",
    durationSec: 20,
    regions: ["core", "shoulders"],
    metricId: "alignment",
    targetBand: { core: [60, 95], shoulders: [55, 95] },
  },
  {
    id: "bird-dog",
    name: "Bird Dog Hold",
    prescribedBy: "Physio plan",
    shortDescription: "Kneel tall and hold a steady, braced trunk.",
    instructions: [
      "Face your phone in a tall kneeling or hands-and-knees position.",
      "Brace your core as if bracing for a gentle push.",
      "Keep your trunk level and still — avoid rocking side to side.",
      "Hold the brace for the full time.",
    ],
    kind: "hold",
    durationSec: 20,
    regions: ["core", "hips"],
    metricId: "stability",
    targetBand: { core: [60, 95], hips: [55, 90] },
  },
  {
    id: "squat",
    name: "Squat",
    prescribedBy: "Physio plan",
    shortDescription: "Controlled bodyweight squats, down and back up.",
    instructions: [
      "Stand facing your phone, feet shoulder-width apart.",
      "Bend your knees and hips to lower down, keeping your chest up.",
      "Go as low as feels comfortable and controlled.",
      "Push back up through your legs to standing.",
    ],
    kind: "reps",
    durationSec: 90,
    targetReps: 10,
    regions: ["legs", "hips"],
    metricId: "squat",
    targetBand: { legs: [40, 85], hips: [35, 80] },
  },
];

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}
