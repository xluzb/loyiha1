import React, { useState } from 'react';
import { Wallet, CreditCard, TrendingUp, ArrowRight, Check, X } from 'lucide-react';

interface OnboardingModalProps {
  onComplete: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onComplete,
  onNavigateTab,
}) => {
  const [step, setStep] = useState(1);

  const steps = [
    {
      num: 1,
      title: '1. Oila daromadlarini kiritish',
      desc: 'Oila a\'zolari (ota, ona, farzandlar) oylik maoshi, biznes yoki ijara daromadlarini kiriting. Bu byudjetingiz asosi hisoblanadi.',
      icon: Wallet,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
      actionTab: 'incomes',
      actionLabel: 'Daromadlar bo\'limiga o\'tish',
    },
    {
      num: 2,
      title: '2. Kredit va qarzlarni hisobga olish',
      desc: 'Ipoteka, avtokredit, mikroqarz va nasiyalarni yillik foiz stavkasi bilan ro\'yxatga oling. Platforma avtomat tarzda qarz yuki (DTI)ni hisoblaydi.',
      icon: CreditCard,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
      actionTab: 'loans',
      actionLabel: 'Kreditlar bo\'limiga o\'tish',
    },
    {
      num: 3,
      title: '3. Kredit strategiyasi va tavsiyalarni oling',
      desc: 'Qaysi kreditni birinchi yopish eng ko\'p foiz tejaydi? "Ko\'chki" (Avalanche) yoki "Qor to\'pi" (Snowball) strategiyalari bilan yillab to\'lanadigan ortiqcha foizlardan qutuling.',
      icon: TrendingUp,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
      actionTab: 'strategy',
      actionLabel: 'Kredit strategiyasini ochish',
    },
  ];

  const currentStepData = steps[step - 1];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleGoToFeature = () => {
    onComplete();
    onNavigateTab(currentStepData.actionTab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6 relative">
        {/* Close / Skip button */}
        <button
          onClick={onComplete}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-3 pr-8">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Xush kelibsiz
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step
                    ? 'w-6 bg-emerald-600'
                    : s < step
                    ? 'w-2 bg-emerald-300 dark:bg-emerald-800'
                    : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${currentStepData.color}`}
          >
            <Icon className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {currentStepData.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {currentStepData.desc}
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleGoToFeature}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition text-center"
          >
            {currentStepData.actionLabel}
          </button>

          <button
            onClick={handleNext}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <span>{step === 3 ? 'Boshlash' : 'Keyingisi'}</span>
            {step === 3 ? (
              <Check className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
