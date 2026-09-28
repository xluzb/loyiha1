import React from 'react';
import { AlertCircle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <footer className="mt-8 mb-4 px-4 text-center">
      <div className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] text-slate-400 dark:text-slate-500 rounded-lg max-w-2xl mx-auto">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>
          Tavsiyalar umumiy xarakterga ega va professional moliyaviy maslahat o'rnini bosmaydi.
        </span>
      </div>
    </footer>
  );
};
