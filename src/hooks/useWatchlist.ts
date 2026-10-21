/**
 * useWatchlist — localStorage-backed protocol watchlist with risk alert thresholds.
 *
 * Each entry stores: protocolId, alertThreshold, lastAlertedScore.
 * On every protocol data refresh, the hook compares current scores to thresholds.
 * When a threshold is crossed, it surfaces an "alert" flag on the entry.
 */

import { useCallback, useEffect, useState } from "react";
import { computeComposite } from "../data/protocols";
import type { Protocol } from "../data/protocols";

const STORAGE_KEY = "exitproof_watchlist_v1";

export interface WatchEntry {
  protocolId: string;
  alertThreshold: number;  // 0-100: alert when score >= this value
  addedAt: number;         // epoch ms
  lastAlertedScore?: number;
}

export interface WatchEntryWithState extends WatchEntry {
  isAlerting: boolean;    // current score >= threshold
  currentScore: number;
}

function load(): WatchEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: WatchEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* quota */ }
}

export function useWatchlist(protocols: Protocol[]) {
  const [entries, setEntries] = useState<WatchEntry[]>(() => load());

  // Persist on change
  useEffect(() => { save(entries); }, [entries]);

  const add = useCallback((protocolId: string, threshold = 50) => {
    setEntries(prev => {
      if (prev.some(e => e.protocolId === protocolId)) return prev;
      return [...prev, { protocolId, alertThreshold: threshold, addedAt: Date.now() }];
    });
  }, []);

  const remove = useCallback((protocolId: string) => {
    setEntries(prev => prev.filter(e => e.protocolId !== protocolId));
  }, []);

  const setThreshold = useCallback((protocolId: string, threshold: number) => {
    setEntries(prev => prev.map(e =>
      e.protocolId === protocolId ? { ...e, alertThreshold: threshold } : e
    ));
  }, []);

  const isWatched = useCallback((protocolId: string) =>
    entries.some(e => e.protocolId === protocolId), [entries]);

  // Join entries with live protocol data
  const entriesWithState: WatchEntryWithState[] = entries
    .map(entry => {
      const protocol = protocols.find(p => p.id === entry.protocolId);
      if (!protocol) return null;
      const score = computeComposite(protocol.scores);
      return {
        ...entry,
        isAlerting: score >= entry.alertThreshold,
        currentScore: score,
      };
    })
    .filter((e): e is WatchEntryWithState => e !== null);

  const alertCount = entriesWithState.filter(e => e.isAlerting).length;

  return { entries: entriesWithState, add, remove, setThreshold, isWatched, alertCount };
}
