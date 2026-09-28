import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Receipt,
  MoreHorizontal,
  Wallet,
  Zap,
  PiggyBank,
  Bot,
  Settings,
  X,
  QrCode,
  Sun,
  Moon,
} from 'lucide-react';
import { MobileConnectModal } from './MobileConnectModal';
import { ThemeType } from '../../types';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  onQuickAddExpense: () => void;
  theme?: ThemeType;
  onToggleTheme?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onQuickAddExpense,
  theme,
  onToggleTheme,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Boshqaruv', icon: LayoutDashboard },
    { id: 'strategy', label: 'Strategiya', icon: TrendingUp },
    { id: 'loans', label: 'Kreditlar', icon: CreditCard },
    { id: 'expenses', label: 'Xarajat', icon: Receipt },
  ];

  const moreTabs = [
    { id: 'incomes', label: 'Daromadlar', icon: Wallet },
    { id: 'utilities', label: 'Kommunal to\'lovlar', icon: Zap },
    { id: 'investments', label: 'Investitsiya & Jamg\'arma', icon: PiggyBank },
    { id: 'ai', label: 'AI Maslahatchi (Gemini)', icon: Bot },
    { id: 'settings', label: 'Oila & Sozlamalar', icon: Settings },
  ];

  const handleTabClick = (id: string) => {
    onSelectTab(id);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* "More" Bottom Sheet for mobile */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-5 border-t border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Barcha bo'limlar
              </span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`min-h-[48px] p-3 rounded-xl flex items-center gap-3 text-left transition-all ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions: Theme & QR */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 text-xs font-semibold shadow-sm transition"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Kunduzgi rejim</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-slate-600" />
                      <span>Tungi rejim</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowConnectModal(true);
                }}
                className={`py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 flex items-center justify-center gap-2 text-xs font-semibold shadow-sm transition ${
                  !onToggleTheme ? 'col-span-2' : ''
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Telefonda ochish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Connect QR Modal */}
      <MobileConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />

      {/* Main fixed bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="flex items-center justify-around h-16 px-1">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`min-h-[48px] min-w-[64px] flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] leading-tight">{tab.label}</span>
              </button>
            );
          })}

          {/* Quick Expense Fab Button */}
          <button
            onClick={onQuickAddExpense}
            className="min-h-[44px] min-w-[44px] -mt-5 w-11 h-11 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
            aria-label="Xarajat qo'shish"
            title="Tezkor xarajat kiritish"
          >
            <span className="text-xl font-bold leading-none">+</span>
          </button>

          {/* More menu trigger */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`min-h-[48px] min-w-[64px] flex flex-col items-center justify-center gap-1 transition-colors ${
              moreTabs.some((t) => t.id === currentTab)
                ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 stroke-2" />
            <span className="text-[10px] leading-tight">Yana</span>
          </button>
        </div>
      </nav>
    </>
  );
};
