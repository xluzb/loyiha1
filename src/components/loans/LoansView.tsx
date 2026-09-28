import React, { useState } from 'react';
import { Loan, Debt, CurrencyType, PaymentType, LoanType, DebtType } from '../../types';
import { formatCurrency, generateAmortizationSchedule, calculateAnnuityPayment } from '../../utils/finance';
import confetti from 'canvas-confetti';
import {
  Plus,
  CreditCard,
  Building2,
  Calendar,
  Percent,
  CheckCircle2,
  Trash2,
  Table,
  X,
  UserCheck,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface LoansViewProps {
  loans: Loan[];
  debts: Debt[];
  currency: CurrencyType;
  onAddLoan: (loan: Loan) => void;
  onUpdateLoan: (loan: Loan) => void;
  onDeleteLoan: (id: string) => void;
  onPayLoanMonth: (loanId: string) => void;
  onAddDebt: (debt: Debt) => void;
  onResolveDebt: (debtId: string) => void;
  onDeleteDebt: (debtId: string) => void;
}

export const LoansView: React.FC<LoansViewProps> = ({
  loans,
  debts,
  currency,
  onAddLoan,
  onDeleteLoan,
  onPayLoanMonth,
  onAddDebt,
  onResolveDebt,
  onDeleteDebt,
}) => {
  const [activeTab, setActiveTab] = useState<'loans' | 'debts'>('loans');
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [selectedScheduleLoan, setSelectedScheduleLoan] = useState<Loan | null>(null);

  // New Loan Form State
  const [newLoan, setNewLoan] = useState({
    name: '',
    bankName: '',
    type: 'bank' as LoanType,
    originalPrincipal: 10000000,
    remainingPrincipal: 10000000,
    annualInterestRate: 24,
    paymentType: 'annuity' as PaymentType,
    startDate: new Date().toISOString().slice(0, 10),
    termMonths: 24,
    monthlyPayment: 520000,
    paymentDueDay: 15,
    prepaymentPenaltyRate: 0,
    notes: '',
  });

  // New Personal Debt Form State
  const [newDebt, setNewDebt] = useState({
    type: 'borrowed' as DebtType,
    counterparty: '',
    originalAmount: 2000000,
    remainingAmount: 2000000,
    dueDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    isInterestFree: true,
    annualInterestRate: 0,
    notes: '',
  });

  // Auto-calculate monthly payment when principal, rate, or term changes in form
  const handlePrincipalOrTermChange = (
    principal: number,
    rate: number,
    term: number,
    type: PaymentType
  ) => {
    const calculated =
      type === 'annuity'
        ? calculateAnnuityPayment(principal, rate, term)
        : Math.round(principal / term + (principal * rate) / 12 / 100);
    setNewLoan((prev) => ({
      ...prev,
      originalPrincipal: principal,
      remainingPrincipal: principal,
      annualInterestRate: rate,
      termMonths: term,
      paymentType: type,
      monthlyPayment: calculated,
    }));
  };

  const handleSaveLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.name) return;

    const schedule = generateAmortizationSchedule(
      newLoan.remainingPrincipal,
      newLoan.annualInterestRate,
      newLoan.termMonths,
      newLoan.paymentType,
      newLoan.startDate
    );

    const loan: Loan = {
      id: `loan-${Date.now()}`,
      name: newLoan.name,
      bankName: newLoan.bankName || "O'zbekiston banki",
      type: newLoan.type,
      originalPrincipal: Number(newLoan.originalPrincipal),
      remainingPrincipal: Number(newLoan.remainingPrincipal),
      annualInterestRate: Number(newLoan.annualInterestRate),
      paymentType: newLoan.paymentType,
      startDate: newLoan.startDate,
      termMonths: Number(newLoan.termMonths),
      monthlyPayment: Number(newLoan.monthlyPayment),
      paymentDueDay: Number(newLoan.paymentDueDay),
      prepaymentPenaltyRate: Number(newLoan.prepaymentPenaltyRate),
      isPaidOff: false,
      notes: newLoan.notes,
      schedule,
    };

    onAddLoan(loan);
    setShowAddLoanModal(false);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebt.counterparty) return;

    const debt: Debt = {
      id: `debt-${Date.now()}`,
      type: newDebt.type,
      counterparty: newDebt.counterparty,
      originalAmount: Number(newDebt.originalAmount),
      remainingAmount: Number(newDebt.remainingAmount),
      dueDate: newDebt.dueDate,
      isInterestFree: newDebt.isInterestFree,
      annualInterestRate: newDebt.isInterestFree ? 0 : Number(newDebt.annualInterestRate),
      notes: newDebt.notes,
      isResolved: false,
      dateCreated: new Date().toISOString().slice(0, 10),
    };

    onAddDebt(debt);
    setShowAddDebtModal(false);
  };

  const handlePay = (loan: Loan) => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#059669', '#34d399', '#f59e0b'],
    });
    onPayLoanMonth(loan.id);
  };

  const totalRemainingLoans = loans
    .filter((l) => !l.isPaidOff)
    .reduce((sum, l) => sum + l.remainingPrincipal, 0);

  const totalMonthlyPayments = loans
    .filter((l) => !l.isPaidOff)
    .reduce((sum, l) => sum + l.monthlyPayment, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kreditlar va qarzlar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Barcha bank kreditlari, muddatli to'lovlar (nasiya) va shaxsiy qarzlaringiz.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'loans' ? (
            <button
              onClick={() => setShowAddLoanModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Kredit qo'shish</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddDebtModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Qarz qo'shish</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs: Bank Kreditlari vs Shaxsiy qarzlar */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('loans')}
          className={`pb-2 text-xs font-bold transition flex items-center gap-2 relative ${
            activeTab === 'loans'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bank va Nasiya kreditlari ({loans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('debts')}
          className={`pb-2 text-xs font-bold transition flex items-center gap-2 relative ${
            activeTab === 'debts'
              ? 'text-blue-700 dark:text-blue-400 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Shaxsiy qarzlar ({debts.length})</span>
        </button>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 block">Jami qolgan qarz</span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatCurrency(totalRemainingLoans, currency)}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 block">Oylik to'lovlar yig'indisi</span>
          <span className="text-base font-extrabold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
            {formatCurrency(totalMonthlyPayments, currency)}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 block">Faol kreditlar soni</span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
            {loans.filter((l) => !l.isPaidOff).length} ta
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 block">Shaxsiy qarzlar saldosi</span>
          <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
            {debts.filter((d) => !d.isResolved).length} ta
          </span>
        </div>
      </div>

      {/* SECTION A: LOANS LIST */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          {loans.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Hozircha kreditlar kiritilmagan
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Yangi ipoteka, avtokredit yoki nasiya to'lovingizni qo'shing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {loans.map((loan) => {
                const paidAmount = Math.max(0, loan.originalPrincipal - loan.remainingPrincipal);
                const percentPaid = Math.min(
                  100,
                  Math.round((paidAmount / (loan.originalPrincipal || 1)) * 100)
                );

                return (
                  <div
                    key={loan.id}
                    className={`rounded-2xl border p-5 transition-all bg-white dark:bg-slate-900 ${
                      loan.isPaidOff
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {loan.name}
                          </h3>
                          {loan.isPaidOff && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                              To'liq to'langan ✓
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{loan.bankName}</span>
                          <span>•</span>
                          <span className="capitalize">{loan.type}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteLoan(loan.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 transition rounded-lg"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">To'langan: {percentPaid}%</span>
                        <span className="text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(paidAmount, currency)} / {formatCurrency(loan.originalPrincipal, currency)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-500 rounded-full"
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>
                    </div>

                    {/* Loan Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-y border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Qolgan qarz</span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatCurrency(loan.remainingPrincipal, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Oylik to'lov</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                          {formatCurrency(loan.monthlyPayment, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Yillik foiz</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                          {loan.annualInterestRate}% ({loan.paymentType === 'annuity' ? 'Annuitet' : 'Diff'})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">To'lov kuni</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Har oyning {loan.paymentDueDay}-kuni
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedScheduleLoan(loan)}
                        className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5"
                      >
                        <Table className="w-3.5 h-3.5 text-slate-500" />
                        <span>To'lov jadvali</span>
                      </button>

                      {!loan.isPaidOff && (
                        <button
                          onClick={() => handlePay(loan)}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Oylik to'lov kiritildi</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION B: PERSONAL DEBTS LIST */}
      {activeTab === 'debts' && (
        <div className="space-y-4">
          {debts.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <UserCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Shaxsiy qarzlar yo'q
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tanishlar, do'stlar yoki qarindoshlardan olingan/berilgan qarzlarni yozing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {debts.map((debt) => (
                <div
                  key={debt.id}
                  className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 transition ${
                    debt.isResolved
                      ? 'border-emerald-200 dark:border-emerald-900/40 opacity-70'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          debt.type === 'borrowed'
                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950'
                            : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950'
                        }`}
                      >
                        {debt.type === 'borrowed' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {debt.counterparty}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {debt.type === 'borrowed'
                            ? 'Men olganman (qaytarishim kerak)'
                            : 'Men berganman (qaytarib olishim kerak)'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteDebt(debt.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="py-2 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Summa:</span>
                      <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(debt.remainingAmount, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Qaytarish muddati:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {debt.dueDate}
                      </span>
                    </div>
                    {debt.notes && (
                      <div className="text-[11px] text-slate-500 italic mt-1">
                        "{debt.notes}"
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    {!debt.isResolved ? (
                      <button
                        onClick={() => onResolveDebt(debt.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold transition"
                      >
                        Qaytarildi deb belgilash ✓
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600">
                        Qarz to'liq yopilgan ✓
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Amortization Schedule Table */}
      {selectedScheduleLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  To'lov jadvali: {selectedScheduleLoan.name}
                </h3>
                <span className="text-xs text-slate-500">
                  {selectedScheduleLoan.bankName} • {selectedScheduleLoan.annualInterestRate}% yillik
                </span>
              </div>
              <button
                onClick={() => setSelectedScheduleLoan(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2 px-2">№</th>
                    <th className="py-2 px-2">Sana</th>
                    <th className="py-2 px-2">Asosiy qarz</th>
                    <th className="py-2 px-2">Foiz</th>
                    <th className="py-2 px-2">Jami to'lov</th>
                    <th className="py-2 px-2">Qoldiq</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {(selectedScheduleLoan.schedule || []).map((item) => (
                    <tr key={item.monthIndex} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-2 font-mono">{item.monthIndex}</td>
                      <td className="py-2 px-2 text-slate-500">{item.paymentDate}</td>
                      <td className="py-2 px-2 tabular-nums">
                        {formatCurrency(item.principalPayment, currency)}
                      </td>
                      <td className="py-2 px-2 text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatCurrency(item.interestPayment, currency)}
                      </td>
                      <td className="py-2 px-2 font-bold tabular-nums">
                        {formatCurrency(item.totalMonthlyPayment, currency)}
                      </td>
                      <td className="py-2 px-2 tabular-nums">
                        {formatCurrency(item.remainingPrincipal, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedScheduleLoan(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD LOAN */}
      {showAddLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Yangi kredit qo'shish
              </h3>
              <button
                onClick={() => setShowAddLoanModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoan} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kredit nomi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Ipoteka, Avtokredit"
                    value={newLoan.name}
                    onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Bank / Tashkilot
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Ipoteka Bank, Uzum Nasiya"
                    value={newLoan.bankName}
                    onChange={(e) => setNewLoan({ ...newLoan, bankName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Kredit turi
                  </label>
                  <select
                    value={newLoan.type}
                    onChange={(e) => setNewLoan({ ...newLoan, type: e.target.value as LoanType })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="bank">Bank krediti</option>
                    <option value="ipoteka">Ipoteka krediti</option>
                    <option value="avtokredit">Avtokredit</option>
                    <option value="mikroqarz">Mikroqarz / Tezkor qarz</option>
                    <option value="nasiya">Nasiya / Muddatli to'lov</option>
                    <option value="kredit_karta">Kredit karta</option>
                    <option value="shaxsiy">Shaxsiy qarz</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    To'lov turi
                  </label>
                  <select
                    value={newLoan.paymentType}
                    onChange={(e) =>
                      handlePrincipalOrTermChange(
                        newLoan.originalPrincipal,
                        newLoan.annualInterestRate,
                        newLoan.termMonths,
                        e.target.value as PaymentType
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="annuity">Annuitet (Teng oylik to'lov)</option>
                    <option value="differential">Differensial (Kamayib boruvchi)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Asl summa (so'm)
                  </label>
                  <input
                    type="number"
                    min={100000}
                    value={newLoan.originalPrincipal}
                    onChange={(e) =>
                      handlePrincipalOrTermChange(
                        Number(e.target.value),
                        newLoan.annualInterestRate,
                        newLoan.termMonths,
                        newLoan.paymentType
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Yillik foiz (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    value={newLoan.annualInterestRate}
                    onChange={(e) =>
                      handlePrincipalOrTermChange(
                        newLoan.originalPrincipal,
                        Number(e.target.value),
                        newLoan.termMonths,
                        newLoan.paymentType
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Muddati (oy)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={360}
                    value={newLoan.termMonths}
                    onChange={(e) =>
                      handlePrincipalOrTermChange(
                        newLoan.originalPrincipal,
                        newLoan.annualInterestRate,
                        Number(e.target.value),
                        newLoan.paymentType
                      )
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Oylik to'lov (avtomat)
                  </label>
                  <input
                    type="number"
                    value={newLoan.monthlyPayment}
                    onChange={(e) =>
                      setNewLoan({ ...newLoan, monthlyPayment: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    To'lov sanasi (oyning kuni)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={newLoan.paymentDueDay}
                    onChange={(e) =>
                      setNewLoan({ ...newLoan, paymentDueDay: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddLoanModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
                >
                  Kreditni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PERSONAL DEBT */}
      {showAddDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Shaxsiy qarz qo'shish
              </h3>
              <button
                onClick={() => setShowAddDebtModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDebt} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Qarz yo'nalishi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDebt({ ...newDebt, type: 'borrowed' })}
                    className={`p-2.5 rounded-xl border text-center font-semibold ${
                      newDebt.type === 'borrowed'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Men olganman (qarz)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDebt({ ...newDebt, type: 'lent' })}
                    className={`p-2.5 rounded-xl border text-center font-semibold ${
                      newDebt.type === 'lent'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Men berganman (haqim)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Kimdan / Kimga *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Rustam akam, Akmal o'rtog'im"
                  value={newDebt.counterparty}
                  onChange={(e) => setNewDebt({ ...newDebt, counterparty: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Summa (so'm)
                  </label>
                  <input
                    type="number"
                    min={10000}
                    value={newDebt.remainingAmount}
                    onChange={(e) =>
                      setNewDebt({
                        ...newDebt,
                        originalAmount: Number(e.target.value),
                        remainingAmount: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Qaytarish sanasi
                  </label>
                  <input
                    type="date"
                    value={newDebt.dueDate}
                    onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Izoh (ixtiyoriy)
                </label>
                <input
                  type="text"
                  placeholder="Masalan: To'y xarajatlariga, foizsiz"
                  value={newDebt.notes}
                  onChange={(e) => setNewDebt({ ...newDebt, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddDebtModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold shadow-sm"
                >
                  Qarzni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
