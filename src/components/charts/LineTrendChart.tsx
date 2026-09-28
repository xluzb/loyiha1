import React from 'react';
import { formatCurrency } from '../../utils/finance';

interface MonthData {
  month: string;
  income: number;
  expenses: number;
}

interface LineTrendChartProps {
  data: MonthData[];
  currency?: 'UZS' | 'USD';
}

export const LineTrendChart: React.FC<LineTrendChartProps> = ({
  data,
  currency = 'UZS',
}) => {
  if (!data || data.length === 0) return null;

  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expenses)),
    1000000
  );

  const getX = (index: number) => {
    return paddingX + (index * (width - 2 * paddingX)) / (data.length - 1);
  };

  const getY = (val: number) => {
    return height - paddingY - (val / maxVal) * (height - 2 * paddingY);
  };

  // Generate paths
  const incomePoints = data.map((d, i) => `${getX(i)},${getY(d.income)}`).join(' ');
  const expensePoints = data.map((d, i) => `${getX(i)},${getY(d.expenses)}`).join(' ');

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-500 rounded-full" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Daromad</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-rose-500 rounded-full" />
            <span className="text-slate-600 dark:text-slate-300 font-medium">Xarajat & Kredit</span>
          </div>
        </div>
        <span className="text-slate-400">Oxirgi 6 oy</span>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto text-slate-200 dark:text-slate-800"
        >
          {/* Subtle grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="currentColor"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="currentColor"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="currentColor"
          />

          {/* Income line */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={incomePoints}
          />

          {/* Expense line */}
          <polyline
            fill="none"
            stroke="#f43f5e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={expensePoints}
          />

          {/* Data nodes */}
          {data.map((d, i) => (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getY(d.income)}
                r="4"
                className="fill-emerald-500 stroke-white dark:stroke-slate-900"
                strokeWidth="2"
              />
              <circle
                cx={getX(i)}
                cy={getY(d.expenses)}
                r="4"
                className="fill-rose-500 stroke-white dark:stroke-slate-900"
                strokeWidth="2"
              />
              <text
                x={getX(i)}
                y={height - 6}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 font-sans"
              >
                {d.month}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>O'rtacha daromad: {formatCurrency(maxVal * 0.85, currency)}</span>
        <span>O'rtacha xarajat: {formatCurrency(maxVal * 0.65, currency)}</span>
      </div>
    </div>
  );
};
