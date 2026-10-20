import { useState } from "react";
import { Shield, ExternalLink, CheckCircle, Loader } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { toast } from "sonner";
import { ConnectKitButton } from "connectkit";
import { REGISTRY_ADDRESS, REGISTRY_ABI, REGISTRY_EXPLORER } from "../lib/registry";

type Props = {
  hash: string;
  protocolId: string;
  onAnchored?: (hash: string) => void;
};

export function AnchorPanel({ hash, protocolId, onAnchored }: Props) {
  const { isConnected } = useAccount();
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const { writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
  });

  const isDeployed = REGISTRY_ADDRESS.length > 2;

  function handleAnchor() {
    if (!isDeployed) {
      toast.error("Registry contract not yet deployed.");
      return;
    }
    const bytes32Hash = hash as `0x${string}`;
    writeContract(
      {
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: "anchorReceipt",
        args: [bytes32Hash, protocolId],
      },
      {
        onSuccess: (h) => {
          setTxHash(h);
          toast.success("Transaction submitted");
          onAnchored?.(hash);
        },
        onError: (e) => {
          toast.error(e.message.slice(0, 80));
        },
      }
    );
  }

  if (!isDeployed) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/4 p-4 text-center">
        <Shield size={24} className="text-[var(--subtle)] mx-auto mb-2" />
        <p className="text-sm text-[var(--muted)]">
          Registry contract not yet deployed. Deploy it to enable on-chain anchoring.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 p-4">
        <p className="text-sm text-[var(--muted)] text-center">
          Connect your wallet to anchor this receipt on Arc Testnet.
        </p>
        <ConnectKitButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-white/8 bg-white/4 p-3">
        <div className="text-[10px] text-[var(--subtle)] uppercase tracking-wider mb-1">
          Receipt hash
        </div>
        <p className="mono text-[10px] text-[var(--ink-2)] break-all">
          {hash}
        </p>
      </div>

      {isSuccess && txHash ? (
        <div className="rounded-xl border border-[var(--success)]/30 bg-[var(--success)]/10 p-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-[var(--success)] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--success)]">Anchored on-chain</p>
            <a
              href={`${REGISTRY_EXPLORER}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              View transaction <ExternalLink size={10} />
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={handleAnchor}
          disabled={isPending || isConfirming}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-sm font-semibold hover:bg-[var(--accent)]/25 transition-all disabled:opacity-50 active:scale-95"
        >
          {isPending || isConfirming ? (
            <>
              <Loader size={14} className="animate-spin" />
              {isConfirming ? "Confirming…" : "Awaiting signature…"}
            </>
          ) : (
            <>
              <Shield size={14} />
              Anchor on Arc Testnet
            </>
          )}
        </button>
      )}
    </div>
  );
}
