import React, { useState } from 'react';
import { SavingsGoal, Investment, CurrencyType, Loan } from '../../types';
import { formatCurrency, calculateCompoundInterest } from '../../utils/finance';
import {
  PiggyBank,
  TrendingUp,
  Target,
  Plus,
  Coins,
  ShieldCheck,
  Calculator,
  ArrowRight,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

interface InvestmentsViewProps {
  savingsGoals: SavingsGoal[];
  investments: Investment[];
  loans: Loan[];
  currency: CurrencyType;
  onAddGoal: (goal: SavingsGoal) => void;
  onUpdateGoalProgress: (id: string, newAmount: number) => void;
  onAddInvestment: (inv: Investment) => void;
}

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({
  savingsGoals,
  investments,
  loans,
  currency,
  onAddGoal,
  onUpdateGoalProgress,
  onAddInvestment,
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'investments' | 'calculator'>('goals');
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAddInvModal, setShowAddInvModal] = useState(false);

  // Compound Interest Calculator State
  const [calcInitial, setCalcInitial] = useState(5000000);
  const [calcMonthly, setCalcMonthly] = useState(1500000);
  const [calcRate, setCalcRate] = useState(21); // 21% Uzbekistan bank national deposit standard
  const [calcYears, setCalcYears] = useState(5);

  // New Goal State
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: 20000000,
    currentAmount: 2000000,
    targetDate: '2027-06-01',
    category: 'Zaxira',
  });

  // New Investment State
  const [newInv, setNewInv] = useState({
    name: '',
    type: 'deposit' as const,
    investedAmount: 10000000,
    currentValue: 10000000,
    expectedAnnualReturnRate: 21,
    startDate: new Date().toISOString().slice(0, 10),
  });

  const compoundResults = calculateCompoundInterest(
    calcInitial,
    calcMonthly,
    calcRate,
    calcYears
  );
  const lastYearResult = compoundResults[compoundResults.length - 1];

  // Highest loan interest comparison
  const highestLoan = [...loans]
    .filter((l) => !l.isPaidOff)
    .sort((a, b) => b.annualInterestRate - a.annualInterestRate)[0];

  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalInvested = investments.reduce((sum, i) => sum + i.currentValue, 0);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name) return;

    onAddGoal({
      id: `goal-${Date.now()}`,
      name: newGoal.name,
      targetAmount: Number(newGoal.targetAmount),
      currentAmount: Number(newGoal.currentAmount),
      targetDate: newGoal.targetDate,
      category: newGoal.category,
      monthlyContributionNeeded: Math.round(
        (Number(newGoal.targetAmount) - Number(newGoal.currentAmount)) / 12
      ),
      isAchieved: false,
    });
    setShowAddGoalModal(false);
  };

  const handleSaveInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.name) return;

    onAddInvestment({
      id: `inv-${Date.now()}`,
      name: newInv.name,
      type: newInv.type,
      investedAmount: Number(newInv.investedAmount),
      currentValue: Number(newInv.currentValue),
      expectedAnnualReturnRate: Number(newInv.expectedAnnualReturnRate),
      startDate: newInv.startDate,
    });
    setShowAddInvModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Investitsiya va jamg'arma
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelajak maqsadlari, murakkab foiz imkoniyati va aktivlar portfeli.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'goals' && (
            <button
              onClick={() => setShowAddGoalModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Maqsad qo'shish</span>
            </button>
          )}
          {activeTab === 'investments' && (
            <button
              onClick={() => setShowAddInvModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Aktiv qo'shish</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('goals')}
          className={`pb-2 text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'goals'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Jamg'arma maqsadlari ({savingsGoals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('investments')}
          className={`pb-2 text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'investments'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Investitsiya aktivlari ({investments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`pb-2 text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'calculator'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Murakkab foiz kalkulyatori</span>
        </button>
      </div>

      {/* Comparison against loans insight banner */}
      {highestLoan && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-900 dark:text-amber-200">
              Kredit foizini investitsiya daromadiga solishtirish:
            </h4>
            <p className="text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              Byudjetingizda <strong>{highestLoan.annualInterestRate}% yillik foizli</strong> "{highestLoan.name}" krediti bor. Bank depozitining o'rtacha daromadi 21-22% bo'lgani sababli, ortiqcha pulni investitsiyaga emas, avval {highestLoan.annualInterestRate}% lik kreditni tezroq yopishga yo'naltirish <strong>moliyaviy jihatdan ancha foydaliroq!</strong>
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Maqsadlarda to'plangan</span>
          <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalSaved, currency)}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Aktivlar joriy qiymati</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalInvested, currency)}
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Xavf profili tavsiyasi</span>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Mo'tadil (Omonat + Oltin + Valyuta)
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: SAVINGS GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savingsGoals.map((goal) => {
              const progress = Math.min(
                100,
                Math.round((goal.currentAmount / (goal.targetAmount || 1)) * 100)
              );

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {goal.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {goal.name}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                      {progress}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      <span>{formatCurrency(goal.currentAmount, currency)}</span>
                      <span>{formatCurrency(goal.targetAmount, currency)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>Muddat: {goal.targetDate}</span>
                    <button
                      onClick={() =>
                        onUpdateGoalProgress(
                          goal.id,
                          goal.currentAmount + 1000000
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[11px] font-semibold transition"
                    >
                      +1 mln qo'shish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INVESTMENTS LIST */}
      {activeTab === 'investments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {investments.map((inv) => (
            <div
              key={inv.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                  {inv.type}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{inv.expectedAnnualReturnRate}% yillik
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {inv.name}
                </h4>
                {inv.notes && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{inv.notes}</p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tikilgan mablag':</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatCurrency(inv.investedAmount, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hozirgi bahosi:</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(inv.currentValue, currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: COMPOUND INTEREST CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Kalkulyator parametrlari</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Boshlang'ich summa (so'm):
              </label>
              <input
                type="number"
                value={calcInitial}
                onChange={(e) => setCalcInitial(Number(e.target.value))}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white tabular-nums"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Har oy qo'shiladigan mablag' (so'm):
              </label>
              <input
                type="number"
                value={calcMonthly}
                onChange={(e) => setCalcMonthly(Number(e.target.value))}
                className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kutilayotgan foiz (%):
                </label>
                <input
                  type="number"
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Muddat (yil):
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={calcYears}
                  onChange={(e) => setCalcYears(Number(e.target.value))}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-2 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {calcYears} yildan keyingi natija
            </h3>

            {lastYearResult && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <span className="text-slate-500 block">Jami o'zingiz kiritgan pul</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(lastYearResult.totalDeposited, currency)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs">
                  <span className="text-emerald-700 dark:text-emerald-300 block">
                    Murakkab foizdan foyda
                  </span>
                  <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">
                    +{formatCurrency(lastYearResult.interestEarned, currency)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-xs">
                  <span className="text-indigo-700 dark:text-indigo-300 block">
                    Yakuniy jamg'arma (FV)
                  </span>
                  <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-300 tabular-nums">
                    {formatCurrency(lastYearResult.futureValue, currency)}
                  </span>
                </div>
              </div>
            )}

            {/* Year-by-Year Growth Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2">Yil</th>
                    <th className="py-2">Kiritilgan sarmoya</th>
                    <th className="py-2">Murakkab foiz daromadi</th>
                    <th className="py-2">Jami balans</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {compoundResults.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 font-bold">{row.year}-yil</td>
                      <td className="py-2 tabular-nums">
                        {formatCurrency(row.totalDeposited, currency)}
                      </td>
                      <td className="py-2 text-emerald-600 font-bold tabular-nums">
                        +{formatCurrency(row.interestEarned, currency)}
                      </td>
                      <td className="py-2 font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(row.futureValue, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD GOAL */}
      {showAddGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Yangi jamg'arma maqsadi
              </h3>
              <button
                onClick={() => setShowAddGoalModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Maqsad nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Uy xaridi, Haj safari, Zaxira fondi"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kerakli summa (so'm)
                  </label>
                  <input
                    type="number"
                    min={100000}
                    value={newGoal.targetAmount}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Hozir bor summa
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newGoal.currentAmount}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, currentAmount: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Toifa
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Zaxira">Favqulodda zaxira</option>
                    <option value="Uy-joy">Uy-joy</option>
                    <option value="Avtomobil">Avtomobil</option>
                    <option value="Ziyorat">Ziyorat / Haj / Umra</option>
                    <option value="Ta'lim">Farzandlar ta'limi</option>
                    <option value="Boshqa">Boshqa</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Erishish muddati
                  </label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, targetDate: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddGoalModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
                >
                  Maqsadni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD INVESTMENT */}
      {showAddInvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Yangi investitsiya aktivi
              </h3>
              <button
                onClick={() => setShowAddInvModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvestment} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Aktiv nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Bank omonati, Oltin quyma, Dollar"
                  value={newInv.name}
                  onChange={(e) => setNewInv({ ...newInv, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Aktiv turi
                  </label>
                  <select
                    value={newInv.type}
                    onChange={(e) => setNewInv({ ...newInv, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="deposit">Bank depoziti (omonat)</option>
                    <option value="gold">Oltin quymasi</option>
                    <option value="currency">Valyuta (USD / EUR)</option>
                    <option value="stocks">Aksiyalar / Obligatsiyalar</option>
                    <option value="real_estate">Ko'chmas mulk</option>
                    <option value="business">Biznes ulushi</option>
                    <option value="crypto">Kriptoaktiv</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Yillik kutilayotgan daromad (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newInv.expectedAnnualReturnRate}
                    onChange={(e) =>
                      setNewInv({
                        ...newInv,
                        expectedAnnualReturnRate: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tikilgan mablag' (so'm)
                  </label>
                  <input
                    type="number"
                    value={newInv.investedAmount}
                    onChange={(e) =>
                      setNewInv({
                        ...newInv,
                        investedAmount: Number(e.target.value),
                        currentValue: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Boshlangan sana
                  </label>
                  <input
                    type="date"
                    value={newInv.startDate}
                    onChange={(e) => setNewInv({ ...newInv, startDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddInvModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
                >
                  Aktivni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
