'use client';

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Activity } from '@/types/activity';

interface PriceChartProps {
  activities: Activity[];
}

export default function PriceChart({ activities }: PriceChartProps) {
  const chartData = useMemo(() => {
    // Filter activities that have a price (sale, bid, listing, auction_won)
    const priceEvents = activities
      .filter((a) => a.price && a.price > 0)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((a) => ({
        date: new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: a.price!,
        type: a.type,
        fullDate: a.timestamp,
      }));

    return priceEvents;
  }, [activities]);

  if (chartData.length < 2) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4">
        <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)] mb-3">
          Price History
        </h3>
        <div className="flex items-center justify-center h-32 text-xs text-[var(--text-secondary)]">
          Not enough data to show price history
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4">
      <h3 className="text-xs font-[family-name:var(--font-display)] uppercase tracking-wider text-[var(--accent)] mb-4">
        Price History
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border-color)"
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={false}
              tickFormatter={(v) => `◎${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={{
                r: 4,
                fill: 'var(--accent)',
                stroke: 'var(--bg-secondary)',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: 'var(--accent)',
                stroke: 'var(--bg-secondary)',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { price: number; type: string; fullDate: string } }> }) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-[var(--bg-primary)] border border-[var(--accent)]/30 px-3 py-2 shadow-lg">
      <p className="text-xs font-[family-name:var(--font-mono)] font-bold text-[var(--accent)]">
        ◎ {data.price}
      </p>
      <p className="text-[10px] text-[var(--text-secondary)] capitalize mt-0.5">
        {data.type.replace('_', ' ')}
      </p>
      <p className="text-[9px] text-[var(--text-secondary)]">
        {new Date(data.fullDate).toLocaleString()}
      </p>
    </div>
  );
}
