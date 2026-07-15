export type MascotMood = "happy" | "cheer" | "concerned" | "sleepy" | "focus";

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
}

const FEATHER = "#8c5b3f";
const FEATHER_DARK = "#6f4530";
const BELLY = "#f5dfc0";
const BEAK = "#eb6834";
const INK = "#2b2116";

// Myou the emu — MyoInsight's mascot. A handful of mood variants swap the
// eyes/brows/mouth/wing so the same component can react to the user.
export function Mascot({ mood = "happy", size = 96, className }: MascotProps) {
  const blink = mood === "sleepy";
  const wingUp = mood === "cheer";

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
      {/* legs */}
      <path d="M64 168 L58 196" stroke={BEAK} strokeWidth="6" strokeLinecap="round" />
      <path d="M64 168 L50 192" stroke={BEAK} strokeWidth="6" strokeLinecap="round" />
      <path d="M64 168 L70 194" stroke={BEAK} strokeWidth="6" strokeLinecap="round" />
      <path d="M96 168 L100 196" stroke={BEAK} strokeWidth="6" strokeLinecap="round" />
      <path d="M96 168 L112 192" stroke={BEAK} strokeWidth="6" strokeLinecap="round" />
      <path d="M96 168 L90 194" stroke={BEAK} strokeWidth="6" strokeLinecap="round" />

      {/* body */}
      <ellipse cx="80" cy="140" rx="42" ry="38" fill={FEATHER} />
      <ellipse cx="80" cy="150" rx="26" ry="24" fill={BELLY} />

      {/* far wing (behind body) */}
      <path
        d={
          wingUp
            ? "M46 118 C 24 96, 20 70, 30 54 C 36 78, 44 96, 56 112 Z"
            : "M46 118 C 30 128, 22 148, 28 166 C 40 156, 50 142, 54 126 Z"
        }
        fill={FEATHER_DARK}
      />

      {/* neck */}
      <path
        d="M70 120 C 54 96, 52 66, 66 40 C 70 58, 80 62, 84 46 C 90 68, 84 96, 96 116 Z"
        fill={FEATHER}
      />

      {/* head */}
      <circle cx="80" cy="34" r="22" fill={FEATHER} />

      {/* near wing (in front, small) */}
      <path
        d={
          wingUp
            ? "M104 116 C 128 96, 134 72, 126 54 C 118 76, 108 94, 96 110 Z"
            : "M104 116 C 122 122, 132 138, 130 156 C 118 148, 108 134, 100 120 Z"
        }
        fill={FEATHER}
      />

      {/* beak */}
      <path d="M98 32 L118 30 L98 40 Z" fill={BEAK} />

      {/* eye */}
      {blink ? (
        <path d="M72 32 Q78 36 84 32" stroke={INK} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      ) : (
        <>
          <circle cx="78" cy="30" r="6.5" fill="white" />
          <circle
            cx={mood === "concerned" ? "76" : mood === "focus" ? "80" : "78"}
            cy="30.5"
            r="3.4"
            fill={INK}
          />
        </>
      )}

      {/* brow */}
      {mood === "concerned" && (
        <path d="M69 20 Q77 16 84 20" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      )}
      {mood === "focus" && (
        <path d="M70 21 L84 19" stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      )}

      {/* cheer sparkles */}
      {mood === "cheer" && (
        <g stroke={BEAK} strokeWidth="2.4" strokeLinecap="round">
          <path d="M28 40 L34 40 M31 37 L31 43" />
          <path d="M126 60 L132 60 M129 57 L129 63" />
          <path d="M118 20 L122 24 M122 20 L118 24" />
        </g>
      )}
    </svg>
  );
}
