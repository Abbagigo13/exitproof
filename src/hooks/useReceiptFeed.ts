/**
 * useReceiptFeed — polls the RiskReceiptRegistry for ReceiptAnchored events.
 *
 * Uses eth_getLogs with a bounded lookback (last 50,000 blocks ≈ ~7 hours on Arc).
 * Polls every 10s to show new anchors as they land.
 *
 * No indexer, no backend — pure Arc RPC.
 */

import { useEffect, useRef, useState } from "react";
import { createPublicClient, http, parseAbiItem } from "viem";
import { requireChain } from "@/onchain-facts";
import { REGISTRY_ADDRESS, REGISTRY_CHAIN_ID } from "../lib/registry";

const LOOKBACK_BLOCKS = 5_000n;  // Arc Mainnet RPC rejects ranges > ~10k blocks
const POLL_INTERVAL_MS = 10_000;
const MAX_EVENTS = 50;

const arcChainFact = requireChain(REGISTRY_CHAIN_ID);
const arcViemChain = {
  id: arcChainFact.chainId,
  name: arcChainFact.name,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: arcChainFact.nativeCurrency.decimals },
  rpcUrls: { default: { http: arcChainFact.rpcUrls as [string, ...string[]] } },
};

const publicClient = createPublicClient({
  chain: arcViemChain,
  transport: http(arcChainFact.rpcUrls[0]),
});

const ANCHORED_EVENT = parseAbiItem(
  "event ReceiptAnchored(address indexed anchorer, bytes32 indexed receiptHash, string protocolRef, uint256 timestamp)"
);

export interface FeedEvent {
  id: string;
  anchorer: string;
  receiptHash: string;
  protocolRef: string;
  timestamp: number;
  blockNumber: bigint;
  txHash: string;
}

export interface ReceiptFeedState {
  events: FeedEvent[];
  loading: boolean;
  error: string | null;
  lastBlock: bigint | null;
  totalOnChain: number | null;
  refresh: () => void;
}

export function useReceiptFeed(): ReceiptFeedState {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastBlock, setLastBlock] = useState<bigint | null>(null);
  const [totalOnChain, setTotalOnChain] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seenRef = useRef<Set<string>>(new Set());

  async function fetchEvents() {
    try {
      const head = await publicClient.getBlockNumber();
      const fromBlock = head > LOOKBACK_BLOCKS ? head - LOOKBACK_BLOCKS : 0n;

      const logs = await publicClient.getLogs({
        address: REGISTRY_ADDRESS,
        event: ANCHORED_EVENT,
        fromBlock,
        toBlock: head,
      });

      const newEvents: FeedEvent[] = [];
      for (const log of logs) {
        const key = `${log.transactionHash}-${String(log.logIndex)}`;
        if (seenRef.current.has(key)) continue;
        seenRef.current.add(key);
        const args = log.args as {
          anchorer: `0x${string}`;
          receiptHash: `0x${string}`;
          protocolRef: string;
          timestamp: bigint;
        };
        newEvents.push({
          id: key,
          anchorer: args.anchorer,
          receiptHash: args.receiptHash,
          protocolRef: args.protocolRef,
          timestamp: Number(args.timestamp),
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? "",
        });
      }

      if (newEvents.length > 0) {
        setEvents(prev => {
          const merged = [...newEvents, ...prev].slice(0, MAX_EVENTS);
          // sort newest first
          return merged.sort((a, b) => b.timestamp - a.timestamp);
        });
      }

      setLastBlock(head);
      setError(null);

      // Also fetch total receipt count from contract
      try {
        const total = await publicClient.readContract({
          address: REGISTRY_ADDRESS,
          abi: [{ name: "totalReceipts", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }],
          functionName: "totalReceipts",
        });
        setTotalOnChain(Number(total));
      } catch {
        // non-critical
      }

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Suppress noisy RPC range errors — just retry silently on next poll
      const isRangeError = msg.includes("eth_getLogs") || msg.includes("block range") ||
        msg.includes("too many") || msg.includes("limit") || msg.includes("Request failed");
      if (!isRangeError) setError(msg.slice(0, 100));
      // On range errors keep any events we already have, don't clear the feed
    } finally {
      setLoading(false);
    }
  }

  function refresh() {
    setLoading(true);
    seenRef.current.clear();
    setEvents([]);
    void fetchEvents();
  }

  useEffect(() => {
    void fetchEvents();
    intervalRef.current = setInterval(() => { void fetchEvents(); }, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, loading, error, lastBlock, totalOnChain, refresh };
}
