'use client';

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'cyber-cyan' | 'cyber-lime';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-[var(--accent)] text-[var(--bg-primary)] font-semibold clip-corner hover:shadow-[0_0_20px_var(--accent-glow)]',
  secondary: 'bg-transparent border border-[var(--accent)] text-[var(--accent)] clip-corner-sm hover:bg-[var(--accent)] hover:text-[var(--bg-primary)]',
  ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10',
  danger: 'bg-transparent border border-[var(--color-crimson)] text-[var(--color-crimson)] clip-corner-sm hover:bg-[var(--color-crimson)] hover:text-white',
  'cyber-cyan': 'border border-[var(--color-neon-cyan)]/30 text-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10 hover:bg-[var(--color-neon-cyan)]/20 hover:border-[var(--color-neon-cyan)] hover:shadow-[0_0_15px_var(--color-neon-cyan-glow)] clip-corner-sm',
  'cyber-lime': 'border border-[var(--color-electric-lime)]/30 text-[var(--color-electric-lime)] bg-[var(--color-electric-lime)]/10 hover:bg-[var(--color-electric-lime)]/20 hover:border-[var(--color-electric-lime)] hover:shadow-[0_0_15px_rgba(163,255,18,0.4)] clip-corner-sm',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`
        inline-flex items-center justify-center gap-2
        font-[family-name:var(--font-display)] uppercase tracking-wider
        transition-all duration-300
        disabled:opacity-40 disabled:cursor-not-allowed
        cursor-pointer
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
