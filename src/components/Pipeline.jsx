import { useState } from "react";
import { PIPELINE_STAGES } from "../lib/brand.js";
import { savePipeline } from "../lib/storage.js";

function money(s) {
  const n = Number(String(s).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export default function Pipeline({ items, setItems }) {
  const [drag, setDrag] = useState(null);
  const [openId, setOpenId] = useState(null);

  function update(id, patch) {
    const next = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    setItems(next);
    savePipeline(next);
  }
  function remove(id) {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    savePipeline(next);
  }
  function drop(stage) {
    if (drag) update(drag, { stage });
    setDrag(null);
  }

  const active = items.filter((i) => !["Closed", "Passed"].includes(i.stage));
  const closedThisMonth = items.filter(
    (i) => i.stage === "Closed" && (i.added || "").slice(0, 7) === new Date().toISOString().slice(0, 7)
  );
  const pipelineValue = active.reduce((s, i) => s + money(i.amount), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Pipeline Value" value={`$${pipelineValue.toLocaleString()}`} />
        <Stat label="Active Leads" value={active.length} />
        <Stat label="Closed (mo.)" value={closedThisMonth.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {PIPELINE_STAGES.map((stage) => {
          const col = items.filter((i) => i.stage === stage);
          return (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(stage)}
              className="rounded-xl border border-line bg-panel/60 p-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/60">{stage}</h3>
                <span className="rounded-full border border-line px-2 text-[11px] text-white/50">{col.length}</span>
              </div>
              <div className="space-y-2">
                {col.map((i) => (
                  <div
                    key={i.id}
                    draggable
                    onDragStart={() => setDrag(i.id)}
                    className="cursor-grab rounded-lg border border-line bg-panel2 p-3 active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-white">{i.brand}</span>
                      <button className="text-white/30 hover:text-red-400" onClick={() => remove(i.id)}>
                        ✕
                      </button>
                    </div>
                    {i.amount && <div className="mt-0.5 text-xs font-semibold text-gold">{i.amount}</div>}
                    <button
                      className="mt-1 text-[11px] text-white/40 hover:text-gold"
                      onClick={() => setOpenId(openId === i.id ? null : i.id)}
                    >
                      {openId === i.id ? "− details" : "+ details"}
                    </button>
                    {openId === i.id && (
                      <div className="mt-2 space-y-2">
                        <input
                          className="ds-input py-1.5 text-xs"
                          placeholder="Contact (email/IG)"
                          value={i.contact}
                          onChange={(e) => update(i.id, { contact: e.target.value })}
                        />
                        <input
                          className="ds-input py-1.5 text-xs"
                          placeholder="$ amount"
                          value={i.amount}
                          onChange={(e) => update(i.id, { amount: e.target.value })}
                        />
                        <input
                          className="ds-input py-1.5 text-xs"
                          placeholder="Deal type"
                          value={i.dealType}
                          onChange={(e) => update(i.id, { dealType: e.target.value })}
                        />
                        <textarea
                          className="ds-input h-16 resize-none py-1.5 text-xs"
                          placeholder="Notes"
                          value={i.notes}
                          onChange={(e) => update(i.id, { notes: e.target.value })}
                        />
                        <div className="text-[10px] text-white/30">added {i.added}</div>
                      </div>
                    )}
                  </div>
                ))}
                {col.length === 0 && <p className="py-4 text-center text-[11px] text-white/20">drop here</p>}
              </div>
            </div>
          );
        })}
      </div>
      {items.length === 0 && (
        <p className="py-8 text-center text-sm text-white/40">
          No leads yet. Add brands from <span className="text-gold">Discover</span> or{" "}
          <span className="text-gold">Fresh Leads</span>.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="ds-card p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 font-display text-3xl text-gold">{value}</div>
    </div>
  );
}
