import { useState, useMemo } from "react";
import { Search, X, ChevronUp, ChevronDown as ChevronDownIcon, SlidersHorizontal } from "lucide-react";
import { computeComposite, riskLabel } from "../data/protocols";
import type { Protocol } from "../data/protocols";
import { RiskGauge } from "./RiskGauge";

type SortKey = "tvl" | "risk-asc" | "risk-desc" | "name";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "risk-desc", label: "Risk: Highest" },
  { id: "risk-asc", label: "Risk: Lowest" },
  { id: "tvl", label: "TVL: Highest" },
  { id: "name", label: "Name A–Z" },
];

function parseTvl(tvl: string): number {
  const n = parseFloat(tvl.replace(/[$,]/g, ""));
  if (tvl.includes("B")) return n * 1_000_000_000;
  if (tvl.includes("M")) return n * 1_000_000;
  if (tvl.includes("K")) return n * 1_000;
  return n;
}

type Props = {
  protocols: Protocol[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ProtocolBrowser({ protocols, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [chainFilter, setChainFilter] = useState<string>("All");
  const [riskFilter, setRiskFilter] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("tvl");
  const [showFilters, setShowFilters] = useState(false);

  // Derived filter options from protocol list
  const categories = useMemo(() => {
    const cats = [...new Set(protocols.map(p => p.category))].sort();
    return ["All", ...cats];
  }, [protocols]);

  const chains = useMemo(() => {
    const cs = [...new Set(protocols.map(p => p.chain))].sort();
    return ["All", ...cs];
  }, [protocols]);

  const riskBands = ["All", "Lower", "Moderate", "Elevated", "High"];

  function riskBand(score: number): string {
    if (score < 25) return "Lower";
    if (score < 45) return "Moderate";
    if (score < 70) return "Elevated";
    return "High";
  }

  const filtered = useMemo(() => {
    let out = protocols;
    const q = search.trim().toLowerCase();
    if (q) out = out.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.chain.toLowerCase().includes(q));
    if (categoryFilter !== "All") out = out.filter(p => p.category === categoryFilter);
    if (chainFilter !== "All") out = out.filter(p => p.chain === chainFilter);
    if (riskFilter !== "All") out = out.filter(p => riskBand(computeComposite(p.scores)) === riskFilter);

    return [...out].sort((a, b) => {
      const ca = computeComposite(a.scores);
      const cb = computeComposite(b.scores);
      if (sort === "risk-desc") return cb - ca;
      if (sort === "risk-asc") return ca - cb;
      if (sort === "tvl") return parseTvl(b.tvl) - parseTvl(a.tvl);
      return a.name.localeCompare(b.name);
    });
  }, [protocols, search, categoryFilter, chainFilter, riskFilter, sort]);

  const activeFilters = [categoryFilter, chainFilter, riskFilter].filter(f => f !== "All").length;

  return (
    <div className="flex flex-col gap-3">
      {/* Search + filter toggle row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--subtle)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search protocols…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-8 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--subtle)] hover:text-[var(--muted)]"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all shrink-0 ${
            showFilters || activeFilters > 0
              ? "bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]"
              : "bg-white/5 border-white/10 text-[var(--subtle)] hover:border-white/20"
          }`}
        >
          <SlidersHorizontal size={13} />
          Filters
          {activeFilters > 0 && (
            <span className="bg-[var(--accent)] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filter panels */}
      {showFilters && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-3 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FilterSelect label="Category" value={categoryFilter} options={categories} onChange={setCategoryFilter} />
            <FilterSelect label="Chain" value={chainFilter} options={chains} onChange={setChainFilter} />
            <FilterSelect label="Risk level" value={riskFilter} options={riskBands} onChange={setRiskFilter} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              {SORT_OPTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSort(s.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    sort === s.id
                      ? "bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]"
                      : "bg-white/4 border-white/8 text-[var(--subtle)] hover:border-white/20"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {activeFilters > 0 && (
              <button
                onClick={() => { setCategoryFilter("All"); setChainFilter("All"); setRiskFilter("All"); }}
                className="text-[11px] text-[var(--danger)] hover:text-[var(--danger)]/80 flex items-center gap-1"
              >
                <X size={10} /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-[var(--subtle)]">
          {filtered.length} of {protocols.length} protocols
        </span>
        <SortIndicator sort={sort} />
      </div>

      {/* Protocol card grid */}
      <div className="max-h-[680px] overflow-y-auto scrollbar-none pr-0.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Search size={18} className="text-[var(--subtle)]" />
            </div>
            <p className="text-sm text-[var(--subtle)]">No protocols match your filters.</p>
            <button
              onClick={() => { setCategoryFilter("All"); setChainFilter("All"); setRiskFilter("All"); setSearch(""); }}
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(p => {
              const score = computeComposite(p.scores);
              const { color } = riskLabel(score);
              const isActive = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className={`flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all hover:border-white/25 active:scale-[0.98] overflow-hidden relative ${
                    isActive
                      ? "bg-[var(--accent)]/10 border-[var(--accent)]/35 shadow-sm shadow-[var(--accent)]/10"
                      : "bg-white/4 border-white/8 hover:bg-white/6"
                  }`}
                >
                  {/* Risk colour top strip */}
                  <div className="absolute left-0 top-0 right-0 h-[3px] rounded-t-2xl" style={{ background: color }} />

                  {/* Top row: name + gauge */}
                  <div className="flex items-start justify-between gap-2 pt-1">
                    <span className="text-sm font-bold text-[var(--ink-2)] leading-snug line-clamp-2">{p.name}</span>
                    <div className="shrink-0">
                      <RiskGauge score={score} size="sm" />
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[var(--subtle)] bg-white/5 border border-white/8 rounded-md px-1.5 py-0.5">{p.category}</span>
                    <span className="text-[10px] text-[var(--subtle)] bg-white/5 border border-white/8 rounded-md px-1.5 py-0.5">{p.chain}</span>
                  </div>

                  {/* Bottom row: TVL + risk pill */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--ink)] tabular-nums">{p.tvl}</span>
                    <RiskPill score={score} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-[var(--subtle)] uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-[var(--ink-2)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors appearance-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o} value={o} className="bg-[#0d1b2f]">{o}</option>
        ))}
      </select>
    </div>
  );
}

function RiskPill({ score }: { score: number }) {
  if (score < 25) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/25 shrink-0">Lower</span>;
  if (score < 45) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 border border-yellow-400/25 shrink-0">Moderate</span>;
  if (score < 70) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-400/15 text-orange-400 border border-orange-400/25 shrink-0">Elevated</span>;
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/25 shrink-0">High</span>;
}

function SortIndicator({ sort }: { sort: SortKey }) {
  const label = SORT_OPTIONS.find(s => s.id === sort)?.label ?? "";
  const isAsc = sort === "risk-asc" || sort === "name";
  return (
    <div className="flex items-center gap-1 text-[10px] text-[var(--subtle)]">
      {isAsc ? <ChevronUp size={10} /> : <ChevronDownIcon size={10} />}
      {label}
    </div>
  );
}
