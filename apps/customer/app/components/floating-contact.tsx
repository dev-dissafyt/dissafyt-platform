'use client';

import { useState } from 'react';
import { MessageSquare, X, Phone, Clock, MapPin, ArrowUpRight } from 'lucide-react';

export function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappUrl = 'https://wa.me/27818082570?text=' + encodeURIComponent('Hi Dissafyt Concierge, I have an inquiry regarding garments / barbershop chair booking.');

  return (
    <div id="floating-contact" className="fixed bottom-6 right-6 z-40 no-print">
      {/* Popover Card */}
      {isOpen && (
        <div className="mb-3 w-80 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-xl p-5 text-white animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                FLAGSHIP CONCIERGE
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors p-1"
              aria-label="Close concierge card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="pt-3 space-y-3">
            <p className="text-xs text-zinc-300 leading-relaxed">
              Need immediate assistance with a booking, sizing questions, or order fulfillment? Connect directly with our studio desk:
            </p>

            {/* WhatsApp Link */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all hover:scale-[1.02] active:scale-98"
            >
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="h-4 w-4 text-emerald-400" />
                <div className="text-left">
                  <div className="text-xs font-bold text-white">WhatsApp Concierge</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Instant response</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            </a>

            {/* Phone Call Link */}
            <a
              href="tel:+27818082570"
              className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-all hover:scale-[1.02] active:scale-98"
            >
              <div className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-amber-500" />
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Direct Line</div>
                  <div className="text-[10px] text-zinc-400 font-mono">+27 81 808 2570</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-400" />
            </a>

            {/* Studio Hours & Location */}
            <div className="pt-2 border-t border-zinc-900 space-y-1 text-[11px] text-zinc-500 font-mono">
              <div className="flex items-center space-x-1.5">
                <Clock className="h-3 w-3 text-amber-500/80" />
                <span>Tue - Sat: 09:00 - 19:00 &bull; Sun: 10:00 - 16:00</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <MapPin className="h-3 w-3 text-amber-500/80" />
                <span>Dissafyt Studio - Bernie &bull; Kraaifontein</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-black shadow-2xl transition-all duration-200 hover:bg-amber-400 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
        aria-label="Contact Flagship Concierge"
        title="Contact Flagship Concierge"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 border border-black" />
        </span>
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5 fill-black" />}
      </button>
    </div>
  );
}
