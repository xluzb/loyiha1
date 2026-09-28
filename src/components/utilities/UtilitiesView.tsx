import React, { useState } from 'react';
import { UtilityBill, UtilityType, CurrencyType } from '../../types';
import { formatCurrency } from '../../utils/finance';
import {
  Zap,
  Flame,
  Droplets,
  Trash2,
  Wifi,
  Home,
  Tv,
  Phone,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Gauge,
} from 'lucide-react';

interface UtilitiesViewProps {
  utilities: UtilityBill[];
  currency: CurrencyType;
  onAddUtility: (bill: UtilityBill) => void;
  onTogglePaid: (id: string) => void;
  onDeleteUtility: (id: string) => void;
}

export const UtilitiesView: React.FC<UtilitiesViewProps> = ({
  utilities,
  currency,
  onAddUtility,
  onTogglePaid,
  onDeleteUtility,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const [newUtil, setNewUtil] = useState({
    name: '',
    type: 'electricity' as UtilityType,
    amount: 150000,
    accountNumber: '',
    meterReadingCurrent: 0,
    meterReadingPrevious: 0,
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUtil.name) return;

    onAddUtility({
      id: `util-${Date.now()}`,
      name: newUtil.name,
      type: newUtil.type,
      amount: Number(newUtil.amount),
      accountNumber: newUtil.accountNumber,
      meterReadingCurrent: Number(newUtil.meterReadingCurrent) || undefined,
      meterReadingPrevious: Number(newUtil.meterReadingPrevious) || undefined,
      isPaid: false,
      dueDate: newUtil.dueDate,
      monthYear: new Date().toISOString().slice(0, 7),
    });

    setShowAddModal(false);
  };

  const getUtilIcon = (type: UtilityType) => {
    switch (type) {
      case 'electricity':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'gas':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'cold_water':
      case 'hot_water':
        return <Droplets className="w-5 h-5 text-sky-500" />;
      case 'trash':
        return <Trash2 className="w-5 h-5 text-slate-500" />;
      case 'internet':
        return <Wifi className="w-5 h-5 text-indigo-500" />;
      case 'housing':
        return <Home className="w-5 h-5 text-emerald-500" />;
      case 'phone':
        return <Phone className="w-5 h-5 text-teal-500" />;
      case 'tv':
        return <Tv className="w-5 h-5 text-purple-500" />;
      default:
        return <Zap className="w-5 h-5 text-slate-500" />;
    }
  };

  const totalMonthlyBills = utilities.reduce((sum, u) => sum + u.amount, 0);
  const unpaidBills = utilities.filter((u) => !u.isPaid);
  const unpaidTotal = unpaidBills.reduce((sum, u) => sum + u.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kommunal to'lovlar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Elektr, gaz, suv va xonadon hisoblagich ko'rsatkichlarini yagona joyda boshqaring.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Kommunal qo'shish</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Jami oylik kommunal sarf</span>
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(totalMonthlyBills, currency)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">To'lanishi kutilayotgan</span>
          <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatCurrency(unpaidTotal, currency)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {unpaidBills.length} ta hisob to'lanmagan
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 block mb-1">Mavsumiy tahlil</span>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Kuz-qish mavsumida gaz va isitish xarajatlari o'rtacha <strong>35-45% ga oshadi</strong>. Zaxira rejasini hozirdan shakllantiring.
          </p>
        </div>
      </div>

      {/* Utility Bills List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {utilities.map((bill) => {
          // Check if due in <= 3 days
          const dueDate = new Date(bill.dueDate);
          const now = new Date();
          const diffDays = Math.ceil(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          const isUrgent = !bill.isPaid && diffDays <= 3 && diffDays >= 0;

          // Meter consumption
          const hasMeter =
            bill.meterReadingCurrent !== undefined &&
            bill.meterReadingPrevious !== undefined;
          const consumption = hasMeter
            ? Math.max(0, bill.meterReadingCurrent! - bill.meterReadingPrevious!)
            : null;

          return (
            <div
              key={bill.id}
              className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 transition-all ${
                bill.isPaid
                  ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20'
                  : isUrgent
                  ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 ring-1 ring-amber-400/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50">
                    {getUtilIcon(bill.type)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {bill.name}
                    </h4>
                    {bill.accountNumber && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        Hisob: {bill.accountNumber}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteUtility(bill.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                  title="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Meter readings if available */}
              {hasMeter && (
                <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Gauge className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hisoblagich ko'rsatkichi:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                    {bill.meterReadingPrevious} → {bill.meterReadingCurrent} (Sarf: {consumption} birlik)
                  </span>
                </div>
              )}

              {/* Status and due date */}
              <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Summa</span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(bill.amount, currency)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">To'lov sanasi</span>
                  <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{bill.dueDate}</span>
                  </div>
                </div>
              </div>

              {isUrgent && (
                <div className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>To'lovga 3 kundan kam qoldi!</span>
                </div>
              )}

              {/* Action Toggle */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => onTogglePaid(bill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    bill.isPaid
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{bill.isPaid ? 'To\'langan ✓' : 'To\'lash'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD UTILITY */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Yangi kommunal to'lov
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
                  To'lov nomi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Elektr energiyasi, Issiq suv"
                  value={newUtil.name}
                  onChange={(e) => setNewUtil({ ...newUtil, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    To'lov turi
                  </label>
                  <select
                    value={newUtil.type}
                    onChange={(e) =>
                      setNewUtil({ ...newUtil, type: e.target.value as UtilityType })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="electricity">Elektr energiyasi</option>
                    <option value="gas">Tabiiy gaz</option>
                    <option value="cold_water">Sovuq suv</option>
                    <option value="hot_water">Issiq suv</option>
                    <option value="trash">Chiqindi</option>
                    <option value="internet">Internet</option>
                    <option value="phone">Telefon / Mobil aloqa</option>
                    <option value="housing">Kvartplata / Shirkat</option>
                    <option value="tv">Kabel televideniyesi</option>
                    <option value="other">Boshqa</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Summa (so'm) *
                  </label>
                  <input
                    type="number"
                    min={1000}
                    value={newUtil.amount}
                    onChange={(e) =>
                      setNewUtil({ ...newUtil, amount: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Oldingi ko'rsatkich
                  </label>
                  <input
                    type="number"
                    value={newUtil.meterReadingPrevious || ''}
                    onChange={(e) =>
                      setNewUtil({
                        ...newUtil,
                        meterReadingPrevious: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Hozirgi ko'rsatkich
                  </label>
                  <input
                    type="number"
                    value={newUtil.meterReadingCurrent || ''}
                    onChange={(e) =>
                      setNewUtil({
                        ...newUtil,
                        meterReadingCurrent: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Shaxsiy hisob raqami
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: 104859"
                    value={newUtil.accountNumber}
                    onChange={(e) =>
                      setNewUtil({ ...newUtil, accountNumber: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    To'lov oxirgi sanasi
                  </label>
                  <input
                    type="date"
                    value={newUtil.dueDate}
                    onChange={(e) =>
                      setNewUtil({ ...newUtil, dueDate: e.target.value })
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
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
