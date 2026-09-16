'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/theme-context';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, isHydrated } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-300 transition-all duration-200 hover:border-amber-500/50 hover:bg-zinc-800 hover:text-amber-400 hover:scale-[1.05] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {!isHydrated ? (
        <span className="h-4 w-4" />
      ) : theme === 'dark' ? (
        <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 hover:rotate-45 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 -rotate-12 hover:rotate-0 text-zinc-800" />
      )}
    </button>
  );
}
