/**
 * ShareReceiptCard — read-only view rendered when the URL contains a
 * ?receipt=<b64> param. Shows the embedded snapshot, the SHA-256 hash,
 * and a link back to the live app for the same protocol.
 */
import { useState, useEffect } from "react";
import { Shield, ExternalLink, AlertCircle, Hash } from "lucide-react";
import { riskLabel } from "../data/protocols";
import { RiskGauge } from "./RiskGauge";
import type { ShareableReceipt } from "../lib/shareUrl";
import { buildProtocolLink } from "../lib/shareUrl";
import { ShareButton } from "./ShareButton";

type Props = {
  receipt: ShareableReceipt;
};

const FACTOR_LABELS: Record<string, string> = {
  contractControls: "Contract Controls",
  liquidity: "Liquidity & Exits",
  concentration: "Holder Concentration",
  governance: "Governance",
  history: "Protocol History",
};

export function ShareReceiptCard({ receipt }: Props) {
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    async function computeHash() {
      const json = JSON.stringify(receipt);
      const encoded = new TextEncoder().encode(json);
      const buf = await crypto.subtle.digest("SHA-256", encoded);
      const arr = Array.from(new Uint8Array(buf));
      setHash("0x" + arr.map(b => b.toString(16).padStart(2, "0")).join(""));
    }
    void computeHash();
  }, [receipt]);

  const { color } = riskLabel(receipt.composite);
  const protocolLink = buildProtocolLink(receipt.protocol.id);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start py-8 px-4" style={{ background: "var(--bg-gradient)" }}>
      <div className="w-full max-w-xl flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/20 border border-[var(--accent)]/30 flex items-center justify-center">
              <Shield size={14} className="text-[var(--accent)]" />
            </div>
            <span className="display font-bold text-[var(--ink)] text-base tracking-tight">ExitProof</span>
          </div>
          <span className="text-[10px] text-[var(--subtle)] border border-white/10 px-2 py-0.5 rounded-full">
            Shared receipt snapshot
          </span>
        </div>

        {/* Protocol hero */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="display text-xl font-bold text-[var(--ink)] leading-tight mb-0.5">
                {receipt.protocol.name}
              </h1>
              <p className="text-xs text-[var(--subtle)]">
                {receipt.protocol.category} · {receipt.protocol.chain} · TVL {receipt.protocol.tvl}
              </p>
            </div>
            <RiskGauge score={receipt.composite} size="md" />
          </div>

          {/* Factor bars */}
          <div className="flex flex-col gap-2">
            {(Object.entries(receipt.scores)).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--subtle)] w-36 shrink-0">{FACTOR_LABELS[key] ?? key}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${val}%`,
                      background: val < 45 ? "var(--success)" : val < 70 ? "#fb923c" : "var(--danger)",
                    }}
                  />
                </div>
                <span className={`text-xs font-bold tabular-nums w-8 text-right ${color}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/8 bg-white/4 px-3 py-2.5">
            <div className="text-[10px] text-[var(--subtle)] uppercase tracking-wider mb-0.5">Generated</div>
            <div className="text-xs font-medium text-[var(--ink-2)]">
              {new Date(receipt.generatedAt).toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg border border-white/8 bg-white/4 px-3 py-2.5">
            <div className="text-[10px] text-[var(--subtle)] uppercase tracking-wider mb-0.5">Evidence items</div>
            <div className="text-xs font-medium text-[var(--ink-2)]">{receipt.evidenceCount}</div>
          </div>
          <div className="col-span-2 rounded-lg border border-white/8 bg-white/4 px-3 py-2.5">
            <div className="text-[10px] text-[var(--subtle)] uppercase tracking-wider mb-0.5">Evidence coverage</div>
            <div className={`text-xs font-bold tabular-nums ${
              receipt.evidenceCoverage < 60 ? "text-[var(--danger)]"
              : receipt.evidenceCoverage < 80 ? "text-yellow-400"
              : "text-[var(--success)]"
            }`}>
              {receipt.evidenceCoverage}%
            </div>
          </div>
        </div>

        {/* Hash */}
        <div className="rounded-xl border border-white/8 bg-white/4 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Hash size={11} className="text-[var(--subtle)]" />
            <span className="text-[10px] text-[var(--subtle)] uppercase tracking-wider">
              SHA-256 of this snapshot
            </span>
          </div>
          <p className="mono text-[10px] text-[var(--ink-2)] break-all leading-relaxed">
            {hash ?? "Computing…"}
          </p>
          <p className="text-[10px] text-[var(--subtle)] mt-1.5">
            To verify: compare this hash against any on-chain anchor for this protocol in the ExitProof registry.
          </p>
        </div>

        {/* Warnings */}
        {receipt.warnings.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {receipt.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-3 py-2">
                <AlertCircle size={11} className="text-[var(--danger)] mt-0.5 shrink-0" />
                <p className="text-[10px] text-[var(--muted)]">{w}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={protocolLink}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
          >
            <ExternalLink size={12} />
            Open live analysis
          </a>
          <ShareButton url={window.location.href} label="Copy snapshot link" />
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl border border-[var(--danger)]/15 bg-[var(--danger)]/5 px-4 py-3">
          <p className="text-[10px] text-[var(--subtle)] text-pretty">{receipt.disclaimer}</p>
        </div>

        <footer className="text-center text-[10px] text-[var(--subtle)] py-2">
          ExitProof · Snapshot embedded in URL · Not financial advice
        </footer>
      </div>
    </div>
  );
}
