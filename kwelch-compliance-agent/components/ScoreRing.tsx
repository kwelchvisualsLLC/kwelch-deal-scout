'use client';

/** SVG compliance score ring (0-100) in brand colors. */
export function ScoreRing({ score, size = 168 }: { score: number; size?: number }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = c * (1 - clamped / 100);
  const color = clamped >= 85 ? '#27AE60' : clamped >= 60 ? '#F39C12' : '#C0392B';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#1E1E1E"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.8s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="font-mono text-4xl font-bold" style={{ color }}>
          {clamped}
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Compliance</p>
      </div>
    </div>
  );
}
