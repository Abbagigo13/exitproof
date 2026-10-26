/**
 * MyReceiptsPage — shows all receipts anchored and NFTs minted by the connected wallet.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { ConnectKitButton } from "connectkit";
import {
  ArrowLeft, ShieldCheck, Image, ExternalLink, Loader,
  AlertTriangle, Hash, Clock, CheckCircle, XCircle,
} from "lucide-react";
import { AppShell } from "../components/AppShell";
import { useMyReceipts } from "../hooks/useMyReceipts";
import { REGISTRY_EXPLORER, REGISTRY_ADDRESS, RECEIPT_NFT_EXPLORER, RECEIPT_NFT_ADDRESS } from "../lib/registry";

function timeAgo(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MyReceiptsPage() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { anchored, nfts, loading, error, fetch } = useMyReceipts();

  useEffect(() => {
    if (address) void fetch(address);
  }, [address, fetch]);

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
          <h1 className="display font-bold text-[var(--ink)] text-lg tracking-tight">My Receipts</h1>
        </div>

        {/* Not connected */}
        {!isConnected && (
          <div className="rounded-2xl border border-white/10 bg-white/4 p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center">
              <ShieldCheck size={20} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--ink-2)] mb-1">Connect your wallet</p>
              <p className="text-xs text-[var(--subtle)] text-pretty max-w-xs">
                Connect to see all risk receipts you have anchored on Arc Mainnet and any NFTs you have minted.
              </p>
            </div>
            <ConnectKitButton />
          </div>
        )}

        {/* Loading */}
        {isConnected && loading && (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)] py-8">
            <Loader size={14} className="animate-spin text-[var(--accent)]" />
            Loading your on-chain receipts…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-[var(--danger)] shrink-0" />
            <p className="text-xs text-[var(--danger)]">{error}</p>
          </div>
        )}

        {/* Anchored receipts */}
        {isConnected && !loading && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="display font-bold text-[var(--ink)] text-base tracking-tight flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--accent)]" />
                Anchored receipts
                <span className="text-[10px] text-[var(--subtle)] bg-white/5 border border-white/8 px-2 py-0.5 rounded-full font-normal">
                  {anchored.length}
                </span>
              </h2>
            </div>

            {anchored.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/4 p-8 text-center flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Hash size={16} className="text-[var(--subtle)]" />
                </div>
                <p className="text-sm font-semibold text-[var(--ink-2)]">No receipts anchored yet</p>
                <p className="text-xs text-[var(--subtle)] max-w-xs text-pretty">
                  Anchor your first risk receipt from the Dashboard — pick a protocol, go to the Receipt tab, compute the hash, and anchor it on Arc Mainnet.
                </p>
                <button
                  onClick={() => { void navigate("/dashboard"); }}
                  className="text-xs text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/8 px-3 py-1.5 rounded-lg hover:bg-[var(--accent)]/15 transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {anchored.map(r => (
                  <div
                    key={r.hash}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-white/8 bg-white/4 hover:border-white/12 transition-all"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      r.revoked
                        ? "bg-[var(--danger)]/15 border border-[var(--danger)]/25"
                        : "bg-[var(--success)]/15 border border-[var(--success)]/25"
                    }`}>
                      {r.revoked
                        ? <XCircle size={14} className="text-[var(--danger)]" />
                        : <CheckCircle size={14} className="text-[var(--success)]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--ink-2)] truncate">{r.protocolRef || "Unknown protocol"}</span>
                        {r.revoked && (
                          <span className="text-[9px] font-bold text-[var(--danger)] bg-[var(--danger)]/15 border border-[var(--danger)]/25 px-1.5 py-0.5 rounded-full shrink-0">REVOKED</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="font-mono text-[10px] text-[var(--subtle)]">
                          {r.hash.slice(0, 10)}…{r.hash.slice(-6)}
                        </span>
                        {r.timestamp > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--subtle)]">
                            <Clock size={9} />
                            {timeAgo(r.timestamp)}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={`${REGISTRY_EXPLORER}/address/${REGISTRY_ADDRESS}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--subtle)] hover:text-[var(--accent)] transition-colors shrink-0"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Minted NFTs */}
        {isConnected && !loading && nfts.length > 0 && (
          <div>
            <h2 className="display font-bold text-[var(--ink)] text-base tracking-tight flex items-center gap-2 mb-4">
              <Image size={16} className="text-[var(--accent)]" />
              Receipt NFTs minted
              <span className="text-[10px] text-[var(--subtle)] bg-white/5 border border-white/8 px-2 py-0.5 rounded-full font-normal">
                {nfts.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nfts.map(nft => (
                <div
                  key={nft.tokenId}
                  className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--accent)]">Token #{nft.tokenId}</span>
                    <a
                      href={`${RECEIPT_NFT_EXPLORER}/address/${RECEIPT_NFT_ADDRESS}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--subtle)] hover:text-[var(--accent)] transition-colors"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <p className="text-sm font-semibold text-[var(--ink-2)]">{nft.protocolRef || "Unknown protocol"}</p>
                  <span className="font-mono text-[9px] text-[var(--subtle)] truncate">
                    {nft.receiptHash.slice(0, 14)}…{nft.receiptHash.slice(-8)}
                  </span>
                  <a
                    href={`${RECEIPT_NFT_EXPLORER}/tx/${nft.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[9px] text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    View mint tx <ExternalLink size={9} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
