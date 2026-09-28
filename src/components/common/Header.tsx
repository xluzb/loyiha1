import React, { useState } from 'react';
import { PWAInstallButton } from './PWAInstallButton';
import { MobileConnectModal } from './MobileConnectModal';
import { CurrencyType, LanguageType, ThemeType } from '../../types';
import { Sun, Moon, ShieldCheck, DollarSign, Smartphone } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  currency: CurrencyType;
  onToggleCurrency: () => void;
  theme: ThemeType;
  onToggleTheme: () => void;
  isPinProtected: boolean;
  onLockApp: () => void;
  language: LanguageType;
  onChangeLanguage: (lang: LanguageType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currency,
  onToggleCurrency,
  theme,
  onToggleTheme,
  isPinProtected,
  onLockApp,
}) => {
  const [showMobileModal, setShowMobileModal] = useState(false);

  const navLinks = [
    { id: 'dashboard', label: 'Boshqaruv' },
    { id: 'strategy', label: 'Strategiya' },
    { id: 'loans', label: 'Kreditlar' },
    { id: 'expenses', label: 'Xarajatlar' },
    { id: 'ai', label: 'AI Maslahatchi' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-base shadow-sm">
              O
            </div>
            <button
              onClick={() => onSelectTab('dashboard')}
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors whitespace-nowrap"
            >
              Oila Moliya
            </button>
          </div>

          {/* Zone 2: 4–6 nav links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onSelectTab(link.id)}
                className={`hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap py-1 ${
                  currentTab === link.id
                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold border-b-2 border-emerald-600 dark:border-emerald-400'
                    : ''
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1–2 primary actions + functional toggles */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Phone Real-time Connect Button */}
            <button
              onClick={() => setShowMobileModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-600/30 text-xs font-semibold shadow-sm transition min-h-[40px]"
              title="QR-kod bilan telefoningizda ochish"
            >
              <Smartphone className="w-4 h-4 animate-bounce" />
              <span className="hidden sm:inline">Telefonda ochish</span>
            </button>

            <PWAInstallButton />

            {/* Currency Switcher */}
            <button
              onClick={onToggleCurrency}
              className="min-h-[40px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
              title="Valyutani o'zgartirish (UZS / USD)"
              aria-label="Valyuta tanlash"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currency}</span>
            </button>

            {/* Theme Toggle (Kunduzgi / Tungi rejim) */}
            <button
              onClick={onToggleTheme}
              className="min-h-[40px] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 shadow-sm"
              title={theme === 'dark' ? "Kunduzgi rejimga o'tish (Yorug')" : "Tungi rejimga o'tish (Qorong'i)"}
              aria-label={theme === 'dark' ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
                  <span className="text-[11px] font-semibold text-amber-300 hidden md:inline">Kunduzgi</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" />
                  <span className="text-[11px] font-semibold text-slate-600 hidden md:inline">Tungi</span>
                </>
              )}
            </button>

            {/* Lock Button (if PIN set) */}
            {isPinProtected && (
              <button
                onClick={onLockApp}
                className="min-h-[40px] min-w-[40px] p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors flex items-center justify-center"
                title="Ilovani qulflash"
                aria-label="Ilovani qulflash"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}

            {/* Direct CTA to Strategy */}
            <button
              onClick={() => onSelectTab('strategy')}
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shadow-sm"
            >
              Kredit tahlili
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Connect QR Modal */}
      <MobileConnectModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
      />
    </>
  );
};
