import type { BodyRegion } from "./metrics";
import { REGION_LABEL } from "./metrics";

const LOW_PHRASES: Record<BodyRegion, string[]> = {
  core: ["Brace your core a little more.", "Gently tighten your core.", "Engage your core a bit more."],
  hips: ["Level your hips.", "Keep your hips a little steadier.", "Engage your glutes a touch more."],
  legs: ["Sink a little deeper, with control.", "Bend your knees a bit more."],
  shoulders: ["Stack your shoulders.", "Lift through your shoulder a little more."],
};

const HIGH_PHRASES: Record<BodyRegion, string[]> = {
  core: ["Nice bracing — you can ease off slightly.", "Good, no need to overdo the core."],
  hips: ["Good hip control — relax just a touch."],
  legs: ["That's deep enough — rise with control."],
  shoulders: ["Good — ease the shoulder tension slightly."],
};

const ENCOURAGEMENT = [
  "Nice and steady, keep it there.",
  "That's it — great control.",
  "Looking good, stay with it.",
  "Solid form, keep going.",
];

const START_LINES = ["Here we go.", "Let's begin.", "Ready, and hold.", "Nice and steady from the start."];
const COMPLETE_LINES = ["Well done!", "Great work!", "Session complete, nice job!", "That's a wrap — great effort."];

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

export class FeedbackSpeaker {
  private lastSpokenAt = 0;
  private cooldownMs = 4200;
  private enabled = true;

  setEnabled(v: boolean) {
    this.enabled = v;
    if (!v) this.stop();
  }

  isEnabled() {
    return this.enabled;
  }

  stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  private say(text: string, force = false) {
    if (!this.enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const now = performance.now();
    if (!force && now - this.lastSpokenAt < this.cooldownMs) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
    this.lastSpokenAt = now;
  }

  regionLow(region: BodyRegion) {
    this.say(pick(LOW_PHRASES[region]));
  }

  regionHigh(region: BodyRegion) {
    this.say(pick(HIGH_PHRASES[region]));
  }

  encouragement() {
    this.say(pick(ENCOURAGEMENT));
  }

  start(exerciseName: string) {
    this.say(`${pick(START_LINES)} ${exerciseName}.`, true);
  }

  complete() {
    this.say(pick(COMPLETE_LINES), true);
  }

  rep(count: number) {
    this.say(String(count), true);
  }
}

export function regionLabel(region: BodyRegion): string {
  return REGION_LABEL[region];
}
