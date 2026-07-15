import thumbsUp from "../assets/mascot/thumbs-up.png";
import cheer from "../assets/mascot/cheer.png";
import sadGround from "../assets/mascot/sad-ground.png";
import headInSand from "../assets/mascot/head-in-sand.png";
import thinking from "../assets/mascot/thinking.png";
import teaching from "../assets/mascot/teaching.png";
import amazed from "../assets/mascot/amazed.png";
import meditating from "../assets/mascot/meditating.png";
import running from "../assets/mascot/running.png";
import waving from "../assets/mascot/waving.png";
import clipboard from "../assets/mascot/clipboard.png";

export type MascotMood =
  | "thumbs-up"
  | "cheer"
  | "sad-ground"
  | "head-in-sand"
  | "thinking"
  | "teaching"
  | "amazed"
  | "meditating"
  | "running"
  | "waving"
  | "clipboard";

const POSE_IMAGE: Record<MascotMood, string> = {
  "thumbs-up": thumbsUp,
  cheer,
  "sad-ground": sadGround,
  "head-in-sand": headInSand,
  thinking,
  teaching,
  amazed,
  meditating,
  running,
  waving,
  clipboard,
};

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

// Myou the emu — MyoInsight's mascot. Real illustrated poses (see
// src/assets/mascot), swapped per screen/outcome rather than drawn live.
export function Mascot({ mood = "waving", size = 96, className }: MascotProps) {
  const bounce = mood === "cheer" || mood === "amazed" ? "myou-cheer-bounce" : "myou-bob";

  return (
    <span className={[bounce, className].filter(Boolean).join(" ")} style={{ display: "inline-block" }}>
      <img
        key={mood}
        src={POSE_IMAGE[mood]}
        alt={`Myou the mascot, ${mood.replace("-", " ")}`}
        className="myou-pose-in"
        style={{ height: size, width: "auto", display: "block" }}
        draggable={false}
      />
    </span>
  );
}
