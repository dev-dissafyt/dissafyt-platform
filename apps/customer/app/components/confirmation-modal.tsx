'use client';

import { useEffect } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from '@dissafyt/ui';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = true,
  loading = false,
}: ConfirmationModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative z-50 w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-white"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        aria-describedby="confirmation-modal-desc"
      >
        <div className="flex items-start space-x-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${
              danger
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1.5">
            <h3 id="confirmation-modal-title" className="text-base font-bold text-white">
              {title}
            </h3>
            <p id="confirmation-modal-desc" className="text-xs text-zinc-400 leading-relaxed">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-zinc-500 hover:text-white p-1 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3 pt-3 border-t border-zinc-900">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 text-xs font-semibold px-4 h-9"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`text-xs font-bold uppercase tracking-wider px-4 h-9 shadow-md transition-all active:scale-95 ${
              danger
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
            }`}
          >
            {loading ? (
              <span className="flex items-center space-x-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
