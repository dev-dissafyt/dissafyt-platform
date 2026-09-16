'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Where is the Ace of Fyt Barbershop Flagship located?',
    answer:
      'Our flagship lounge is located in Cape Town, Western Cape. We operate an integrated culture house combining master barber chairs with our Dissafyt Garment Lab drop room. In-chair sessions run Tuesday to Saturday 09:00 – 19:00 and Sunday 10:00 – 16:00.',
  },
  {
    question: 'What makes Dissafyt garments different from standard streetwear?',
    answer:
      'Every piece is engineered from 280GSM ring-spun combed cotton or heavyweight French terry fleece. Garments feature pre-shrunk high-density knits, reinforced double-needle seam stitching, and direct-to-garment permanent prints cured for wash longevity.',
  },
  {
    question: 'How does nationwide delivery work with The Courier Guy?',
    answer:
      'All orders are processed out of our Cape Town fulfillment facility within 24–48 hours. The Courier Guy provides express door-to-door delivery with real-time SMS tracking updates straight to your mobile number anywhere across South Africa.',
  },
  {
    question: 'What payment methods do you accept at checkout?',
    answer:
      'We process all ZAR transactions through PayFast South Africa, supporting Instant EFT (via Capitec, FNB, Standard Bank, Nedbank, Absa, TymeBank), Visa and Mastercard credit/debit cards, and Capitec Pay with 256-bit bank encryption.',
  },
  {
    question: 'How do VIP Monthly Guild Memberships work?',
    answer:
      'VIP Guild Memberships offer priority chair reservations, zero-queue waitlisting, exclusive capsule discounts, and complimentary hot towel treatments. Memberships renew automatically every 30 days and can be managed or paused at any time in your Account dashboard.',
  },
  {
    question: 'What is your return or exchange policy?',
    answer:
      'We offer size exchanges within 14 days of delivery for unworn garments with original tags intact. If you need a size exchange, connect with our Flagship Concierge via WhatsApp or email orders@dissafyt.com.',
  },
];

export function FaqAccordion() {
  const [openIndices, setOpenIndices] = useState<number[]>([0]); // First open by default

  const toggleIndex = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1 text-xs font-mono text-zinc-400">
          <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
          <span>FLAGSHIP BRIEFING // FREQUENTLY ASKED</span>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
          Everything You Need To Know
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Questions about Cape Town chair reservations, 280GSM streetwear specs, or nationwide shipping? We&apos;ve got you covered.
        </p>
      </div>

      <div className="space-y-3 pt-4">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndices.includes(idx);
          return (
            <div
              key={idx}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/80 transition-all hover:border-zinc-700 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleIndex(idx)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                aria-expanded={isOpen}
              >
                <span className="font-display text-base sm:text-lg font-bold uppercase tracking-tight text-white pr-4">
                  {item.question}
                </span>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition-transform duration-250 flex-shrink-0 ${
                    isOpen ? 'rotate-180 bg-amber-500/10 border-amber-500/30 text-amber-400' : ''
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-zinc-900 px-5 pb-5 pt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
