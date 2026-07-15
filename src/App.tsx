import { useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { Onboarding } from "./pages/Onboarding";
import { Home } from "./pages/Home";
import { Library } from "./pages/Library";
import { Player } from "./pages/Player";
import { Progress } from "./pages/Progress";
import { Share } from "./pages/Share";

const ONBOARDED_KEY = "myou.onboarded.v1";

function App() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem(ONBOARDED_KEY) === "1");
  const location = useLocation();
  const isPlaying = location.pathname.startsWith("/exercise/");

  if (!onboarded) {
    return (
      <div className="app-shell">
        <Onboarding
          onDone={() => {
            localStorage.setItem(ONBOARDED_KEY, "1");
            setOnboarded(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/exercises" element={<Library />} />
        <Route path="/exercise/:id" element={<Player />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/share" element={<Share />} />
      </Routes>
      {!isPlaying && <BottomNav />}
    </div>
  );
}

export default App;
