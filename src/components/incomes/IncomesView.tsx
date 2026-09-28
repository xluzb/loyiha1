import React, { useState } from 'react';
import { Income, FamilyMember, CurrencyType, IncomeCategory } from '../../types';
import { formatCurrency } from '../../utils/finance';
import { Plus, Trash2, Wallet, Briefcase, Home, Calendar, Users, X } from 'lucide-react';

interface IncomesViewProps {
  incomes: Income[];
  members: FamilyMember[];
  currency: CurrencyType;
  onAddIncome: (income: Income) => void;
  onDeleteIncome: (id: string) => void;
}

export const IncomesView: React.FC<IncomesViewProps> = ({
  incomes,
  members,
  currency,
  onAddIncome,
  onDeleteIncome,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');

  const [newIncome, setNewIncome] = useState({
    title: '',
    memberId: members[0]?.id || 'mem-1',
    amount: 5000000,
    dayOfMonth: 5,
    isRecurring: true,
    category: 'maosh' as IncomeCategory,
  });

  const totalMonthlyIncome = incomes
    .filter((inc) => inc.isRecurring)
    .reduce((sum, inc) => sum + inc.amount, 0);

  const filteredIncomes =
    selectedMemberFilter === 'all'
      ? incomes
      : incomes.filter((inc) => inc.memberId === selectedMemberFilter);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncome.title) return;

    onAddIncome({
      id: `inc-${Date.now()}`,
      title: newIncome.title,
      memberId: newIncome.memberId,
      amount: Number(newIncome.amount),
      dayOfMonth: Number(newIncome.dayOfMonth),
      isRecurring: newIncome.isRecurring,
      category: newIncome.category,
      dateCreated: new Date().toISOString().slice(0, 10),
    });

    setShowAddModal(false);
    setNewIncome({
      title: '',
      memberId: members[0]?.id || 'mem-1',
      amount: 5000000,
      dayOfMonth: 5,
      isRecurring: true,
      category: 'maosh',
    });
  };

  const getCategoryLabel = (cat: IncomeCategory) => {
    switch (cat) {
      case 'maosh':
        return 'Oylik maosh';
      case 'biznes':
        return 'Tadbirkorlik / Biznes';
      case 'ijara':
        return 'Xonadon ijarasi';
      case 'pensiya':
        return 'Pensiya';
      case 'nafaqa':
        return 'Ijtimoiy nafaqa';
      case 'qoshimcha':
        return 'Qo\'shimcha ish (freelance)';
      default:
        return 'Boshqa';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Oila daromadlari
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Oila a'zolari bo'yicha barqaror va qo'shimcha daromad manbalari.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Daromad qo'shish</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Jami oylik barqaror daromad</span>
          <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatCurrency(totalMonthlyIncome, currency)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {incomes.filter((i) => i.isRecurring).length} ta doimiy manba
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Daromad keltiruvchi a'zolar</span>
          <div className="flex items-center gap-2 mt-2">
            {members.map((m) => {
              const memberIncome = incomes
                .filter((i) => i.memberId === m.id)
                .reduce((s, i) => s + i.amount, 0);
              if (memberIncome === 0) return null;

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: m.avatarColor }}
                  />
                  <span>{m.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Tushum taqvimi</span>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Asosiy tushumlar oyning <strong>1, 5 va 10-kunlarida</strong> bank kartasiga kelib tushadi.
          </p>
        </div>
      </div>

      {/* Member Filter Pills (Unboxed clean tags) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedMemberFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            selectedMemberFilter === 'all'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          Barchasi ({incomes.length})
        </button>
        {members.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMemberFilter(m.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              selectedMemberFilter === m.id
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: m.avatarColor }}
            />
            <span>{m.name}</span>
          </button>
        ))}
      </div>

      {/* Incomes List */}
      <div className="space-y-3">
        {filteredIncomes.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Ushbu parametrlar bo'yicha daromad topilmadi
            </p>
          </div>
        ) : (
          filteredIncomes.map((inc) => {
            const member = members.find((m) => m.id === inc.memberId);

            return (
              <div
                key={inc.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {inc.title}
                      </h4>
                      {inc.isRecurring && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                          Har oy
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {member && (
                        <span className="flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: member.avatarColor }}
                          />
                          {member.name}
                        </span>
                      )}
                      <span>•</span>
                      <span>{getCategoryLabel(inc.category)}</span>
                      <span>•</span>
                      <span>Har oyning {inc.dayOfMonth}-kuni</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                    +{formatCurrency(inc.amount, currency)}
                  </span>

                  <button
                    onClick={() => onDeleteIncome(inc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition rounded-lg"
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

      {/* MODAL: ADD INCOME */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Yangi daromad manbasi
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Daromad nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Asosiy ish haqi, Repetitorlik"
                  value={newIncome.title}
                  onChange={(e) => setNewIncome({ ...newIncome, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Oila a'zosi
                  </label>
                  <select
                    value={newIncome.memberId}
                    onChange={(e) => setNewIncome({ ...newIncome, memberId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Toifasi
                  </label>
                  <select
                    value={newIncome.category}
                    onChange={(e) =>
                      setNewIncome({ ...newIncome, category: e.target.value as IncomeCategory })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="maosh">Oylik maosh</option>
                    <option value="biznes">Biznes / Tadbirkorlik</option>
                    <option value="ijara">Ijara daromadi</option>
                    <option value="pensiya">Pensiya</option>
                    <option value="nafaqa">Nafaqa</option>
                    <option value="qoshimcha">Qo'shimcha ish</option>
                    <option value="boshqa">Boshqa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Summa (so'm)
                  </label>
                  <input
                    type="number"
                    min={10000}
                    value={newIncome.amount}
                    onChange={(e) =>
                      setNewIncome({ ...newIncome, amount: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tushish kuni (oyning kuni)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={newIncome.dayOfMonth}
                    onChange={(e) =>
                      setNewIncome({ ...newIncome, dayOfMonth: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm"
                >
                  Daromadni saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
