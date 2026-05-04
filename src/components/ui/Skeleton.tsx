'use client';

import React from 'react';

export default function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`
        bg-[var(--border-color)] animate-pulse
        ${className}
      `}
    />
  );
}

export function NFTCardSkeleton() {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}
