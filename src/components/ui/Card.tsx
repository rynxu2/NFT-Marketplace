'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  hover = true,
  glow = false,
  onClick,
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={`
        relative bg-[var(--bg-secondary)] 
        border border-[var(--border-color)]
        overflow-hidden
        transition-all duration-300
        ${hover ? 'cursor-pointer hover:border-[var(--accent)]/40' : ''}
        ${glow ? 'glow-cyan-hover' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
