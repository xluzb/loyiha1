import React, { useState, useMemo } from 'react';
import {
  Loan,
  Income,
  Expense,
  ExpenseCategory,
  SavingsGoal,
  UtilityBill,
  CurrencyType,
  ExpenseForecastReport,
} from '../../types';
import {
  Bot,
  Send,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Loader2,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowRight,
  Check,
  Copy,
  RefreshCw,
  Wallet,
  PiggyBank,
  CheckCircle2,
  Info,
  CalendarClock,
  SlidersHorizontal,
  Square,
} from 'lucide-react';
import { formatCurrency, calculateDTI } from '../../utils/finance';

interface AIAdvisorViewProps {
  loans: Loan[];
  incomes: Income[];
  expenses: Expense[];
  categories: ExpenseCategory[];
  goals: SavingsGoal[];
  utilities?: UtilityBill[];
  currency: CurrencyType;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

type ScenarioType = 'standard' | 'saving' | 'strict';

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({
  loans,
  incomes,
  expenses,
  categories,
  goals,
  utilities = [],
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'chat'>('forecast');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Assalomu alaykum! Men sizning shaxsiy moliyaviy sun'iy intellekt maslahatchingizman.\n\nOilangizning barcha daromadlari, kreditlari va o'tgan oylardagi xarajatlari bazasini tahlil qilib, eng optimal to'lov strategiyasi, foizlarni tejash va keyingi oy uchun kutilayotgan xarajatlar prognozini real vaqt rejimida berishga tayyorman. Pastdagi tayyor savollardan birini tanlang yoki savolingizni yozing!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat when message streams
  React.useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatLoading, activeTab]);

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setChatLoading(false);
    setMessages((prev) => prev.map((m) => ({ ...m, isStreaming: false })));
  };

  // Forecast State
  const [forecastReport, setForecastReport] = useState<ExpenseForecastReport | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastScenario, setForecastScenario] = useState<ScenarioType>('standard');
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [copiedForecast, setCopiedForecast] = useState(false);

  // General Financial Metrics
  const totalIncome = incomes.reduce((s, i) => s + (i.isRecurring ? i.amount : 0), 0);
  const totalLoanMonthly = loans
    .filter((l) => !l.isPaidOff)
    .reduce((s, l) => s + l.monthlyPayment, 0);
  const dti = calculateDTI(totalLoanMonthly, totalIncome);

  // Extract Past Months Summary
  const historicalMonthSummaries = useMemo(() => {
    const monthMap: Record<string, { total: number; count: number }> = {};
    for (const exp of expenses) {
      if (!exp.date) continue;
      const mKey = exp.date.slice(0, 7);
      if (!monthMap[mKey]) monthMap[mKey] = { total: 0, count: 0 };
      monthMap[mKey].total += exp.amount;
      monthMap[mKey].count += 1;
    }

    const monthNames = [
      '',
      'Yanvar',
      'Fevral',
      'Mart',
      'Aprel',
      'May',
      'Iyun',
      'Iyul',
      'Avgust',
      'Sentyabr',
      'Oktyabr',
      'Noyabr',
      'Dekabr',
    ];

    const sorted = Object.keys(monthMap).sort();
    return sorted.map((key) => {
      const [year, month] = key.split('-');
      const mIdx = parseInt(month, 10);
      return {
        key,
        name: `${monthNames[mIdx] || month} ${year}`,
        total: monthMap[key].total,
        count: monthMap[key].count,
      };
    });
  }, [expenses]);

  // Target next month name
  const targetNextMonthName = useMemo(() => {
    if (historicalMonthSummaries.length > 0) {
      const lastKey = historicalMonthSummaries[historicalMonthSummaries.length - 1].key;
      const [yearStr, monthStr] = lastKey.split('-');
      let y = parseInt(yearStr, 10);
      let m = parseInt(monthStr, 10) + 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      const monthNames = [
        '',
        'Yanvar',
        'Fevral',
        'Mart',
        'Aprel',
        'May',
        'Iyun',
        'Iyul',
        'Avgust',
        'Sentyabr',
        'Oktyabr',
        'Noyabr',
        'Dekabr',
      ];
      return `${monthNames[m]} ${y}`;
    }
    return 'Keyingi oy (Oktyabr 2026)';
  }, [historicalMonthSummaries]);

  // Handle Forecast Generation
  const handleGenerateForecast = async (scenario: ScenarioType = forecastScenario) => {
    setForecastLoading(true);
    setForecastError(null);

    try {
      const response = await fetch('/api/ai/forecast-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenses,
          categories,
          loans,
          utilities,
          totalMonthlyIncome: totalIncome,
          targetMonth: targetNextMonthName,
          scenario,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || errJson?.details || 'Prognoz hisobotini shakllantirib bo‘lmadi.');
      }

      const data = await response.json();
      if (data.report) {
        setForecastReport(data.report);
      } else {
        throw new Error('Hisobot formati noto‘g‘ri qaytdi.');
      }
    } catch (err: any) {
      console.error('Forecast generation error:', err);
      setForecastError(err?.message || 'Xatolik yuz berdi. Iltimos qaytadan urinib ko‘ring.');
    } finally {
      setForecastLoading(false);
    }
  };

  // Copy forecast report text
  const handleCopyForecast = () => {
    if (!forecastReport) return;
    const lines = [
      `📊 OILAVIY XARAJATLAR PROGNOZI: ${forecastReport.targetMonth}`,
      `----------------------------------------`,
      `• Kutilayotgan umumiy xarajat: ${formatCurrency(forecastReport.predictedTotalExpenses, currency)}`,
      `• Majburiy to'lovlar (kredit + kommunal): ${formatCurrency(forecastReport.fixedObligationsTotal, currency)}`,
      `• Kundalik o'zgaruvchan sarf: ${formatCurrency(forecastReport.predictedVariableExpenses, currency)}`,
      `• Kutilayotgan sof jamg'arma: ${formatCurrency(forecastReport.projectedSavings, currency)} (${forecastReport.projectedSavingsRate}% daromaddan)`,
      `\nToifalar bo'yicha kutilmalar:`,
      ...forecastReport.categoryBreakdown.map(
        (c) =>
          `- ${c.categoryName}: ${formatCurrency(c.predictedAmount, currency)} (o'tgan o'rtacha: ${formatCurrency(
            c.pastAverageAmount,
            currency
          )}) | Sabab: ${c.rationale}`
      ),
      `\nMavsumiy omillar:`,
      ...forecastReport.seasonalInsights.map((s) => `• ${s}`),
      `\nAmaliy tavsiyalar:`,
      ...forecastReport.actionableRecommendations.map((r, i) => `${i + 1}. ${r}`),
      `\nXulosa:`,
      forecastReport.summaryNarrative,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedForecast(true);
    setTimeout(() => setCopiedForecast(false), 2000);
  };

  // Discuss in chat
  const handleDiscussForecastInChat = () => {
    if (!forecastReport) return;
    setActiveTab('chat');
    const promptText = `Men ${forecastReport.targetMonth} uchun tuzilgan xarajatlar prognozini ko'rib chiqdim (Jami kutilayotgan sarf: ${formatCurrency(
      forecastReport.predictedTotalExpenses,
      currency
    )}). Ushbu xarajatlarni yana 10% ga kamaytirish va erkin mablag'ni ko'paytirish uchun eng samarali 3 ta qadamni tushuntirib bering.`;
    handleSendMessage(promptText);
  };

  // Preset Fast Chat Prompts
  const presetQuestions = [
    'Keyingi oy uchun o\'tgan oylar asosida taxminiy xarajatlar hisoboti tuzib ber.',
    'Mening moliyaviy holatimni tahlil qil va kreditlarni to\'lash rejasini tuz.',
    'Keyingi 6 oyda xarajatlarni qanday qilib 15% ga qisqartirish mumkin?',
    'Erkin mablag\'imni kreditga to\'lash yaxshimi yoki omonatga qo\'yishmi?',
  ];

  // Send Chat message
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuestion;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const aiMsgId = `ai-${Date.now() + 1}`;
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      sender: 'ai',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputQuestion('');
    setChatLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const contextData = {
      totalMonthlyIncome: totalIncome,
      incomes: incomes.map((i) => ({
        title: i.title,
        amount: i.amount,
        category: i.category,
      })),
      loans: loans
        .filter((l) => !l.isPaidOff)
        .map((l) => ({
          name: l.name,
          bank: l.bankName,
          remaining: l.remainingPrincipal,
          rate: l.annualInterestRate,
          monthly: l.monthlyPayment,
          paymentType: l.paymentType,
        })),
      dtiRatio: dti.dti,
      monthlyExpensesTotal: expenses.reduce((s, e) => s + e.amount, 0),
      topExpenses: categories.map((c) => {
        const spent = expenses
          .filter((e) => e.categoryId === c.id)
          .reduce((s, e) => s + e.amount, 0);
        return { category: c.name, spent, budgetLimit: c.budgetLimit };
      }),
      savingsGoals: goals.map((g) => ({
        name: g.name,
        current: g.currentAmount,
        target: g.targetAmount,
      })),
    };

    try {
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      const response = await fetch('/api/ai/advisor-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          question: textToSend,
          contextData,
          history: historyPayload,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('AI serveriga ulanishda xatolik yuz berdi');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              accumulated += parsed.text;
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMsgId ? { ...m, text: accumulated } : m))
              );
            }
          } catch {
            // ignore partial JSON parse error
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false } : m))
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false } : m))
        );
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                isStreaming: false,
                text: m.text.trim()
                  ? m.text
                  : `[Oflayn tahlil]: Hozirgi kunda sizning oylik daromadingiz ${formatCurrency(
                      totalIncome,
                      currency
                    )}, qarz yuki (DTI) ko'rsatkichi esa ${dti.dti}%. \n\nTavsiya:\n1. ${
                      loans.length > 0
                        ? `Birinchi navbatda eng yuqori foiz stavkali kreditni (Ko'chki usuli) tezlashtirib to'lang.`
                        : "Hozirda kreditlaringiz yo'q, ajoyib!"
                    }\n2. Oziq-ovqat va kundalik sarf-xarajatlar limitiga rioya qiling.\n3. Favqulodda zaxira jamg'armasiga har oy kamida 10-15% mablag' yo'naltiring.`,
              }
            : m
        )
      );
    } finally {
      setChatLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>AI Moliyaviy Maslahatchi</span>
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Google Gemini sun'iy intellekti orqali o'tgan oylar xarajatlari tahlili, kelasi oy prognozi va kreditlar optimallashuvi.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-2xs">
          {chatLoading ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-time jonli javob...</span>
            </span>
          ) : (
            <>
              <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Gemini AI faol</span>
            </>
          )}
        </div>
      </div>

      {/* Main Mode Sub-Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 gap-1">
        <button
          onClick={() => setActiveTab('forecast')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'forecast'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CalendarClock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Keyingi oy xarajatlar prognozi</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold uppercase">
            Yangi
          </span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Muloqot va Maslahat</span>
        </button>
      </div>

      {/* TAB 1: EXPENSE FORECAST REPORT (Next Month Forecast) */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* Controls & Generate Trigger Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {targetNextMonthName}
                  </span>
                  <span className="text-xs text-slate-400">• O'tgan {historicalMonthSummaries.length} oylik tarix asosida</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                  Keyingi oy uchun taxminiy xarajatlar hisoboti
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  O'tgan oylardagi sarf-xarajatlar dinamikasi, mavsumiy omillar va belgilangan limitlar asosida sun'iy intellekt hisob-kitobi.
                </p>
              </div>

              {/* Scenario Toggle Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setForecastScenario('standard');
                    if (forecastReport) handleGenerateForecast('standard');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    forecastScenario === 'standard'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Standart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForecastScenario('saving');
                    if (forecastReport) handleGenerateForecast('saving');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    forecastScenario === 'saving'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="10% tejamkorlik maqsadi"
                >
                  -10% Tejash
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForecastScenario('strict');
                    if (forecastReport) handleGenerateForecast('strict');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    forecastScenario === 'strict'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="15% qat'iy tejamkorlik maqsadi"
                >
                  -15% Qat'iy
                </button>
              </div>
            </div>

            {/* Historical Months Mini Bar / Badges */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                O'tgan oylar xarajatlari:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {historicalMonthSummaries.map((h) => (
                  <div
                    key={h.key}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300"
                  >
                    <span className="font-medium text-slate-500 mr-1.5">{h.name}:</span>
                    <span className="font-bold tabular-nums">{formatCurrency(h.total, currency)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">
                Majburiy oylik to'lovlar (kredit + kommunal):{' '}
                <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                  {formatCurrency(totalLoanMonthly + utilities.reduce((s, u) => s + u.amount, 0), currency)}
                </strong>
              </span>

              <button
                type="button"
                disabled={forecastLoading}
                onClick={() => handleGenerateForecast()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2 min-h-[42px]"
              >
                {forecastLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI xarajatlar prognozini hisoblamoqda...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{forecastReport ? 'Qayta hisoblash' : 'Taxminiy hisobotni generatsiya qilish'}</span>
                  </>
                )}
              </button>
            </div>

            {forecastError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forecastError}</span>
              </div>
            )}
          </div>

          {/* GENERATED FORECAST REPORT CONTAINER */}
          {forecastReport && (
            <div className="space-y-6 animate-fade-in">
              {/* 1. Core Summary Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Metric 1: Total Forecast Expenses */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold">Kutilayotgan umumiy sarf</span>
                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
                    {formatCurrency(forecastReport.predictedTotalExpenses, currency)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                        forecastReport.trendComparison.percentChange <= 0
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {forecastReport.trendComparison.percentChange > 0 ? '+' : ''}
                      {forecastReport.trendComparison.percentChange}%
                    </span>
                    <span className="text-slate-400 truncate">o'tgan o'rtachaga nisbatan</span>
                  </div>
                </div>

                {/* Metric 2: Projected Net Savings */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold">Kutilayotgan jamg'arma</span>
                    <PiggyBank className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                    +{formatCurrency(forecastReport.projectedSavings, currency)}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>Daromadning</span>
                    <strong className="text-emerald-700 dark:text-emerald-300">{forecastReport.projectedSavingsRate}%</strong>
                    <span>qismi erkin qoladi</span>
                  </div>
                </div>

                {/* Metric 3: Fixed Obligations */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold">Majburiy to'lovlar</span>
                    <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {formatCurrency(forecastReport.fixedObligationsTotal, currency)}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Kreditlar va kommunal to'lovlar
                  </div>
                </div>

                {/* Metric 4: Daily Variable Spending */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold">Kundalik o'zgaruvchan</span>
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {formatCurrency(forecastReport.predictedVariableExpenses, currency)}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Kuniga o'rtacha: ~{formatCurrency(Math.round(forecastReport.predictedVariableExpenses / 30), currency)}
                  </div>
                </div>
              </div>

              {/* 2. Detailed Category Forecast Table / Cards */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Toifalar bo'yicha batafsil prognoz taqsimoti</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Har bir xarajat yo'nalishi bo'yicha kutilayotgan summa, o'tgan o'rtacha va sun'iy intellekt xulosasi.
                    </p>
                  </div>

                  <span className="text-xs font-semibold text-slate-500 font-mono">
                    {forecastReport.categoryBreakdown.length} toifa
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {forecastReport.categoryBreakdown.map((cat) => (
                    <div
                      key={cat.categoryId}
                      className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {cat.categoryName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              cat.riskLevel === 'high'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : cat.riskLevel === 'medium'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {cat.riskLevel === 'high' ? 'Yuqori xavf' : cat.riskLevel === 'medium' ? "O'rtacha" : 'Xavfsiz'}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                          {cat.rationale}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 self-end md:self-center font-mono">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-sans">O'tgan o'rtacha</span>
                          <span className="text-slate-600 dark:text-slate-400 font-semibold tabular-nums">
                            {formatCurrency(cat.pastAverageAmount, currency)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-sans">Kutilayotgan summa</span>
                          <span className="text-slate-900 dark:text-white font-bold text-sm tabular-nums">
                            {formatCurrency(cat.predictedAmount, currency)}
                          </span>
                        </div>

                        {cat.budgetLimit > 0 && (
                          <div className="text-right hidden sm:block">
                            <span className="text-[10px] text-slate-400 block font-sans">Limit</span>
                            <span className="text-slate-500 tabular-nums">
                              {formatCurrency(cat.budgetLimit, currency)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Seasonal Insights and Risks in Uzbekistan */}
              {forecastReport.seasonalInsights?.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 space-y-2">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Mavsumiy omillar va xavflar (O'zbekiston sharoitida)</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-amber-900/90 dark:text-amber-200/90 pl-1">
                    {forecastReport.seasonalInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Actionable Recommendations */}
              {forecastReport.actionableRecommendations?.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2.5">
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Ortiqcha sarflarning oldini olish bo'yicha amaliy tavsiyalar</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                    {forecastReport.actionableRecommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/60 text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-1 shadow-2xs"
                      >
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {idx + 1}-qadam:
                        </span>
                        <p>{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. AI Narrative Summary Text */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-600" />
                    <span>AI Maslahatchining to'liq tahliliy xulosasi</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Gemini AI</span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {forecastReport.summaryNarrative}
                </div>
              </div>

              {/* 6. Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyForecast}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-2xs"
                  >
                    {copiedForecast ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Nusxalandi!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Hisobotdan nusxa olish</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateForecast()}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Qayta tahlil qilish</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDiscussForecastInChat}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Chatda muhokama qilish</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI CONVERSATION & QA (Chat) */}
      {activeTab === 'chat' && (
        <div className="space-y-6">
          {/* Promo Card to forecast if not generated yet */}
          {!forecastReport && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Keyingi oy xarajatlaringiz qancha bo'lishini bilmoqchimisiz?</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  O'tgan oylardagi sarflaringiz tahlil qilinib, kelasi oy uchun kutilayotgan byudjet hisoboti tayyorlanadi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('forecast');
                  handleGenerateForecast();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shrink-0 self-start sm:self-center flex items-center gap-1.5"
              >
                <span>Prognoz hisoboti →</span>
              </button>
            </div>
          )}

          {/* Preset Fast Prompt Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Tezkor savollar:
            </span>
            <div className="flex flex-wrap gap-2">
              {presetQuestions.map((q, idx) => (
                <button
                  key={idx}
                  disabled={chatLoading}
                  onClick={() => handleSendMessage(q)}
                  className="text-left px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-xs text-slate-700 dark:text-slate-200 transition shadow-2xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-6 space-y-4 min-h-[420px] max-h-[600px] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-emerald-700 text-white font-medium rounded-tr-none'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                  }`}
                >
                  <div className="text-slate-900 dark:text-white">
                    {msg.text || (msg.isStreaming && (
                      <span className="text-slate-400 italic">Javob shakllanmoqda...</span>
                    ))}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3.5 bg-emerald-500 animate-pulse ml-1 align-middle" />
                    )}
                  </div>
                  <div
                    className={`mt-2 text-[10px] text-right flex items-center justify-end gap-1.5 ${
                      msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {msg.isStreaming && (
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Jonli oqim
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputQuestion}
              disabled={chatLoading}
              onChange={(e) => setInputQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder={
                chatLoading
                  ? "AI jonli rejimda javob bermoqda..."
                  : "Oila moliyasi yoki kreditlar bo'yicha savolingizni yozing..."
              }
              className="flex-1 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            {chatLoading ? (
              <button
                type="button"
                onClick={handleStopStreaming}
                className="px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-1.5 min-h-[44px]"
                title="Jonli javobni to'xtatish"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">To'xtatish</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputQuestion.trim()}
                className="px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center min-h-[44px]"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
