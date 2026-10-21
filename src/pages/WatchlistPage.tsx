/**
 * WatchlistPage — Arc Protocol Watchlist
 *
 * Bookmark protocols and set a risk-score alert threshold.
 * When a protocol's score exceeds the threshold, a red alert badge fires
 * and you can send a 0.001 USDC on-chain signal from your wallet — a primitive
 * "pay-to-alert" primitive only possible on Arc where gas IS USDC.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc20Abi } from "viem";
import { ConnectKitButton } from "connectkit";
import {
  ArrowLeft,
  Bell,
  BellRing,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Zap,
  ExternalLink,
  AlertTriangle,
  Loader,
  CheckCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "../components/AppShell";
import { RiskGauge } from "../components/RiskGauge";
import { useProtocols } from "../hooks/useProtocols";
import { useWatchlist } from "../hooks/useWatchlist";
import { computeComposite, riskLabel } from "../data/protocols";
import type { Protocol } from "../data/protocols";
import { getUsdc, buildTxExplorerUrl } from "@/onchain-facts";
import { parseAmount } from "@/onchain-money";
import { REGISTRY_CHAIN_ID } from "../lib/registry";

const TARGET_CHAIN_ID = REGISTRY_CHAIN_ID;
const usdcFact = getUsdc(TARGET_CHAIN_ID)!;
const USDC_ADDRESS = usdcFact.address as `0x${string}`;

// Signal amount: 0.001 USDC — a micro on-chain signal, not a fee
const SIGNAL_AMOUNT = "0.001";
// Signal recipient: the user sends it to themselves (self-signal) or their notification wallet
// Here we send it to the zero address? No — we send it back to the sender (self-signal)
// to demonstrate on-chain activity with no external party receiving funds.

function RiskPill({ score }: { score: number }) {
  const { label } = riskLabel(score);
  if (score < 25) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25 shrink-0">{label}</span>;
  if (score < 45) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-400/15 text-yellow-400 border border-yellow-400/25 shrink-0">{label}</span>;
  if (score < 70) return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-400/15 text-orange-400 border border-orange-400/25 shrink-0">{label}</span>;
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/25 shrink-0">{label}</span>;
}

function SignalButton({ protocolName, onSignaled }: { protocolName: string; onSignaled: (tx: string) => void }) {
  const { address } = useAccount();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const { writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  function handleSignal() {
    if (!address) return;
    const amount = parseAmount(TARGET_CHAIN_ID, SIGNAL_AMOUNT);
    writeContract(
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        // Self-transfer: the "signal" lands back in your own wallet
        args: [address, amount.raw],
        chainId: TARGET_CHAIN_ID,
      },
      {
        onSuccess: (h) => {
          setTxHash(h);
          toast.success(`On-chain signal sent for ${protocolName}`);
          onSignaled(h);
        },
        onError: (e) => {
          if (e.message?.toLowerCase().includes("user rejected")) return;
          toast.error(e.message?.slice(0, 80) ?? "Signal failed");
        },
      }
    );
  }

  if (isSuccess && txHash) {
    return (
      <a
        href={buildTxExplorerUrl(TARGET_CHAIN_ID, txHash)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 text-[10px] text-[var(--success)] hover:underline"
      >
        <CheckCircle size={10} /> Signaled <ExternalLink size={8} />
      </a>
    );
  }

  return (
    <button
      onClick={handleSignal}
      disabled={isPending || isConfirming}
      title="Send a 0.001 USDC on-chain signal (Arc-native alert)"
      className="flex items-center gap-1 text-[10px] text-[var(--accent)] border border-[var(--accent)]/25 bg-[var(--accent)]/8 px-2 py-1 rounded-lg hover:bg-[var(--accent)]/15 transition-all disabled:opacity-40 shrink-0"
    >
      {isPending || isConfirming ? (
        <Loader size={10} className="animate-spin" />
      ) : (
        <Zap size={10} />
      )}
      0.001 USDC signal
    </button>
  );
}

function ProtocolSearch({ protocols, watchedIds, onAdd }: {
  protocols: Protocol[];
  watchedIds: Set<string>;
  onAdd: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = protocols
    .filter(p =>
      !watchedIds.has(p.id) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--subtle)]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Add a protocol to watchlist…"
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
        />
      </div>
      {search && filtered.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden">
          {filtered.map(p => {
            const score = computeComposite(p.scores);
            return (
              <button
                key={p.id}
                onClick={() => { onAdd(p.id); setSearch(""); }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-[var(--ink-2)]">{p.name}</span>
                  <span className="text-[10px] text-[var(--subtle)] ml-2">{p.category}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <RiskPill score={score} />
                  <Bookmark size={12} className="text-[var(--accent)]" />
                </div>
              </button>
            );
          })}
        </div>
      )}
      {search && filtered.length === 0 && (
        <p className="text-xs text-[var(--subtle)] text-center py-2">
          {watchedIds.has(protocols.find(p => p.name.toLowerCase() === search.toLowerCase())?.id ?? "") ? "Already watching this protocol." : "No matching unwatched protocols."}
        </p>
      )}
    </div>
  );
}

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { protocols } = useProtocols();
  const { entries, add, remove, setThreshold, isWatched, alertCount } = useWatchlist(protocols);

  const watchedIds = new Set(entries.map(e => e.protocolId));

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { void navigate("/dashboard"); }}
              className="flex items-center gap-1.5 text-xs text-[var(--subtle)] hover:text-[var(--muted)] transition-colors shrink-0"
            >
              <ArrowLeft size={13} /> Dashboard
            </button>
            <span className="text-[var(--subtle)]/40">/</span>
            <h1 className="display font-bold text-[var(--ink)] text-lg tracking-tight">Watchlist</h1>
            {alertCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--danger)] bg-[var(--danger)]/12 border border-[var(--danger)]/25 px-2 py-0.5 rounded-full font-semibold">
                <BellRing size={9} />
                {alertCount} alert{alertCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Explainer */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5 flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
            <Bell size={18} className="text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="display font-semibold text-[var(--ink-2)] text-sm mb-1">Protocol alerts with USDC signals</h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed text-pretty">
              Bookmark any protocol and set a risk-score threshold. When the score crosses it, an alert fires.
              You can then send a <span className="text-[var(--accent)] font-semibold">0.001 USDC on-chain signal</span> — a primitive "pay-to-alert"
              that only works on Arc where gas IS USDC. The transaction lands on-chain as permanent proof of the alert moment.
            </p>
          </div>
        </div>

        {/* Add protocol */}
        <ProtocolSearch protocols={protocols} watchedIds={watchedIds} onAdd={id => add(id, 50)} />

        {/* Watchlist entries */}
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/4 p-10 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <BookmarkCheck size={20} className="text-[var(--subtle)]" />
            </div>
            <p className="text-sm font-semibold text-[var(--ink-2)]">No protocols watched yet</p>
            <p className="text-xs text-[var(--subtle)] max-w-xs text-pretty">
              Search above to add protocols. Once added, set a risk threshold to get alerted when a protocol crosses it.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map(entry => {
              const protocol = protocols.find(p => p.id === entry.protocolId);
              if (!protocol) return null;
              const score = entry.currentScore;
              const alerting = entry.isAlerting;

              return (
                <div
                  key={entry.protocolId}
                  className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
                    alerting
                      ? "border-[var(--danger)]/35 bg-[var(--danger)]/6"
                      : "border-white/8 bg-white/4"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <RiskGauge score={score} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--ink-2)] text-sm truncate">{protocol.name}</span>
                          {alerting && (
                            <span className="flex items-center gap-0.5 text-[9px] text-[var(--danger)] bg-[var(--danger)]/12 border border-[var(--danger)]/25 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                              <AlertTriangle size={8} /> ALERT
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--subtle)] mt-0.5">
                          {protocol.category} · {protocol.tvl} · score <span className="tabular-nums font-medium text-[var(--ink-2)]">{score}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(entry.protocolId)}
                      className="text-[var(--subtle)] hover:text-[var(--danger)] transition-colors shrink-0"
                      title="Remove from watchlist"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Threshold slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[var(--subtle)]">Alert threshold</span>
                      <span className={`font-bold tabular-nums ${alerting ? "text-[var(--danger)]" : "text-[var(--muted)]"}`}>
                        ≥ {entry.alertThreshold}
                        {alerting ? " — EXCEEDED" : ""}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      step={5}
                      value={entry.alertThreshold}
                      onChange={e => setThreshold(entry.protocolId, Number(e.target.value))}
                      className="w-full accent-[var(--accent)] h-1.5 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-[var(--subtle)]">
                      <span>10 (safe)</span>
                      <span>50 (moderate)</span>
                      <span>90 (critical)</span>
                    </div>
                  </div>

                  {/* Alert action */}
                  {alerting && (
                    <div className={`rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-3 py-2.5 flex items-center justify-between gap-3`}>
                      <div className="flex items-center gap-2">
                        <BellRing size={13} className="text-[var(--danger)] shrink-0" />
                        <p className="text-xs text-[var(--danger)] font-medium">
                          Risk score {score} exceeds your threshold of {entry.alertThreshold}
                        </p>
                      </div>
                      {isConnected ? (
                        <SignalButton
                          protocolName={protocol.name}
                          onSignaled={(tx) => { void tx; }}
                        />
                      ) : (
                        <ConnectKitButton />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-[var(--subtle)] text-center pb-2">
          Watchlist stored locally · Thresholds trigger in-app alerts only ·
          On-chain signal = 0.001 USDC self-transfer on {TARGET_CHAIN_ID === 5042 ? "Arc Mainnet" : "Arc Testnet"}
        </p>
      </div>
    </AppShell>
  );
}
