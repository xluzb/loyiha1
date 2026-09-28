import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Send,
  X,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Share2,
  Info,
} from 'lucide-react';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const devUrl =
    'https://ais-dev-n36zg3oyvs2degs5s2ufiv-650070569194.asia-east1.run.app';
  const sharedUrl =
    'https://ais-pre-n36zg3oyvs2degs5s2ufiv-650070569194.asia-east1.run.app';

  const [activeTab, setActiveTab] = useState<'dev' | 'shared'>('dev');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showTroubleshoot, setShowTroubleshoot] = useState(true);

  const currentUrl = activeTab === 'dev' ? devUrl : sharedUrl;

  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: '#064e3b', // Deep emerald
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    currentUrl
  )}&text=${encodeURIComponent(
    "Oila Moliya — oilaviy byudjet va kredit strategiyasi platformasi"
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-fade-in select-none overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl relative space-y-4 my-6 max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Android telefonda ochish
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Jonli ko'rish va to'g'ri ochish yo'riqnomasi
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('dev')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'dev'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>1. Jonli havola (Dev)</span>
          </button>

          <button
            onClick={() => setActiveTab('shared')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'shared'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>2. Ommaviy havola (Share)</span>
          </button>
        </div>

        {/* QR Code and Status Box */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-800/40 dark:to-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="bg-white p-3 rounded-xl shadow-md border border-slate-100 flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Oila Moliya QR Code"
                className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
              />
            ) : (
              <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center text-slate-400">
                <QrCode className="w-12 h-12 animate-pulse" />
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              {activeTab === 'dev'
                ? 'Real vaqt rejimida sinash uchun'
                : 'Barcha brauzerlar uchun (parolsiz)'}
            </span>
          </div>
        </div>

        {/* Tab 2 Special Notice */}
        {activeTab === 'shared' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs space-y-1.5 text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
              <Share2 className="w-4 h-4" />
              <span>Ommaviy havolani faollashtirish:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-800/90 dark:text-blue-300/90">
              Ommaviy havola har qanday telefonda Google hisobiga kirmasdan ochiladi. Buning uchun ekranning <strong>eng yuqori o'ng burchagidagi ko'k "Share" (yoki "Publish")</strong> tugmasini bir marta bosing!
            </p>
          </div>
        )}

        {/* Current URL Display & Copy */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {activeTab === 'dev' ? 'Jonli havola manzili:' : 'Ommaviy havola manzili:'}
            </label>
            <span className="text-[10px] text-slate-400 font-mono">HTTPS</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 truncate border border-slate-200 dark:border-slate-700 select-all">
              {currentUrl}
            </div>
            <button
              onClick={handleCopy}
              className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Nusxalandi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Nusxa olish</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href={telegramShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegramga yuborish</span>
          </a>

          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Brauzerda sinash</span>
          </a>
        </div>

        {/* Android Real Solution Guide */}
        <div className="rounded-xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Android telefonda nega ochilmaydi va yechimi:</span>
            </div>
            <button
              onClick={() => setShowTroubleshoot(!showTroubleshoot)}
              className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
            >
              {showTroubleshoot ? 'Yashirish ▲' : 'Ko\'rish ▼'}
            </button>
          </div>

          {showTroubleshoot && (
            <div className="space-y-2.5 text-xs text-slate-800 dark:text-slate-200">
              <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-amber-200/50 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    Telegram ichki brauzerida ochmang!
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Telegram ichki brauzeri xavfsizlik kukilarini bloklaydi va oq ekran yoki aylana chiqadi. Telegramda havolani bosgach, yuqoridagi <strong>3 nuqta (⋮)</strong> ni bosing va <strong>"Chrome brauzerida ochish"</strong> ni tanlang.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-amber-200/50 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    "Authenticate in new window" chiqsa:
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Ekranda AI Studio logosi va <em>"Authenticate in new window"</em> tugmasi chiqsa, uni bir marta bosing. Bu Google xavfsizlik tekshiruvidan o'tkazadi va ilova bir zumda yuklanadi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-lg border border-amber-200/50 dark:border-slate-700">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    Doimiy ilova (PWA) sifatida o'rnatish:
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Google Chrome brauzerida yuqoridagi <strong>3 nuqta (⋮)</strong> menyuni ochib, <strong>"Ilovani o'rnatish" (Install app)</strong> yoki <strong>"Bosh ekranga qo'shish"</strong> ni bosing. Ilova telefonga yuklanadi va oflayn ham ishlaydi.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
