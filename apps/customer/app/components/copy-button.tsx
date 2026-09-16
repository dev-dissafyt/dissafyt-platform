'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
}

export function CopyButton({ text, className = '', label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-mono text-zinc-300 transition-all hover:border-amber-500/40 hover:bg-zinc-800 hover:text-white active:scale-95 ${className}`}
      aria-label={copied ? 'Copied to clipboard' : 'Copy to clipboard'}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] text-emerald-400 font-semibold">Copied!</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-zinc-400" />
          {label && <span className="text-[11px]">{label}</span>}
        </>
      )}
    </button>
  );
}
