/**
 * useArcBlock — polls eth_blockNumber on Arc every 500ms.
 * Shows sub-second finality in action.
 */
import { useEffect, useRef, useState } from "react";
import { createPublicClient, http } from "viem";
import { requireChain } from "@/onchain-facts";
import { REGISTRY_CHAIN_ID } from "../lib/registry";

const arcFact = requireChain(REGISTRY_CHAIN_ID);
const arcViemChain = {
  id: arcFact.chainId,
  name: arcFact.name,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: arcFact.nativeCurrency.decimals },
  rpcUrls: { default: { http: arcFact.rpcUrls as [string, ...string[]] } },
};
const client = createPublicClient({ chain: arcViemChain, transport: http(arcFact.rpcUrls[0]) });

export function useArcBlock() {
  const [block, setBlock] = useState<bigint | null>(null);
  const [tps, setTps] = useState<number | null>(null);
  const prevRef = useRef<{ block: bigint; time: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const n = await client.getBlockNumber();
        if (!active) return;
        const now = Date.now();
        if (prevRef.current) {
          const blockDiff = Number(n - prevRef.current.block);
          const timeDiff = (now - prevRef.current.time) / 1000;
          if (blockDiff > 0 && timeDiff > 0) {
            setTps(Math.round(blockDiff / timeDiff * 10) / 10);
          }
        }
        prevRef.current = { block: n, time: now };
        setBlock(n);
      } catch { /* ignore */ }
    }
    void poll();
    intervalRef.current = setInterval(() => { void poll(); }, 500);
    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { block, tps };
}
