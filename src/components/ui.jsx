import { useState } from "react";

export function Spinner({ label = "Working…" }) {
  return (
    <div className="flex items-center gap-3 text-sm text-white/60">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      {label}
    </div>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {children}
    </div>
  );
}

export function HeatBadge({ score }) {
  const s = Number(score) || 0;
  const tone =
    s >= 70 ? "bg-gold/20 text-gold border-gold/40" : s >= 45 ? "bg-goldsoft/10 text-goldsoft border-goldsoft/30" : "bg-white/5 text-white/50 border-line";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${tone}`}>
      🔥 {s}
    </span>
  );
}

export function Tag({ children }) {
  return (
    <span className="rounded-full border border-line bg-panel2 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/60">
      {children}
    </span>
  );
}

export function CopyButton({ text, label = "Copy" }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="ds-btn-ghost px-3 py-1.5 text-xs"
      onClick={async () => {
        await navigator.clipboard.writeText(text || "");
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
    >
      {done ? "✓ Copied" : `⧉ ${label}`}
    </button>
  );
}
