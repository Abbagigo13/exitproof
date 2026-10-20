/**
 * usePremiumAccess — tracks whether the connected wallet has paid 1 USDC
 * for premium access to a specific protocol.
 *
 * Access is stored in localStorage keyed by `premium:<address>:<protocolId>`.
 * It is set after a confirmed USDC transfer to the treasury address.
 *
 * This is a testnet-friendly pattern: the trust anchor is the user's own
 * confirmed transaction. In production you would verify on-chain.
 */
import { useState, useCallback } from "react";
import { useAccount } from "wagmi";

const STORAGE_KEY_PREFIX = "premium";

function storageKey(address: string, protocolId: string): string {
  return `${STORAGE_KEY_PREFIX}:${address.toLowerCase()}:${protocolId}`;
}

export interface UsePremiumAccessResult {
  hasAccess: boolean;
  grantAccess: () => void;
}

export function usePremiumAccess(protocolId: string): UsePremiumAccessResult {
  const { address } = useAccount();

  const checkStorage = useCallback((): boolean => {
    if (!address) return false;
    return localStorage.getItem(storageKey(address, protocolId)) === "1";
  }, [address, protocolId]);

  const [hasAccess, setHasAccess] = useState<boolean>(() => checkStorage());

  const grantAccess = useCallback(() => {
    if (!address) return;
    localStorage.setItem(storageKey(address, protocolId), "1");
    setHasAccess(true);
  }, [address, protocolId]);

  return { hasAccess, grantAccess };
}
