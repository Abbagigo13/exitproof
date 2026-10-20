import { useState } from "react";
import { Share2, Check, Link } from "lucide-react";
import { toast } from "sonner";

type Props = {
  url: string;
  label?: string;
  className?: string;
};

export function ShareButton({ url, label = "Copy link", className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={() => { void handleCopy(); }}
      className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
        copied
          ? "text-[var(--success)]"
          : "text-[var(--subtle)] hover:text-[var(--muted)]"
      } ${className}`}
      title={url}
    >
      {copied ? (
        <Check size={12} className="shrink-0" />
      ) : label === "" ? (
        <Share2 size={12} className="shrink-0" />
      ) : (
        <Link size={12} className="shrink-0" />
      )}
      {label && (copied ? "Copied!" : label)}
    </button>
  );
}
