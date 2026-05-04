'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-[var(--bg-primary)] 
            border border-[var(--border-color)]
            text-[var(--text-primary)]
            placeholder:text-[var(--text-secondary)]/50
            px-4 py-3 text-sm
            font-[family-name:var(--font-body)]
            transition-all duration-300
            focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_10px_var(--accent-glow)]
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-[var(--color-crimson)]' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--color-crimson)] mt-1">{error}</p>
      )}
    </div>
  );
}
