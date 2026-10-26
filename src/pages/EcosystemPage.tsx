import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Database, TrendingUp, Globe, ExternalLink, RefreshCw, Loader, Radio, ShieldCheck, Hash, Blocks } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useReceiptFeed } from "../hooks/useReceiptFeed";
import { useArcBlock } from "../hooks/useArcBlock";
import { REGISTRY_EXPLORER, REGISTRY_ADDRESS } from "../lib/registry";

interface ArcStats {
  totalTvl: string;
  transactions24h: string;
  usdcVolume24h: string;
  activeWallets: string;
  blockTime: string;
  gasFee: string;
}

interface ArcProtocol {
  name: string;
  tvl: string;
  category: string;
  url: string;
  change24h?: string;
}

// Hardcoded Arc ecosystem facts (chain-specific, stable)
const ARC_FACTS = [
  { icon: Zap, title: "USDC as Gas", desc: "Arc is the only EVM chain where USDC is the native gas token. No ETH, no bridging — pay for transactions directly in USDC." },
  { icon: Database, title: "Sub-second Finality", desc: "Arc achieves ~500ms block times, making it one of the fastest EVM-compatible chains for DeFi transactions." },
  { icon: Globe, title: "Circle-native", desc: "Built by Circle, Arc is purpose-designed for USDC-first applications. CCTP, Gateway, and Bridge Kit are all natively supported." },
  { icon: TrendingUp, title: "Stable Gas Fees", desc: "Because gas is paid in USDC, fees are predictable in dollar terms — no more gas fee spikes measured in ETH." },
];

async function fetchArcStats(): Promise<ArcStats> {
  // Fetch Arc chain TVL from DefiLlama
  const res = await fetch("https://api.llama.fi/v2/chains");
  if (!res.ok) throw new Error("Failed");
  const chains = (await res.json()) as Array<{ name: string; tvl: number; gecko_id?: string }>;
  const arc = chains.find((c) => c.name?.toLowerCase() === "arc" || c.gecko_id?.toLowerCase().includes("arc"));
  const tvl = arc ? `$${(arc.tvl / 1e6).toFixed(1)}M` : "—";
  return {
    totalTvl: tvl,
    transactions24h: "—",
    usdcVolume24h: "—",
    activeWallets: "—",
    blockTime: "~500ms",
    gasFee: "~0.0001 USDC",
  };
}

async function fetchArcProtocols(): Promise<ArcProtocol[]> {
  const res = await fetch("https://api.llama.fi/protocols");
  if (!res.ok) throw new Error("Failed");
  const all = (await res.json()) as Array<{ name: string; tvl: number; category: string; chains: string[]; url: string; change_1d?: number }>;
  return all
    .filter((p) => Array.isArray(p.chains) && p.chains.some((c: string) => c.toLowerCase() === "arc"))
    .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
    .slice(0, 20)
    .map((p) => ({
      name: p.name,
      tvl: p.tvl >= 1e9 ? `$${(p.tvl / 1e9).toFixed(2)}B` : p.tvl >= 1e6 ? `$${(p.tvl / 1e6).toFixed(1)}M` : `$${(p.tvl / 1e3).toFixed(0)}K`,
      category: p.category ?? "DeFi",
      url: p.url ?? `https://defillama.com/protocol/${p.name.toLowerCase().replace(/\s+/g, "-")}`,
      change24h: p.change_1d != null ? `${p.change_1d > 0 ? "+" : ""}${p.change_1d.toFixed(1)}%` : undefined,
    }));
}

const STAT_CARDS = (s: ArcStats) => [
  { label: "Total TVL on Arc", value: s.totalTvl, icon: Database },
  { label: "Block time", value: s.blockTime, icon: Zap },
  { label: "Gas fee (approx)", value: s.gasFee, icon: TrendingUp },
];

export default function EcosystemPage() {
  const navigate = useNavigate();
  const feed = useReceiptFeed();
  const { block: liveBlock, tps } = useArcBlock();
  const [stats, setStats] = useState<ArcStats | null>(null);
  const [protocols, setProtocols] = useState<ArcProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([fetchArcStats(), fetchArcProtocols()]);
      setStats(s);
      setProtocols(p);
    } catch {
      setError("Could not load live Arc data. Showing static facts.");
      setStats({ totalTvl: "—", transactions24h: "—", usdcVolume24h: "—", activeWallets: "—", blockTime: "~500ms", gasFee: "~0.0001 USDC" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* Back + header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { void navigate("/dashboard"); }}
              className="flex items-center gap-1.5 text-xs text-[var(--subtle)] hover:text-[var(--muted)] transition-colors"
            >
              <ArrowLeft size={13} /> Dashboard
            </button>
            <span className="text-[var(--subtle)]/40">/</span>
            <h1 className="display font-bold text-[var(--ink)] text-lg tracking-tight">Arc Ecosystem</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Live block counter */}
            {liveBlock !== null && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--accent)] bg-[var(--accent)]/8 border border-[var(--accent)]/20 px-2.5 py-1.5 rounded-lg">
                <Blocks size={10} className="shrink-0" />
                <span className="tabular-nums">#{liveBlock.toLocaleString()}</span>
                {tps !== null && (
                  <span className="text-[var(--subtle)] ml-1">{tps} blk/s</span>
                )}
              </div>
            )}
            <button
              onClick={() => { void load(); }}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-40 transition-opacity"
            >
              <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Arc identity banner */}
        <div className="rounded-2xl border border-[var(--accent)]/25 bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 p-6 flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center shrink-0">
              <Zap size={22} className="text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="display font-bold text-[var(--ink)] text-xl tracking-tight mb-1">Arc — where USDC is gas</h2>
              <p className="text-sm text-[var(--muted)] max-w-2xl text-pretty leading-relaxed">
                Arc is Circle's EVM-compatible blockchain where USDC is the native gas token. No need to hold ETH or any other volatile asset to transact. ExitProof's risk receipts are anchored here permanently — paying gas in USDC with sub-second finality.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="https://arc.io" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1.5 rounded-lg hover:bg-[var(--accent)]/15 transition-all">
              arc.io <ExternalLink size={10} />
            </a>
            <a href="https://explorer.arc.io" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1.5 rounded-lg hover:bg-[var(--accent)]/15 transition-all">
              Explorer <ExternalLink size={10} />
            </a>
            <a href="https://bridge.arc.io" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1.5 rounded-lg hover:bg-[var(--accent)]/15 transition-all">
              Bridge to Arc <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STAT_CARDS(stats).map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/4 p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icon size={14} className="text-[var(--accent)]" />
                  <span className="text-[10px] text-[var(--subtle)] uppercase tracking-wider font-semibold">{label}</span>
                </div>
                <span className="display font-bold text-[var(--ink)] text-2xl tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Arc facts */}
        <div>
          <h2 className="display font-bold text-[var(--ink)] text-base tracking-tight mb-4">Why Arc for DeFi?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ARC_FACTS.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-white/8 bg-white/4 p-5 flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/12 border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="display font-semibold text-[var(--ink-2)] text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-[var(--muted)] leading-relaxed text-pretty">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Arc protocols */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="display font-bold text-[var(--ink)] text-base tracking-tight">
              Protocols on Arc
            </h2>
            {error && <span className="text-[10px] text-[var(--danger)]">{error}</span>}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--muted)] py-8">
              <Loader size={14} className="animate-spin text-[var(--accent)]" />
              Loading Arc protocols from DefiLlama…
            </div>
          ) : protocols.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/4 p-8 text-center">
              <p className="text-sm text-[var(--subtle)]">No protocols with Arc TVL found yet — Arc is a new chain.</p>
              <p className="text-xs text-[var(--subtle)] mt-1">Check back as more protocols deploy on Arc Mainnet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {protocols.map(p => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-white/8 bg-white/4 hover:border-white/15 hover:bg-white/6 transition-all group"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-[var(--ink-2)] group-hover:text-[var(--accent)] transition-colors">{p.name}</span>
                    <span className="text-[11px] text-[var(--subtle)]">{p.category}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-[var(--ink-2)] tabular-nums">{p.tvl}</span>
                    {p.change24h && (
                      <span className={`text-xs font-medium tabular-nums ${p.change24h.startsWith("+") ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                        {p.change24h}
                      </span>
                    )}
                    <ExternalLink size={12} className="text-[var(--subtle)] group-hover:text-[var(--accent)] transition-colors shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Live Receipt Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
              <h2 className="display font-bold text-[var(--ink)] text-base tracking-tight">Live Receipt Feed</h2>
              {feed.totalOnChain !== null && (
                <span className="text-[10px] text-[var(--subtle)] bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                  {feed.totalOnChain} total anchors
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {feed.lastBlock !== null && (
                <span className="text-[10px] text-[var(--subtle)] hidden sm:block">
                  block #{feed.lastBlock.toString()}
                </span>
              )}
              <button
                onClick={feed.refresh}
                disabled={feed.loading}
                className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] disabled:opacity-40 transition-opacity"
              >
                <RefreshCw size={11} className={feed.loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {feed.error && (
            <div className="rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-[10px] text-[var(--subtle)] mb-3">
              Retrying… {feed.error}
            </div>
          )}

          {feed.loading && feed.events.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-[var(--muted)] py-6">
              <Loader size={14} className="animate-spin text-[var(--accent)]" />
              Scanning Arc Mainnet for receipt anchors…
            </div>
          ) : feed.events.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-white/4 p-8 text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                <Radio size={18} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--ink-2)]">Listening for receipts…</p>
                <p className="text-xs text-[var(--subtle)] mt-0.5">
                  No anchors found in the last 5,000 blocks. Be the first — anchor a risk receipt from the Dashboard.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {feed.events.map(ev => (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/8 bg-white/4 hover:border-white/12 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-[var(--success)]/15 border border-[var(--success)]/25 flex items-center justify-center shrink-0">
                    <ShieldCheck size={14} className="text-[var(--success)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-[var(--ink-2)] truncate">
                        {ev.protocolRef || "Unknown protocol"}
                      </span>
                      <span className="text-[10px] text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20 px-1.5 py-0.5 rounded-full shrink-0">
                        Anchored
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="font-mono text-[10px] text-[var(--subtle)]">
                        {ev.anchorer.slice(0, 6)}…{ev.anchorer.slice(-4)}
                      </span>
                      <span className="text-[10px] text-[var(--subtle)]">
                        {new Date(ev.timestamp * 1000).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`${REGISTRY_EXPLORER}/address/${REGISTRY_ADDRESS}`}
                      target="_blank"
                      rel="noreferrer"
                      title={ev.receiptHash}
                      className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline"
                    >
                      <Hash size={10} />
                      {ev.receiptHash.slice(0, 8)}…
                    </a>
                    {ev.txHash && (
                      <a
                        href={`${REGISTRY_EXPLORER}/tx/${ev.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--subtle)] hover:text-[var(--accent)] transition-colors"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-[var(--subtle)] mt-2">
            Polling Arc Mainnet every 10s · Showing up to 50 events · Contract: <a href={`${REGISTRY_EXPLORER}/address/${REGISTRY_ADDRESS}`} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline font-mono">{REGISTRY_ADDRESS.slice(0, 10)}…</a>
          </p>
        </div>

        {/* ExitProof contract */}
        <div className="rounded-2xl border border-[var(--success)]/25 bg-[var(--success)]/6 p-5 flex flex-col gap-2">
          <span className="text-[10px] text-[var(--subtle)] uppercase tracking-wider font-semibold">ExitProof on Arc Mainnet</span>
          <p className="text-sm text-[var(--muted)]">
            The <span className="text-[var(--ink-2)] font-medium">RiskReceiptRegistry</span> contract is deployed on Arc Mainnet.
            Risk receipt hashes anchored in ExitProof are permanently stored on Arc, verifiable by anyone.
          </p>
          <a
            href="https://explorer.arc.io/address/0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-[var(--success)] hover:underline font-mono"
          >
            0xcd8E285b61437EE0AfDdbD5EBA54c1A3ea6FBFb6 <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </AppShell>
  );
}
