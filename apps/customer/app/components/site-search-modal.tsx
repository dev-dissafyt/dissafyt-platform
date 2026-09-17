'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Scissors, ShoppingBag, Loader2, Sparkles } from 'lucide-react';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'STREETWEAR' | 'BARBERSHOP';
  href: string;
  price?: string;
}

export function SiteSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cmsItems, setCmsItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    function handleCustomOpen() {
      setIsOpen(true);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open_site_search', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open_site_search', handleCustomOpen);
    };
  }, [isOpen]);

  // Fetch live CMS products & services whenever modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);

      // Fetch live CMS items
      let isSubscribed = true;
      setLoading(true);
      fetch('/api/search')
        .then((res) => (res.ok ? res.json() : []))
        .then((data: SearchResult[]) => {
          if (isSubscribed) {
            setCmsItems(data);
          }
        })
        .catch((err) => {
          console.error('Failed to load CMS search items:', err);
        })
        .finally(() => {
          if (isSubscribed) setLoading(false);
        });

      return () => {
        isSubscribed = false;
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter items exclusively against active CMS products and services
  const filteredItems = query.trim() === ''
    ? cmsItems
    : cmsItems.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.price && item.price.toLowerCase().includes(q))
        );
      });

  // Handle arrow key navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      const target = filteredItems[selectedIndex];
      setIsOpen(false);
      router.push(target.href);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 no-print">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Command Palette Card */}
      <div
        className="relative z-50 w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-150 text-white"
        role="dialog"
        aria-modal="true"
        aria-label="CMS Product and Service Search"
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-zinc-800 px-4 py-3.5 space-x-3">
          {loading ? (
            <Loader2 className="h-5 w-5 text-amber-500 animate-spin flex-shrink-0" />
          ) : (
            <Search className="h-5 w-5 text-amber-500 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search CMS products & services... (Cmd + K)"
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-zinc-500 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-900">
          {loading && cmsItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <Loader2 className="mx-auto h-6 w-6 text-amber-500 animate-spin" />
              <p className="text-xs text-zinc-400">Querying live CMS catalog...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <p className="text-sm font-medium text-zinc-300">
                No products or services found in CMS matching &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Search queries strictly against active garments in our streetwear lab and scheduled barbershop cuts.
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-3 transition-colors ${
                    isSelected ? 'bg-amber-500/15 text-white' : 'hover:bg-zinc-900/80 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex-shrink-0">
                      {item.category === 'STREETWEAR' ? (
                        <ShoppingBag className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Scissors className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-tight truncate text-white">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
                    {item.price && (
                      <span className="font-mono text-xs font-bold text-amber-400">
                        {item.price}
                      </span>
                    )}
                    <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                      {item.category}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-900/40 px-4 py-2.5 text-[11px] font-mono text-zinc-500">
          <div className="flex items-center space-x-3">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-amber-500/80 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> CMS CATALOG SEARCH
          </span>
        </div>
      </div>
    </div>
  );
}
