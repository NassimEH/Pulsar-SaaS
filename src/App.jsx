import { Routes, Route } from "react-router-dom";
import ButtonGradient from "./assets/svg/ButtonGradient";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import ProcessAudio from "./pages/ProcessAudio";
import AnalyzeAI from "./pages/AnalyzeAI";
import Transpose from "./pages/Transpose";
import SlowedVersion from "./pages/SlowedVersion";
import Nightcore from "./pages/Nightcore";
import Compare from "./pages/Compare";

const App = () => {
  return (
    <>
      <div className="pt-[4.75rem] lg:pt-[5.25rem] overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/process" element={<ProcessAudio />} />
          <Route path="/analyze-ai" element={<AnalyzeAI />} />
          <Route path="/transpose" element={<Transpose />} />
          <Route path="/slowed" element={<SlowedVersion />} />
          <Route path="/nightcore" element={<Nightcore />} />
          <Route path="/compare" element={<Compare />} />
        </Routes>
      </div>

      <ButtonGradient />
    </>
  );
};

export default App;
