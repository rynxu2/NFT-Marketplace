'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

const variantMap = {
  default:
    'border border-slate-300 text-slate-700 bg-white/85 backdrop-blur-sm shadow-sm',

  success:
    'border border-green-500/40 text-green-700 bg-green-50/90 backdrop-blur-sm font-medium shadow-sm',

  warning:
    'border border-orange-500/45 text-orange-700 bg-orange-50/90 backdrop-blur-sm font-medium shadow-sm',

  danger:
    'border border-red-500/45 text-red-700 bg-red-50/90 backdrop-blur-sm font-medium shadow-sm',

  info:
    'border border-blue-500/45 text-blue-700 bg-blue-50/90 backdrop-blur-sm font-medium shadow-sm',
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
