export type MascotMood = "happy" | "cheer" | "concerned" | "sleepy" | "focus";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

const FEATHER = "#8c5b3f";
const FEATHER_DARK = "#6f4530";
const CAP = "#4a3626";
const BILL = "#332a22";
const LEG = "#7a6a58";
const THROAT = "#71828a";
const CREAM = "#f5dfc0";
const INK = "#2b2116";

// Myou the emu — MyoInsight's mascot. Long neck, small dark-capped head, flat
// bill and tiny hidden wings distinguish it from reading as a penguin.
export function Mascot({ mood = "happy", size = 96, className }: MascotProps) {
  const eyesClosed = mood === "sleepy";
  const wingUp = mood === "cheer";
  const bodyMotion = mood === "cheer" ? "myou-cheer-bounce" : "myou-bob";
  const headMotion = mood === "concerned" ? "myou-shake" : mood === "sleepy" ? "myou-nod" : undefined;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 160 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Myou the mascot, ${mood}`}
    >
      <g className={bodyMotion}>
        {/* legs */}
        <path d="M70 172 L62 197" stroke={LEG} strokeWidth="5" strokeLinecap="round" />
        <path d="M70 172 L56 193" stroke={LEG} strokeWidth="5" strokeLinecap="round" />
        <path d="M70 172 L68 197" stroke={LEG} strokeWidth="5" strokeLinecap="round" />
        <path d="M92 172 L100 197" stroke={LEG} strokeWidth="5" strokeLinecap="round" />
        <path d="M92 172 L106 192" stroke={LEG} strokeWidth="5" strokeLinecap="round" />
        <path d="M92 172 L92 197" stroke={LEG} strokeWidth="5" strokeLinecap="round" />

        {/* body */}
        <ellipse cx="81" cy="150" rx="35" ry="30" fill={FEATHER} />
        <g stroke={FEATHER_DARK} strokeWidth="2" strokeLinecap="round" opacity="0.6">
          <path d="M58 170 Q 56 176 54 180" />
          <path d="M70 176 Q 69 182 67 186" />
          <path d="M82 178 Q 82 184 82 188" />
          <path d="M94 176 Q 95 182 97 186" />
          <path d="M106 170 Q 108 176 110 180" />
        </g>

        {/* wing */}
        <path
          className={wingUp ? "myou-wing-cheer" : undefined}
          d={
            wingUp
              ? "M46 136 C 30 118, 26 96, 34 80 C 40 100, 46 116, 52 130 Z"
              : "M47 132 C 39 136, 35 146, 37 155 C 43 151, 47 143, 48 134 Z"
          }
          fill={FEATHER_DARK}
        />

        {/* neck + head group (shake / nod live here) */}
        <g className={headMotion}>
          <path
            d="M71 124 C 60 103, 59 79, 68 60 C 71 51, 85 51, 88 60 C 96 79, 95 103, 91 124 Z"
            fill={FEATHER}
          />
          <ellipse cx="79" cy="66" rx="9" ry="12" fill={THROAT} opacity="0.5" />
          <circle cx="78" cy="42" r="17" fill={FEATHER} />
          <path d="M62 38 C 64 24, 92 24, 94 38 C 84 30, 72 30, 62 38 Z" fill={CAP} />
          <path d="M93 43 L 115 41 L 113 48 L 93 49 Z" fill={BILL} />

          {eyesClosed ? (
            <path d="M67 43 Q72 47 77 43" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          ) : (
            <g className="myou-blink">
              <circle cx="72" cy="43" r="5.5" fill="white" />
              <circle cx={mood === "concerned" ? "70.5" : "71.5"} cy="43.5" r="3" fill={INK} />
            </g>
          )}

          {mood === "concerned" && (
            <path d="M63 39 Q 72 34 81 38" stroke={CREAM} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          )}
        </g>

        {mood === "cheer" && (
          <g stroke="#eb6834" strokeWidth="2.4" strokeLinecap="round">
            <path className="myou-sparkle" d="M28 60 L34 60 M31 57 L31 63" />
            <path className="myou-sparkle" d="M118 70 L124 70 M121 67 L121 73" />
            <path className="myou-sparkle" d="M110 30 L114 34 M114 30 L110 34" />
          </g>
        )}
      </g>
    </svg>
  );
}
