import React, { useState } from 'react';
import { Lock, Delete } from 'lucide-react';

interface PinLockScreenProps {
  correctPin: string;
  onUnlock: () => void;
  onResetPin?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  correctPin,
  onUnlock,
  onResetPin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-4 select-none">
      <div className="w-full max-w-xs flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
          <Lock className="w-7 h-7 text-emerald-400" />
        </div>

        <h1 className="text-xl font-bold tracking-tight mb-1">Oila Moliya</h1>
        <p className="text-xs text-slate-400 mb-8">
          Ilovaga kirish uchun 4 xonali PIN-kodni kiriting
        </p>

        {/* 4 dots */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                error
                  ? 'bg-rose-500 scale-110'
                  : pin.length > idx
                  ? 'bg-emerald-400 scale-110'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-400 mb-6 font-medium animate-shake">
            Noto'g'ri PIN-kod! Qaytadan urinib ko'ring.
          </p>
        )}

        {/* Numeric keypad (min 44px touch targets) */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-emerald-600/30 text-xl font-semibold transition active:scale-95 flex items-center justify-center tabular-nums"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-emerald-600/30 text-xl font-semibold transition active:scale-95 flex items-center justify-center tabular-nums"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-700/50 text-slate-400 hover:text-white transition active:scale-95 flex items-center justify-center"
            aria-label="O'chirish"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {onResetPin && (
          <button
            onClick={onResetPin}
            className="mt-6 text-xs text-slate-400 hover:text-emerald-400 underline underline-offset-4 transition"
          >
            PIN-kodni unutdingizmi? (Qulfni bekor qilish)
          </button>
        )}
      </div>
    </div>
  );
};
