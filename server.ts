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
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
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
