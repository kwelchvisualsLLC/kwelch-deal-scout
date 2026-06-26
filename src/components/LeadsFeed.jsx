import { useState } from "react";
import { api } from "../lib/api.js";
import { CATEGORIES } from "../lib/brand.js";
import { addLead } from "../lib/storage.js";
import { Spinner, ErrorNote } from "./ui.jsx";

export default function LeadsFeed({ onPipelineChange }) {
  const [category, setCategory] = useState("Sports");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [leads, setLeads] = useState([]);
  const [added, setAdded] = useState({});

  async function run() {
    setLoading(true);
    setErr("");
    setLeads([]);
    try {
      const d = await api.leads({ category });
      setLeads(d.leads || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  function add(l) {
    onPipelineChange(addLead({ brand: l.brand, dealType: l.campaignType, amount: l.budgetRange, notes: `${l.campaignType} · submit: ${l.submitWhere}` }));
    setAdded((p) => ({ ...p, [l.brand]: true }));
  }

  return (
    <div className="space-y-6">
      <div className="ds-card flex flex-wrap items-end gap-4 p-5">
        <div className="flex-1">
          <h2 className="mb-1 font-display text-2xl tracking-wide text-gold">FRESH LEADS FEED</h2>
          <p className="text-sm text-white/50">AI-sourced brands plausibly running creator campaigns now.</p>
        </div>
        <div>
          <label className="ds-label">Category</label>
          <select className="ds-input w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button className="ds-btn" onClick={run} disabled={loading}>
          {loading ? "Finding…" : "✦ Find 10 Leads"}
        </button>
      </div>

      {loading && <div className="ds-card p-5"><Spinner label="Sourcing fresh campaigns…" /></div>}
      <ErrorNote>{err}</ErrorNote>

      <div className="space-y-3">
        {leads.map((l, i) => (
          <div key={i} className="ds-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{l.brand}</h3>
                {l.urgent && (
                  <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">
                    ⚡ Urgent
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-white/65">{l.campaignType}</p>
              <p className="mt-0.5 text-xs text-white/40">Submit: {l.submitWhere}</p>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gold">{l.budgetRange}</div>
            </div>
            <button
              className="ds-btn shrink-0 py-2 text-xs"
              onClick={() => add(l)}
              disabled={added[l.brand]}
            >
              {added[l.brand] ? "✓ Added" : "+ Add to Pipeline"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
