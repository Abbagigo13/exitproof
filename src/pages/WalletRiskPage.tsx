/**
 * WalletRiskPage — Arc Wallet Risk Score
 *
 * Paste or connect any Arc address to get:
 * - USDC balance
 * - Total tx count
 * - Composite portfolio risk score
 * - Per-protocol interaction breakdown
 * - On-chain receipt anchor count
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import {
  ArrowLeft,
  Wallet,
  Search,
  Loader,
  ShieldCheck,
  Zap,
  TrendingUp,
  Hash,
  ClipboardPaste,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { RiskGauge } from "../components/RiskGauge";
import { useWalletRisk } from "../hooks/useWalletRisk";
import { useProtocols } from "../hooks/useProtocols";
import { REGISTRY_EXPLORER, REGISTRY_CHAIN_ID } from "../lib/registry";
import { requireChain } from "@/onchain-facts";

const arcChain = requireChain(REGISTRY_CHAIN_ID);
const EXPLORER = arcChain.explorerBase;

function isValidAddress(s: string): s is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(s.trim());
}

export default function WalletRiskPage() {
  const navigate = useNavigate();
  const { address: connectedAddress } = useAccount();
  const { protocols } = useProtocols();
  const { result, loading, error, analyze } = useWalletRisk();
  const [input, setInput] = useState("");

  function handleAnalyze(addr?: string) {
    const target = (addr ?? input).trim();
    if (!isValidAddress(target)) return;
    setInput(target);
    void analyze(target, protocols);
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      setInput(trimmed);
      if (isValidAddress(trimmed)) void analyze(trimmed, protocols);
    } catch { /* clipboard denied */ }
  }

  function useConnected() {
    if (!connectedAddress) return;
    setInput(connectedAddress);
    void analyze(connectedAddress, protocols);
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { void navigate("/dashboard"); }}
            className="flex items-center gap-1.5 text-xs text-[var(--subtle)] hover:text-[var(--muted)] transition-colors shrink-0"
          >
            <ArrowLeft size={13} /> Dashboard
          </button>
          <span className="text-[var(--subtle)]/40">/</span>
          <h1 className="display font-bold text-[var(--ink)] text-lg tracking-tight">Wallet Risk Score</h1>
          <span className="text-[10px] text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2 py-0.5 rounded-full shrink-0">
            Arc Mainnet
          </span>
        </div>

        {/* Hero explainer */}
        <div className="rounded-2xl border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/8 to-transparent p-5 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center shrink-0">
            <Wallet size={18} className="text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="display font-semibold text-[var(--ink-2)] text-sm mb-1">
              How exposed is your Arc portfolio?
            </h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed text-pretty">
              Enter any Arc Mainnet address. ExitProof reads its USDC balance, transaction count,
              and receipt anchor history directly from Arc — no external API, pure Arc RPC.
              USDC transfer patterns are cross-referenced with known protocol contracts where available.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAnalyze()}
              placeholder="0x… Arc Mainnet address"
              spellCheck={false}
              className="w-full font-mono text-xs bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3.5 text-[var(--ink-2)] placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => { void handlePaste(); }}
              title="Paste from clipboard"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--subtle)] hover:text-[var(--muted)] transition-colors"
            >
              <ClipboardPaste size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAnalyze()}
              disabled={!isValidAddress(input) || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-sm font-semibold hover:bg-[var(--accent)]/25 transition-all disabled:opacity-40 active:scale-95"
            >
              {loading ? (
                <><Loader size={14} className="animate-spin" /> Analyzing…</>
              ) : (
                <><Search size={14} /> Analyze wallet</>
              )}
            </button>

            {connectedAddress ? (
              <button
                onClick={useConnected}
                className="flex items-center gap-1.5 text-xs text-[var(--muted)] border border-white/10 bg-white/4 px-3 py-2.5 rounded-xl hover:border-white/20 transition-all"
              >
                <Zap size={11} className="text-[var(--accent)]" />
                Use my wallet
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--subtle)]">or</span>
                <ConnectKitButton />
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-[var(--danger)] shrink-0" />
            <p className="text-xs text-[var(--danger)]">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-5">

            {/* Address + score hero */}
            <div className="rounded-2xl border border-white/10 bg-white/4 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[10px] text-[var(--subtle)] uppercase tracking-wider mb-1">Arc Mainnet address</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={`${EXPLORER}/address/${result.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
                    >
                      {result.address.slice(0, 10)}…{result.address.slice(-6)}
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
                <RiskGauge score={result.portfolioScore} size="lg" />
              </div>

              {/* Stat row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="USDC Balance" value={`$${result.usdcBalance}`} accent />
                <StatCard label="Transactions" value={result.txCount.toLocaleString()} />
                <StatCard label="Risk Level" value={result.riskLabel} style={{ color: result.riskColor }} />
                <StatCard label="Receipts anchored" value={result.anchorsOnChain.toString()} />
              </div>

              {/* Portfolio score explainer */}
              <div className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
                <TrendingUp size={12} className="text-[var(--accent)] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[var(--muted)]">
                  Portfolio risk score <span className="font-bold tabular-nums" style={{ color: result.riskColor }}>{result.portfolioScore}</span> — weighted average across {result.interactions.length} protocol interaction{result.interactions.length !== 1 ? "s" : ""} by USDC volume.
                  Top exposure: <span className="font-medium text-[var(--ink-2)]">{result.topExposure}</span>.
                </p>
              </div>
            </div>

            {/* Interaction breakdown */}
            {result.interactions.length > 0 && (
              <div>
                <h3 className="text-[11px] text-[var(--subtle)] uppercase tracking-wider font-semibold mb-3">
                  Protocol interaction breakdown
                </h3>
                <div className="flex flex-col gap-2">
                  {result.interactions.map(i => (
                    <div
                      key={i.address}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/4 overflow-hidden relative"
                    >
                      {/* Risk colour strip */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: i.riskColor }} />
                      <div className="pl-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--ink-2)] truncate">{i.protocolName}</span>
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0"
                            style={{ color: i.riskColor, borderColor: `${i.riskColor}40`, background: `${i.riskColor}18` }}
                          >
                            {i.riskLabel}
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-[var(--subtle)] mt-0.5 truncate">
                          {i.address}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-xs font-bold tabular-nums text-[var(--ink-2)]">${i.totalVolume} USDC</span>
                        <span className="text-[10px] text-[var(--subtle)]">{i.txCount} tx</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.interactions.length === 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/4 p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-[var(--subtle)] shrink-0" />
                  <p className="text-sm font-semibold text-[var(--ink-2)]">No mapped DeFi interactions</p>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed text-pretty">
                  No outbound USDC transfers to known DeFi protocol contracts were found in the last 5,000 blocks.
                  Arc is a new chain — the contract registry will grow as more protocols deploy here.
                  The stats above (balance, tx count, anchors) are always accurate regardless.
                </p>
                <p className="text-[10px] text-[var(--subtle)]">
                  Portfolio risk defaults to <span className="font-bold">50 / Moderate</span> when no interactions are mapped.
                </p>
              </div>
            )}

            {/* Receipt anchor history */}
            {result.anchorsOnChain > 0 && (
              <div className="rounded-xl border border-[var(--success)]/25 bg-[var(--success)]/6 px-4 py-3 flex items-center gap-3">
                <ShieldCheck size={16} className="text-[var(--success)] shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[var(--success)]">
                    {result.anchorsOnChain} receipt{result.anchorsOnChain !== 1 ? "s" : ""} anchored
                  </p>
                  <a
                    href={`${REGISTRY_EXPLORER}/address/${result.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    View on Arc Explorer <ExternalLink size={9} />
                  </a>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-white/6 bg-white/3">
              <Hash size={11} className="text-[var(--subtle)] mt-0.5 shrink-0" />
              <p className="text-[10px] text-[var(--subtle)] leading-relaxed">
                Scanning last 5,000 blocks only. Unknown contracts assigned moderate (50) risk.
                Portfolio score is informational — not financial advice or a security audit.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, accent, style }: {
  label: string;
  value: string;
  accent?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 flex flex-col gap-1 ${accent ? "border-[var(--accent)]/25 bg-[var(--accent)]/8" : "border-white/8 bg-white/4"}`}>
      <div className="text-[9px] text-[var(--subtle)] uppercase tracking-widest font-semibold">{label}</div>
      <div className="text-sm font-bold text-[var(--ink-2)] tabular-nums leading-tight" style={style}>{value}</div>
    </div>
  );
}
