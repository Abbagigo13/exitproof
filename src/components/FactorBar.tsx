type Props = {
  label: string;
  score: number;
  weight: number;
};

function barColor(score: number) {
  if (score < 25) return "bg-[var(--success)]";
  if (score < 45) return "bg-yellow-400";
  if (score < 70) return "bg-orange-400";
  return "bg-[var(--danger)]";
}

export function FactorBar({ label, score, weight }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-[var(--muted)] font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[var(--subtle)] tabular-nums">
            w={Math.round(weight * 100)}%
          </span>
          <span className="tabular-nums font-semibold text-[var(--ink-2)]">
            {score}
          </span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
