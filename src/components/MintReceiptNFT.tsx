/**
 * MintReceiptNFT — mint an ERC-721 NFT from a computed receipt hash.
 *
 * Deployed on Arc Testnet: 0x53c0283587a2b2bb35cf150b926f6c9362f2adce
 * For mainnet: deploy ReceiptNFT.sol via Remix to Arc Mainnet and update NFT_ADDRESS.
 *
 * The token metadata is a fully on-chain data URI — no IPFS, no server.
 */
import { useMemo, useState } from "react";
import { Sparkles, ExternalLink, CheckCircle, Loader, Image } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { toast } from "sonner";
import { RECEIPT_NFT_ADDRESS, RECEIPT_NFT_CHAIN_ID, RECEIPT_NFT_EXPLORER } from "../lib/registry";
import { useGasEstimate } from "../hooks/useGasEstimate";
import { GasPill } from "./GasPill";

const NFT_ADDRESS = RECEIPT_NFT_ADDRESS;
const NFT_CHAIN_ID = RECEIPT_NFT_CHAIN_ID;
const NFT_EXPLORER = RECEIPT_NFT_EXPLORER;

const NFT_ABI = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "receiptHash", type: "bytes32" },
      { name: "protocolRef", type: "string" },
      { name: "riskLevel", type: "string" },
      { name: "riskScore", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "ReceiptNFTMinted",
    type: "event",
    inputs: [
      { name: "minter", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "receiptHash", type: "bytes32", indexed: false },
      { name: "protocolRef", type: "string", indexed: false },
    ],
  },
] as const;

interface Props {
  receiptHash: string;  // 0x-prefixed bytes32 hex
  protocolName: string;
  riskLevel: string;
  riskScore: number;
}

export function MintReceiptNFT({ receiptHash, protocolName, riskLevel, riskScore }: Props) {
  const { isConnected, chainId, address } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const gasTarget = useMemo(() => address
    ? { type: "premium" as const, from: address }  // same gas class as an ERC-20 transfer
    : null, [address]);
  const gas = useGasEstimate(isConnected ? gasTarget : null);

  const isWrongChain = isConnected && chainId !== NFT_CHAIN_ID;
  const isValidHash = /^0x[0-9a-fA-F]{64}$/.test(receiptHash);

  function handleMint() {
    if (!isValidHash) return;
    writeContract(
      {
        address: NFT_ADDRESS,
        abi: NFT_ABI,
        functionName: "mint",
        args: [
          receiptHash as `0x${string}`,
          protocolName,
          riskLevel,
          BigInt(riskScore),
        ],
        chainId: NFT_CHAIN_ID,
      },
      {
        onSuccess: (h) => {
          setTxHash(h);
          toast.success("NFT mint submitted!");
        },
        onError: (e) => {
          const msg = e.message ?? "";
          if (msg.toLowerCase().includes("user rejected")) return;
          toast.error(msg.slice(0, 80));
        },
      }
    );
  }

  if (!isValidHash) return null;

  return (
    <div className="rounded-2xl border border-[var(--accent)]/20 bg-white/3 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center shrink-0">
          <Image size={14} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--ink-2)]">Mint as Receipt NFT</p>
          <p className="text-[10px] text-[var(--subtle)]">On-chain metadata · {NFT_CHAIN_ID === 5042 ? "Arc Mainnet" : "Arc Testnet"} · No IPFS</p>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)] text-pretty">
        Mint an ERC-721 NFT whose metadata is the full risk receipt — stored entirely on-chain as a data URI.
        No server, no IPFS. The token proves you ran this assessment at this moment.
      </p>

      {/* Token preview */}
      <div className="rounded-xl border border-white/8 bg-white/4 p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--subtle)]">Protocol</span>
          <span className="text-[var(--ink-2)] font-medium">{protocolName}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--subtle)]">Risk level</span>
          <span className="text-[var(--ink-2)] font-medium">{riskLevel}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--subtle)]">Risk score</span>
          <span className="text-[var(--ink-2)] tabular-nums font-bold">{riskScore}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--subtle)]">Hash</span>
          <span className="font-mono text-[var(--accent)]">{receiptHash.slice(0, 10)}…{receiptHash.slice(-6)}</span>
        </div>
      </div>

      {/* CTA */}
      {!isConnected ? (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-[var(--subtle)]">Connect your wallet to mint</p>
          <ConnectKitButton />
        </div>
      ) : isWrongChain ? (
        <button
          onClick={() => switchChain({ chainId: NFT_CHAIN_ID })}
          disabled={isSwitching}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/25 transition-all disabled:opacity-50"
        >
          {isSwitching ? <Loader size={14} className="animate-spin" /> : null}
          Switch to {NFT_CHAIN_ID === 5042 ? "Arc Mainnet" : "Arc Testnet"}
        </button>
      ) : isSuccess && txHash ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-[var(--success)] text-sm font-semibold">
            <CheckCircle size={15} />
            NFT minted!
          </div>
          <a
            href={`${NFT_EXPLORER}/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            View on Arc Explorer <ExternalLink size={10} />
          </a>
        </div>
      ) : isConfirming ? (
        <div className="flex items-center justify-center gap-2 text-[var(--muted)] text-sm">
          <Loader size={14} className="animate-spin text-[var(--accent)]" />
          Confirming…
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <button
            onClick={handleMint}
            disabled={isPending}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] text-sm font-semibold hover:bg-[var(--accent)]/25 transition-all disabled:opacity-50 active:scale-95"
          >
            {isPending ? (
              <><Loader size={14} className="animate-spin" /> Awaiting signature…</>
            ) : (
              <><Sparkles size={14} /> Mint Receipt NFT</>
            )}
          </button>
          <div className="flex justify-center">
            <GasPill display={gas.display} loading={gas.loading} error={gas.error} />
          </div>
        </div>
      )}

      <p className="text-[9px] text-[var(--subtle)] text-center">
        {NFT_CHAIN_ID === 5042 ? "Arc Mainnet" : "Arc Testnet"} · Contract:{" "}
        <a href={`${NFT_EXPLORER}/address/${NFT_ADDRESS}`} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline font-mono">{NFT_ADDRESS.slice(0, 10)}…</a>
        {NFT_CHAIN_ID !== 5042 && " · Deploy ReceiptNFT.sol via Remix to Arc Mainnet to go live"}
      </p>
    </div>
  );
}
