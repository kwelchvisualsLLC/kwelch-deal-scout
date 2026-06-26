import { useState } from "react";
import { api } from "../lib/api.js";
import { KWELCH } from "../lib/brand.js";
import { Spinner, ErrorNote, Tag } from "./ui.jsx";

export default function ProfileAnalyzer() {
  const [handle, setHandle] = useState(KWELCH.instagram);
  const [followers, setFollowers] = useState(KWELCH.followers);
  const [subscribers, setSubscribers] = useState(KWELCH.subscribers);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [fit, setFit] = useState(null);
  const [igNote, setIgNote] = useState("");

  async function pull() {
    setErr("");
    try {
      const d = await api.instagram(handle);
      if (d.followers) setFollowers(d.followers);
      setIgNote(d.note || (d.source === "live" ? "Live stats pulled from Instagram." : ""));
    } catch (e) {
      setErr(e.message);
    }
  }

  async function analyze() {
    setLoading(true);
    setErr("");
    setFit(null);
    try {
      setFit(await api.profileFit({ handle, followers, subscribers, notes }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="ds-card p-5">
        <h2 className="mb-1 font-display text-2xl tracking-wide text-gold">PROFILE ANALYZER</h2>
        <p className="mb-4 text-sm text-white/50">
          Pull stats, then let Claude map Keith's brand-fit categories.
        </p>

        <label className="ds-label">Instagram handle</label>
        <div className="mb-1 flex gap-2">
          <input className="ds-input" value={handle} onChange={(e) => setHandle(e.target.value)} />
          <button className="ds-btn-ghost shrink-0" onClick={pull}>
            Pull
          </button>
        </div>
        {igNote && <p className="mb-3 text-[11px] text-white/40">{igNote}</p>}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="ds-label">IG followers</label>
            <input
              type="number"
              className="ds-input"
              value={followers}
              onChange={(e) => setFollowers(+e.target.value)}
            />
          </div>
          <div>
            <label className="ds-label">YouTube subs</label>
            <input
              type="number"
              className="ds-input"
              value={subscribers}
              onChange={(e) => setSubscribers(+e.target.value)}
            />
          </div>
        </div>

        <label className="ds-label mt-3">Extra context (optional)</label>
        <textarea
          className="ds-input h-20 resize-none"
          placeholder="e.g. just shot 49ers content, want more sneaker/streetwear deals"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button className="ds-btn mt-4 w-full" onClick={analyze} disabled={loading}>
          {loading ? "Analyzing…" : "✦ Analyze Brand Fit"}
        </button>
      </div>

      <div className="space-y-4">
        {loading && <div className="ds-card p-5"><Spinner label="Claude is reading the profile…" /></div>}
        <ErrorNote>{err}</ErrorNote>

        {fit && (
          <>
            <div className="ds-card p-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-white/40">Strategic read</h3>
              <p className="text-[15px] leading-relaxed text-white/90">{fit.summary}</p>
              {fit.pillars?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {fit.pillars.map((p, i) => (
                    <Tag key={i}>{p}</Tag>
                  ))}
                </div>
              )}
            </div>

            {fit.audience && (
              <div className="ds-card grid gap-4 p-5 sm:grid-cols-3">
                {Object.entries(fit.audience).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gold">{k}</div>
                    <div className="mt-1 text-sm text-white/70">{v}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="ds-card p-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">
                Best-fit brand categories
              </h3>
              <div className="space-y-2.5">
                {fit.fitCategories?.map((c, i) => (
                  <div key={i} className="rounded-lg border border-line bg-panel2 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">{c.name}</span>
                      <span className="text-xs font-bold text-gold">{c.strength}/100</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-gold" style={{ width: `${c.strength}%` }} />
                    </div>
                    <p className="mt-2 text-sm text-white/55">{c.why}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
