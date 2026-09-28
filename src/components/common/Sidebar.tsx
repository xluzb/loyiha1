import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Wallet,
  Receipt,
  Zap,
  PiggyBank,
  Bot,
  Settings,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  dtiScore?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  dtiScore = 0,
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Boshqaruv paneli',
      icon: LayoutDashboard,
    },
    {
      id: 'strategy',
      label: 'Kredit strategiyasi',
      icon: TrendingUp,
      highlight: true,
      badge: dtiScore > 0 ? `${dtiScore}% DTI` : undefined,
    },
    {
      id: 'loans',
      label: 'Kreditlar va qarzlar',
      icon: CreditCard,
    },
    {
      id: 'incomes',
      label: 'Daromadlar',
      icon: Wallet,
    },
    {
      id: 'expenses',
      label: 'Kunlik xarajatlar',
      icon: Receipt,
    },
    {
      id: 'utilities',
      label: 'Kommunal to\'lovlar',
      icon: Zap,
    },
    {
      id: 'investments',
      label: 'Investitsiya & Jamg\'arma',
      icon: PiggyBank,
    },
    {
      id: 'ai',
      label: 'AI Maslahatchi',
      icon: Bot,
      aiBadge: true,
    },
    {
      id: 'settings',
      label: 'Oila & Sozlamalar',
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 space-y-6 min-h-[calc(100vh-3.5rem)]">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Asosiy bo'limlar
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              } ${item.highlight ? 'relative' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    dtiScore > 50
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {item.aiBadge && (
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Mini Strategy Promo Box in Sidebar */}
      <div className="mt-auto p-3.5 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white text-xs shadow-md">
        <div className="flex items-center gap-2 mb-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-300" />
          <span className="font-semibold text-white">Aqlli kredit tahlili</span>
        </div>
        <p className="text-[11px] text-emerald-100/90 leading-relaxed mb-3">
          Ko'chki yoki Qor to'pi usuli orqali ortiqcha to'lanadigan foizlarni tejang.
        </p>
        <button
          onClick={() => onSelectTab('strategy')}
          className="w-full py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium text-[11px] transition text-center"
        >
          Tavsiyalarni ko'rish
        </button>
      </div>
    </aside>
  );
};
