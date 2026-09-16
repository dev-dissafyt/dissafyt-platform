'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 350);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      id="scroll-to-top"
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-6 right-20 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/90 text-zinc-300 shadow-xl backdrop-blur transition-all duration-200 hover:border-amber-500/50 hover:bg-zinc-900 hover:text-amber-400 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 animate-in fade-in zoom-in-75 duration-200 no-print"
      aria-label="Scroll back to top"
      title="Scroll back to top"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
