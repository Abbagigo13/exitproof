/**
 * PremiumGate — wraps any content behind a 1 USDC paywall.
 * On Arc Testnet the user pays 1 USDC (ERC-20 transfer) to the treasury.
 * Once the transaction is confirmed, the content is revealed and access is
 * persisted in localStorage for this wallet + protocol combination.
 */
import { useState } from "react";
import { Lock, Unlock, Loader, ExternalLink, BadgeCheck, Coins } from "lucide-react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { erc20Abi } from "viem";
import { ConnectKitButton } from "connectkit";
import { toast } from "sonner";
import { getUsdc, buildTxExplorerUrl } from "@/onchain-facts";
import { parseAmount } from "@/onchain-money";
import { usePremiumAccess } from "../hooks/usePremiumAccess";

// Arc Testnet
const TARGET_CHAIN_ID = 5042002;

// Treasury: platform deployer wallet (testnet demo)
const TREASURY = "0x5B12Ce46C7194aD57d143bC22847224047b1Ef42" as const;

const usdcFact = getUsdc(TARGET_CHAIN_ID);
const USDC_ADDRESS = usdcFact?.address as `0x${string}`;
const PREMIUM_AMOUNT = "1"; // 1 USDC

type Props = {
  protocolId: string;
  protocolName: string;
  featureLabel: string;
  children: React.ReactNode;
};

export function PremiumGate({ protocolId, protocolName, featureLabel, children }: Props) {
  const { isConnected, chainId, address } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { hasAccess, grantAccess } = usePremiumAccess(protocolId);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Grant access once tx is confirmed
  if (isSuccess && txHash && !hasAccess) {
    grantAccess();
  }

  if (hasAccess) return <>{children}</>;

  const isWrongChain = isConnected && chainId !== TARGET_CHAIN_ID;

  function handlePay() {
    if (!address || !USDC_ADDRESS) return;
    if (isWrongChain) {
      switchChain({ chainId: TARGET_CHAIN_ID });
      return;
    }
    const amount = parseAmount(TARGET_CHAIN_ID, PREMIUM_AMOUNT);
    writeContract(
      {
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "transfer",
        args: [TREASURY, amount.raw],
        chainId: TARGET_CHAIN_ID,
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
          toast.success("Payment submitted — awaiting confirmation…");
        },
        onError: (e) => {
          const msg = e.message ?? "";
          if (msg.toLowerCase().includes("user rejected")) return;
          toast.error(msg.slice(0, 90));
        },
      }
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--accent)]/20 bg-white/3 overflow-hidden">
      {/* Blurred preview of gated content */}
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-30 max-h-40 overflow-hidden p-4">
          {children}
        </div>
        {/* Gradient fade over preview */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1b2f]/60 to-[#0d1b2f]/95" />
      </div>

      {/* Gate card */}
      <div className="p-5 flex flex-col items-center gap-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center">
          <Lock size={18} className="text-[var(--accent)]" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)] mb-1">
            {featureLabel}
          </h3>
          <p className="text-xs text-[var(--muted)] max-w-xs">
            Unlock premium access for <span className="font-semibold text-[var(--ink-2)]">{protocolName}</span> for a one-time payment of <span className="font-semibold text-[var(--accent)]">1 USDC</span> on Arc Testnet.
          </p>
        </div>

        {/* What you get */}
        <div className="flex flex-wrap gap-2 justify-center">
          {["Full evidence detail", "PDF receipt export", "Verified badge"].map(f => (
            <span
              key={f}
              className="flex items-center gap-1 text-[10px] text-[var(--muted)] border border-white/10 bg-white/4 px-2.5 py-1 rounded-full"
            >
              <BadgeCheck size={9} className="text-[var(--accent)]" />
              {f}
            </span>
          ))}
        </div>

        {/* CTA area */}
        {!isConnected ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-[var(--subtle)]">Connect your wallet to pay</p>
            <ConnectKitButton />
          </div>
        ) : isWrongChain ? (
          <button
            onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
            disabled={isSwitching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/25 transition-all disabled:opacity-50"
          >
            {isSwitching ? <Loader size={14} className="animate-spin" /> : null}
            Switch to Arc Testnet
          </button>
        ) : isSuccess && txHash ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-[var(--success)] text-sm font-semibold">
              <Unlock size={15} />
              Access unlocked
            </div>
            <a
              href={buildTxExplorerUrl(TARGET_CHAIN_ID, txHash)}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              View transaction <ExternalLink size={9} />
            </a>
          </div>
        ) : isConfirming ? (
          <div className="flex items-center gap-2 text-[var(--muted)] text-sm">
            <Loader size={14} className="animate-spin text-[var(--accent)]" />
            Confirming payment…
          </div>
        ) : (
          <button
            onClick={handlePay}
            disabled={isPending || !USDC_ADDRESS}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-sm font-semibold hover:bg-[var(--accent)]/25 transition-all disabled:opacity-50 active:scale-95"
          >
            {isPending ? (
              <><Loader size={14} className="animate-spin" /> Awaiting signature…</>
            ) : (
              <><Coins size={14} /> Pay 1 USDC to unlock</>
            )}
          </button>
        )}

        <p className="text-[9px] text-[var(--subtle)]">
          Testnet demo — no real funds. Get test USDC from the sidebar.
        </p>
      </div>
    </div>
  );
}
