import type { BodyRegion } from "./metrics";
import { REGION_LABEL } from "./metrics";

const LOW_PHRASES: Record<BodyRegion, string[]> = {
  core: [
    "Brace your core a little more.",
    "Gently tighten your core.",
    "Engage your core a bit more.",
    "Draw your belly button in slightly.",
    "Switch on your core a touch more.",
  ],
  hips: [
    "Level your hips.",
    "Keep your hips a little steadier.",
    "Engage your glutes a touch more.",
    "Squeeze your glutes a little harder.",
    "Try to stop your hips from dipping.",
  ],
  legs: [
    "Sink a little deeper, with control.",
    "Bend your knees a bit more.",
    "Push a little more through your legs.",
    "Take it a little lower, nice and controlled.",
  ],
  shoulders: [
    "Stack your shoulders.",
    "Lift through your shoulder a little more.",
    "Open your chest a touch.",
    "Keep that shoulder lifted.",
  ],
};

const HIGH_PHRASES: Record<BodyRegion, string[]> = {
  core: [
    "Nice bracing — you can ease off slightly.",
    "Good, no need to overdo the core.",
    "That's plenty of core — soften just a little.",
  ],
  hips: ["Good hip control — relax just a touch.", "That's enough there — ease off slightly."],
  legs: ["That's deep enough — rise with control.", "Good depth — no need to go further."],
  shoulders: ["Good — ease the shoulder tension slightly.", "That's enough lift — relax a touch."],
};

const ENCOURAGEMENT = [
  "Nice and steady, keep it there.",
  "That's it — great control.",
  "Looking good, stay with it.",
  "Solid form, keep going.",
  "You've got this.",
  "Great focus, keep breathing.",
  "That's exactly it.",
  "Strong and steady.",
];

const START_LINES = ["Here we go.", "Let's begin.", "Ready, and hold.", "Nice and steady from the start."];
const COMPLETE_LINES = ["Well done!", "Great work!", "Session complete, nice job!", "That's a wrap — great effort."];
const LOST_TRACKING_LINES = [
  "I can't quite see you — try stepping back a little.",
  "Let's get your whole body in frame.",
  "Step back so I can see you fully.",
];

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

function isEnglish(voice: SpeechSynthesisVoice): boolean {
  return voice.lang?.toLowerCase().startsWith("en");
}

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const byLang = (lang: string) => voices.find((v) => v.lang?.toLowerCase() === lang);
  return (
    byLang("en-us") ||
    byLang("en-gb") ||
    voices.find(isEnglish) ||
    null
  );
}

export class FeedbackSpeaker {
  private lastSpokenAt = 0;
  private cooldownMs = 4200;
  private enabled = true;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.refreshVoice();
    window.speechSynthesis.addEventListener?.("voiceschanged", () => this.refreshVoice());
  }

  private refreshVoice() {
    this.voice = pickEnglishVoice(window.speechSynthesis.getVoices());
  }

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
    utterance.lang = "en-US";
    if (this.voice) utterance.voice = this.voice;
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

  lostTracking() {
    // not forced — if the tracking signal flickers, this must never be able
    // to repeat faster than the normal cooldown allows.
    this.say(pick(LOST_TRACKING_LINES));
  }
}

export function regionLabel(region: BodyRegion): string {
  return REGION_LABEL[region];
}
