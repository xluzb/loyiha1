import React, { useState } from 'react';
import {
  Loan,
  Income,
  Expense,
  ExpenseCategory,
  SavingsGoal,
  CurrencyType,
} from '../../types';
import {
  Bot,
  Send,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Loader2,
  TrendingDown,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { formatCurrency, calculateDTI } from '../../utils/finance';

interface AIAdvisorViewProps {
  loans: Loan[];
  incomes: Income[];
  expenses: Expense[];
  categories: ExpenseCategory[];
  goals: SavingsGoal[];
  currency: CurrencyType;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({
  loans,
  incomes,
  expenses,
  categories,
  goals,
  currency,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Assalomu alaykum! Men sizning shaxsiy moliyaviy sun'iy intellekt maslahatchingizman.\n\nOilangizning barcha daromadlari, kreditlari va xarajatlari bazasini tahlil qilib, eng optimal to'lov strategiyasi, foizlarni tejash va byudjetni me'yorlashtirish bo'yicha amaliy tavsiyalar berishga tayyorman. Pastdagi tayyor savollardan birini tanlang yoki o'z savolingizni yozing!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const presetQuestions = [
    'Mening moliyaviy holatimni tahlil qil va kreditlarni to\'lash rejasini tuz.',
    'Keyingi 6 oyda xarajatlarni qanday qilib 15% ga qisqartirish mumkin?',
    'Erkin mablag\'imni kreditga to\'lash yaxshimi yoki omonatga qo\'yishmi?',
    'Mening byudjetim bo\'yicha qaysi xarajatlar haddan tashqari ko\'p?',
  ];

  const totalIncome = incomes.reduce((s, i) => s + (i.isRecurring ? i.amount : 0), 0);
  const totalLoanMonthly = loans
    .filter((l) => !l.isPaidOff)
    .reduce((s, l) => s + l.monthlyPayment, 0);
  const dti = calculateDTI(totalLoanMonthly, totalIncome);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuestion;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    // Build context payload
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

      const response = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          contextData,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.error || errJson?.details || 'AI serveri javob bermadi');
      }

      const data = await response.json();
      const aiReply =
        data.text ||
        data.reply ||
        "Ma'lumotlaringiz asosida: Sizning birinchi navbatdagi maqsadingiz eng yuqori foizli kreditlarni yopish bo'lishi lozim.";

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } catch (err: any) {
      // Graceful rule-based fallback response if server offline
      const fallbackReply = `[Oflayn tahlil]: Hozirgi kunda sizning oylik daromadingiz ${formatCurrency(
        totalIncome,
        currency
      )}, qarz yuki (DTI) ko'rsatkichi esa ${dti.dti}%. 
Tavsiya:
1. ${
        loans.length > 0
          ? `Birinchi navbatda eng yuqori foiz stavkali kreditni (Ko'chki usuli) tezlashtirib to'lang.`
          : 'Hozirda kreditlaringiz yo\'q, ajoyib!'
      }
2. Oziq-ovqat va kundalik sarf-xarajatlar limitiga rioya qiling.
3. Favqulodda zaxira jamg'armasiga har oy kamida 10-15% mablag' yo'naltiring.`;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setLoading(false);
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
            Google Gemini sun'iy intellekti orqali shaxsiylashtirilgan kredit tahlili va byudjet optimallashuvi.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Bot className="w-4 h-4 text-emerald-600" />
          <span>Gemini Pro faol</span>
        </div>
      </div>

      {/* Preset Fast Prompt Buttons */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Tezkor savollar:
        </span>
        <div className="flex flex-wrap gap-2">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSendMessage(q)}
              className="text-left px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-xs text-slate-700 dark:text-slate-200 transition shadow-sm"
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
            className={`flex gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
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
              <div className="text-slate-900 dark:text-white">{msg.text}</div>
              <div
                className={`mt-2 text-[10px] text-right ${
                  msg.sender === 'user'
                    ? 'text-emerald-200'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500 flex items-center gap-2">
              <span>Moliyaviy ma'lumotlaringiz tahlil qilinmoqda...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputQuestion}
          disabled={loading}
          onChange={(e) => setInputQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Oila moliyasi yoki kreditlar bo'yicha savolingizni yozing..."
          className="flex-1 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputQuestion.trim()}
          className="px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center min-h-[44px]"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
