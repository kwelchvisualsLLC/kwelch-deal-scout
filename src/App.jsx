import { useState } from "react";
import Header from "./components/Header.jsx";
import ProfileAnalyzer from "./components/ProfileAnalyzer.jsx";
import Discovery from "./components/Discovery.jsx";
import Outreach from "./components/Outreach.jsx";
import Pipeline from "./components/Pipeline.jsx";
import LeadsFeed from "./components/LeadsFeed.jsx";
import RateCard from "./components/RateCard.jsx";
import Settings from "./components/Settings.jsx";
import { loadPipeline } from "./lib/storage.js";
import { getKey } from "./lib/api.js";

export default function App() {
  const [tab, setTab] = useState("analyzer");
  const [pipeline, setPipeline] = useState(loadPipeline());
  const [outreachSeed, setOutreachSeed] = useState(null);
  const [keyOk, setKeyOk] = useState(!!getKey());
  const [showSettings, setShowSettings] = useState(false);

  // Jump from a discovery/lead card straight into the Outreach tab, prefilled.
  function startOutreach(brand) {
    setOutreachSeed({ ...brand, _ts: Date.now() });
    setTab("outreach");
  }

  return (
    <div className="min-h-screen">
      <Header tab={tab} setTab={setTab} onSettings={() => setShowSettings(true)} />

      {!keyOk && (
        <button
          onClick={() => setShowSettings(true)}
          className="block w-full border-b border-gold/30 bg-gold/10 px-4 py-2 text-center text-xs text-goldsoft hover:bg-gold/15"
        >
          ⚠ No Anthropic API key yet — AI features are off. Click here to add your key (the Rate Card works without one).
        </button>
      )}

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} onSaved={setKeyOk} />
      )}

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {tab === "analyzer" && <ProfileAnalyzer />}
        {tab === "discover" && <Discovery onPipelineChange={setPipeline} onOutreach={startOutreach} />}
        {tab === "outreach" && <Outreach seed={outreachSeed} />}
        {tab === "pipeline" && <Pipeline items={pipeline} setItems={setPipeline} />}
        {tab === "leads" && <LeadsFeed onPipelineChange={setPipeline} />}
        {tab === "ratecard" && <RateCard />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-[11px] text-white/25 sm:px-6">
        KWelch Deal Scout · built for KWelchVisuals · powered by Claude
      </footer>
    </div>
  );
}
