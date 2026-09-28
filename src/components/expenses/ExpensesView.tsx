import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, FamilyMember, CurrencyType } from '../../types';
import { formatCurrency } from '../../utils/finance';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  Receipt,
  Calendar,
  Tag,
  X,
  Sparkles,
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  members: FamilyMember[];
  currency: CurrencyType;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onAddCategory: (category: ExpenseCategory) => void;
  isQuickAddOpen?: boolean;
  onCloseQuickAdd?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  categories,
  members,
  currency,
  onAddExpense,
  onDeleteExpense,
  onAddCategory,
  isQuickAddOpen = false,
  onCloseQuickAdd,
}) => {
  const [showAddModal, setShowAddModal] = useState(isQuickAddOpen);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');

  // Form State
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    categoryId: categories[0]?.id || 'cat-1',
    memberId: members[0]?.id || 'mem-1',
    date: new Date().toISOString().slice(0, 10),
    isRecurring: false,
    notes: '',
  });

  // New Category Form State
  const [newCat, setNewCat] = useState({
    name: '',
    budgetLimit: 2000000,
    color: '#059669',
    isEssential: false,
  });

  // Calculate spending per category for current month
  const categorySpending = useMemo(() => {
    const map: Record<string, number> = {};
    for (const exp of expenses) {
      map[exp.categoryId] = (map[exp.categoryId] || 0) + exp.amount;
    }
    return map;
  }, [expenses]);

  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat =
        selectedCategoryFilter === 'all' || e.categoryId === selectedCategoryFilter;
      const matchMember =
        selectedMemberFilter === 'all' || e.memberId === selectedMemberFilter;
      return matchSearch && matchCat && matchMember;
    });
  }, [expenses, searchTerm, selectedCategoryFilter, selectedMemberFilter]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(newExpense.amount);
    if (!newExpense.title || !numAmount) return;

    onAddExpense({
      id: `exp-${Date.now()}`,
      title: newExpense.title,
      amount: numAmount,
      categoryId: newExpense.categoryId,
      memberId: newExpense.memberId,
      date: newExpense.date,
      isRecurring: newExpense.isRecurring,
      notes: newExpense.notes,
    });

    setShowAddModal(false);
    if (onCloseQuickAdd) onCloseQuickAdd();
    setNewExpense({
      title: '',
      amount: '',
      categoryId: categories[0]?.id || 'cat-1',
      memberId: members[0]?.id || 'mem-1',
      date: new Date().toISOString().slice(0, 10),
      isRecurring: false,
      notes: '',
    });
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name) return;

    onAddCategory({
      id: `cat-${Date.now()}`,
      name: newCat.name,
      iconName: 'Tag',
      budgetLimit: Number(newCat.budgetLimit),
      color: newCat.color,
      isEssential: newCat.isEssential,
      isCustom: true,
    });

    setShowAddCategoryModal(false);
    setNewCat({
      name: '',
      budgetLimit: 2000000,
      color: '#059669',
      isEssential: false,
    });
  };

  // Quick Amount preset buttons (+50k, +100k, +200k, +500k)
  const handleAddPreset = (val: number) => {
    const current = Number(newExpense.amount) || 0;
    setNewExpense((prev) => ({ ...prev, amount: String(current + val) }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kunlik xarajatlar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Xarajatlarni toifalar va byudjet limitlari bo'yicha nazorat qiling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            + Yangi toifa
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Xarajat kiritish</span>
          </button>
        </div>
      </div>

      {/* Category Budget Limits & Status Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Oylik toifalar limiti va sarf nazorati
          </h3>
          <span className="text-xs text-slate-500">
            Jami sarf: <strong>{formatCurrency(totalExpensesAmount, currency)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const spent = categorySpending[cat.id] || 0;
            const limit = cat.budgetLimit || 1;
            const percent = Math.round((spent / limit) * 100);
            const isNearLimit = percent >= 80 && percent < 100;
            const isOverLimit = percent >= 100;

            return (
              <div
                key={cat.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isOverLimit
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                    : isNearLimit
                    ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {cat.name}
                    </span>
                  </div>

                  <span
                    className={`font-bold tabular-nums text-[11px] ${
                      isOverLimit
                        ? 'text-rose-600'
                        : isNearLimit
                        ? 'text-amber-600'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {percent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isOverLimit
                        ? 'bg-rose-500'
                        : isNearLimit
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>{formatCurrency(spent, currency)}</span>
                  <span>Limit: {formatCurrency(limit, currency)}</span>
                </div>

                {isOverLimit && (
                  <div className="mt-1 text-[10px] font-bold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Limitdan oshib ketdi!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Xarajat nomi yoki izoh bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        >
          <option value="all">Barcha toifalar</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedMemberFilter}
          onChange={(e) => setSelectedMemberFilter(e.target.value)}
          className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
        >
          <option value="all">Barcha oila a'zolari</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses History Table / List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Xarajatlar topilmadi.
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const cat = categories.find((c) => c.id === exp.categoryId);
            const member = members.find((m) => m.id === exp.memberId);

            return (
              <div
                key={exp.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cat?.color || '#059669'}15`,
                      color: cat?.color || '#059669',
                    }}
                  >
                    <Receipt className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {exp.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{cat?.name || 'Boshqa'}</span>
                      <span>•</span>
                      <span>{exp.date}</span>
                      {member && (
                        <>
                          <span>•</span>
                          <span>{member.name}</span>
                        </>
                      )}
                      {exp.notes && (
                        <>
                          <span>•</span>
                          <span className="italic truncate">"{exp.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                    -{formatCurrency(exp.amount, currency)}
                  </span>
                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD EXPENSE (Fast 2-click entry & mobile numeric friendly) */}
      {(showAddModal || isQuickAddOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tezkor xarajat kiritish
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  if (onCloseQuickAdd) onCloseQuickAdd();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Summa (so'm) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  autoFocus
                  required
                  placeholder="0"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-bold tabular-nums"
                />

                {/* Preset quick buttons */}
                <div className="flex gap-2 mt-2">
                  {[50000, 100000, 200000, 500000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleAddPreset(val)}
                      className="flex-1 py-1.5 px-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 dark:text-slate-300 font-semibold text-[10px] transition text-center"
                    >
                      +{val >= 1000000 ? `${val / 1000000} mln` : `${val / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Xarajat nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Bozorlik, Benzin, Apteka"
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Toifa
                  </label>
                  <select
                    value={newExpense.categoryId}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, categoryId: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Oila a'zosi
                  </label>
                  <select
                    value={newExpense.memberId}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, memberId: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Sana
                  </label>
                  <input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Izoh (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    placeholder="Qo'shimcha izoh"
                    value={newExpense.notes}
                    onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    if (onCloseQuickAdd) onCloseQuickAdd();
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
                >
                  Xarajatni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Yangi xarajat toifasi
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Toifa nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sport, Kitoblar, Hayvonlar"
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Oylik limit (so'm)
                </label>
                <input
                  type="number"
                  min={100000}
                  value={newCat.budgetLimit}
                  onChange={(e) =>
                    setNewCat({ ...newCat, budgetLimit: Number(e.target.value) })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cat-essential"
                  checked={newCat.isEssential}
                  onChange={(e) => setNewCat({ ...newCat, isEssential: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="cat-essential" className="font-medium text-slate-700 dark:text-slate-300">
                  Majburiy birlamchi xarajat (oziq-ovqat, dori kabi)
                </label>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
                >
                  Toifani saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
