import { useState } from "react";
import { api } from "../lib/api.js";
import { CATEGORIES, MIN_DEALS, DEAL_TYPES, GEOGRAPHIES } from "../lib/brand.js";
import { addLead } from "../lib/storage.js";
import { Spinner, ErrorNote, HeatBadge } from "./ui.jsx";

export default function Discovery({ onPipelineChange, onOutreach }) {
  const [cats, setCats] = useState(["Sports", "Music"]);
  const [minDeal, setMinDeal] = useState("$1,000");
  const [dealType, setDealType] = useState("Sponsored post");
  const [geography, setGeography] = useState("Both");
  const [sort, setSort] = useState("heat");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [brands, setBrands] = useState([]);
  const [added, setAdded] = useState({});

  const toggleCat = (c) =>
    setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  async function run() {
    setLoading(true);
    setErr("");
    setBrands([]);
    try {
      const d = await api.discover({ categories: cats, minDeal, dealType, geography });
      setBrands(d.brands || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const sorted = [...brands].sort((a, b) => {
    if (sort === "heat") return (b.heatScore || 0) - (a.heatScore || 0);
    if (sort === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  function add(b) {
    onPipelineChange(addLead({ brand: b.name, dealType, notes: b.why, amount: b.dealRange }));
    setAdded((p) => ({ ...p, [b.name]: true }));
  }

  return (
    <div className="space-y-6">
      <div className="ds-card p-5">
        <h2 className="mb-4 font-display text-2xl tracking-wide text-gold">DEAL DISCOVERY ENGINE</h2>

        <label className="ds-label">Content categories</label>
        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <span
              key={c}
              onClick={() => toggleCat(c)}
              className={`ds-chip ${
                cats.includes(c) ? "border-gold bg-gold/15 text-gold" : "border-line text-white/50"
              }`}
            >
              {c}
            </span>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="ds-label">Min deal value</label>
            <select className="ds-input" value={minDeal} onChange={(e) => setMinDeal(e.target.value)}>
              {MIN_DEALS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="ds-label">Deal type</label>
            <select className="ds-input" value={dealType} onChange={(e) => setDealType(e.target.value)}>
              {DEAL_TYPES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="ds-label">Geography</label>
            <select className="ds-input" value={geography} onChange={(e) => setGeography(e.target.value)}>
              {GEOGRAPHIES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <button className="ds-btn mt-4" onClick={run} disabled={loading}>
          {loading ? "Scouting…" : "✦ Find Brand Targets"}
        </button>
      </div>

      {loading && <div className="ds-card p-5"><Spinner label="Claude is sourcing realistic brand targets…" /></div>}
      <ErrorNote>{err}</ErrorNote>

      {brands.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">{brands.length} targets</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/40">Sort</span>
            <select className="ds-input w-auto py-1.5" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="heat">Heat score</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((b, i) => (
          <div key={i} className="ds-card flex flex-col p-4">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold leading-tight text-white">{b.name}</h3>
              <HeatBadge score={b.heatScore} />
            </div>
            <div className="mb-2 flex flex-wrap gap-1.5 text-[11px] uppercase tracking-wide">
              <span className="rounded border border-line px-1.5 py-0.5 text-white/50">{b.category}</span>
              {b.local && <span className="rounded border border-gold/40 px-1.5 py-0.5 text-gold">Local</span>}
            </div>
            <p className="text-sm text-white/65">{b.why}</p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Est. deal</span>
                <span className="font-semibold text-gold">{b.dealRange}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-white/40">Content</span>
                <span className="text-right text-white/70">{b.contentType}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="ds-btn flex-1 py-2 text-xs"
                onClick={() => add(b)}
                disabled={added[b.name]}
              >
                {added[b.name] ? "✓ In Pipeline" : "+ Pipeline"}
              </button>
              <button className="ds-btn-ghost py-2 text-xs" onClick={() => onOutreach(b)}>
                ✉ Outreach
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
