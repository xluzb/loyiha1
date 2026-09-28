import React from 'react';
import { formatCurrency } from '../../utils/finance';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data?: DonutSlice[];
  items?: DonutSlice[];
  totalLabel?: string;
  centerTitle?: string;
  size?: number;
  thickness?: number;
  currency?: 'UZS' | 'USD';
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  items,
  totalLabel,
  centerTitle,
  size = 220,
  thickness = 28,
  currency = 'UZS',
}) => {
  const chartData = data || items || [];
  const displayLabel = centerTitle || totalLabel || 'Jami';
  const total = chartData.reduce((acc, slice) => acc + slice.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedPercent = 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            className="text-slate-200 dark:text-slate-800"
          />
        </svg>
        <p className="mt-2 text-xs text-slate-500">Ma'lumotlar mavjud emas</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 transform"
        >
          {chartData.map((slice, index) => {
            const percent = slice.value / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 hover:opacity-90"
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {displayLabel}
          </span>
          <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </div>

      {/* Clean legend list (Zero-pill discipline: unboxed clean text) */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 w-full text-xs">
        {chartData.slice(0, 6).map((slice, index) => {
          const pct = Math.round((slice.value / total) * 100);
          return (
            <div key={index} className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-slate-600 dark:text-slate-300 truncate">
                  {slice.label}
                </span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums shrink-0">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
