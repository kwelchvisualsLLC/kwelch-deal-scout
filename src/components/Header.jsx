import { KWELCH } from "../lib/brand.js";

const TABS = [
  ["analyzer", "Profile"],
  ["discover", "Discover"],
  ["outreach", "Outreach"],
  ["pipeline", "Pipeline"],
  ["leads", "Fresh Leads"],
  ["ratecard", "Rate Card"],
];

export default function Header({ tab, setTab, onSettings }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-black/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl leading-none tracking-wide text-gold">
              KWELCH
            </span>
            <span className="font-display text-3xl leading-none tracking-wide text-white">
              DEAL SCOUT
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-[11px] uppercase tracking-wider text-white/40 sm:block">
              {KWELCH.brand} · {KWELCH.location}
              <br />
              120k IG · 50k YT · The Fader · XXL · NYT
            </div>
            <button
              onClick={onSettings}
              title="Settings / API key"
              className="rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-white/70 transition hover:border-gold/60 hover:text-gold"
            >
              ⚙
            </button>
          </div>
        </div>
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`whitespace-nowrap rounded-t-lg px-3.5 py-2 text-sm font-semibold transition ${
                tab === k
                  ? "bg-panel text-gold shadow-[inset_0_-2px_0_0_#D4AF37]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
