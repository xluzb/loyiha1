import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loan,
  Income,
  Expense,
  ExpenseCategory,
  UtilityBill,
  SavingsGoal,
  CurrencyType,
} from '../../types';
import { formatCurrency } from '../../utils/finance';
import {
  CalendarRange,
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  Target,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface AnnualReportsSectionProps {
  incomes: Income[];
  loans: Loan[];
  expenses: Expense[];
  categories: ExpenseCategory[];
  utilities: UtilityBill[];
  savingsGoals: SavingsGoal[];
  currency: CurrencyType;
  onNavigateTab?: (tabId: string) => void;
}

type ViewMode = 'comparison' | 'velocity' | 'savingsRate';

interface MonthAggregate {
  monthKey: string;
  monthName: string;
  fullName: string;
  income: number;
  expenses: number;
  loans: number;
  utilities: number;
  totalOutflow: number;
  netSavings: number;
  cumulativeSavings: number;
  savingsRate: number;
  velocityIndex: number;
}

const MONTH_DEFS = [
  { key: '01', name: 'Yan', fullName: 'Yanvar', seasonFactor: 0.96 },
  { key: '02', name: 'Fev', fullName: 'Fevral', seasonFactor: 0.94 },
  { key: '03', name: 'Mar', fullName: 'Mart', seasonFactor: 1.05 }, // Navro'z holiday expenses/bonuses
  { key: '04', name: 'Apr', fullName: 'Aprel', seasonFactor: 0.98 },
  { key: '05', name: 'May', fullName: 'May', seasonFactor: 1.0 },
  { key: '06', name: 'Iyun', fullName: 'Iyun', seasonFactor: 1.02 },
  { key: '07', name: 'Iyul', fullName: 'Iyul', seasonFactor: 1.04 },
  { key: '08', name: 'Avg', fullName: 'Avgust', seasonFactor: 1.08 }, // Pre-school & holiday preparations
  { key: '09', name: 'Sen', fullName: 'Sentyabr', seasonFactor: 1.1 }, // School start, seasonal change
  { key: '10', name: 'Okt', fullName: 'Oktyabr', seasonFactor: 1.0 },
  { key: '11', name: 'Noy', fullName: 'Noyabr', seasonFactor: 0.98 },
  { key: '12', name: 'Dek', fullName: 'Dekabr', seasonFactor: 1.06 }, // New year
];

export const AnnualReportsSection: React.FC<AnnualReportsSectionProps> = ({
  incomes,
  loans,
  expenses,
  categories,
  utilities,
  savingsGoals,
  currency,
  onNavigateTab,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('comparison');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isTableExpanded, setIsTableExpanded] = useState<boolean>(false);
  const [showGoalMilestone, setShowGoalMilestone] = useState<boolean>(true);
  const [velocityBoostPercent, setVelocityBoostPercent] = useState<number>(0);
  const [animationKey, setAnimationKey] = useState<number>(0);

  // 1. Calculate Monthly Baselines
  const baselineMonthlyIncome = useMemo(() => {
    return incomes.reduce(
      (sum, inc) => (inc.isRecurring ? sum + inc.amount : sum),
      0
    );
  }, [incomes]);

  const baselineMonthlyLoans = useMemo(() => {
    return loans
      .filter((l) => !l.isPaidOff)
      .reduce((sum, l) => sum + l.monthlyPayment, 0);
  }, [loans]);

  const baselineMonthlyUtilities = useMemo(() => {
    return utilities.reduce((sum, u) => sum + u.amount, 0);
  }, [utilities]);

  const baselineMonthlyVariableExpenses = useMemo(() => {
    // If user has recorded expenses, find the typical monthly sum or category budget limit
    const totalRecorded = expenses.reduce((sum, e) => sum + e.amount, 0);
    if (totalRecorded > 0) return totalRecorded;
    // Otherwise fallback to sum of category budget limits
    return categories.reduce((sum, c) => sum + (c.budgetLimit || 0), 0);
  }, [expenses, categories]);

  // Primary Savings Goal Target for Milestone reference
  const primaryGoal = useMemo(() => {
    return savingsGoals.find((g) => !g.isAchieved) || savingsGoals[0];
  }, [savingsGoals]);

  // 2. Aggregate 12 Months Data
  const monthlyData: MonthAggregate[] = useMemo(() => {
    let runningCumulative = 0;
    const yearStr = String(selectedYear);

    return MONTH_DEFS.map((m, index) => {
      const monthPrefix = `${yearStr}-${m.key}`;

      // Actual expenses recorded for this specific month
      const monthActualExpenses = expenses
        .filter((e) => e.date?.startsWith(monthPrefix))
        .reduce((sum, e) => sum + e.amount, 0);

      // If this month has actual recorded expenses, use them;
      // otherwise, model via baseline * seasonal factor
      const calculatedExpenses =
        monthActualExpenses > 0
          ? monthActualExpenses
          : Math.round(baselineMonthlyVariableExpenses * m.seasonFactor);

      // Actual utilities for this specific month if recorded
      const monthActualUtilities = utilities
        .filter((u) => u.monthYear === monthPrefix)
        .reduce((sum, u) => sum + u.amount, 0);

      const calculatedUtilities =
        monthActualUtilities > 0 ? monthActualUtilities : baselineMonthlyUtilities;

      // Incomes created in this month or recurring
      const monthOneOffIncomes = incomes
        .filter((inc) => !inc.isRecurring && inc.dateCreated?.startsWith(monthPrefix))
        .reduce((sum, inc) => sum + inc.amount, 0);

      // In Navro'z (March) and New Year (Dec) or mid-year, slight seasonal bonus
      const incomeBonus =
        index === 2 ? baselineMonthlyIncome * 0.08 : index === 11 ? baselineMonthlyIncome * 0.12 : 0;

      const calculatedIncome =
        baselineMonthlyIncome + monthOneOffIncomes + Math.round(incomeBonus);

      // Apply optimization simulation if user slid velocityBoostPercent
      const expenseReduction = (calculatedExpenses * velocityBoostPercent) / 100;
      const effectiveExpenses = Math.max(0, calculatedExpenses - expenseReduction);

      const totalOutflow = baselineMonthlyLoans + calculatedUtilities + effectiveExpenses;
      const netSavings = calculatedIncome - totalOutflow;

      runningCumulative += netSavings;

      const savingsRate =
        calculatedIncome > 0
          ? Math.max(0, Math.round((netSavings / calculatedIncome) * 100))
          : 0;

      return {
        monthKey: m.key,
        monthName: m.name,
        fullName: m.fullName,
        income: calculatedIncome,
        expenses: effectiveExpenses,
        loans: baselineMonthlyLoans,
        utilities: calculatedUtilities,
        totalOutflow,
        netSavings,
        cumulativeSavings: runningCumulative,
        savingsRate,
        velocityIndex: Math.round(netSavings / (baselineMonthlyIncome || 1) * 100),
      };
    });
  }, [
    selectedYear,
    incomes,
    loans,
    expenses,
    utilities,
    baselineMonthlyIncome,
    baselineMonthlyLoans,
    baselineMonthlyUtilities,
    baselineMonthlyVariableExpenses,
    velocityBoostPercent,
  ]);

  // 3. Annual Aggregates & Velocity KPIs
  const annualSummary = useMemo(() => {
    const totalAnnualIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
    const totalAnnualOutflow = monthlyData.reduce((sum, m) => sum + m.totalOutflow, 0);
    const totalAnnualLoans = monthlyData.reduce((sum, m) => sum + m.loans, 0);
    const totalAnnualExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const totalAnnualUtilities = monthlyData.reduce((sum, m) => sum + m.utilities, 0);
    const totalAnnualNetSavings = monthlyData.reduce((sum, m) => sum + m.netSavings, 0);
    const averageMonthlyVelocity = Math.round(totalAnnualNetSavings / 12);
    const averageSavingsRate =
      totalAnnualIncome > 0
        ? Math.round((totalAnnualNetSavings / totalAnnualIncome) * 100)
        : 0;

    // Peak & Trough months
    const sortedBySavings = [...monthlyData].sort((a, b) => b.netSavings - a.netSavings);
    const bestMonth = sortedBySavings[0];
    const tightestMonth = sortedBySavings[sortedBySavings.length - 1];

    // Estimated months to reach primary goal at current saving velocity
    let monthsToPrimaryGoal = 0;
    if (primaryGoal && averageMonthlyVelocity > 0) {
      const remainingTarget = Math.max(0, primaryGoal.targetAmount - primaryGoal.currentAmount);
      monthsToPrimaryGoal = Math.ceil(remainingTarget / averageMonthlyVelocity);
    }

    return {
      totalAnnualIncome,
      totalAnnualOutflow,
      totalAnnualLoans,
      totalAnnualExpenses,
      totalAnnualUtilities,
      totalAnnualNetSavings,
      averageMonthlyVelocity,
      averageSavingsRate,
      bestMonth,
      tightestMonth,
      monthsToPrimaryGoal,
    };
  }, [monthlyData, primaryGoal]);

  // Custom Recharts Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const dataItem = payload[0]?.payload as MonthAggregate;
    if (!dataItem) return null;

    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-3.5 rounded-xl border border-slate-700/80 shadow-xl backdrop-blur-md min-w-[210px] text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 mb-2">
          <span className="font-bold text-sm tracking-tight text-emerald-400">
            {dataItem.fullName} {selectedYear}
          </span>
          <span className="text-[11px] font-mono text-slate-300">
            {dataItem.savingsRate}% tejamkorlik
          </span>
        </div>

        <div className="space-y-1.5 font-mono">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Daromad:
            </span>
            <span className="font-semibold text-emerald-400 tabular-nums">
              +{formatCurrency(dataItem.income, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Chiqim (Jami):
            </span>
            <span className="font-semibold text-rose-400 tabular-nums">
              -{formatCurrency(dataItem.totalOutflow, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between pl-3 text-[11px] text-slate-400">
            <span>• Kreditlar:</span>
            <span>{formatCurrency(dataItem.loans, currency)}</span>
          </div>

          <div className="flex items-center justify-between pl-3 text-[11px] text-slate-400">
            <span>• Kundalik sarf:</span>
            <span>{formatCurrency(dataItem.expenses, currency)}</span>
          </div>

          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              Oylik sof qoldiq:
            </span>
            <span
              className={`tabular-nums ${
                dataItem.netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {dataItem.netSavings >= 0 ? '+' : ''}
              {formatCurrency(dataItem.netSavings, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-amber-300 pt-1 font-medium">
            <span>Kümülyativ jamg'arma:</span>
            <span className="tabular-nums">
              {formatCurrency(dataItem.cumulativeSavings, currency)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* 1. Header Bar with Title, Subtitle, and Interactive Controls */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarRange className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Yillik hisobotlar (Annual Reports)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            12-oylik oilaviy daromad va xarajatlar tahlili hamda uzoq muddatli jamg'arma tezligi (Saving Velocity).
          </p>
        </div>

        {/* Action Controls & View Mode Selectors */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Year selector */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setSelectedYear(2025)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                selectedYear === 2025
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              2025-yil
            </button>
            <button
              onClick={() => setSelectedYear(2026)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                selectedYear === 2026
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              2026-yil
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                viewMode === 'comparison'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Oqim dinamikasi
            </button>
            <button
              onClick={() => setViewMode('velocity')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                viewMode === 'velocity'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Jamg'arma tezligi
            </button>
            <button
              onClick={() => setViewMode('savingsRate')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                viewMode === 'savingsRate'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tejamkorlik %
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Annual KPI Metrics Grid */}
      <div className="p-5 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
        {/* KPI 1: Annual Income */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Yillik jami daromad</span>
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            +{formatCurrency(annualSummary.totalAnnualIncome, currency)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>O'rtacha oyiga:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {formatCurrency(Math.round(annualSummary.totalAnnualIncome / 12), currency)}
            </span>
          </div>
        </div>

        {/* KPI 2: Annual Outflow */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Yillik jami chiqim</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
            -{formatCurrency(annualSummary.totalAnnualOutflow, currency)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Kreditlar ulushi:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {Math.round((annualSummary.totalAnnualLoans / (annualSummary.totalAnnualOutflow || 1)) * 100)}%
            </span>
          </div>
        </div>

        {/* KPI 3: Net Annual Savings */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Yillik sof jamg'arma</span>
            <Coins className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight ${
              annualSummary.totalAnnualNetSavings >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {annualSummary.totalAnnualNetSavings >= 0 ? '+' : ''}
            {formatCurrency(annualSummary.totalAnnualNetSavings, currency)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Tejamkorlik:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {annualSummary.averageSavingsRate}% oqim
            </span>
          </div>
        </div>

        {/* KPI 4: Saving Velocity */}
        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <span className="font-semibold">Oylik jamg'arish tezligi</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums tracking-tight">
            +{formatCurrency(annualSummary.averageMonthlyVelocity, currency)}
            <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400"> /oy</span>
          </div>
          <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 flex items-center gap-1">
            <span>Reja:</span>
            <span className="font-semibold tabular-nums">
              1 yilda +{formatCurrency(annualSummary.averageMonthlyVelocity * 12, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Recharts 12-Month Interactive Trend Section */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Chart Sub-legend and Mode Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            {viewMode === 'comparison' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Oylik daromad</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-rose-500" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Oylik jami chiqim</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-indigo-500 rounded-full" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Sof qoldiq (Net)</span>
                </div>
              </>
            )}

            {viewMode === 'velocity' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-600/40 border border-emerald-600" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Kümülyativ jamg'arma trayektoriyasi
                  </span>
                </div>
                {primaryGoal && showGoalMilestone && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500" />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      Maqsad marrasi ({primaryGoal.name})
                    </span>
                  </div>
                )}
              </>
            )}

            {viewMode === 'savingsRate' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Haqiqiy tejamkorlik %</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-400" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">20% Sog'lom me'yor</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {viewMode === 'velocity' && primaryGoal && (
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={showGoalMilestone}
                  onChange={(e) => setShowGoalMilestone(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Maqsad chizig'ini ko'rsatish</span>
              </label>
            )}

            <button
              type="button"
              onClick={() => setAnimationKey((prev) => prev + 1)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1 shadow-2xs"
              title="Grafik animatsiyasini qayta ijro etish"
            >
              <RotateCcw className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Qayta ko'rish</span>
            </button>

            <span className="text-slate-400 hidden sm:inline">12 oylik to'liq tsikl</span>
          </div>
        </div>

        {/* Responsive Recharts Container with Entrance Animations */}
        <div className="w-full h-72 sm:h-80 min-h-[300px] relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`chart-container-${viewMode}-${selectedYear}-${velocityBoostPercent}-${animationKey}`}
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.995 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'comparison' ? (
                  <ComposedChart
                    key={`composed-${viewMode}-${selectedYear}-${velocityBoostPercent}-${animationKey}`}
                    data={monthlyData}
                    margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorIncomeBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                      </linearGradient>
                      <linearGradient id="colorExpenseBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#e11d48" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                      className="dark:stroke-slate-800"
                    />
                    <XAxis
                      dataKey="monthName"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                        return `${val}`;
                      }}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <Tooltip content={renderCustomTooltip} />
                    <Bar
                      dataKey="income"
                      name="Daromad"
                      fill="url(#colorIncomeBar)"
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                      isAnimationActive={true}
                      animationDuration={1100}
                      animationBegin={120}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="totalOutflow"
                      name="Chiqim"
                      fill="url(#colorExpenseBar)"
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                      isAnimationActive={true}
                      animationDuration={1100}
                      animationBegin={280}
                      animationEasing="ease-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="netSavings"
                      name="Sof qoldiq"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#6366f1', strokeWidth: 1, stroke: '#ffffff' }}
                      activeDot={{ r: 5 }}
                      isAnimationActive={true}
                      animationDuration={1300}
                      animationBegin={480}
                      animationEasing="ease-out"
                    />
                  </ComposedChart>
                ) : viewMode === 'velocity' ? (
                  <AreaChart
                    key={`area-${viewMode}-${selectedYear}-${velocityBoostPercent}-${animationKey}`}
                    data={monthlyData}
                    margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                      className="dark:stroke-slate-800"
                    />
                    <XAxis
                      dataKey="monthName"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                        return `${val}`;
                      }}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <Tooltip content={renderCustomTooltip} />
                    {primaryGoal && showGoalMilestone && (
                      <ReferenceLine
                        y={primaryGoal.targetAmount}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{
                          value: `Maqsad: ${primaryGoal.name.slice(0, 18)}...`,
                          fill: '#d97706',
                          fontSize: 10,
                          position: 'insideTopRight',
                        }}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="cumulativeSavings"
                      name="Kümülyativ jamg'arma"
                      stroke="#059669"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorVelocity)"
                      dot={{ r: 3, fill: '#059669', strokeWidth: 1, stroke: '#ffffff' }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={true}
                      animationDuration={1400}
                      animationBegin={150}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                ) : (
                  <ComposedChart
                    key={`savings-rate-${viewMode}-${selectedYear}-${velocityBoostPercent}-${animationKey}`}
                    data={monthlyData}
                    margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                      className="dark:stroke-slate-800"
                    />
                    <XAxis
                      dataKey="monthName"
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                      domain={[0, 60]}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <Tooltip content={renderCustomTooltip} />
                    <ReferenceLine
                      y={20}
                      stroke="#10b981"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: '20% meʼyor',
                        fill: '#10b981',
                        fontSize: 10,
                        position: 'insideTopLeft',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="savingsRate"
                      name="Tejamkorlik nisbati (%)"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#10b981', strokeWidth: 1, stroke: '#ffffff' }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={true}
                      animationDuration={1300}
                      animationBegin={150}
                      animationEasing="ease-out"
                    />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 4. Saving Velocity Insights & Simulator Box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          {/* Card: Velocity Analysis Insight */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Jamg'arma tezligi xulosasi</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Oilangiz har oy o'rtacha{' '}
              <strong className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                +{formatCurrency(annualSummary.averageMonthlyVelocity, currency)}
              </strong>{' '}
              jamg'arish tezligiga ega. Bu ko'rsatkich bilan 12 oyda jami{' '}
              <strong className="text-slate-900 dark:text-white tabular-nums">
                +{formatCurrency(annualSummary.totalAnnualNetSavings, currency)}
              </strong>{' '}
              kapital shakllanadi.
            </p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span>Eng tejamkor oy:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {annualSummary.bestMonth.fullName} (+{formatCurrency(annualSummary.bestMonth.netSavings, currency)})
              </span>
            </div>
          </div>

          {/* Card: Goal Acceleration Forecast */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-500" />
                <span>Maqsadlarga yetish marrasi</span>
              </span>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('investments')}
                  className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                >
                  Maqsadlar →
                </button>
              )}
            </div>

            {primaryGoal ? (
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {primaryGoal.name}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Joriy jamg'arish tezligida ({formatCurrency(annualSummary.averageMonthlyVelocity, currency)}/oy),
                  maqsadga yetish uchun taxminan{' '}
                  <strong className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                    {annualSummary.monthsToPrimaryGoal > 0 ? `${annualSummary.monthsToPrimaryGoal} oy` : "1 oydan kam"}
                  </strong>{' '}
                  kerak bo'ladi.
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Hozircha faol maqsad belgilanmagan. Maqsad qo'shish orqali tezlikni kuzating.
              </p>
            )}
          </div>

          {/* Card: Velocity Boost Simulator */}
          <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tezlikni oshirish simulyatori</span>
              </span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                +{velocityBoostPercent}% tejash
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Xarajatlarni {velocityBoostPercent > 0 ? `${velocityBoostPercent}%` : 'biroz'} optimallashtirsangiz, yillik jamg'arma tezligingiz qanday oshishini sinab ko'ring:
            </p>

            <div className="flex items-center gap-1.5 pt-1">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setVelocityBoostPercent(pct)}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition tabular-nums ${
                    velocityBoostPercent === pct
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pct === 0 ? 'Asl' : `+${pct}%`}
                </button>
              ))}
            </div>

            {velocityBoostPercent > 0 && (
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium pt-1 flex items-center justify-between border-t border-emerald-200/60 dark:border-emerald-800/60">
                <span>Yillik qo'shimcha tejov:</span>
                <span className="font-bold tabular-nums">
                  +{formatCurrency(
                    Math.round(
                      (annualSummary.totalAnnualExpenses / (1 - velocityBoostPercent / 100)) *
                        (velocityBoostPercent / 100)
                    ),
                    currency
                  )}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 5. Expandable Detailed 12-Month Table */}
        <div className="pt-2">
          <button
            onClick={() => setIsTableExpanded(!isTableExpanded)}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center justify-between"
          >
            <span>12-oylik batafsil hisob-kitob jadvalini {isTableExpanded ? 'yashirish' : 'ko\'rish'}</span>
            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <span>{isTableExpanded ? 'Yopish' : 'Ochish'}</span>
              {isTableExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {isTableExpanded && (
            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Oy</th>
                    <th className="py-2.5 px-3 text-right">Daromad</th>
                    <th className="py-2.5 px-3 text-right">Kreditlar</th>
                    <th className="py-2.5 px-3 text-right">Xarajat & Kommunal</th>
                    <th className="py-2.5 px-3 text-right">Sof jamg'arma</th>
                    <th className="py-2.5 px-3 text-right">Tejamkorlik %</th>
                    <th className="py-2.5 px-3 text-right">Kümülyativ tezlik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {monthlyData.map((row) => (
                    <tr
                      key={row.monthKey}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">
                        {row.fullName}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums font-semibold">
                        +{formatCurrency(row.income, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-500 tabular-nums">
                        {formatCurrency(row.loans, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300 tabular-nums">
                        {formatCurrency(row.expenses + row.utilities, currency)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right tabular-nums font-bold ${
                          row.netSavings >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {row.netSavings >= 0 ? '+' : ''}
                        {formatCurrency(row.netSavings, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300 tabular-nums">
                        {row.savingsRate}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400 tabular-nums font-semibold">
                        {formatCurrency(row.cumulativeSavings, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-800 font-mono">
                  <tr>
                    <td className="py-2.5 px-3 font-sans text-slate-900 dark:text-white">
                      Yillik jami
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatCurrency(annualSummary.totalAnnualIncome, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-500 tabular-nums">
                      {formatCurrency(annualSummary.totalAnnualLoans, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-200 tabular-nums">
                      {formatCurrency(
                        annualSummary.totalAnnualExpenses + annualSummary.totalAnnualUtilities,
                        currency
                      )}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right tabular-nums ${
                        annualSummary.totalAnnualNetSavings >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {annualSummary.totalAnnualNetSavings >= 0 ? '+' : ''}
                      {formatCurrency(annualSummary.totalAnnualNetSavings, currency)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white tabular-nums">
                      {annualSummary.averageSavingsRate}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {formatCurrency(annualSummary.totalAnnualNetSavings, currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
