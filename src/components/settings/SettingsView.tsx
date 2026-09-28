import React, { useState } from 'react';
import {
  FamilyMember,
  CurrencyType,
  LanguageType,
  ThemeType,
  Loan,
  Income,
  Expense,
} from '../../types';
import {
  Users,
  Download,
  Upload,
  Lock,
  RotateCcw,
  Trash2,
  Plus,
  Shield,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  exportDataToJSON,
  exportLoansToCSV,
  exportExpensesToCSV,
  importDataFromJSON,
  resetToDemoData,
} from '../../services/storageService';

interface SettingsViewProps {
  members: FamilyMember[];
  currency: CurrencyType;
  language: LanguageType;
  theme: ThemeType;
  pinCode?: string;
  loans: Loan[];
  incomes: Income[];
  expenses: Expense[];
  onAddMember: (member: FamilyMember) => void;
  onDeleteMember: (id: string) => void;
  onChangeCurrency: (c: CurrencyType) => void;
  onChangeLanguage: (l: LanguageType) => void;
  onToggleTheme: () => void;
  onSetPin: (pin?: string) => void;
  onReloadAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  members,
  currency,
  language,
  theme,
  pinCode,
  loans,
  incomes,
  expenses,
  onAddMember,
  onDeleteMember,
  onChangeCurrency,
  onChangeLanguage,
  onToggleTheme,
  onSetPin,
  onReloadAllData,
}) => {
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  // New member form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('ota');
  const [newMemberColor, setNewMemberColor] = useState('#059669');

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    onAddMember({
      id: `mem-${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole,
      avatarColor: newMemberColor,
    });

    setNewMemberName('');
    setShowMemberModal(false);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length === 4 && /^\d{4}$/.test(pinInput)) {
      onSetPin(pinInput);
      setPinSuccessMsg("PIN-kod muvaffaqiyatli o'rnatildi!");
      setTimeout(() => {
        setPinSuccessMsg('');
        setShowPinModal(false);
      }, 1000);
    }
  };

  const handleRemovePin = () => {
    onSetPin(undefined);
    setPinSuccessMsg("PIN-kod o'chirildi.");
    setTimeout(() => {
      setPinSuccessMsg('');
      setShowPinModal(false);
    }, 1000);
  };

  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importDataFromJSON(text);
        if (success) {
          alert("Ma'lumotlar muvaffaqiyatli import qilindi!");
          onReloadAllData();
        } else {
          alert("Fayl formati noto'g'ri!");
        }
      } catch (err) {
        alert("Xatolik yuz berdi!");
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "Barcha kiritilgan ma'lumotlar demo holatiga qaytarilsinmi?"
      )
    ) {
      resetToDemoData();
      onReloadAllData();
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Oila va sozlamalar
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Oila a'zolari, ma'lumotlar xavfsizligi, eksport/import va ilova interfeysi.
        </p>
      </div>

      {/* SECTION 1: OILASI A'ZOLARI */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Oila a'zolari ({members.length})
            </h3>
          </div>

          <button
            onClick={() => setShowMemberModal(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>A'zo qo'shish</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: m.avatarColor }}
                >
                  {m.name.charAt(0)}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {m.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {m.role}
                  </span>
                </div>
              </div>

              {members.length > 1 && (
                <button
                  onClick={() => onDeleteMember(m.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded"
                  title="O'chirish"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: MA'LUMOTLARNI EKSPORT VA IMPORT QILISH */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Ma'lumotlarni saqlash va ko'chirish
          </h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Barcha moliyaviy ma'lumotlaringiz qurilmangizning xavfsiz xotirasida (localStorage) saqlanadi. Ma'lumotlarni yo'qotmaslik uchun fayl sifatida yuklab oling.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* JSON Export */}
          <button
            onClick={exportDataToJSON}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>To'liq zaxira (JSON)</span>
          </button>

          {/* Loans CSV Export */}
          <button
            onClick={() => exportLoansToCSV(loans)}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Kreditlar (Excel CSV)</span>
          </button>

          {/* Expenses CSV Export */}
          <button
            onClick={() => exportExpensesToCSV(expenses)}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-rose-600" />
            <span>Xarajatlar (Excel CSV)</span>
          </button>

          {/* Project Source ZIP Export */}
          <a
            href="/oila-moliya-project.zip"
            download="oila-moliya-project.zip"
            className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300 transition flex items-center gap-2 shadow-2xs"
            title="Loyiha barcha manba fayllarini (React, TypeScript, Tailwind) ZIP arxiv ko'rinishida yuklab olish"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Loyiha kodi (ZIP)</span>
          </a>

          {/* JSON Import */}
          <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4 text-amber-600" />
            <span>Zaxirani yuklash (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleJSONImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* SECTION 3: XAVFSIZLIK VA ILovani QULFLASH (PIN-KOD) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Xavfsizlik va PIN-kod
              </h3>
              <p className="text-xs text-slate-500">
                Ilovaga begona shaxslar kirishini cheklash uchun 4 xonali PIN-kod o'rnating.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowPinModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition whitespace-nowrap"
          >
            {pinCode ? "PIN-kodni o'zgartirish" : "PIN-kod o'rnatish"}
          </button>
        </div>

        {pinCode && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>PIN-kod himoyasi yoqilgan</span>
            </div>
            <button
              onClick={handleRemovePin}
              className="text-xs text-rose-600 hover:underline font-semibold"
            >
              O'chirish
            </button>
          </div>
        )}
      </div>

      {/* SECTION 4: TIZIM SOZLAMALARI (TIL, VALYUTA, TIKLASH) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Tizim parametrlari
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Asosiy valyuta:
            </label>
            <select
              value={currency}
              onChange={(e) => onChangeCurrency(e.target.value as CurrencyType)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="UZS">UZS — O'zbekiston so'mi</option>
              <option value="USD">USD — AQSH dollari</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Interfeys tili:
            </label>
            <select
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as LanguageType)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="uz">O'zbek tili (Lotin)</option>
              <option value="ru">Русский язык</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Ko'rinish mavzusi:
            </label>
            <button
              onClick={onToggleTheme}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center hover:bg-slate-100"
            >
              {theme === 'dark' ? 'Qorong\'i (Dark)' : 'Yorug\' (Light)'}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Boshlang'ich demo ma'lumotlarni qayta tiklash
            </h4>
            <span className="text-[11px] text-slate-500">
              Kreditlar, daromadlar va xarajatlar namunaviy holatiga keltiriladi.
            </span>
          </div>

          <button
            onClick={handleResetData}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Qayta tiklash</span>
          </button>
        </div>
      </div>

      {/* MODAL: ADD MEMBER */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Oila a'zosi qo'shish
              </h3>
              <button
                onClick={() => setShowMemberModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Ismi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Azizbek, Madina"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Oila roli
                </label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="ota">Ota / Boshliq</option>
                  <option value="ona">Ona</option>
                  <option value="farzand">Farzand</option>
                  <option value="bobo">Bobo / Buvi</option>
                  <option value="boshqa">Boshqa</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Avatar rangi
                </label>
                <div className="flex gap-2">
                  {['#059669', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0891b2'].map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewMemberColor(color)}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          newMemberColor === color ? 'scale-125 ring-2 ring-emerald-500' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
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

      {/* MODAL: SET PIN */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                4 xonali PIN-kod
              </h3>
              <button
                onClick={() => setShowPinModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Yangi PIN-kodni kiriting:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="Masalan: 1234"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full text-center text-xl tracking-widest font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {pinSuccessMsg && (
                <p className="text-xs text-emerald-600 font-semibold text-center">
                  {pinSuccessMsg}
                </p>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Bekor
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
