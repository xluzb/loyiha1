import React, { useState, useMemo } from 'react';
import {
  Loan,
  Income,
  Expense,
  ExpenseCategory,
  UtilityBill,
  SavingsGoal,
  CurrencyType,
} from '../../types';
import {
  formatCurrency,
  calculateFinancialHealth,
  calculateDTI,
} from '../../utils/finance';
import { DonutChart } from '../charts/DonutChart';
import { LineTrendChart } from '../charts/LineTrendChart';
import { HealthGauge } from '../charts/HealthGauge';
import { AnnualReportsSection } from './AnnualReportsSection';
import { MobileConnectModal } from '../common/MobileConnectModal';
import {
  Wallet,
  TrendingDown,
  CreditCard,
  Calendar,
  CalendarRange,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Smartphone,
  QrCode,
} from 'lucide-react';

interface DashboardViewProps {
  incomes: Income[];
  loans: Loan[];
  expenses: Expense[];
  categories: ExpenseCategory[];
  utilities: UtilityBill[];
  savingsGoals: SavingsGoal[];
  currency: CurrencyType;
  onNavigateTab: (tabId: string) => void;
  onQuickAddExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  incomes,
  loans,
  expenses,
  categories,
  utilities,
  savingsGoals,
  currency,
  onNavigateTab,
  onQuickAddExpense,
}) => {
  const [showMobileConnect, setShowMobileConnect] = useState(false);

  // 1. Monthly Recurring Income
  const totalMonthlyIncome = useMemo(() => {
    return incomes.reduce(
      (sum, inc) => (inc.isRecurring ? sum + inc.amount : sum),
      0
    );
  }, [incomes]);

  // 2. Active Loans Monthly Payment Total
  const totalLoanMonthly = useMemo(() => {
    return loans
      .filter((l) => !l.isPaidOff)
      .reduce((sum, l) => sum + l.monthlyPayment, 0);
  }, [loans]);

  // 3. Current Month Variable Expenses Total
  const totalExpensesSpent = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // 4. Utilities Monthly Total
  const totalUtilitiesSpent = useMemo(() => {
    return utilities.reduce((sum, u) => sum + u.amount, 0);
  }, [utilities]);

  // Total Outflow
  const totalOutflow = totalLoanMonthly + totalExpensesSpent + totalUtilitiesSpent;
  const netRemaining = totalMonthlyIncome - totalOutflow;

  // Total Emergency Fund
  const emergencyFundTotal = useMemo(() => {
    return savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  }, [savingsGoals]);

  // Health Score Calculation
  const healthBreakdown = useMemo(() => {
    return calculateFinancialHealth(
      totalMonthlyIncome,
      totalExpensesSpent + totalUtilitiesSpent,
      totalLoanMonthly,
      emergencyFundTotal
    );
  }, [totalMonthlyIncome, totalLoanMonthly, totalExpensesSpent, totalUtilitiesSpent, emergencyFundTotal]);

  // DTI
  const dti = calculateDTI(totalLoanMonthly, totalMonthlyIncome);

  // Donut chart data (Categorized Outflow)
  const donutData = useMemo(() => {
    const list: { label: string; value: number; color: string }[] = [];

    if (totalLoanMonthly > 0) {
      list.push({
        label: 'Kredit to\'lovlari',
        value: totalLoanMonthly,
        color: '#f43f5e',
      });
    }

    if (totalUtilitiesSpent > 0) {
      list.push({
        label: 'Kommunal to\'lovlar',
        value: totalUtilitiesSpent,
        color: '#0284c7',
      });
    }

    for (const cat of categories) {
      const catSpent = expenses
        .filter((e) => e.categoryId === cat.id)
        .reduce((sum, e) => sum + e.amount, 0);
      if (catSpent > 0) {
        list.push({
          label: cat.name,
          value: catSpent,
          color: cat.color,
        });
      }
    }

    return list;
  }, [totalLoanMonthly, totalUtilitiesSpent, categories, expenses]);

  // 6-month historical trend
  const trendData = useMemo(() => {
    const months = ['Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen'];
    return months.map((m, idx) => {
      const multiplier = 0.88 + idx * 0.024;
      return {
        month: m,
        income: Math.round(totalMonthlyIncome * multiplier),
        expenses: Math.round((totalOutflow * 0.95 + idx * 200000) * (idx === 5 ? 1 : 0.92)),
      };
    });
  }, [totalMonthlyIncome, totalOutflow]);

  // Upcoming payments in next 7 days
  const upcomingPayments = useMemo(() => {
    const list: {
      id: string;
      title: string;
      amount: number;
      type: 'loan' | 'utility';
      dueText: string;
      daysLeft: number;
    }[] = [];

    const now = new Date();
    const currentDay = now.getDate();

    // Loans due day check
    for (const loan of loans.filter((l) => !l.isPaidOff)) {
      let daysLeft = loan.paymentDueDay - currentDay;
      if (daysLeft < 0) daysLeft += 30; // next month cycle
      if (daysLeft <= 7) {
        list.push({
          id: loan.id,
          title: `${loan.name} (${loan.bankName})`,
          amount: loan.monthlyPayment,
          type: 'loan',
          dueText: `Har oyning ${loan.paymentDueDay}-kuni`,
          daysLeft,
        });
      }
    }

    // Utilities due check
    for (const util of utilities.filter((u) => !u.isPaid)) {
      const dueDate = new Date(util.dueDate);
      const diffDays = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 0 && diffDays <= 7) {
        list.push({
          id: util.id,
          title: util.name,
          amount: util.amount,
          type: 'utility',
          dueText: util.dueDate,
          daysLeft: diffDays,
        });
      }
    }

    return list.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [loans, utilities]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Boshqaruv paneli
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Oilangizning umumiy byudjeti, xarajatlari va kredit dinamikasi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setShowMobileConnect(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 hover:bg-emerald-100 text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            title="QR-kod orqali telefoningizda ochish"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Telefonda ochish (QR)</span>
          </button>

          <button
            onClick={onQuickAddExpense}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <span>+ Tezkor xarajat</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('annual-reports-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
            title="Yillik hisobotlar va jamg'arma tezligi"
          >
            <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
            <span>Yillik hisobot</span>
          </button>

          <button
            onClick={() => onNavigateTab('strategy')}
            className="px-3.5 py-2 rounded-xl border border-emerald-600/30 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 text-xs font-semibold transition flex items-center gap-1"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Kredit strategiyasi</span>
          </button>
        </div>
      </div>

      {/* Mobile Connect Modal */}
      <MobileConnectModal
        isOpen={showMobileConnect}
        onClose={() => setShowMobileConnect(false)}
      />

      {/* Main 3 Financial Summary Cards (Hero Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Daromad */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Oylik jami daromad
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            +{formatCurrency(totalMonthlyIncome, currency)}
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Barqaror manbalar:</span>
            <button
              onClick={() => onNavigateTab('incomes')}
              className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
            >
              {incomes.length} ta manba →
            </button>
          </div>
        </div>

        {/* Card 2: Xarajatlar & Kreditlar */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jami oylik chiqim
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
            -{formatCurrency(totalOutflow, currency)}
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Kreditlar: {formatCurrency(totalLoanMonthly, currency)}</span>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-rose-600 dark:text-rose-400 font-semibold hover:underline"
            >
              Batafsil →
            </button>
          </div>
        </div>

        {/* Card 3: Qolgan mablag' (Balans) */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Erkin oylik qoldiq
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div
            className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight ${
              netRemaining >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(netRemaining, currency)}
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>DTI yuklama:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full ${dti.badgeBg}`}
            >
              {dti.dti}% ({dti.label})
            </span>
          </div>
        </div>
      </div>

      {/* AI Quick Insight Banner on Dashboard */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border border-emerald-200/60 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              AI Maslahatchi oylik tavsiyasi:
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              {dti.dti > 40
                ? `Diqqat: Oylik qarz yukingiz ${dti.dti}% ga yetgan. Eng yuqori foizli kreditga har oy qo'shimcha to'lov ajrating.`
                : `Moliyaviy balansingiz barqaror. Oylik erkin qoldiqning kamida 50% qismini favqulodda zaxira va depozitga yo'naltiring.`}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('ai')}
          className="self-end sm:self-auto shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 shadow-sm"
        >
          <span>AI bilan suhbat</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SECTION: Moliyaviy salomatlik bali + Xarajatlar toifalar taqsimoti */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card: Moliyaviy salomatlik bali (0–100) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Moliyaviy salomatlik bali
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <HealthGauge breakdown={healthBreakdown} />
        </div>

        {/* Card: Xarajatlar toifalar bo'yicha Doira diagramma (DonutChart) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Xarajatlar strukturasi
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Mablag'lar qayerga sarflanmoqda?
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Barcha toifalar →
            </button>
          </div>

          <DonutChart
            items={donutData}
            centerTitle="Jami sarf"
            currency={currency}
          />
        </div>
      </div>

      {/* SECTION: 6-Oylik Dinamika (LineTrendChart) + Yaqin 7 Kundagi to'lovlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 6-Oylik Dinamika */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Oylik dinamika
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Daromad va xarajatlar tendentsiyasi
              </h3>
            </div>
          </div>

          <LineTrendChart data={trendData} currency={currency} />
        </div>

        {/* Yaqin 7 kundagi to'lovlar eslatmasi */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Yaqin 7 kunlik to'lovlar
            </span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>

          {upcomingPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Yaqin kunlarda to'lovlar rejalashtirilmagan.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingPayments.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {item.daysLeft === 0
                          ? 'Bugun to\'lash kerak!'
                          : `${item.daysLeft} kundan keyin`}
                      </span>
                      <span>•</span>
                      <span>{item.dueText}</span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums shrink-0">
                    {formatCurrency(item.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigateTab('loans')}
              className="w-full py-2 rounded-xl text-xs font-semibold text-center text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Barcha to'lov rejalarini ko'rish →
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: Yillik hisobotlar va Jamg'arma tezligi (12-Month Annual Reports & Saving Velocity via Recharts) */}
      <div id="annual-reports-section" className="scroll-mt-6">
        <AnnualReportsSection
          incomes={incomes}
          loans={loans}
          expenses={expenses}
          categories={categories}
          utilities={utilities}
          savingsGoals={savingsGoals}
          currency={currency}
          onNavigateTab={onNavigateTab}
        />
      </div>
    </div>
  );
};
