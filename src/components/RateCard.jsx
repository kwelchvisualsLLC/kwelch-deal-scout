import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { KWELCH } from "../lib/brand.js";
import { Spinner, ErrorNote, CopyButton } from "./ui.jsx";

export default function RateCard() {
  const [followers, setFollowers] = useState(KWELCH.followers);
  const [subscribers, setSubscribers] = useState(KWELCH.subscribers);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      setCard(await api.ratecard({ followers, subscribers }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function asText() {
    if (!card) return "";
    const lines = [
      `KWELCHVISUALS — RATE CARD`,
      `${KWELCH.name} · @${KWELCH.instagram} · ${KWELCH.location}`,
      `120k+ Instagram · 50k+ YouTube · The Fader · XXL · New York Times`,
      ``,
      `À LA CARTE`,
      ...card.items.map((i) => `• ${i.service} — $${i.price.toLocaleString()} ${i.unit} (${i.detail})`),
      ``,
      `MONTHLY RETAINERS`,
      ...card.retainers.map((r) => `• ${r.tier} — $${r.price.toLocaleString()}${r.unit} (${r.detail})`),
      ``,
      card.meta.note,
    ];
    return lines.join("\n");
  }

  return (
    <div className="space-y-5">
      <div className="ds-card flex flex-wrap items-end gap-4 p-5">
        <div className="flex-1">
          <h2 className="mb-1 font-display text-2xl tracking-wide text-gold">RATE CARD GENERATOR</h2>
          <p className="text-sm text-white/50">Auto-priced from reach. Recalculates live.</p>
        </div>
        <div>
          <label className="ds-label">IG followers</label>
          <input type="number" className="ds-input w-36" value={followers} onChange={(e) => setFollowers(+e.target.value)} />
        </div>
        <div>
          <label className="ds-label">YT subs</label>
          <input type="number" className="ds-input w-36" value={subscribers} onChange={(e) => setSubscribers(+e.target.value)} />
        </div>
        <button className="ds-btn-ghost" onClick={load}>↻ Recalculate</button>
        {card && <CopyButton text={asText()} label="Copy card" />}
      </div>

      {loading && <div className="ds-card p-5"><Spinner /></div>}
      <ErrorNote>{err}</ErrorNote>

      {card && (
        <div className="ds-card overflow-hidden p-0">
          <div className="border-b border-line bg-panel2 px-6 py-5">
            <div className="font-display text-3xl tracking-wide">
              <span className="text-gold">KWELCH</span>VISUALS
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider text-white/50">
              {KWELCH.name} · @{KWELCH.instagram} · {KWELCH.location}
            </div>
            <div className="mt-0.5 text-[11px] text-white/40">
              120k+ Instagram · 50k+ YouTube · The Fader · XXL · New York Times
            </div>
          </div>

          <div className="px-6 py-5">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gold">À la carte</h3>
            <div className="divide-y divide-line">
              {card.items.map((i, n) => (
                <div key={n} className="flex items-center justify-between gap-4 py-2.5">
                  <div>
                    <div className="font-semibold text-white">{i.service}</div>
                    <div className="text-xs text-white/40">{i.detail}</div>
                  </div>
                  <div className="whitespace-nowrap text-right">
                    <span className="font-display text-2xl text-gold">${i.price.toLocaleString()}</span>
                    <span className="ml-1 text-xs text-white/40">{i.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-gold">Monthly retainers</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {card.retainers.map((r, n) => (
                <div key={n} className="rounded-lg border border-gold/30 bg-panel2 p-4">
                  <div className="text-sm font-semibold text-white">{r.tier}</div>
                  <div className="mt-1 font-display text-3xl text-gold">
                    ${r.price.toLocaleString()}
                    <span className="ml-0.5 text-sm text-white/40">{r.unit}</span>
                  </div>
                  <div className="mt-1 text-xs text-white/50">{r.detail}</div>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[11px] italic text-white/35">{card.meta.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}
