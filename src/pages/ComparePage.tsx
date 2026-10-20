import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useProtocols } from "../hooks/useProtocols";
import { RiskGauge } from "../components/RiskGauge";
import { FactorBar } from "../components/FactorBar";
import { computeComposite, riskLabel, WEIGHTS } from "../data/protocols";
import type { Protocol } from "../data/protocols";

const FACTOR_LABELS: Record<keyof Protocol["scores"], string> = {
  contractControls: "Contract Controls",
  liquidity: "Liquidity & Exits",
  concentration: "Holder Concentration",
  governance: "Governance",
  history: "Protocol History",
};

function ProtocolSelector({ protocols, value, onChange, label }: {
  protocols: Protocol[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] text-[var(--subtle)] uppercase tracking-wider font-semibold">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-white/5 border border-white/12 rounded-xl px-3 py-2.5 text-sm text-[var(--ink-2)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors appearance-none cursor-pointer"
      >
        {protocols.map(p => (
          <option key={p.id} value={p.id} className="bg-[#0d1b2f]">{p.name}</option>
        ))}
      </select>
    </div>
  );
}

function ProtocolColumn({ protocol }: { protocol: Protocol }) {
  const composite = computeComposite(protocol.scores);
  const { label, color } = riskLabel(composite);
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col items-center gap-3">
        <RiskGauge score={composite} size="lg" />
        <div className="text-center">
          <h3 className="display font-bold text-[var(--ink)] text-base tracking-tight">{protocol.name}</h3>
          <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] text-[var(--subtle)]">{protocol.category}</span>
            <span className="text-[var(--subtle)]/40 text-[10px]">·</span>
            <span className="text-[10px] text-[var(--subtle)]">{protocol.chain}</span>
            <span className="text-[var(--subtle)]/40 text-[10px]">·</span>
            <span className="text-[10px] tabular-nums text-[var(--muted)]">{protocol.tvl}</span>
          </div>
          <span className="text-xs font-bold mt-2 inline-block" style={{ color }}>{label}</span>
        </div>
      </div>

      {/* Scores */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-4 flex flex-col gap-3">
        <span className="text-[10px] text-[var(--subtle)] uppercase tracking-wider font-semibold">Risk factors</span>
        {(Object.entries(protocol.scores) as [keyof Protocol["scores"], number][]).map(([key, val]) => (
          <FactorBar key={key} label={FACTOR_LABELS[key]} score={val} weight={WEIGHTS[key]} />
        ))}
      </div>

      {/* Warnings */}
      {protocol.warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {protocol.warnings.map((w, i) => (
            <div key={i} className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/6 px-3 py-2.5">
              <p className="text-xs text-[var(--muted)] text-pretty">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Composite", value: `${composite}` },
          { label: "Evidence", value: `${protocol.evidence.length} items` },
          { label: "TVL", value: protocol.tvl },
          { label: "Last checked", value: protocol.lastChecked },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/8 bg-white/4 px-3 py-2.5">
            <div className="text-[9px] text-[var(--subtle)] uppercase tracking-widest font-semibold">{s.label}</div>
            <div className="text-sm font-bold text-[var(--ink-2)] tabular-nums leading-tight mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const navigate = useNavigate();
  const { protocols, loading, refresh } = useProtocols();

  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  // Default to first two protocols when loaded
  const leftProtocol = protocols.find(p => p.id === leftId) ?? protocols[0];
  const rightProtocol = protocols.find(p => p.id === rightId) ?? protocols[1];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { void navigate("/dashboard"); }}
              className="flex items-center gap-1.5 text-xs text-[var(--subtle)] hover:text-[var(--muted)] transition-colors"
            >
              <ArrowLeft size={13} /> Dashboard
            </button>
            <span className="text-[var(--subtle)]/40">/</span>
            <h1 className="display font-bold text-[var(--ink)] text-lg tracking-tight">Protocol Comparison</h1>
          </div>
          <button
            onClick={() => { void refresh(); }}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-40 transition-opacity"
          >
            <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Selectors */}
        {protocols.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <ProtocolSelector
              protocols={protocols}
              value={leftProtocol?.id ?? ""}
              onChange={setLeftId}
              label="Protocol A"
            />
            <ProtocolSelector
              protocols={protocols}
              value={rightProtocol?.id ?? ""}
              onChange={setRightId}
              label="Protocol B"
            />
          </div>
        )}

        {/* Comparison columns */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map(i => (
              <div key={i} className="flex flex-col gap-4">
                <div className="skeleton h-48 rounded-2xl" />
                <div className="skeleton h-40 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : leftProtocol && rightProtocol ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ProtocolColumn protocol={leftProtocol} />
            <ProtocolColumn protocol={rightProtocol} />
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
