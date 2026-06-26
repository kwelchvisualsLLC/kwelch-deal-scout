import { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { DEAL_TYPES } from "../lib/brand.js";
import { Spinner, ErrorNote, CopyButton } from "./ui.jsx";

export default function Outreach({ seed }) {
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [dealType, setDealType] = useState("Sponsored post");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [out, setOut] = useState(null);

  // Prefill when the user clicks "Outreach" on a discovery card.
  useEffect(() => {
    if (seed) {
      setBrand(seed.name || "");
      setCategory(seed.category || "");
      setNote(seed.why || "");
      setOut(null);
    }
  }, [seed]);

  async function generate() {
    if (!brand.trim()) return setErr("Enter a brand name first.");
    setLoading(true);
    setErr("");
    try {
      setOut(await api.outreach({ brand, category, dealType, note }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="ds-card p-5">
        <h2 className="mb-1 font-display text-2xl tracking-wide text-gold">OUTREACH GENERATOR</h2>
        <p className="mb-4 text-sm text-white/50">Custom cold DM + email in Keith's voice.</p>

        <label className="ds-label">Brand</label>
        <input className="ds-input mb-3" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Oakland Roots SC" />

        <label className="ds-label">Category (optional)</label>
        <input className="ds-input mb-3" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Sports" />

        <label className="ds-label">Deal type to pitch</label>
        <select className="ds-input mb-3" value={dealType} onChange={(e) => setDealType(e.target.value)}>
          {DEAL_TYPES.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <label className="ds-label">Angle / hook (optional)</label>
        <textarea
          className="ds-input h-20 resize-none"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. I already shoot at their matches / mutual connection"
        />

        <button className="ds-btn mt-4 w-full" onClick={generate} disabled={loading}>
          {loading ? "Writing…" : out ? "↻ Regenerate" : "✦ Generate Outreach"}
        </button>
      </div>

      <div className="space-y-4">
        {loading && <div className="ds-card p-5"><Spinner label="Drafting in Keith's voice…" /></div>}
        <ErrorNote>{err}</ErrorNote>

        {out && (
          <>
            <Block title="Subject line" text={out.subject} mono />
            <Block title="Instagram DM" text={out.dm} sub={`${(out.dm || "").length} chars`} editable onChange={(v) => setOut({ ...out, dm: v })} />
            <Block title="Email" text={out.email} editable onChange={(v) => setOut({ ...out, email: v })} />
          </>
        )}
      </div>
    </div>
  );
}

function Block({ title, text, sub, mono, editable, onChange }) {
  return (
    <div className="ds-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gold">{title}</h3>
          {sub && <span className="text-[11px] text-white/40">{sub}</span>}
        </div>
        <CopyButton text={text} />
      </div>
      {editable ? (
        <textarea
          className="ds-input min-h-[96px] resize-y leading-relaxed"
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p className={`text-white/90 ${mono ? "font-mono text-sm" : ""}`}>{text}</p>
      )}
    </div>
  );
}
