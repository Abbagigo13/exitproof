/**
 * Share URL helpers for ExitProof.
 *
 * Two URL formats:
 *  - Protocol link:  ?protocol=<protocolId>
 *    Opens the app on that protocol's detail view.
 *
 *  - Receipt snapshot: ?receipt=<base64url-encoded-JSON>
 *    Embeds a full RiskReceipt snapshot in the URL. Read-only; no server needed.
 *    Keeps the URL short by omitting evidence detail in the shareable snapshot.
 */

import type { RiskReceipt } from "./receipt";

// ---- protocol link ----------------------------------------------------------

export function buildProtocolLink(protocolId: string): string {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("protocol", protocolId);
  return url.toString();
}

export function getProtocolFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("protocol");
}

// ---- receipt snapshot link --------------------------------------------------

/** Shareable subset — omit full evidence list to keep URL under ~2 KB */
export type ShareableReceipt = Omit<RiskReceipt, "evidence"> & {
  evidenceCount: number;
};

export function buildReceiptLink(receipt: RiskReceipt): string {
  const { evidence: _evidence, ...rest } = receipt;
  const shareable: ShareableReceipt = {
    ...rest,
    evidenceCount: receipt.evidence.length,
  };

  const json = JSON.stringify(shareable);
  const b64 = btoa(encodeURIComponent(json));
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("receipt", b64);
  return url.toString();
}

export function getReceiptFromUrl(): ShareableReceipt | null {
  const raw = new URLSearchParams(window.location.search).get("receipt");
  if (!raw) return null;
  try {
    const json = decodeURIComponent(atob(raw));
    return JSON.parse(json) as ShareableReceipt;
  } catch {
    return null;
  }
}
