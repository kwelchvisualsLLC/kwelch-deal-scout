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
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="ds-card h-fit p-5">
        <h2 className="mb-1 font-display text-2xl tracking-wide text-gold">OUTREACH PLAN</h2>
        <p className="mb-4 text-sm text-white/50">
          Best channel, contact path & a ready-to-send message — per brand.
        </p>

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
          {loading ? "Building plan…" : out ? "↻ Regenerate plan" : "✦ Build Outreach Plan"}
        </button>
      </div>

      <div className="space-y-4">
        {loading && <div className="ds-card p-5"><Spinner label="Finding the best way in + drafting…" /></div>}
        <ErrorNote>{err}</ErrorNote>

        {out && (
          <>
            {out.bestChannel && (
              <div className="ds-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/40">Best way in</span>
                  </div>
                  {out.channelConfidence != null && (
                    <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[11px] font-bold text-gold">
                      {out.channelConfidence}% reach
                    </span>
                  )}
                </div>
                <div className="mt-1 font-display text-3xl tracking-wide text-gold">{out.bestChannel}</div>
                <p className="mt-1 text-sm text-white/65">{out.channelWhy}</p>
              </div>
            )}

            {out.contacts?.length > 0 && (
              <div className="ds-card p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold">Contact intelligence</h3>
                <div className="space-y-2">
                  {out.contacts.map((c, i) => (
                    <ContactRow key={i} c={c} />
                  ))}
                </div>
                <p className="mt-3 text-[11px] italic text-white/30">
                  Emails marked “verify” are likely patterns — confirm on the brand's site before sending.
                </p>
              </div>
            )}

            <Block title="Subject line" text={out.subject} mono />
            <Block
              title={`Message — ${out.bestChannel === "Email" ? "Email" : "Instagram DM"}`}
              text={out.bestChannel === "Email" ? out.email : out.dm}
              sub={out.bestChannel === "Email" ? undefined : `${(out.dm || "").length} chars`}
              editable
              onChange={(v) => setOut({ ...out, [out.bestChannel === "Email" ? "email" : "dm"]: v })}
            />
            <Block
              title={out.bestChannel === "Email" ? "Backup — Instagram DM" : "Backup — Email"}
              text={out.bestChannel === "Email" ? out.dm : out.email}
              sub={out.bestChannel === "Email" ? `${(out.dm || "").length} chars` : undefined}
              editable
              onChange={(v) => setOut({ ...out, [out.bestChannel === "Email" ? "dm" : "email"]: v })}
            />

            {out.followUp && (
              <div className="ds-card p-4">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-gold">⏱ Follow-up tip</h3>
                <p className="text-sm text-white/75">{out.followUp}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ContactRow({ c }) {
  const type = (c.type || "").toLowerCase();
  let href = null;
  if (type === "email") href = `mailto:${c.value}`;
  else if (type === "instagram") href = `https://instagram.com/${(c.value || "").replace(/^@/, "")}`;
  else if (type === "linkedin") href = `https://www.google.com/search?q=${encodeURIComponent("LinkedIn " + c.value)}`;
  else if (type === "website" || type === "platform") {
    href = /^https?:\/\//.test(c.value) ? c.value : `https://${c.value}`;
  }
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-line bg-panel2 p-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="rounded border border-line px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/50">
            {c.type}
          </span>
          {c.verify && (
            <span className="rounded border border-gold/40 px-1.5 py-0.5 text-[10px] font-semibold text-gold">verify</span>
          )}
        </div>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm font-semibold text-white hover:text-gold">
            {c.value}
          </a>
        ) : (
          <div className="mt-1 truncate text-sm font-semibold text-white">{c.value}</div>
        )}
        {c.note && <div className="text-xs text-white/45">{c.note}</div>}
      </div>
      <CopyButton text={c.value} />
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
