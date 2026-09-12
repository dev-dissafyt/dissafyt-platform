'use client';

import React from 'react';
import { CheckCircle2, Printer, PlusCircle, Scissors, Tag, ShieldCheck, X } from 'lucide-react';

interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  type: 'service' | 'product';
}

interface ReceiptData {
  ticket_number: string;
  total: number;
  items: ReceiptItem[];
  payment_reference: string;
  payment_method: string;
  barber_name?: string;
  operator: string;
  customer_name?: string;
  timestamp: string;
}

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
}

export function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Success Header */}
        <div className="bg-gradient-to-b from-amber-500/20 via-zinc-900 to-zinc-900 p-6 text-center border-b border-zinc-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white font-serif">Payment Approved</h2>
          <p className="text-xs text-amber-400 font-mono mt-0.5">
            Ticket #{receipt.ticket_number}
          </p>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs font-mono">
          <div className="text-center pb-3 border-b border-dashed border-zinc-800">
            <div className="text-sm font-bold text-white font-sans">DISSAFYT STUDIO</div>
            <div className="text-[11px] text-zinc-400">Ace of Fyt Cape Town Flagship</div>
            <div className="text-[10px] text-zinc-500 mt-1">
              {new Date(receipt.timestamp).toLocaleString('en-ZA', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-[11px] text-zinc-400 pb-3 border-b border-dashed border-zinc-800">
            <div className="flex justify-between">
              <span>Client:</span>
              <span className="text-white font-semibold">{receipt.customer_name || 'Walk-In Guest'}</span>
            </div>
            {receipt.barber_name && (
              <div className="flex justify-between">
                <span>Master Barber:</span>
                <span className="text-amber-400 font-semibold">{receipt.barber_name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Terminal Ref:</span>
              <span className="text-zinc-200">{receipt.payment_reference}</span>
            </div>
            <div className="flex justify-between">
              <span>Operator:</span>
              <span className="text-zinc-300">{receipt.operator}</span>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2 py-2 border-b border-dashed border-zinc-800">
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-zinc-300">
                <div className="flex-1 pr-2">
                  <div className="text-white font-sans text-xs flex items-center gap-1.5">
                    {item.type === 'service' ? (
                      <Scissors className="w-3 h-3 text-amber-500 shrink-0" />
                    ) : (
                      <Tag className="w-3 h-3 text-zinc-400 shrink-0" />
                    )}
                    <span>{item.name}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {item.quantity} × R {item.price.toFixed(2)}
                  </div>
                </div>
                <div className="text-right font-semibold text-white">
                  R {(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-2 flex justify-between items-baseline text-sm">
            <span className="font-bold text-white font-sans text-base">TOTAL PAID:</span>
            <span className="font-bold text-amber-400 font-mono text-lg">
              R {receipt.total.toFixed(2)}
            </span>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 text-center text-[10px] text-zinc-500 space-y-0.5">
            <div className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              PayFast Card Machine Transaction Settled
            </div>
            <div>Inventory and grooming logs updated in real time.</div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-zinc-400" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Sale</span>
          </button>
        </div>
      </div>
    </div>
  );
}
