'use client';

import { Calendar } from 'lucide-react';

interface LastUpdatedProps {
  date?: string;
  className?: string;
  prefix?: string;
}

export function LastUpdatedBadge({
  date = 'September 15, 2026',
  className = '',
  prefix = 'Updated',
}: LastUpdatedProps) {
  return (
    <div
      className={`inline-flex items-center space-x-1.5 rounded-full border border-zinc-800/80 bg-zinc-900/60 px-3 py-1 text-[11px] font-mono text-zinc-400 ${className}`}
    >
      <Calendar className="h-3 w-3 text-amber-500/80" />
      <span>
        {prefix}: <strong className="text-zinc-200 font-semibold">{date}</strong>
      </span>
    </div>
  );
}
