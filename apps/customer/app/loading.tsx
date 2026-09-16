import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex min-h-[65vh] w-full flex-col items-center justify-center space-y-4 px-4 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Pulsing glow ring */}
        <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-xl animate-pulse" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-2.5 shadow-2xl">
          <Image
            src="/logo.png"
            alt="Dissafyt"
            width={48}
            height={48}
            className="h-full w-full object-contain brightness-110 animate-pulse"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="font-display text-sm font-bold uppercase tracking-widest text-white">
          Loading Dissafyt Platform
        </p>
        <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">
          CAPE TOWN FLAGSHIP // DUAL PILLAR
        </p>
      </div>
    </div>
  );
}
