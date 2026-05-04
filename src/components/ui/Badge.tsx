'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const variantMap = {
  default: 'border-[var(--border-color)] text-[var(--text-secondary)]',
  success: 'border-[var(--color-electric-lime)]/30 text-[var(--color-electric-lime)] bg-[var(--color-electric-lime)]/5',
  warning: 'border-[var(--color-signal-orange)]/30 text-[var(--color-signal-orange)] bg-[var(--color-signal-orange)]/5',
  danger: 'border-[var(--color-crimson)]/30 text-[var(--color-crimson)] bg-[var(--color-crimson)]/5',
  info: 'border-[var(--accent)]/30 text-[var(--accent)] bg-[var(--accent)]/5',
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1
        border font-[family-name:var(--font-display)] uppercase tracking-wider
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
