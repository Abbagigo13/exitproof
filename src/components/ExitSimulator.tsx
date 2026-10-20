import { useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { simulateExit, parseTvl, PRESET_AMOUNTS } from "../lib/exitSimulator";
import type { Protocol } from "../data/protocols";

type Props = {
  protocol: Protocol;
};

const exitabilityConfig = {
  easy: { label: "Easy exit", color: "text-[var(--success)]", bg: "bg-[var(--success)]/10", border: "border-[var(--success)]/30" },
  moderate: { label: "Moderate friction", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  difficult: { label: "Difficult exit", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30" },
  critical: { label: "Critical — exit may fail", color: "text-[var(--danger)]", bg: "bg-[var(--danger)]/10", border: "border-[var(--danger)]/30" },
};

export function ExitSimulator({ protocol }: Props) {
  const tvlNum = parseTvl(protocol.tvl);
  const [amount, setAmount] = useState(10_000);
  const [customRaw, setCustomRaw] = useState("");

  const result = simulateExit(amount, tvlNum, protocol.scores.liquidity);
  const cfg = exitabilityConfig[result.exitability];

  function formatUsd(n: number) {
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n}`;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Amount selector */}
      <div>
        <label className="block text-xs text-[var(--muted)] font-medium mb-2 uppercase tracking-wider">
          Exit amount
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_AMOUNTS.map(p => (
            <button
              key={p}
              onClick={() => { setAmount(p); setCustomRaw(""); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                amount === p && customRaw === ""
                  ? "bg-[var(--accent)]/20 border-[var(--accent)]/60 text-[var(--accent)]"
                  : "bg-white/5 border-white/10 text-[var(--muted)] hover:border-white/25"
              }`}
            >
              {formatUsd(p)}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[var(--muted)] text-sm">$</span>
          <input
            type="number"
            min={1}
            placeholder="Custom amount"
            value={customRaw}
            onChange={e => {
              setCustomRaw(e.target.value);
              const n = parseFloat(e.target.value);
              if (!isNaN(n) && n > 0) setAmount(n);
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[var(--ink)] w-40 focus:outline-none focus:border-[var(--accent)]/50 tabular-nums"
          />
        </div>
      </div>

      {/* Result card */}
      <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
          <span className={`text-2xl font-bold tabular-nums ${cfg.color} display`}>
            ~{result.priceImpact}%
            <span className="text-sm font-medium ml-1">impact</span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Exit size" value={formatUsd(amount)} />
          <Metric label="Pool share" value={`${result.liquidityRatio}%`} />
          <Metric label="Est. slippage" value={`~${result.slippage}%`} />
        </div>
      </div>

      {/* Assumptions */}
      <div className="rounded-xl border border-white/8 bg-white/3 p-3">
        <div className="flex items-center gap-1.5 text-xs text-[var(--subtle)] font-semibold uppercase tracking-wider mb-2">
          <Info size={12} />
          Assumptions
        </div>
        <ul className="space-y-1">
          {result.assumptions.map(a => (
            <li key={a} className="text-xs text-[var(--muted)]">
              {a}
            </li>
          ))}
        </ul>
      </div>

      {/* Cannot verify */}
      <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3">
        <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-semibold uppercase tracking-wider mb-2">
          <AlertTriangle size={12} />
          Cannot verify
        </div>
        <ul className="space-y-1">
          {result.cannotVerify.map(c => (
            <li key={c} className="text-xs text-[var(--muted)]">
              {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-[var(--subtle)] uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className="text-sm font-semibold tabular-nums text-[var(--ink-2)]">
        {value}
      </div>
    </div>
  );
}
