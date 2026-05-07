'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToastStore, type Toast as ToastItem } from '@/store/useToastStore';
import { getExplorerUrl, getNetwork } from '@/lib/solana/connection';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: {
    border: 'border-[var(--color-electric-lime)]',
    bg: 'bg-[var(--color-electric-lime)]/10',
    icon: 'text-[var(--color-electric-lime)]',
    bar: 'bg-[var(--color-electric-lime)]',
  },
  error: {
    border: 'border-[var(--color-crimson)]',
    bg: 'bg-[var(--color-crimson)]/10',
    icon: 'text-[var(--color-crimson)]',
    bar: 'bg-[var(--color-crimson)]',
  },
  info: {
    border: 'border-[var(--accent)]',
    bg: 'bg-[var(--accent)]/10',
    icon: 'text-[var(--accent)]',
    bar: 'bg-[var(--accent)]',
  },
  warning: {
    border: 'border-[var(--color-signal-orange)]',
    bg: 'bg-[var(--color-signal-orange)]/10',
    icon: 'text-[var(--color-signal-orange)]',
    bar: 'bg-[var(--color-signal-orange)]',
  },
};

function ToastComponent({ toast }: { toast: ToastItem }) {
  const { removeToast } = useToastStore();
  const [progress, setProgress] = useState(100);
  const Icon = iconMap[toast.type];
  const colors = colorMap[toast.type];
  const duration = toast.duration || 5000;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev - 100 / (duration / 50);
        return next <= 0 ? 0 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [duration]);

  const network = getNetwork();
  const isTx = toast.txSignature && !toast.txSignature.startsWith('list_') && !toast.txSignature.startsWith('cancel_') && !toast.txSignature.startsWith('auction_');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative w-80 border ${colors.border} ${colors.bg} backdrop-blur-sm overflow-hidden`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="p-4 flex gap-3">
        <Icon size={18} className={`${colors.icon} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-primary)] leading-snug">{toast.message}</p>
          {toast.txSignature && (
            <a
              href={isTx ? getExplorerUrl(toast.txSignature) : '#'}
              target={isTx ? '_blank' : undefined}
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline mt-1.5 font-[family-name:var(--font-mono)]"
            >
              {isTx ? (
                <>
                  View on Explorer <ExternalLink size={8} />
                </>
              ) : (
                `${network === 'devnet' ? 'Devnet' : 'Mainnet'} • Signed`
              )}
            </a>
          )}
        </div>
        <button
          onClick={() => removeToast(toast.id)}
          className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-transparent">
        <motion.div
          className={`h-full ${colors.bar}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
}

export default function ToastProvider() {
  const { toasts } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
