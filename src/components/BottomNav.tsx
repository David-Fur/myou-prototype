import type { ReactElement } from "react";
import { NavLink } from "react-router-dom";

const ICONS: Record<string, ReactElement> = {
  home: (
    <path d="M4 11.5 12 4l8 7.5M6 10v9h5v-5h2v5h5v-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
  exercises: (
    <path
      d="M6 8v8M4 10v4M9 12h6M18 10v4M20 8v8M9 8v8M15 8v8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  progress: (
    <path d="M4 20V12M10 20V6M16 20v-9M22 20H2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  ),
};

function NavIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

const TABS: { to: string; label: string; icon: keyof typeof ICONS }[] = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/exercises", label: "Exercises", icon: "exercises" },
  { to: "/progress", label: "Progress", icon: "progress" },
];

export function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: 0,
        width: "100%",
        maxWidth: 480,
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom)",
        zIndex: 20,
      }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === "/"}
          style={({ isActive }) => ({
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "10px 0 8px",
            textDecoration: "none",
            color: isActive ? "var(--brand)" : "var(--text-muted)",
            fontSize: 11,
            fontWeight: 600,
          })}
        >
          <NavIcon name={tab.icon} />
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
