import React, { useState, useMemo } from 'react';
import {
  Loan,
  ExpenseCategory,
  Expense,
  SavingsGoal,
  CurrencyType,
} from '../../types';
import {
  formatCurrency,
  calculateDTI,
  calculateLoanPriorityScore,
  simulateStrategies,
  recommendBudgetDistribution,
  simulateWhatIfExtraPayment,
  calculateRefinanceBenefit,
} from '../../utils/finance';
import {
  TrendingUp,
  AlertTriangle,
  Zap,
  ArrowRight,
  ShieldAlert,
  Percent,
  Calculator,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface StrategyModuleViewProps {
  loans: Loan[];
  monthlyIncome: number;
  expenses: Expense[];
  categories: ExpenseCategory[];
  savingsGoals: SavingsGoal[];
  currency: CurrencyType;
  onNavigateTab: (tabId: string) => void;
}

export const StrategyModuleView: React.FC<StrategyModuleViewProps> = ({
  loans,
  monthlyIncome,
  categories,
  savingsGoals,
  currency,
  onNavigateTab,
}) => {
  const [selectedStrategyTab, setSelectedStrategyTab] = useState<
    'avalanche' | 'snowball' | 'hybrid'
  >('avalanche');

  // "What if" calculator extra monthly budget state
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(1000000);
  const [whatIfLoanId, setWhatIfLoanId] = useState<string>(
    loans.find((l) => !l.isPaidOff)?.id || ''
  );

  // Refinance calculator state
  const [refinanceLoanId, setRefinanceLoanId] = useState<string>(
    loans.find((l) => !l.isPaidOff)?.id || ''
  );
  const [newRefinanceRate, setNewRefinanceRate] = useState<number>(18);
  const [newRefinanceTerm, setNewRefinanceTerm] = useState<number>(36);

  const activeLoans = useMemo(
    () => loans.filter((l) => !l.isPaidOff && l.remainingPrincipal > 0),
    [loans]
  );

  // Calculate essential expenses (essential categories budget limits)
  const essentialExpensesTotal = useMemo(() => {
    return categories
      .filter((c) => c.isEssential)
      .reduce((sum, c) => sum + (c.budgetLimit || 0), 0);
  }, [categories]);

  // Current emergency fund
  const emergencyFundCurrent = useMemo(() => {
    const efGoal = savingsGoals.find(
      (g) =>
        g.category.toLowerCase().includes('zaxira') ||
        g.name.toLowerCase().includes('zaxira')
    );
    return efGoal ? efGoal.currentAmount : 0;
  }, [savingsGoals]);

  // 1. DTI & Budget recommendations
  const budgetRec = useMemo(() => {
    return recommendBudgetDistribution(
      monthlyIncome,
      essentialExpensesTotal,
      activeLoans,
      emergencyFundCurrent
    );
  }, [monthlyIncome, essentialExpensesTotal, activeLoans, emergencyFundCurrent]);

  // 2. Strategy simulations
  const strategySim = useMemo(() => {
    return simulateStrategies(
      activeLoans,
      budgetRec.allocation.extraLoanAmount || 500000
    );
  }, [activeLoans, budgetRec.allocation.extraLoanAmount]);

  // 3. Priority ranking of loans
  const prioritizedLoans = useMemo(() => {
    return [...activeLoans]
      .map((loan) => ({
        loan,
        score: calculateLoanPriorityScore(loan, monthlyIncome),
      }))
      .sort((a, b) => b.score - a.score);
  }, [activeLoans, monthlyIncome]);

  // 4. "What if" calculation
  const targetWhatIfLoan = activeLoans.find((l) => l.id === whatIfLoanId) || activeLoans[0];
  const whatIfResult = useMemo(() => {
    if (!targetWhatIfLoan) return null;
    return simulateWhatIfExtraPayment(targetWhatIfLoan, extraMonthlyPayment);
  }, [targetWhatIfLoan, extraMonthlyPayment]);

  // 5. Refinance calculation
  const targetRefinanceLoan =
    activeLoans.find((l) => l.id === refinanceLoanId) || activeLoans[0];
  const refinanceResult = useMemo(() => {
    if (!targetRefinanceLoan) return null;
    return calculateRefinanceBenefit(
      targetRefinanceLoan,
      newRefinanceRate,
      newRefinanceTerm
    );
  }, [targetRefinanceLoan, newRefinanceRate, newRefinanceTerm]);

  const dti = calculateDTI(
    budgetRec.mandatoryLoanPaymentsTotal,
    monthlyIncome
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Mission */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Kredit strategiyasi va tavsiyalar</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Foiz stavkalari va qarz hajmini tahlil qilib, eng optimal to'lash rejasini tuzing.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('loans')}
          className="self-start sm:self-auto px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
        >
          Kreditlar ro'yxati →
        </button>
      </div>

      {/* DTI Critical Warning Alert if > 50% */}
      {budgetRec.warningAlert && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3.5 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Qarz yuki bo'yicha muhim ogohlantirish!
            </h4>
            <p className="text-xs text-rose-800/90 dark:text-rose-300 mt-1 leading-relaxed">
              {budgetRec.warningAlert}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 1: DTI Meter & Family Budget Allocation Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: DTI Gauge & Status */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              DTI (Qarz yuki ko'rsatkichi)
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${dti.badgeBg}`}
            >
              {dti.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {dti.dti}%
            </span>
            <span className="text-xs text-slate-500">
              daromadga nisbatan kredit to'lovlari
            </span>
          </div>

          {/* DTI Range visual bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: '20%' }} title="0-20%: Yaxshi" />
              <div className="h-full bg-lime-500" style={{ width: '15%' }} title="20-35%: Me'yorda" />
              <div className="h-full bg-amber-500" style={{ width: '15%' }} title="35-50%: Xavfli" />
              <div className="h-full bg-rose-500" style={{ width: '50%' }} title="50%+: Kritik" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0%</span>
              <span className="text-emerald-600 font-semibold">20%</span>
              <span className="text-lime-600 font-semibold">35%</span>
              <span className="text-amber-600 font-semibold">50%</span>
              <span>100%</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            {dti.dti <= 20
              ? 'Ajoyib! Qarz yukingiz juda xavfsiz. Mablag\'ning ko\'p qismini jamg\'arma va investitsiyalarga ajratishingiz mumkin.'
              : dti.dti <= 35
              ? 'Me\'yordagi ko\'rsatkich. Yangi qarz olishda ehtiyotkor bo\'ling va ortiqcha xarajatlarni nazorat qiling.'
              : dti.dti <= 50
              ? 'Xavfli daraja! Oylik daromadingizning uchdan bir qismidan ko\'pi kreditlarga ketmoqda. Yangi kreditlar olmang.'
              : 'Kritik xavf! Daromadning 50% dan ko\'prog\'i qarz to\'lashga sarflanmoqda. Zudlik bilan yuqori foizli kreditlarni yopish rejasiga o\'ting!'}
          </p>
        </div>

        {/* Card 2 & 3: Tavsiya etilgan oylik byudjet taqsimoti (Waterfall) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Oylik byudjetni taqsimlash tavsiyasi
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                Daromad qanday taqsimlanishi kerak?
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Oylik tushum: <strong>{formatCurrency(monthlyIncome, currency)}</strong>
            </span>
          </div>

          {/* 5-Step Distribution Bar */}
          <div className="space-y-3">
            <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 dark:bg-slate-800">
              {budgetRec.allocation.essentialPct > 0 && (
                <div
                  style={{ width: `${budgetRec.allocation.essentialPct}%` }}
                  className="bg-sky-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title={`Majburiy xarajatlar: ${budgetRec.allocation.essentialPct}%`}
                >
                  {budgetRec.allocation.essentialPct > 10 ? `${budgetRec.allocation.essentialPct}%` : ''}
                </div>
              )}
              {budgetRec.allocation.mandatoryLoanPct > 0 && (
                <div
                  style={{ width: `${budgetRec.allocation.mandatoryLoanPct}%` }}
                  className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title={`Kreditlar minimal: ${budgetRec.allocation.mandatoryLoanPct}%`}
                >
                  {budgetRec.allocation.mandatoryLoanPct > 10 ? `${budgetRec.allocation.mandatoryLoanPct}%` : ''}
                </div>
              )}
              {budgetRec.allocation.extraLoanPct > 0 && (
                <div
                  style={{ width: `${budgetRec.allocation.extraLoanPct}%` }}
                  className="bg-amber-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title={`Qo'shimcha kredit: ${budgetRec.allocation.extraLoanPct}%`}
                >
                  {budgetRec.allocation.extraLoanPct > 8 ? `${budgetRec.allocation.extraLoanPct}%` : ''}
                </div>
              )}
              {budgetRec.allocation.emergencySavingsPct > 0 && (
                <div
                  style={{ width: `${budgetRec.allocation.emergencySavingsPct}%` }}
                  className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title={`Jamg'arma: ${budgetRec.allocation.emergencySavingsPct}%`}
                >
                  {budgetRec.allocation.emergencySavingsPct > 8 ? `${budgetRec.allocation.emergencySavingsPct}%` : ''}
                </div>
              )}
              {budgetRec.allocation.lifestylePct > 0 && (
                <div
                  style={{ width: `${budgetRec.allocation.lifestylePct}%` }}
                  className="bg-indigo-400 h-full flex items-center justify-center text-[10px] text-white font-bold"
                  title={`Erkin qoldiq: ${budgetRec.allocation.lifestylePct}%`}
                >
                  {budgetRec.allocation.lifestylePct > 8 ? `${budgetRec.allocation.lifestylePct}%` : ''}
                </div>
              )}
            </div>

            {/* Legend & Exact amounts */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs pt-1">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40">
                <span className="text-[10px] text-sky-700 dark:text-sky-300 block font-medium">1. Majburiy sarf</span>
                <span className="font-bold text-sky-950 dark:text-sky-100 tabular-nums">
                  {formatCurrency(budgetRec.allocation.essentialAmount, currency)}
                </span>
                <span className="text-[10px] text-sky-600/80 block">({budgetRec.allocation.essentialPct}%)</span>
              </div>

              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
                <span className="text-[10px] text-rose-700 dark:text-rose-300 block font-medium">2. Asosiy kredit</span>
                <span className="font-bold text-rose-950 dark:text-rose-100 tabular-nums">
                  {formatCurrency(budgetRec.allocation.mandatoryLoanAmount, currency)}
                </span>
                <span className="text-[10px] text-rose-600/80 block">({budgetRec.allocation.mandatoryLoanPct}%)</span>
              </div>

              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
                <span className="text-[10px] text-amber-700 dark:text-amber-300 block font-medium">3. Tezlatishga</span>
                <span className="font-bold text-amber-950 dark:text-amber-100 tabular-nums">
                  {formatCurrency(budgetRec.allocation.extraLoanAmount, currency)}
                </span>
                <span className="text-[10px] text-amber-600/80 block">({budgetRec.allocation.extraLoanPct}%)</span>
              </div>

              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-medium">4. Zaxira/Jamg'arma</span>
                <span className="font-bold text-emerald-950 dark:text-emerald-100 tabular-nums">
                  {formatCurrency(budgetRec.allocation.emergencySavingsAmount, currency)}
                </span>
                <span className="text-[10px] text-emerald-600/80 block">({budgetRec.allocation.emergencySavingsPct}%)</span>
              </div>

              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 block font-medium">5. Erkin qoldiq</span>
                <span className="font-bold text-indigo-950 dark:text-indigo-100 tabular-nums">
                  {formatCurrency(budgetRec.allocation.lifestyleAmount, currency)}
                </span>
                <span className="text-[10px] text-indigo-600/80 block">({budgetRec.allocation.lifestylePct}%)</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-200 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>{budgetRec.summaryText}</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: Qaysi kreditni birinchi yopish kerak? (Ustuvorlik reytingi) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Ustuvorlashtirish reytingi
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Qaysi kreditni birinchi yopish kerak?
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Algoritm foiz stavkasi, qarz miqdori va to'lov yukini hisobga oladi.
          </p>
        </div>

        {prioritizedLoans.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Hozircha faol kreditlar mavjud emas. Yangi kredit qo'shing.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {prioritizedLoans.map(({ loan, score }, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={loan.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isFirst
                      ? 'border-emerald-500 dark:border-emerald-500/80 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm relative'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  {isFirst && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-current" />
                      1-maqsad
                    </span>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      #{index + 1} Navbat
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                      {score} ball
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {loan.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-3">
                    {loan.bankName}
                  </p>

                  <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Yillik foiz:</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {loan.annualInterestRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Qolgan qarz:</span>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(loan.remainingPrincipal, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Oylik to'lov:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                        {formatCurrency(loan.monthlyPayment, currency)}
                      </span>
                    </div>
                  </div>

                  {isFirst && (
                    <div className="mt-3.5 pt-2 border-t border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300">
                      <strong>Tavsiya:</strong> Erkin byudjetning katta qismini shu kreditga qo'shimcha to'lov qilib yo'naltiring!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: 3 ta Strategiya taqqoslashi (Avalanche vs Snowball vs Hybrid) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Strategiyalar taqqoslash moduli
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Ko'chki vs Qor to'pi vs Aralash strategiya
            </h3>
          </div>

          {/* Strategy Tabs */}
          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setSelectedStrategyTab('avalanche')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedStrategyTab === 'avalanche'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ko'chki (Avalanche)
            </button>
            <button
              onClick={() => setSelectedStrategyTab('snowball')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedStrategyTab === 'snowball'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Qor to'pi (Snowball)
            </button>
            <button
              onClick={() => setSelectedStrategyTab('hybrid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedStrategyTab === 'hybrid'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Aralash (Tavsiya)
            </button>
          </div>
        </div>

        {/* 3 Strategy Comparison Cards Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Avalanche Card */}
          <div
            onClick={() => setSelectedStrategyTab('avalanche')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedStrategyTab === 'avalanche'
                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                1. Ko'chki (Avalanche)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                Eng ko'p tejovchi
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Eng yuqori foiz stavkali kreditdan boshlab yopish. Eng ko'p foiz tejaladi.
            </p>

            <div className="space-y-2 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">To'liq qutulish muddati:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {strategySim.avalanche.totalMonthsToPayoff} oy ({strategySim.avalanche.debtFreeDate})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jami to'lanadigan foiz:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(strategySim.avalanche.totalInterestPaid, currency)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Tejaladigan mablag':</span>
                <span className="tabular-nums">
                  +{formatCurrency(strategySim.avalanche.totalInterestSaved, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Snowball Card */}
          <div
            onClick={() => setSelectedStrategyTab('snowball')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedStrategyTab === 'snowball'
                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                2. Qor to'pi (Snowball)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                Psixologik kuchli
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Eng kichik qarzdan boshlash. Kreditlar soni tez kamayib, ishonch bag'ishlaydi.
            </p>

            <div className="space-y-2 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">To'liq qutulish muddati:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {strategySim.snowball.totalMonthsToPayoff} oy ({strategySim.snowball.debtFreeDate})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jami to'lanadigan foiz:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(strategySim.snowball.totalInterestPaid, currency)}
                </span>
              </div>
              <div className="flex justify-between text-blue-600 dark:text-blue-400 font-bold">
                <span>Tejaladigan mablag':</span>
                <span className="tabular-nums">
                  +{formatCurrency(strategySim.snowball.totalInterestSaved, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Hybrid Card */}
          <div
            onClick={() => setSelectedStrategyTab('hybrid')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedStrategyTab === 'hybrid'
                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                3. Aralash (Tavsiya)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                Oltin o'rtaliq
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Kichik kreditlarni tez yopib, qolganida yuqori foizlilarga e'tibor qaratadi.
            </p>

            <div className="space-y-2 text-xs pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">To'liq qutulish muddati:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {strategySim.hybrid.totalMonthsToPayoff} oy ({strategySim.hybrid.debtFreeDate})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jami to'lanadigan foiz:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatCurrency(strategySim.hybrid.totalInterestPaid, currency)}
                </span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                <span>Tejaladigan mablag':</span>
                <span className="tabular-nums">
                  +{formatCurrency(strategySim.hybrid.totalInterestSaved, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Strategy Payoff Timeline Order */}
        {strategySim[selectedStrategyTab]?.payoffOrder?.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>
                "{strategySim[selectedStrategyTab].label}" bo'yicha kreditlarni yopish xronologiyasi:
              </span>
            </h4>

            <div className="space-y-2">
              {strategySim[selectedStrategyTab].payoffOrder.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {step.loanName}
                    </span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Taxminan <strong>{step.monthsToClose}-oyda</strong> to'liq yopiladi
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: Interactive "What-If" Calculator & Refinance Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* "NIMA BO'LADI AGAR?" KALKULYATORI */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                "Nima bo'ladi agar?" kalkulyatori
              </h3>
              <p className="text-xs text-slate-500">
                Agar har oy qo'shimcha summa to'lasam, qancha vaqt va foiz tejayman?
              </p>
            </div>
          </div>

          {activeLoans.length === 0 ? (
            <p className="text-xs text-slate-400">Faol kredit mavjud emas.</p>
          ) : (
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kreditni tanlang:
                </label>
                <select
                  value={whatIfLoanId}
                  onChange={(e) => setWhatIfLoanId(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {activeLoans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {formatCurrency(l.remainingPrincipal, currency)} ({l.annualInterestRate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Oylik qo'shimcha to'lov:
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums text-sm">
                    +{formatCurrency(extraMonthlyPayment, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={5000000}
                  step={100000}
                  value={extraMonthlyPayment}
                  onChange={(e) => setExtraMonthlyPayment(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>+100 000</span>
                  <span>+2 500 000</span>
                  <span>+5 000 000 so'm</span>
                </div>
              </div>

              {whatIfResult && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">
                      Asl qolgan muddat:
                    </span>
                    <span className="font-medium line-through text-slate-400 tabular-nums">
                      {whatIfResult.originalMonths} oy
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300 font-bold">
                      Yangi muddat:
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {whatIfResult.newMonths} oy ({whatIfResult.monthsSaved} oy erta!)
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    <span>Sof foizdan tejaladigan pul:</span>
                    <span className="tabular-nums text-sm">
                      {formatCurrency(whatIfResult.interestSaved, currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* QAYTA MOLIYALASH (REFINANCE) KALKULYATORI */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Qayta moliyalash (Refinanslash)
              </h3>
              <p className="text-xs text-slate-500">
                Pastroq foizli yangi kredit olib eskisini yopish foydalimi?
              </p>
            </div>
          </div>

          {activeLoans.length === 0 ? (
            <p className="text-xs text-slate-400">Faol kredit mavjud emas.</p>
          ) : (
            <div className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Mavjud kredit:
                </label>
                <select
                  value={refinanceLoanId}
                  onChange={(e) => setRefinanceLoanId(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {activeLoans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.annualInterestRate}% yillik ({formatCurrency(l.remainingPrincipal, currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Yangi foiz stavkasi (%):
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={newRefinanceRate}
                    onChange={(e) => setNewRefinanceRate(Number(e.target.value))}
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Yangi muddat (oy):
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={120}
                    value={newRefinanceTerm}
                    onChange={(e) => setNewRefinanceTerm(Number(e.target.value))}
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {refinanceResult && (
                <div
                  className={`p-4 rounded-xl border space-y-2 text-xs ${
                    refinanceResult.isBeneficial
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">
                      Hozirgi oylik to'lov:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      {formatCurrency(refinanceResult.currentMonthly, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">
                      Yangi oylik to'lov:
                    </span>
                    <span className="font-semibold text-blue-700 dark:text-blue-300 tabular-nums">
                      {formatCurrency(refinanceResult.newMonthly, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200/60 dark:border-blue-800/60 font-bold">
                    <span>
                      {refinanceResult.isBeneficial
                        ? 'Jami kutilayotgan sof tejamkorlik:'
                        : 'Qayta moliyalash foyda keltirmaydi:'}
                    </span>
                    <span
                      className={`tabular-nums text-sm ${
                        refinanceResult.isBeneficial
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {formatCurrency(refinanceResult.netLifetimeSavings, currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
