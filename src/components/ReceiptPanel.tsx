import { useState } from "react";
import { Download, Hash, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { buildReceipt, downloadReceipt, hashReceipt } from "../lib/receipt";
import { computeComposite, riskLabel } from "../data/protocols";
import type { Protocol } from "../data/protocols";
import { MintReceiptNFT } from "./MintReceiptNFT";

type Props = {
  protocol: Protocol;
  contractAddress?: string;
  onAnchorRequest?: (hash: string) => void;
};

export function ReceiptPanel({ protocol, contractAddress, onAnchorRequest }: Props) {
  const [hash, setHash] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const composite = computeComposite(protocol.scores);
  const { label: riskLevelStr } = riskLabel(composite);

  function handleDownload() {
    const receipt = buildReceipt(protocol);
    downloadReceipt(receipt);
    toast.success("Receipt downloaded");
  }

  async function handleHash() {
    setComputing(true);
    try {
      const receipt = buildReceipt(protocol);
      const h = await hashReceipt(receipt);
      setHash(h);
    } catch {
      toast.error("Failed to compute hash");
    } finally {
      setComputing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* What's in the receipt */}
      <div className="rounded-xl border border-white/8 bg-white/4 p-4">
        <p className="text-xs text-[var(--muted)] text-pretty mb-3">
          A JSON risk receipt records the assessment time, all factor scores, evidence items with types and freshness, warnings, scoring methodology, assumptions, and limitations.
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            "Protocol metadata",
            "Five factor scores",
            "Evidence register",
            "Stale-data flags",
            "Methodology",
            "Limitations",
          ].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-[var(--muted)]">
              <CheckCircle size={11} className="text-[var(--success)] shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={handleDownload}
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-sm font-semibold hover:bg-[var(--accent)]/25 transition-all active:scale-95"
      >
        <Download size={15} />
        Export JSON receipt
      </button>

      {/* Hash */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => { void handleHash(); }}
          disabled={computing}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-[var(--muted)] text-sm font-medium hover:border-white/20 transition-all disabled:opacity-50 active:scale-95"
        >
          <Hash size={15} />
          {computing ? "Computing…" : "Compute receipt hash (SHA-256)"}
        </button>
        {hash && (
          <div className="rounded-xl border border-white/8 bg-white/3 p-3">
            <div className="text-[10px] text-[var(--subtle)] uppercase tracking-wider mb-1">
              SHA-256 digest
            </div>
            <p className="mono text-[10px] text-[var(--ink-2)] break-all leading-relaxed">
              {hash}
            </p>
            {contractAddress ? (
              <button
                onClick={() => onAnchorRequest?.(hash)}
                className="mt-2 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] underline"
              >
                Anchor this hash on Arc Mainnet
              </button>
            ) : (
              <p className="mt-2 text-[10px] text-[var(--subtle)]">
                On-chain anchoring available after contract deployment.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mint as NFT (shown once hash is computed) */}
      {hash && (
        <MintReceiptNFT
          receiptHash={hash}
          protocolName={protocol.name}
          riskLevel={riskLevelStr}
          riskScore={composite}
        />
      )}

      {/* Disclaimer */}
      <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={13} className="text-[var(--danger)] mt-0.5 shrink-0" />
          <p className="text-[10px] text-[var(--muted)] text-pretty">
            A matching hash demonstrates the receipt content matches a previously recorded digest. It does not prove the risk analysis is correct, the evidence is genuine, or the protocol is safe.
          </p>
        </div>
      </div>
    </div>
  );
}
