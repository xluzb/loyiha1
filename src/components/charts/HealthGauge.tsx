import React from 'react';
import { FinancialHealthBreakdown } from '../../types';

interface HealthGaugeProps {
  breakdown: FinancialHealthBreakdown;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({ breakdown }) => {
  const { score, dtiScore, savingsScore, balanceScore, statusText, statusColor, insights } = breakdown;

  // Semicircle gauge calculation
  const radius = 65;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // half circle
  const progressOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-26 flex flex-col items-center justify-end overflow-hidden">
        <svg width="160" height="90" viewBox="0 0 160 90" className="overflow-visible">
          {/* Background track */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-slate-100 dark:text-slate-800"
          />
          {/* Progress arc */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke={statusColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Score in center */}
        <div className="absolute bottom-0 text-center">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {score}
          </span>
          <span className="text-xs text-slate-400 block font-medium">/ 100 ball</span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <span
          className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
          }}
        >
          {statusText} holat
        </span>
      </div>

      {/* Sub metrics breakdown */}
      <div className="mt-4 grid grid-cols-3 gap-2 w-full pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
        <div>
          <span className="text-[10px] text-slate-400 block">Qarz yuki</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
            {dtiScore}/40
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Zaxira</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
            {savingsScore}/30
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Balans</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
            {balanceScore}/30
          </span>
        </div>
      </div>

      {insights && insights.length > 0 && (
        <div className="mt-3 w-full bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2.5 text-[11px] text-slate-600 dark:text-slate-300">
          <ul className="space-y-1">
            {insights.map((msg, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold shrink-0">·</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
