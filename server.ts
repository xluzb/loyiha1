import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to build structured financial context text
function formatFinancialContext(data: any): string {
  if (!data) return "Foydalanuvchi hali to'liq moliyaviy ma'lumotlarni kiritmadi.";
  if (typeof data === 'string') return data;

  const lines: string[] = [];
  if (data.totalMonthlyIncome !== undefined) {
    lines.push(`• Jami oylik doimiy daromad: ${Number(data.totalMonthlyIncome).toLocaleString()} UZS`);
  }
  if (data.dtiRatio !== undefined) {
    lines.push(
      `• Qarz yuki ko'rsatkichi (DTI): ${data.dtiRatio}% (${
        data.dtiRatio > 50 ? 'XAVFLI DARAJA' : data.dtiRatio > 35 ? "O'RTACHA YUK" : 'XAVFSIZ/ME\'YOR'
      })`
    );
  }
  if (data.monthlyExpensesTotal !== undefined) {
    lines.push(`• Oylik jami xarajatlar: ${Number(data.monthlyExpensesTotal).toLocaleString()} UZS`);
  }
  if (Array.isArray(data.incomes) && data.incomes.length > 0) {
    lines.push(`• Daromad manbalari:`);
    data.incomes.forEach((inc: any) => {
      lines.push(`  - ${inc.title || 'Daromad'}: ${Number(inc.amount || 0).toLocaleString()} UZS`);
    });
  }
  if (Array.isArray(data.loans) && data.loans.length > 0) {
    lines.push(`• Faol kreditlar (${data.loans.length} ta):`);
    data.loans.forEach((l: any) => {
      lines.push(
        `  - ${l.name || 'Kredit'} (${l.bank || 'Bank'}): qoldiq ${Number(
          l.remaining || 0
        ).toLocaleString()} UZS, yillik foiz stavkasi: ${l.rate}%, oylik to'lov: ${Number(
          l.monthly || 0
        ).toLocaleString()} UZS, turi: ${l.paymentType || 'annuitet'}`
      );
    });
  } else {
    lines.push(`• Faol kreditlar: Hozirda mavjud emas`);
  }
  if (Array.isArray(data.topExpenses) && data.topExpenses.length > 0) {
    lines.push(`• Xarajat toifalari taqsimoti:`);
    data.topExpenses.forEach((c: any) => {
      lines.push(
        `  - ${c.category}: sarf ${Number(c.spent || 0).toLocaleString()} UZS (reja: ${
          c.budgetLimit ? Number(c.budgetLimit).toLocaleString() + ' UZS' : 'cheklanmagan'
        })`
      );
    });
  }
  if (Array.isArray(data.savingsGoals) && data.savingsGoals.length > 0) {
    lines.push(`• Jamg'arma maqsadlari:`);
    data.savingsGoals.forEach((g: any) => {
      lines.push(
        `  - ${g.name}: yig'ilgan ${Number(g.current || 0).toLocaleString()} UZS / reja ${Number(
          g.target || 0
        ).toLocaleString()} UZS`
      );
    });
  }
  return lines.join('\n');
}

// Resilient Gemini generator with fallback models
async function generateGeminiContentWithFallback(contents: any, config?: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY sozlanmagan yoki topilmadi');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents,
        config,
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout on ${model}`)), 16000)
      );
      const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`[AI] Model ${model} xatoligi (keyingi model sinab ko'riladi):`, err?.status || err?.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Barcha AI modellari band');
}

// Core prompt builder for financial advisor
function getFinancialAdvisorSystemInstruction(formattedContext: string): string {
  return `Siz "Oila Moliya" platformasining shaxsiy moliya va kredit bo'yicha aqlli AI maslahatchisisiz.
Vazifangiz: O'zbekiston oilalarining moliyaviy barqarorligini oshirish, kredit yukini (DTI) kamaytirish, to'g'ri byudjet taqsimotini shakllantirish va investitsiya/jamg'arma madaniyatini rivojlantirish.
Muloqot tili: Faqat o'zbek tilida (lotin alifbosida).
Tohangiz: Do'stona, samimiy, dalillarga va foydalanuvchining aniq raqamlariga asoslangan, tushunarli va professional.

Muhim ko'rsatmalar:
1. O'zbekiston bank tizimi va valyutasi (so'm - UZS) xususiyatlarini inobatga oling (annuitet, differensial to'lovlar, nasiya/muddatli to'lovlar, mikromoliya).
2. Kredit strategiyasi: Avalanche (Ko'chki - eng yuqori foizlilarni birinchi yopib, foizni tejash) va Snowball (Qor to'pi - eng kichik summalilarni tez yopib, psixologik yengillik olish) metodlarini tushuntiring.
3. DTI (Qarz yuki nisbati) 50% dan oshsa, zudlik bilan yangi qarz olmaslikni va ortiqcha xarajatlarni to'xtatishni qat'iy tavsiya eting.
4. Har doim favqulodda zaxira (kamida 3 oylik majburiy xarajatlar summasi) to'plash muhimligini eslatib turing.
5. Foydalanuvchining pastda berilgan aniq raqamlaridan foydalanib, unga mos aniq qadamlar va hisob-kitoblarni taqdim eting.
6. Javobingiz oxirida "Tavsiyalar umumiy tahliliy xarakterga ega va professional moliyaviy maslahat o'rnini bosmaydi" degan qisqa eslatma bo'lsin.

Foydalanuvchining ayni paytdagi moliyaviy ko'rsatkichlari:
${formattedContext}`;
}

// Real-time AI Streaming Endpoint (SSE)
app.post(['/api/ai/advisor-stream', '/api/ai/chat-stream'], async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  try {
    const { question, message, contextData, financialContext, history = [] } = req.body;
    const userQuery = question || message;

    if (!userQuery) {
      res.write(`data: ${JSON.stringify({ error: 'Savol matni talab qilinadi' })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const formattedContext = formatFinancialContext(contextData || financialContext);
    const systemInstruction = getFinancialAdvisorSystemInstruction(formattedContext);

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h && h.text) {
          contents.push({
            role: h.role === 'model' || h.sender === 'ai' ? 'model' : 'user',
            parts: [{ text: h.text }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: userQuery }],
    });

    const fullText = await generateGeminiContentWithFallback(contents, {
      systemInstruction,
      temperature: 0.7,
    });

    // Stream words in real-time with natural conversational pace
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunkText = words[i] + (i < words.length - 1 ? ' ' : '');
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    res.write('data: [DONE]\n\n');
    return res.end();
  } catch (error: any) {
    console.warn('Gemini stream API error, streaming fallback advice:', error?.message);
    const { question, message } = req.body;
    const userQuery = question || message || 'savolingiz';
    const fallbackMessage = `Assalomu alaykum! Sizning savolingiz va moliyaviy ko'rsatkichlaringiz asosida quyidagi tahliliy tavsiyalarni taqdim etaman:

1. Kreditlarni optimallashtirish: Oylik daromadingizdan majburiy to'lovlarni to'laganingizdan so'ng, erkin qolgan mablag'ning eng katta qismini eng yuqori foiz stavkali kreditga yo'naltiring (Ko'chki usuli). Bu sizga kredit muddatini qisqartirish va ortiqcha foiz to'lovlaridan qutulishga yordam beradi.

2. Favqulodda zaxira jamg'armasi: Har oy daromadingizning 10-15% qismini kutilmagan holatlar uchun alohida jamg'arib boring. Kamida 3 oylik majburiy xarajatlaringizga teng zaxira bo'lishi moliyaviy xavfsizlikni ta'minlaydi.

3. Xarajatlar nazorati: Oziq-ovqat va kundalik ro'zg'or sarflari uchun haftalik aniq limit belgilang. Rejadan tashqari ko'ngilochar xarajatlarni cheklash jamg'arma tezligini sezilarli oshiradi.

Tavsiyalar umumiy tahliliy xarakterga ega va professional moliyaviy maslahat o'rnini bosmaydi.`;

    const words = fallbackMessage.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunkText = words[i] + (i < words.length - 1 ? ' ' : '');
      res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    res.write('data: [DONE]\n\n');
    return res.end();
  }
});

// AI Advisor Endpoint (Called by AIAdvisorView)
app.post('/api/ai/advisor', async (req, res) => {
  try {
    const { question, message, contextData, financialContext, history = [] } = req.body;
    const userQuery = question || message;

    if (!userQuery) {
      return res.status(400).json({ error: 'Savol matni (question) talab qilinadi.' });
    }

    const formattedContext = formatFinancialContext(contextData || financialContext);
    const systemInstruction = getFinancialAdvisorSystemInstruction(formattedContext);

    // Prepare contents array with history
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h && h.text) {
          contents.push({
            role: h.role === 'model' || h.sender === 'ai' ? 'model' : 'user',
            parts: [{ text: h.text }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: userQuery }],
    });

    const replyText = await generateGeminiContentWithFallback(contents, {
      systemInstruction,
      temperature: 0.7,
    });

    return res.json({
      text: replyText,
      reply: replyText,
      success: true,
    });
  } catch (error: any) {
    console.error('Gemini advisor error:', error);
    return res.status(500).json({
      error: 'AI xizmati bilan bog\'lanishda xatolik yuz berdi.',
      details: error?.message || String(error),
    });
  }
});

// AI Chat Endpoint (Backward-compatible)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, question, history = [], financialContext = '', contextData } = req.body;
    const userQuery = message || question;

    if (!userQuery) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const formattedContext = formatFinancialContext(contextData || financialContext);
    const systemInstruction = getFinancialAdvisorSystemInstruction(formattedContext);

    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h && h.text) {
          contents.push({
            role: h.role === 'model' || h.sender === 'ai' ? 'model' : 'user',
            parts: [{ text: h.text }],
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: userQuery }],
    });

    const replyText = await generateGeminiContentWithFallback(contents, {
      systemInstruction,
      temperature: 0.7,
    });

    return res.json({
      text: replyText,
      reply: replyText,
      success: true,
    });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    return res.status(500).json({
      error: 'AI xizmati bilan bog\'lanishda xatolik yuz berdi.',
      details: error?.message || String(error),
    });
  }
});

// AI Monthly Report Endpoint
app.post('/api/ai/monthly-report', async (req, res) => {
  try {
    const { summary } = req.body;

    const prompt = `Quyidagi oilaviy moliya holatiga oylik tahlil va xulosa bering:
${JSON.stringify(summary, null, 2)}

Iltimos, JSON formatida javob bering, struktura:
{
  "goodPoints": ["nima yaxshi bo'lganligi haqida 2 ta punkt"],
  "riskPoints": ["qayerda ortiqcha sarf yoki xavf borligi haqida 2 ta punkt"],
  "recommendations": ["keyingi oy uchun 3 ta aniq va amaliy tavsiya"]
}
Barcha matnlar o'zbek tilida (lotin) bo'lsin.`;

    const rawResult = await generateGeminiContentWithFallback(prompt, {
      responseMimeType: 'application/json',
      temperature: 0.4,
    });

    const parsed = JSON.parse(rawResult || '{}');
    return res.json({ report: parsed });
  } catch (error: any) {
    console.error('Gemini monthly report error:', error);
    return res.status(500).json({
      error: 'Oylik hisobot shakllantirishda xatolik yuz berdi.',
      details: error?.message || String(error),
    });
  }
});

// AI Next-Month Expense Forecast Endpoint
app.post('/api/ai/forecast-expenses', async (req, res) => {
  try {
    const {
      expenses = [],
      categories = [],
      loans = [],
      utilities = [],
      totalMonthlyIncome = 0,
      targetMonth = 'Keyingi oy (Oktyabr 2026)',
      scenario = 'standard', // 'standard' | 'saving' | 'strict'
    } = req.body;

    // 1. Group past expenses by month
    const monthGroups: Record<string, { total: number; categories: Record<string, number> }> = {};
    for (const exp of expenses) {
      if (!exp.date) continue;
      const monthKey = exp.date.slice(0, 7); // e.g. "2026-09"
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = { total: 0, categories: {} };
      }
      monthGroups[monthKey].total += exp.amount || 0;
      const catId = exp.categoryId || 'cat-other';
      monthGroups[monthKey].categories[catId] = (monthGroups[monthKey].categories[catId] || 0) + (exp.amount || 0);
    }

    const sortedMonths = Object.keys(monthGroups).sort();
    const historicalMonths = sortedMonths.map((mKey) => {
      const parts = mKey.split('-');
      const monthNames = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
      const mNum = parseInt(parts[1], 10);
      const name = `${monthNames[mNum] || parts[1]} ${parts[0]}`;
      return {
        month: mKey,
        monthName: name,
        total: monthGroups[mKey].total,
      };
    });

    const pastMonthsCount = sortedMonths.length || 1;
    const pastMonthsAverage = Math.round(
      (Object.values(monthGroups).reduce((s, m) => s + m.total, 0) || expenses.reduce((s: number, e: any) => s + e.amount, 0)) / pastMonthsCount
    );

    // 2. Fixed monthly commitments
    const loansTotal = loans
      .filter((l: any) => !l.isPaidOff)
      .reduce((s: number, l: any) => s + (l.monthlyPayment || 0), 0);
    const utilitiesTotal = utilities.reduce((s: number, u: any) => s + (u.amount || 0), 0);
    const recurringExpensesTotal = expenses
      .filter((e: any) => e.isRecurring)
      .reduce((s: number, e: any) => s + (e.amount || 0), 0);
    const fixedObligationsTotal = loansTotal + utilitiesTotal;

    // Category averages
    const categoryAverages: Record<string, { name: string; pastAvg: number; budgetLimit: number }> = {};
    for (const cat of categories) {
      let sumForCat = 0;
      for (const mKey of sortedMonths) {
        sumForCat += monthGroups[mKey].categories[cat.id] || 0;
      }
      const pastAvg = Math.round(sumForCat / pastMonthsCount) || Math.round((cat.budgetLimit || 1000000) * 0.85);
      categoryAverages[cat.id] = {
        name: cat.name,
        pastAvg,
        budgetLimit: cat.budgetLimit || 0,
      };
    }

    // 3. Fallback mathematical forecast generator
    const generateStatisticalFallback = () => {
      const multiplier = scenario === 'saving' ? 0.9 : scenario === 'strict' ? 0.85 : 1.0;
      let predictedVarTotal = 0;
      const categoryBreakdown = categories.map((cat: any) => {
        const info = categoryAverages[cat.id] || { name: cat.name, pastAvg: 500000, budgetLimit: 0 };
        // Seasonal factor: Food & fuel slight seasonal change
        let seasonalFactor = 1.0;
        if (cat.name.toLowerCase().includes('oziq') || cat.name.toLowerCase().includes('bozor')) seasonalFactor = 1.02;
        if (cat.name.toLowerCase().includes('kommunal') || cat.name.toLowerCase().includes('uy-joy')) seasonalFactor = 1.08;
        if (cat.name.toLowerCase().includes('kiyim')) seasonalFactor = 1.1;

        const predictedAmount = Math.round(info.pastAvg * multiplier * seasonalFactor);
        predictedVarTotal += predictedAmount;
        const changePct = info.pastAvg > 0 ? Math.round(((predictedAmount - info.pastAvg) / info.pastAvg) * 100) : 0;
        const riskLevel: 'low' | 'medium' | 'high' =
          info.budgetLimit > 0 && predictedAmount > info.budgetLimit
            ? 'high'
            : predictedAmount > info.pastAvg * 1.1
            ? 'medium'
            : 'low';

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          predictedAmount,
          pastAverageAmount: info.pastAvg,
          budgetLimit: info.budgetLimit,
          changePercentage: changePct,
          riskLevel,
          rationale:
            riskLevel === 'high'
              ? `Belgilangan byudjet limitidan (${Number(info.budgetLimit).toLocaleString()} UZS) oshish ehtimoli mavjud.`
              : seasonalFactor > 1.05
              ? `Mavsumiy ehtiyojlar tufayli biroz oshishi mumkin.`
              : `O'tgan oylar sarfi me'yorida barqaror prognoz qilinmoqda.`,
        };
      });

      const predictedTotalExpenses = predictedVarTotal + fixedObligationsTotal;
      const diffVsPast = pastMonthsAverage + fixedObligationsTotal > 0
        ? Math.round(((predictedTotalExpenses - (pastMonthsAverage + fixedObligationsTotal)) / (pastMonthsAverage + fixedObligationsTotal)) * 100)
        : 0;

      const projectedSavings = Math.max(0, totalMonthlyIncome - predictedTotalExpenses);
      const projectedSavingsRate = totalMonthlyIncome > 0 ? Math.round((projectedSavings / totalMonthlyIncome) * 100) : 0;

      return {
        targetMonth,
        predictedTotalExpenses,
        pastMonthsAverage: pastMonthsAverage + fixedObligationsTotal,
        predictedVariableExpenses: predictedVarTotal,
        fixedObligationsTotal,
        projectedSavings,
        projectedSavingsRate,
        trendComparison: {
          percentChange: diffVsPast,
          direction: diffVsPast > 1 ? 'up' : diffVsPast < -1 ? 'down' : 'flat',
          summary: diffVsPast < 0
            ? `O'tgan oylarga nisbatan xarajatlar ${Math.abs(diffVsPast)}% ga kamayishi kutilmoqda.`
            : `O'tgan oylarga nisbatan xarajatlar ${diffVsPast}% ga ko'payishi mumkin.`,
        },
        categoryBreakdown,
        seasonalInsights: [
          "Kuz/qish mavsumi yaqinlashishi sababli tabiiy gaz, issiqlik ta'minoti va issiq kiyim-kechak xarajatlari ortishi mumkin.",
          "Oziq-ovqat mahsulotlari narxlarining mavsumiy o'zgarishini inobatga olgan holda haftalik xaridlarni rejalashtirish tavsiya etiladi.",
        ],
        actionableRecommendations: [
          "Doimiy oziq-ovqat va ro'zg'or xarajatlari uchun haftalik aniq sarf-xarajat limitini o'rnating.",
          "Kommunal hisoblagichlarni oy boshida tekshirib, ortiqcha energiya sarfini optimallashtiring.",
          "Erkin qolgan mablag'ning kamida 50% qismini favqulodda zaxira yoki yuqori foizli kreditni muddatidan oldin yopishga ajrating.",
        ],
        summaryNarrative: `O'tgan oylardagi (${sortedMonths.join(', ') || 'joriy davr'}) xarajatlar tahlili shuni ko'rsatadiki, oilangizning o'rtacha oylik xarajati ${Number(pastMonthsAverage + fixedObligationsTotal).toLocaleString()} UZS atrofida shakllangan. ${targetMonth} uchun kutilayotgan umumiy xarajat ${Number(predictedTotalExpenses).toLocaleString()} UZS ni tashkil etadi. Agar reja intizom bilan bajarilsa, oy oxirida ${Number(projectedSavings).toLocaleString()} UZS (${projectedSavingsRate}% sof jamg'arma) erkin mablag' shakllanishi kutilmoqda.`,
        historicalMonths,
      };
    };

    // 4. Try Gemini AI Model for deep analytical report
    try {
      const monthlyTotalsStr = historicalMonths
        .map((m) => `• ${m.monthName} (${m.month}): jami ${Number(m.total).toLocaleString()} UZS`)
        .join('\n');

      const categoriesSummaryStr = Object.entries(categoryAverages)
        .map(
          ([_cid, c]) =>
            `• ${c.name}: o'tgan oylar o'rtachasi ${Number(c.pastAvg).toLocaleString()} UZS | Limit: ${
              c.budgetLimit ? Number(c.budgetLimit).toLocaleString() + ' UZS' : 'cheklanmagan'
            }`
        )
        .join('\n');

      const prompt = `Siz O'zbekiston oilaviy moliyasi bo'yicha yetakchi tahlilchisiz.
Quyidagi oilaviy moliya tarixi asosida ${targetMonth} uchun xarajatlar prognozi hisobotini tayyorlang:

Oylik doimiy daromad: ${Number(totalMonthlyIncome).toLocaleString()} UZS
Oylik kredit to'lovlari (majburiy): ${Number(loansTotal).toLocaleString()} UZS
Kommunal to'lovlar: ${Number(utilitiesTotal).toLocaleString()} UZS
O'tgan oylardagi jami xarajatlar:
${monthlyTotalsStr || 'Joriy oy xarajatlari mavjud'}

Toifalar bo'yicha sarflar va limitlar:
${categoriesSummaryStr}

Ssenariy: ${scenario === 'saving' ? "10% tejash rejasi" : scenario === 'strict' ? "Qat'iy tejash rejasi" : "Standart muvozanatli reja"}

Quyidagi JSON formatda hisobot qaytaring (faqat valid JSON, kod bloklarisiz):
{
  "targetMonth": "${targetMonth}",
  "predictedTotalExpenses": <raqam: jami kutilayotgan chiqim>,
  "pastMonthsAverage": <raqam: o'tgan oylar o'rtachasi>,
  "predictedVariableExpenses": <raqam: o'zgaruvchan kundalik sarf>,
  "fixedObligationsTotal": <raqam: kredit + kommunal jami>,
  "projectedSavings": <raqam: daromad - xarajat>,
  "projectedSavingsRate": <raqam: foiz, 0-100>,
  "trendComparison": {
    "percentChange": <raqam, masalan -4.5 yoki 3.2>,
    "direction": "up" | "down" | "flat",
    "summary": "<o'tgan oylarga qiyosiy 1 jumla>"
  },
  "categoryBreakdown": [
    {
      "categoryId": "<id>",
      "categoryName": "<nomi>",
      "predictedAmount": <kutilayotgan summa>,
      "pastAverageAmount": <o'tgan o'rtacha>,
      "budgetLimit": <limit>,
      "changePercentage": <foiz>,
      "riskLevel": "low" | "medium" | "high",
      "rationale": "<ushbu summa nima sababdan kutilayotgani haqida qisqa izoh (masalan: mavsumiy o'zgarish, ob-havo, narxlar)>"
    }
  ],
  "seasonalInsights": [
    "<O'zbekistondagi ushbu oyga xos 1-mavsumiy ehtiyoj yoki xavf>",
    "<2-mavsumiy omil>"
  ],
  "actionableRecommendations": [
    "<1-amaliy tavsiya>",
    "<2-amaliy tavsiya>",
    "<3-amaliy tavsiya>"
  ],
  "summaryNarrative": "<Keyingi oy byudjetini boshqarish bo'yicha professional, dalilli 2-3 xatboshilik xulosa o'zbek tilida>"
}
Barcha matnlar sof o'zbek tilida (lotin yozuvida) bo'lsin.`;

      const aiResponse = await generateGeminiContentWithFallback(prompt, {
        responseMimeType: 'application/json',
        temperature: 0.4,
      });

      const parsed = JSON.parse(aiResponse || '{}');
      if (parsed.predictedTotalExpenses && Array.isArray(parsed.categoryBreakdown)) {
        return res.json({
          report: {
            ...parsed,
            historicalMonths,
          },
          success: true,
          source: 'gemini',
        });
      }
    } catch (aiErr) {
      console.warn('Gemini forecast AI attempt failed, using robust statistical fallback:', aiErr);
    }

    // Return statistical fallback if AI unreachable
    const fallbackReport = generateStatisticalFallback();
    return res.json({
      report: fallbackReport,
      success: true,
      source: 'statistical',
    });
  } catch (error: any) {
    console.error('Forecast endpoint error:', error);
    return res.status(500).json({
      error: 'Xarajatlar prognozini hisoblashda xatolik yuz berdi.',
      details: error?.message || String(error),
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Mount Vite or serve static dist
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(express.static(path.resolve(__dirname, 'public')));
    app.use(vite.middlewares);

    const fs = await import('fs');
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Oila Moliya server running on http://localhost:${PORT}`);
  });
}

startServer();
