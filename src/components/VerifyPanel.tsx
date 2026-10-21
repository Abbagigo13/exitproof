import { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, ExternalLink, Loader, ClipboardPaste } from "lucide-react";
import { useReadContract } from "wagmi";
import { REGISTRY_ADDRESS, REGISTRY_ABI, REGISTRY_EXPLORER } from "../lib/registry";
import { useGasEstimate } from "../hooks/useGasEstimate";
import { GasPill } from "./GasPill";

type Props = {
  /** Pre-populate the input (e.g. after anchoring). */
  initialHash?: string;
};

type ReceiptResult =
  | { status: "found"; anchorer: string; timestamp: number; protocolRef: string; revoked: boolean }
  | { status: "not-found" }
  | { status: "idle" }
  | { status: "error"; message: string };

function isValidBytes32(s: string): s is `0x${string}` {
  return /^0x[0-9a-fA-F]{64}$/.test(s);
}

function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function VerifyPanel({ initialHash = "" }: Props) {
  const [input, setInput] = useState(initialHash);
  const [query, setQuery] = useState<`0x${string}` | null>(
    isValidBytes32(initialHash) ? (initialHash) : null
  );
  const gas = useGasEstimate({ type: "verify" });

  // Sync when the parent passes a new initialHash (e.g. just anchored)
  useEffect(() => {
    if (initialHash && initialHash !== input) {
      setInput(initialHash);
      if (isValidBytes32(initialHash)) {
        setQuery(initialHash);
      }
    }
    // Only run when initialHash changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHash]);

  const { data, isLoading, isError, error } = useReadContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: "getReceipt",
    args: query ? [query] : undefined,
    query: { enabled: !!query },
  });

  // Derive result from wagmi state
  const result: ReceiptResult = (() => {
    if (!query) return { status: "idle" };
    if (isLoading) return { status: "idle" }; // spinner shown separately
    if (isError) return { status: "error", message: error?.message ?? "Unknown error" };
    if (!data) return { status: "idle" };
    const [anchorer, timestamp, protocolRef, revoked] = data as [string, bigint, string, boolean];
    if (anchorer === "0x0000000000000000000000000000000000000000" || timestamp === 0n) {
      return { status: "not-found" };
    }
    return {
      status: "found",
      anchorer,
      timestamp: Number(timestamp),
      protocolRef,
      revoked: revoked ?? false,
    };
  })();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!isValidBytes32(trimmed)) return;
    setQuery(trimmed);
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      setInput(trimmed);
      if (isValidBytes32(trimmed)) setQuery(trimmed);
    } catch {
      // clipboard access denied — ignore
    }
  }

  const inputValid = isValidBytes32(input.trim());

  return (
    <div className="flex flex-col gap-4">
      {/* Explainer */}
      <p className="text-xs text-[var(--muted)] text-pretty">
        Enter a SHA-256 receipt hash to check whether it has been anchored on Arc. You can paste any hash computed in the Receipt tab.
      </p>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x… (64-char hex hash)"
            spellCheck={false}
            className="w-full mono text-[11px] bg-white/5 border border-white/10 rounded-xl px-3 py-3 pr-10 text-[var(--ink-2)] placeholder:text-[var(--subtle)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
          />
          <button
            type="button"
            onClick={() => { void handlePaste(); }}
            title="Paste from clipboard"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--subtle)] hover:text-[var(--muted)] transition-colors"
          >
            <ClipboardPaste size={14} />
          </button>
        </div>

        {input.length > 2 && !inputValid && (
          <p className="text-[10px] text-[var(--danger)]">
            Must be a 0x-prefixed 64-character hex string (bytes32).
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <button
            type="submit"
            disabled={!inputValid || isLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-sm font-semibold hover:bg-[var(--accent)]/25 transition-all disabled:opacity-40 active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader size={14} className="animate-spin" />
                Querying…
              </>
            ) : (
              <>
                <Search size={14} />
                Verify on-chain
              </>
            )}
          </button>
          <div className="flex items-center justify-between px-1">
            <GasPill display={gas.display} loading={gas.loading} error={gas.error} />
            <span className="text-[9px] text-[var(--subtle)]">Read-only — no gas required</span>
          </div>
        </div>
      </form>

      {/* Result */}
      {query && !isLoading && (
        <div>
          {result.status === "found" && (
            <div className={`rounded-xl border p-4 flex flex-col gap-3 ${result.revoked ? "border-[var(--risk-crit)]/30 bg-[var(--risk-crit)]/8" : "border-[var(--success)]/30 bg-[var(--success)]/8"}`}>
              <div className="flex items-center gap-2">
                {result.revoked
                  ? <XCircle size={16} className="text-[var(--risk-crit)] shrink-0" />
                  : <CheckCircle size={16} className="text-[var(--success)] shrink-0" />
                }
                <span className={`text-sm font-semibold ${result.revoked ? "text-[var(--risk-crit)]" : "text-[var(--success)]"}`}>
                  {result.revoked ? "Receipt revoked" : "Receipt found on-chain"}
                </span>
                {result.revoked && (
                  <span className="ml-auto text-[10px] bg-[var(--risk-crit)]/15 text-[var(--risk-crit)] border border-[var(--risk-crit)]/25 px-2 py-0.5 rounded-full font-medium">
                    REVOKED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <ResultRow label="Protocol" value={result.protocolRef} />
                <ResultRow label="Anchored by" value={formatAddress(result.anchorer)} mono />
                <ResultRow label="Anchored at" value={formatTimestamp(result.timestamp)} />
                <ResultRow label="Hash" value={`${query.slice(0, 18)}…${query.slice(-8)}`} mono />
                <ResultRow label="Status" value={result.revoked ? "Revoked by owner" : "Valid"} />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={`${REGISTRY_EXPLORER}/address/${REGISTRY_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                >
                  View registry <ExternalLink size={10} />
                </a>
                <a
                  href={`${REGISTRY_EXPLORER}/address/${result.anchorer}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
                >
                  View anchorer <ExternalLink size={10} />
                </a>
              </div>
            </div>
          )}

          {result.status === "not-found" && (
            <div className="rounded-xl border border-white/10 bg-white/4 p-4 flex items-start gap-3">
              <XCircle size={16} className="text-[var(--subtle)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[var(--ink-2)]">Not anchored</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  This hash has no record in the registry. It may not have been anchored yet, or the hash may be incorrect.
                </p>
              </div>
            </div>
          )}

          {result.status === "error" && (
            <div className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/8 p-4">
              <p className="text-xs text-[var(--danger)]">{result.message.slice(0, 120)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-[var(--subtle)] shrink-0 w-24">{label}</span>
      <span className={`text-[var(--ink-2)] text-right break-all ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
