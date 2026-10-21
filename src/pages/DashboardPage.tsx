import { useState, useEffect } from "react";
import { Search, BarChart3, Layers, FlaskConical, FileJson, ArrowUpRight, RefreshCw, Wifi, WifiOff, BadgeCheck, ArrowLeft, type LucideIcon } from "lucide-react";
import { useAccount } from "wagmi";
import { computeComposite, evidenceCoverage, WEIGHTS } from "../data/protocols";
import type { Protocol } from "../data/protocols";
import { useProtocols } from "../hooks/useProtocols";
import { RiskGauge } from "../components/RiskGauge";
import { FactorBar } from "../components/FactorBar";
import { EvidenceTag } from "../components/EvidenceTag";
import { ExitSimulator } from "../components/ExitSimulator";
import { WhatIfLab } from "../components/WhatIfLab";
import { ReceiptPanel } from "../components/ReceiptPanel";
import { AnchorPanel } from "../components/AnchorPanel";
import { VerifyPanel } from "../components/VerifyPanel";
import { ProtocolBrowser } from "../components/ProtocolBrowser";
import { PremiumGate } from "../components/PremiumGate";
import { ShareButton } from "../components/ShareButton";
import { ShareReceiptCard } from "../components/ShareReceiptCard";
import { AppShell } from "../components/AppShell";
import { getProtocolFromUrl, getReceiptFromUrl, buildProtocolLink, buildReceiptLink } from "../lib/shareUrl";
import { buildReceipt } from "../lib/receipt";

type Tab = "overview" | "exit" | "whatif" | "evidence" | "receipt" | "verify";
const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "exit", label: "Exit Stress", icon: Layers },
  { id: "whatif", label: "What-If Lab", icon: FlaskConical },
  { id: "evidence", label: "Evidence", icon: Search },
  { id: "receipt", label: "Receipt", icon: FileJson },
  { id: "verify", label: "Verify", icon: BadgeCheck },
];

const FACTOR_LABELS: Record<keyof Protocol["scores"], string> = {
  contractControls: "Contract Controls",
  liquidity: "Liquidity & Exits",
  concentration: "Holder Concentration",
  governance: "Governance",
  history: "Protocol History",
};

// Parse URL params once at module level (safe: no hooks, no side effects)
const urlProtocolId = getProtocolFromUrl();
const initialSharedReceipt = getReceiptFromUrl();

export default function DashboardPage() {
  const { protocols, loading, error, source, fetchedAt, refresh } = useProtocols();
  void useAccount(); // chain/connection state handled by AppShell
  const [selectedId, setSelectedId] = useState<string | null>(urlProtocolId);
  // "browse" shows the full protocol browser; "detail" shows the selected protocol
  const [view, setView] = useState<"browse" | "detail">(urlProtocolId ? "detail" : "browse");
  const [tab, setTab] = useState<Tab>("overview");
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const [anchoredHash, setAnchoredHash] = useState<string>("");

  // When protocols load, ensure URL-specified protocol exists; fall back to browse
  useEffect(() => {
    if (urlProtocolId && protocols.length > 0) {
      const exists = protocols.some(p => p.id === urlProtocolId);
      if (!exists) {
        setSelectedId(null);
        setView("browse");
      }
    }
  }, [protocols]);

  // If a receipt snapshot is in the URL, render it directly
  if (initialSharedReceipt) return <ShareReceiptCard receipt={initialSharedReceipt} />;

  function selectProtocol(id: string) {
    setSelectedId(id);
    setView("detail");
    setTab("overview");
    setPendingHash(null);
    // update URL without reload
    const url = new URL(window.location.href);
    url.searchParams.set("protocol", id);
    window.history.replaceState(null, "", url.toString());
  }

  const activeId = selectedId ?? protocols[0]?.id ?? "";
  const protocol = protocols.find(p => p.id === activeId) ?? protocols[0];

  // Skeleton loading state
  if (loading && !protocol) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4">
          <div className="skeleton h-9 w-full rounded-xl" />
          <div className="skeleton h-10 w-48 rounded-xl" />
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-24 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  const composite = computeComposite(protocol.scores);
  const coverage = evidenceCoverage(protocol.evidence);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto w-full px-4 py-6 flex flex-col gap-6">

        {/* Live data status bar */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2">
          <div className="flex items-center gap-2">
            {source === "live" ? (
              <Wifi size={12} className="text-[var(--success)] shrink-0" />
            ) : (
              <WifiOff size={12} className="text-[var(--danger)] shrink-0" />
            )}
            <span className="text-[11px] text-[var(--muted)]">
              {source === "live"
                ? `Live DefiLlama data · ${protocols.length} protocols`
                : "Illustrative data (DefiLlama unavailable)"}
            </span>
            {error && (
              <span className="text-[10px] text-[var(--danger)] hidden sm:block">
                {error}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {fetchedAt && (
              <span className="text-[10px] text-[var(--subtle)] hidden sm:block">
                refreshed {fetchedAt.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => { void refresh(); setSelectedId(null); }}
              disabled={loading}
              className="flex items-center gap-1 text-[11px] text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-40 transition-opacity"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Protocol browser / detail toggle */}
        {view === "browse" ? (
          <ProtocolBrowser
            protocols={protocols}
            selectedId={activeId}
            onSelect={selectProtocol}
          />
        ) : (
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => { setView("browse"); const url = new URL(window.location.href); url.searchParams.delete("protocol"); window.history.replaceState(null, "", url.toString()); }}
                className="flex items-center gap-1.5 text-xs text-[var(--subtle)] hover:text-[var(--muted)] transition-colors shrink-0"
              >
                <ArrowLeft size={13} />
                All protocols
              </button>
              <span className="text-[var(--subtle)]/40">/</span>
              <span className="text-xs text-[var(--ink-2)] font-medium truncate">{protocol.name}</span>
            </div>
            <ShareButton url={buildProtocolLink(protocol.id)} label="Share" />
          </div>
        )}

        {view === "detail" && <>

        {/* Hero scores row */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {/* Composite gauge */}
          <div className="col-span-3 sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col items-center justify-center gap-3">
            <RiskGauge score={composite} size="lg" />
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-[var(--subtle)] mb-0.5">
                Composite risk score
              </div>
              <div className="text-xs text-[var(--muted)] flex items-center gap-1.5 justify-center">
                Evidence coverage:
                <span className={`font-semibold tabular-nums ${coverage < 60 ? "text-[var(--danger)]" : coverage < 80 ? "text-yellow-400" : "text-[var(--success)]"}`}>
                  {coverage}%
                </span>
              </div>
            </div>
          </div>

          {/* Factor mini-gauges */}
          <div className="col-span-3 sm:col-span-3 rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2.5 justify-center">
            {(Object.entries(protocol.scores) as [keyof Protocol["scores"], number][]).map(([key, val]) => (
              <FactorBar
                key={key}
                label={FACTOR_LABELS[key]}
                score={val}
                weight={WEIGHTS[key]}
              />
            ))}
          </div>
        </div>

        {/* Warning banners */}
        {protocol.warnings.length > 0 && (
          <div className="flex flex-col gap-2">
            {protocol.warnings.map((w, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-4 py-3"
              >
                <ArrowUpRight size={13} className="text-[var(--danger)] mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--muted)] text-pretty">{w}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none bg-white/4 rounded-2xl p-1 border border-white/8">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  tab === t.id
                    ? "bg-[var(--accent)]/20 text-[var(--accent)] shadow-sm ring-1 ring-[var(--accent)]/25"
                    : "text-[var(--subtle)] hover:text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                <Icon size={12} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          {tab === "overview" && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="display text-lg font-semibold text-[var(--ink)] mb-1">
                  {protocol.name}
                </h2>
                <p className="text-sm text-[var(--muted)] text-pretty max-w-xl">
                  {protocol.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Category" value={protocol.category} />
                <StatCard label="Chain" value={protocol.chain} />
                <StatCard label="TVL" value={protocol.tvl} accent />
                <StatCard label="Last checked" value={protocol.lastChecked} />
              </div>

              <div>
                <h3 className="text-xs text-[var(--subtle)] uppercase tracking-wider mb-3">
                  Risk methodology
                </h3>
                <div className="flex flex-col gap-1.5 text-xs text-[var(--muted)]">
                  <p>
                    Composite = (Contract × 0.25) + (Liquidity × 0.25) + (Concentration × 0.15) + (Governance × 0.15) + (History × 0.20)
                  </p>
                  <p>
                    Scores 0–100 (higher = higher estimated risk). Missing evidence treated as 100 until verified. Weights and thresholds are provisional.
                  </p>
                  <p className="text-[var(--danger)]/80">
                    This is not a security audit or financial advice.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === "exit" && <ExitSimulator protocol={protocol} />}

          {tab === "whatif" && <WhatIfLab protocol={protocol} />}

          {tab === "evidence" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-[var(--ink-2)]">Evidence register</h3>
                <span className={`text-xs font-medium tabular-nums ${coverage < 60 ? "text-[var(--danger)]" : coverage < 80 ? "text-yellow-400" : "text-[var(--success)]"}`}>
                  {coverage}% coverage
                </span>
              </div>
              {/* First 2 evidence items are free; full register is premium */}
              {protocol.evidence.slice(0, 2).map((e, i) => (
                <EvidenceTag key={i} item={e} />
              ))}
              {protocol.evidence.length > 2 && (
                <PremiumGate
                  protocolId={protocol.id}
                  protocolName={protocol.name}
                  featureLabel="Full evidence register"
                >
                  <div className="flex flex-col gap-2">
                    {protocol.evidence.slice(2).map((e, i) => (
                      <EvidenceTag key={i} item={e} />
                    ))}
                  </div>
                </PremiumGate>
              )}
              <p className="text-[10px] text-[var(--subtle)] text-center pt-1">
                Every finding links to its evidence type. Missing evidence lowers confidence but does not prove malice.
              </p>
            </div>
          )}

          {tab === "verify" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-[var(--ink-2)]">Verify anchored receipt</h3>
                {anchoredHash && (
                  <span className="text-[10px] text-[var(--success)] border border-[var(--success)]/30 bg-[var(--success)]/10 px-2 py-0.5 rounded-full">
                    auto-populated from last anchor
                  </span>
                )}
              </div>
              <VerifyPanel initialHash={anchoredHash} />
            </div>
          )}

          {tab === "receipt" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--ink-2)]">Risk receipt</span>
                <ShareButton
                  url={buildReceiptLink(buildReceipt(protocol))}
                  label="Share snapshot"
                />
              </div>
              <ReceiptPanel
                protocol={protocol}
                contractAddress="0xf9394055a418cf0cf606c11c928d992bb1c55536"
                onAnchorRequest={(h) => { setPendingHash(h); }}
              />
              {/* Premium: verified on-chain receipt badge */}
              <PremiumGate
                protocolId={protocol.id}
                protocolName={protocol.name}
                featureLabel="Verified on-chain receipt badge"
              >
                <div className="rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/8 p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--success)]/20 border border-[var(--success)]/30 flex items-center justify-center shrink-0">
                    <BadgeCheck size={16} className="text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--success)]">Verified receipt</p>
                    <p className="text-xs text-[var(--muted)]">
                      This receipt hash was verified against the on-chain registry and matches a confirmed anchor transaction.
                    </p>
                  </div>
                </div>
              </PremiumGate>
              {pendingHash && (
                <div>
                  <h3 className="text-xs text-[var(--subtle)] uppercase tracking-wider mb-2">
                    On-chain anchoring
                  </h3>
                  <AnchorPanel
                    hash={pendingHash}
                    protocolId={protocol.id}
                    onAnchored={(h) => { setAnchoredHash(h); setTab("verify"); }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        </>}

        {/* Footer */}
        <footer className="text-center text-[10px] text-[var(--subtle)] py-6 border-t border-white/5 flex flex-col gap-1.5">
          <p className="font-medium text-[var(--muted)]">ExitProof — DeFi Risk Intelligence</p>
          <p>{source === "live" ? "Protocol data sourced live from DefiLlama" : "Illustrative protocol data"} · Risk scores algorithmically derived</p>
          <p>Smart contract on <a href="https://explorer.arc.io/address/0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6" target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline">Arc Mainnet</a> · Not financial advice · Not a security audit</p>
        </footer>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-3 flex flex-col gap-1 transition-colors ${
      accent
        ? "border-[var(--accent)]/25 bg-[var(--accent)]/8"
        : "border-white/8 bg-white/4 hover:bg-white/6"
    }`}>
      <div className="text-[9px] text-[var(--subtle)] uppercase tracking-widest font-semibold">{label}</div>
      <div className="text-sm font-bold text-[var(--ink-2)] tabular-nums leading-tight">{value}</div>
    </div>
  );
}
