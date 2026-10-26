/**
 * useMyReceipts — reads all ReceiptAnchored and ReceiptNFTMinted events
 * for the connected wallet from Arc Mainnet.
 *
 * Uses getReceiptsByAnchorer() from the registry (O(1) call) for the
 * anchored hashes, then fetches each receipt's metadata via getReceipt().
 * NFT mints are read from ReceiptNFTMinted events in the last 50k blocks.
 */
import { useState, useCallback } from "react";
import { createPublicClient, http, parseAbiItem } from "viem";
import { requireChain } from "@/onchain-facts";
import { REGISTRY_ADDRESS, REGISTRY_CHAIN_ID, REGISTRY_ABI, RECEIPT_NFT_ADDRESS, RECEIPT_NFT_CHAIN_ID } from "../lib/registry";

const arcFact = requireChain(REGISTRY_CHAIN_ID);
const arcViemChain = {
  id: arcFact.chainId,
  name: arcFact.name,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: arcFact.nativeCurrency.decimals },
  rpcUrls: { default: { http: arcFact.rpcUrls as [string, ...string[]] } },
};
const client = createPublicClient({ chain: arcViemChain, transport: http(arcFact.rpcUrls[0]) });

const NFT_MINTED_EVENT = parseAbiItem(
  "event ReceiptNFTMinted(address indexed minter, uint256 indexed tokenId, bytes32 receiptHash, string protocolRef)"
);

export interface AnchoredReceipt {
  hash: string;
  protocolRef: string;
  timestamp: number;
  revoked: boolean;
  txHash?: string;
}

export interface MintedNFT {
  tokenId: string;
  receiptHash: string;
  protocolRef: string;
  txHash: string;
}

export interface MyReceiptsState {
  anchored: AnchoredReceipt[];
  nfts: MintedNFT[];
  loading: boolean;
  error: string | null;
  fetch: (address: `0x${string}`) => Promise<void>;
}

export function useMyReceipts(): MyReceiptsState {
  const [anchored, setAnchored] = useState<AnchoredReceipt[]>([]);
  const [nfts, setNfts] = useState<MintedNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (address: `0x${string}`) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get all hashes anchored by this wallet
      const hashes = await client.readContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: "getReceiptsByAnchorer",
        args: [address],
      }) as `0x${string}`[];

      // 2. Fetch metadata for each hash
      const receipts: AnchoredReceipt[] = [];
      for (const hash of hashes.slice(0, 20)) { // cap at 20 to avoid RPC spam
        try {
          const data = await client.readContract({
            address: REGISTRY_ADDRESS,
            abi: REGISTRY_ABI,
            functionName: "getReceipt",
            args: [hash],
          }) as readonly [string, bigint, string, boolean];
          receipts.push({
            hash,
            protocolRef: data[2],
            timestamp: Number(data[1]),
            revoked: data[3],
          });
        } catch { /* skip this receipt */ }
      }
      receipts.sort((a, b) => b.timestamp - a.timestamp);
      setAnchored(receipts);

      // 3. Get NFTs minted by this wallet (last 5k blocks)
      try {
        const head = await client.getBlockNumber();
        const fromBlock = head > 5_000n ? head - 5_000n : 0n;
        // Only query NFT contract if it's on same chain
        if (RECEIPT_NFT_CHAIN_ID === REGISTRY_CHAIN_ID) {
          const logs = await client.getLogs({
            address: RECEIPT_NFT_ADDRESS,
            event: NFT_MINTED_EVENT,
            args: { minter: address },
            fromBlock,
            toBlock: head,
          });
          const minted: MintedNFT[] = logs.map(log => ({
            tokenId: (log.args as { tokenId: bigint }).tokenId?.toString() ?? "?",
            receiptHash: (log.args as { receiptHash: `0x${string}` }).receiptHash ?? "",
            protocolRef: (log.args as { protocolRef: string }).protocolRef ?? "",
            txHash: log.transactionHash ?? "",
          }));
          setNfts(minted);
        }
      } catch { /* NFT logs optional */ }

    } catch (e) {
      setError(e instanceof Error ? e.message.slice(0, 120) : "Failed to load receipts");
    } finally {
      setLoading(false);
    }
  }, []);

  return { anchored, nfts, loading, error, fetch };
}
