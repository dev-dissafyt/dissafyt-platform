'use client';

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-amber-500 focus:text-black focus:font-extrabold focus:text-xs focus:uppercase focus:tracking-wider focus:shadow-2xl focus:outline-none focus:ring-2 focus:ring-black no-print"
    >
      Skip to main content
    </a>
  );
}
