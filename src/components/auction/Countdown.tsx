'use client';

import React, { useState, useEffect } from 'react';

interface CountdownProps {
  endTime: string;
  onEnd?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
}

function calcTimeLeft(endTime: string): TimeLeft {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, ended: true };
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    ended: false,
  };
}

const sizeStyles = {
  sm: 'text-xs gap-1',
  md: 'text-sm gap-2',
  lg: 'text-lg gap-3',
};

const boxStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
};

export default function Countdown({ endTime, onEnd, size = 'md' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      const t = calcTimeLeft(endTime);
      setTimeLeft(t);
      if (t.ended) {
        clearInterval(timer);
        onEnd?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, onEnd]);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (timeLeft.ended) {
    return (
      <span className="font-[family-name:var(--font-display)] text-[var(--color-crimson)] uppercase tracking-wider text-xs">
        Ended
      </span>
    );
  }

  const blocks = [
    { val: pad(timeLeft.hours), label: 'HRS' },
    { val: pad(timeLeft.minutes), label: 'MIN' },
    { val: pad(timeLeft.seconds), label: 'SEC' },
  ];

  return (
    <div className={`flex items-center ${sizeStyles[size]}`}>
      {blocks.map((b, i) => (
        <React.Fragment key={b.label}>
          <div className="flex flex-col items-center">
            <div className={`${boxStyles[size]} flex items-center justify-center bg-[var(--bg-primary)] border border-[var(--accent)]/30 font-[family-name:var(--font-mono)] font-bold text-[var(--accent)]`}>
              {b.val}
            </div>
            <span className="text-[8px] text-[var(--text-secondary)] mt-0.5 font-[family-name:var(--font-display)] tracking-widest">
              {b.label}
            </span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-[var(--accent)] font-bold mt-[-10px]">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
