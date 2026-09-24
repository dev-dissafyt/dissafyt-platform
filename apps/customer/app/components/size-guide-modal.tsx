'use client';

import { useState, useEffect } from 'react';
import { X, Ruler, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@dissafyt/ui';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'tops' | 'bottoms';
}

interface MeasurementRow {
  size: string;
  chestCm: number;
  chestIn: number;
  lengthCm: number;
  lengthIn: number;
  sleeveCm: number;
  sleeveIn: number;
}

interface BottomMeasurementRow {
  size: string;
  waistCm: string;
  waistIn: string;
  inseamCm: number;
  inseamIn: number;
  hipCm: number;
  hipIn: number;
}

const TOPS_MEASUREMENTS: MeasurementRow[] = [
  { size: 'S', chestCm: 56, chestIn: 22.0, lengthCm: 70, lengthIn: 27.5, sleeveCm: 61, sleeveIn: 24.0 },
  { size: 'M', chestCm: 59, chestIn: 23.2, lengthCm: 73, lengthIn: 28.7, sleeveCm: 63, sleeveIn: 24.8 },
  { size: 'L', chestCm: 62, chestIn: 24.4, lengthCm: 76, lengthIn: 30.0, sleeveCm: 65, sleeveIn: 25.6 },
  { size: 'XL', chestCm: 65, chestIn: 25.6, lengthCm: 79, lengthIn: 31.1, sleeveCm: 67, sleeveIn: 26.4 },
  { size: '2XL', chestCm: 68, chestIn: 26.8, lengthCm: 82, lengthIn: 32.3, sleeveCm: 69, sleeveIn: 27.2 },
];

const BOTTOMS_MEASUREMENTS: BottomMeasurementRow[] = [
  { size: 'S', waistCm: '74 - 82', waistIn: '29 - 32', inseamCm: 74, inseamIn: 29.1, hipCm: 104, hipIn: 41.0 },
  { size: 'M', waistCm: '80 - 88', waistIn: '31.5 - 34.5', inseamCm: 76, inseamIn: 30.0, hipCm: 110, hipIn: 43.3 },
  { size: 'L', waistCm: '86 - 94', waistIn: '34 - 37', inseamCm: 78, inseamIn: 30.7, hipCm: 116, hipIn: 45.6 },
  { size: 'XL', waistCm: '92 - 102', waistIn: '36 - 40', inseamCm: 80, inseamIn: 31.5, hipCm: 122, hipIn: 48.0 },
  { size: '2XL', waistCm: '98 - 110', waistIn: '38.5 - 43', inseamCm: 82, inseamIn: 32.3, hipCm: 128, hipIn: 50.4 },
];

export function SizeGuideModal({ isOpen, onClose, defaultTab = 'tops' }: SizeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'tops' | 'bottoms'>(defaultTab);
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative z-50 w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-white flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Ruler className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="size-guide-title" className="text-lg font-bold text-white uppercase tracking-wider">
                  Dissafyt Streetwear Size Guide
                </h2>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/20">
                  Boxy Oversized Cut
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Cape Town heavyweight cotton &bull; 280GSM to 420GSM luxury drape
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
            aria-label="Close size guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body with scrolling */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* Controls: Tab Selector & Unit Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80">
            {/* Tabs */}
            <div className="inline-flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('tops')}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                  activeTab === 'tops'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tops (Hoodies & Tees)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bottoms')}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                  activeTab === 'bottoms'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Bottoms (Trackpants & Cargo)
              </button>
            </div>

            {/* Units Toggle */}
            <div className="flex items-center space-x-2 self-end sm:self-auto px-2">
              <span className="text-xs text-zinc-400 font-mono">Unit:</span>
              <div className="inline-flex rounded-md bg-zinc-950 p-0.5 border border-zinc-800 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setUnit('cm')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    unit === 'cm'
                      ? 'bg-zinc-800 text-amber-400 font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  CM
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('in')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    unit === 'in'
                      ? 'bg-zinc-800 text-amber-400 font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  INCHES
                </button>
              </div>
            </div>
          </div>

          {/* Measurements Table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            {activeTab === 'tops' ? (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-900/80 uppercase font-mono text-zinc-400">
                  <tr>
                    <th className="py-3 px-4 text-white font-bold">Size</th>
                    <th className="py-3 px-4">Chest (Pit-to-Pit)</th>
                    <th className="py-3 px-4">Body Length</th>
                    <th className="py-3 px-4">Shoulder & Sleeve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                  {TOPS_MEASUREMENTS.map((row) => (
                    <tr key={row.size} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-amber-400 font-sans text-sm">
                        {row.size}
                      </td>
                      <td className="py-3 px-4">
                        {unit === 'cm' ? `${row.chestCm} cm` : `${row.chestIn} in`}
                      </td>
                      <td className="py-3 px-4">
                        {unit === 'cm' ? `${row.lengthCm} cm` : `${row.lengthIn} in`}
                      </td>
                      <td className="py-3 px-4">
                        {unit === 'cm' ? `${row.sleeveCm} cm` : `${row.sleeveIn} in`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-900/80 uppercase font-mono text-zinc-400">
                  <tr>
                    <th className="py-3 px-4 text-white font-bold">Size</th>
                    <th className="py-3 px-4">Waist (Elastic)</th>
                    <th className="py-3 px-4">Inseam Length</th>
                    <th className="py-3 px-4">Hip Circumference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-zinc-300">
                  {BOTTOMS_MEASUREMENTS.map((row) => (
                    <tr key={row.size} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-amber-400 font-sans text-sm">
                        {row.size}
                      </td>
                      <td className="py-3 px-4">
                        {unit === 'cm' ? `${row.waistCm} cm` : `${row.waistIn} in`}
                      </td>
                      <td className="py-3 px-4">
                        {unit === 'cm' ? `${row.inseamCm} cm` : `${row.inseamIn} in`}
                      </td>
                      <td className="py-3 px-4">
                        {unit === 'cm' ? `${row.hipCm} cm` : `${row.hipIn} in`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Silhouette Advice & Streetwear Fit Callout */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2.5">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              <span>Dissafyt Fit Philosophy</span>
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Signature Oversized Cut:</strong> Pick your regular size for the intended dropped-shoulder, boxy streetwear drape.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Fitted Silhouette:</strong> If you prefer a traditional standard fit rather than oversized streetwear, size down one size.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Pre-Shrunk Luxury Blanks:</strong> All 100% cotton garments undergo double wash pre-shrinking before embroidery or screen print.
                </span>
              </li>
            </ul>
          </div>

          {/* Measuring Instructions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2 text-xs text-zinc-400">
            <div className="flex items-center space-x-2 text-zinc-200 font-bold">
              <Info className="h-4 w-4 text-amber-500" />
              <span>How to Measure Your Best-Fitting Garment:</span>
            </div>
            <p className="leading-relaxed">
              Lay your favorite tee or hoodie flat on a table. Measure from pit-to-pit across the fullest part of the chest, and from the highest collar point straight down to the bottom hem. Compare with the chart above to choose your exact size.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 pt-4 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Need custom advice? Chat with our Cape Town studio on WhatsApp.
          </span>
          <Button
            type="button"
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider px-5 h-9"
          >
            Got It
          </Button>
        </div>
      </div>
    </div>
  );
}
