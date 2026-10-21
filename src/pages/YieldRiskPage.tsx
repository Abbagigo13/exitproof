/**
 * YieldRiskPage — USDC Yield Risk Dashboard
 *
 * Ranks all protocols by a risk-adjusted USDC yield estimate.
 * Yield estimate = category-baseline APY × (1 - riskScore/100) × tvl-multiplier
 * Expressed entirely in USDC terms — no token price conversions needed.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useProtocols } from "../hooks/useProtocols";
import { computeComposite, riskLabel } from "../data/protocols";
import type { Protocol } from "../data/protocols";

// Category-baseline gross APY estimates (USDC, annualised)
// These are illustrative mid-market figures; not a yield guarantee.
const CATEGORY_APY: Record<string, number> = {
  "Lending":          8.5,
  "Liquid Staking":   5.2,
  "Dexes":            6.0,
  "DEX":              6.0,
  "CDP":              7.0,
  "Bridge":           3.5,
  "Yield":           12.0,
  "Yield Aggregator":12.0,
  "Derivatives":     10.0,
  "Staking Pool":     5.5,
  "Options":         14.0,
  "Insurance":        4.0,
  "Indexes":          4.5,
  "Risk Curators":    6.5,
  "Onchain Capital Allocator": 9.0,
  "RWA":              5.8,
  "Cross Chain":      4.0,
  "Payments":         2.0,
  "Privacy":          3.0,
  "NFT":              8.0,
};

function baseApy(category: string): number {
  return CATEGORY_APY[category] ?? 5.0;
}

function parseTvl(tvl: string): number {
  const n = parseFloat(tvl.replace(/[$,]/g, ""));
  if (tvl.includes("B")) return n * 1_000_000_000;
  if (tvl.includes("M")) return n * 1_000_000;
  if (tvl.includes("K")) return n * 1_000;
  return n;
}

/** Risk-adjusted yield: gross APY de-rated by composite risk score */
function riskAdjustedYield(p: Protocol): number {
  const score = computeComposite(p.scores);
  const gross = baseApy(p.category);
  // De-rate linearly: score 0 → full yield, score 100 → 0%
  return parseFloat((gross * (1 - score / 100)).toFixed(2));
}

/** Yield-to-risk ratio: higher = better bang for the risk you take */
function yieldRiskRatio(p: Protocol): number {
  const score = computeComposite(p.scores);
  if (score === 0) return Infinity;
  return parseFloat((riskAdjustedYield(p) / score * 100).toFixed(2));
}

type SortKey = "yield" | "ratio" | "risk" | "tvl" | "name";
const SORT_OPTS: { id: SortKey; label: string }[] = [
  { id: "yield", label: "Adj. Yield ↓" },
  { id: "ratio", label: "Yield/Risk ↓" },
  { id: "risk", label: "Risk ↑ (safest)" },
  { id: "tvl", label: "TVL ↓" },
  { id: "name", label: "Name A–Z" },
];

function RiskPill({ score }: { score: number }) {
  const { label } = riskLabel(score);
  if (score < 25) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25 shrink-0">{label}</span>;
  if (score < 45) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 border border-yellow-400/25 shrink-0">{label}</span>;
  if (score < 70) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-400/15 text-orange-400 border border-orange-400/25 shrink-0">{label}</span>;
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/25 shrink-0">{label}</span>;
}

function YieldBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const hue = Math.round(120 * (1 - value / Math.max(max, 1)));
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: `hsl(${hue},70%,55%)` }}
        />
      </div>
      <span className="tabular-nums text-xs font-bold text-[var(--ink-2)]">
        {value > 0 ? `${value.toFixed(2)}%` : "—"}
      </span>
    </div>
  );
}

export default function YieldRiskPage() {
  const navigate = useNavigate();
  const { protocols, loading } = useProtocols();
  const [sort, setSort] = useState<SortKey>("yield");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showInfo, setShowInfo] = useState(false);

  const categories = useMemo(() => {
    const cats = [...new Set(protocols.map(p => p.category))].sort();
    return ["All", ...cats];
  }, [protocols]);

  const ranked = useMemo(() => {
    let list = categoryFilter === "All"
      ? protocols
      : protocols.filter(p => p.category === categoryFilter);

    return [...list].sort((a, b) => {
      if (sort === "yield") return riskAdjustedYield(b) - riskAdjustedYield(a);
      if (sort === "ratio") return yieldRiskRatio(b) - yieldRiskRatio(a);
      if (sort === "risk") return computeComposite(a.scores) - computeComposite(b.scores);
      if (sort === "tvl") return parseTvl(b.tvl) - parseTvl(a.tvl);
      return a.name.localeCompare(b.name);
    });
  }, [protocols, sort, categoryFilter]);

  const maxYield = useMemo(() => Math.max(...ranked.map(riskAdjustedYield), 1), [ranked]);

  const topThree = ranked.slice(0, 3);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => { void navigate("/dashboard"); }}
            className="flex items-center gap-1.5 text-xs text-[var(--subtle)] hover:text-[var(--muted)] transition-colors shrink-0"
          >
            <ArrowLeft size={13} /> Dashboard
          </button>
          <span className="text-[var(--subtle)]/40">/</span>
          <h1 className="display font-bold text-[var(--ink)] text-lg tracking-tight">USDC Yield Risk</h1>
          <span className="text-[10px] text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2 py-0.5 rounded-full">
            All in USDC · No token prices
          </span>
        </div>

        {/* Hero explainer */}
        <div className="rounded-2xl border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/8 to-transparent p-5 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-[var(--accent)]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="display font-semibold text-[var(--ink-2)] text-sm">Risk-adjusted USDC yield</h2>
              <button
                onClick={() => setShowInfo(i => !i)}
                className="text-[var(--subtle)] hover:text-[var(--muted)] transition-colors"
              >
                <Info size={13} />
              </button>
            </div>
            {showInfo ? (
              <div className="text-xs text-[var(--muted)] leading-relaxed space-y-1">
                <p><span className="font-semibold text-[var(--ink-2)]">Adj. Yield</span> = Category baseline APY × (1 − RiskScore/100). A riskier protocol gets a lower adjusted yield for the same gross rate.</p>
                <p><span className="font-semibold text-[var(--ink-2)]">Yield/Risk Ratio</span> = Adj. Yield ÷ RiskScore × 100. Higher = more yield per unit of risk you accept.</p>
                <p className="text-[var(--danger)]/80">Illustrative only — not a yield guarantee or financial advice.</p>
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)] text-pretty">
                Ranks {protocols.length} protocols by risk-adjusted USDC yield. All figures are in USDC percentage terms — no token volatility, no ETH gas conversion.
                The safest way to earn on Arc is to maximise yield per unit of risk.
              </p>
            )}
          </div>
        </div>

        {/* Top 3 podium */}
        {!loading && topThree.length > 0 && (
          <div>
            <p className="text-[10px] text-[var(--subtle)] uppercase tracking-wider font-semibold mb-3">
              Top picks by risk-adjusted yield
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topThree.map((p, i) => {
                const score = computeComposite(p.scores);
                const adjYield = riskAdjustedYield(p);
                const ratio = yieldRiskRatio(p);
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/6 p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-lg leading-none">{medals[i]}</span>
                      <RiskPill score={score} />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--ink)] text-sm leading-tight">{p.name}</p>
                      <p className="text-[10px] text-[var(--subtle)] mt-0.5">{p.category} · {p.tvl}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[var(--subtle)]">Adj. yield</span>
                        <span className="font-bold text-[var(--success)] tabular-nums">{adjYield.toFixed(2)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[var(--subtle)]">Yield/Risk</span>
                        <span className="font-semibold text-[var(--accent)] tabular-nums">{ratio.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <SlidersHorizontal size={11} className="text-[var(--subtle)]" />
            <span className="text-[10px] text-[var(--subtle)]">Sort:</span>
          </div>
          {SORT_OPTS.map(o => (
            <button
              key={o.id}
              onClick={() => setSort(o.id)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                sort === o.id
                  ? "bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]"
                  : "bg-white/4 border-white/8 text-[var(--subtle)] hover:border-white/20"
              }`}
            >
              {o.label}
            </button>
          ))}

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="ml-auto bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-[var(--ink-2)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors appearance-none cursor-pointer"
          >
            {categories.map(c => (
              <option key={c} value={c} className="bg-[#0d1b2f]">{c}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/8 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 border-b border-white/8 bg-white/3 text-[9px] text-[var(--subtle)] uppercase tracking-wider font-semibold">
            <span>Protocol</span>
            <span className="text-right">Gross APY</span>
            <span className="text-right">Adj. Yield</span>
            <span className="text-right">Yield/Risk</span>
            <span className="text-right">Risk</span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-12 w-full rounded-none border-b border-white/4" />
              ))}
            </div>
          ) : (
            <div className="max-h-[520px] overflow-y-auto scrollbar-none">
              {ranked.map((p, idx) => {
                const score = computeComposite(p.scores);
                const adjYield = riskAdjustedYield(p);
                const ratio = yieldRiskRatio(p);
                const gross = baseApy(p.category);
                const isTop = idx < 3;
                return (
                  <div
                    key={p.id}
                    className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 items-center px-4 py-3 border-b border-white/4 hover:bg-white/3 transition-colors ${
                      isTop ? "bg-[var(--accent)]/4" : ""
                    }`}
                  >
                    {/* Protocol name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-[var(--subtle)] w-5 tabular-nums shrink-0">{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--ink-2)] truncate">{p.name}</p>
                        <p className="text-[10px] text-[var(--subtle)] truncate">{p.category} · {p.tvl}</p>
                      </div>
                    </div>

                    {/* Gross APY */}
                    <div className="flex justify-end">
                      <span className="text-xs text-[var(--muted)] tabular-nums">{gross.toFixed(1)}%</span>
                    </div>

                    {/* Adj. yield bar */}
                    <div className="flex justify-end">
                      <YieldBar value={adjYield} max={maxYield} />
                    </div>

                    {/* Yield/Risk */}
                    <div className="flex justify-end">
                      <span className="text-xs font-medium tabular-nums text-[var(--accent)]">
                        {ratio === Infinity ? "∞" : ratio.toFixed(2)}
                      </span>
                    </div>

                    {/* Risk */}
                    <div className="flex justify-end">
                      <RiskPill score={score} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ascending/descending legend */}
        <div className="flex items-center gap-4 text-[10px] text-[var(--subtle)]">
          <div className="flex items-center gap-1"><ChevronDown size={10} /> Higher adj. yield = better risk-adjusted return</div>
          <div className="flex items-center gap-1"><ChevronUp size={10} /> Lower risk score = safer protocol</div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-[var(--subtle)] text-center pb-2">
          Yield estimates are illustrative category baselines, not guaranteed returns. Not financial advice.
          Risk scores are algorithmic — ExitProof is not a security audit.
        </p>
      </div>
    </AppShell>
  );
}
