'use client';

import { useEffect, useState } from 'react';

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setProgress(0);
        return;
      }
      const currentProgress = (window.scrollY / totalHeight) * 100;
      setProgress(Math.min(100, Math.max(0, currentProgress)));
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (progress <= 0) return null;

  return (
    <div
      id="scroll-progress"
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-transparent pointer-events-none no-print"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-200 transition-all duration-75 ease-out shadow-[0_0_8px_rgba(245,158,11,0.6)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
