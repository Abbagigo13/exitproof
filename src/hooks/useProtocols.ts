import { useState, useEffect, useCallback } from "react";
import { fetchTopProtocols } from "../lib/defiLlama";
import { PROTOCOLS as STATIC_PROTOCOLS } from "../data/protocols";
import type { Protocol } from "../data/protocols";

export type ProtocolSource = "live" | "fallback";

export interface UseProtocolsResult {
  protocols: Protocol[];
  loading: boolean;
  error: string | null;
  source: ProtocolSource;
  fetchedAt: Date | null;
  refresh: () => Promise<void>;
}

export function useProtocols(): UseProtocolsResult {
  const [protocols, setProtocols] = useState<Protocol[]>(STATIC_PROTOCOLS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ProtocolSource>("fallback");
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchTopProtocols(50);
    if (result.source === "live" && result.protocols.length > 0) {
      setProtocols(result.protocols);
      setSource("live");
      setError(null);
    } else {
      setProtocols(STATIC_PROTOCOLS);
      setSource("fallback");
      setError(result.error ?? "Could not reach DefiLlama — showing illustrative data.");
    }
    setFetchedAt(result.fetchedAt);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { protocols, loading, error, source, fetchedAt, refresh: load };
}
