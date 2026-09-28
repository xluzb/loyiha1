# Oila Moliya — Oilaviy Byudjet va Kredit Strategiyasi Platformasi

Ushbu platforma oilaviy daromadlar, kundalik xarajatlar, kreditlarni optimallashtirish (qor to'pi / qor ko'chkisi strategiyalari), DTI (Debt-to-Income) ko'rsatkichi tahlili, kommunal to'lovlar, jamg'arma maqsadlari hamda yillik moliyaviy hisobotlarni (12 oylik trend va jamg'arma tezligi) professional darajada boshqarish uchun ishlab chiqilgan zamonaviy Progressive Web App (PWA).

---

## 🚀 Texnologiyalar (Tech Stack)

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Lucide React piktogrammalari
- **Grafiklar va Vizualizatsiya:** Recharts, Motion (Framer Motion v12) animatsiyalari
- **Offline / PWA:** Vite PWA plagin, Service Worker, Web App Manifest
- **AI Integratsiya:** Google GenAI SDK (`@google/genai`)
- **Backend/Server:** Express, Node.js (`server.ts`)

---

## 🛠 O'rnatish va Mahalliy Kompyuterda Ishga Tushirish

### 1. Talablar:
- Node.js (v18 yoki undan yuqori)
- npm, yarn, pnpm yoki bun

### 2. Kutubxonalarni o'rnatish:
```bash
npm install
```

### 3. Muhit o'zgaruvchilari (ixtiyoriy):
`.env.example` faylidan `.env` nusxasini oling:
```bash
cp .env.example .env
```
*(AI maslahatchidan foydalanish uchun `GEMINI_API_KEY` kiritishingiz mumkin)*

### 4. Dasturni ishga tushirish (Dev Server):
```bash
npm run dev
```
Dastur brauzerda ochiladi: `http://localhost:3000`

### 5. Production Build:
```bash
npm run build
npm start
```

---

## 📁 Loyiha Strukturasi

```text
├── index.html                   # Asosiy HTML kirish fayli
├── package.json                 # Bog'liqliklar va skriptlar
├── tsconfig.json                # TypeScript konfiguratsiyasi
├── vite.config.ts               # Vite va PWA konfiguratsiyasi
├── server.ts                    # Express backend va proxy server
├── public/                      # Statik fayllar (ikonkalar, manifest, zip)
└── src/
    ├── main.tsx                 # Ilova ildizi
    ├── App.tsx                  # Asosiy boshqaruv va holat (state)
    ├── index.css                # Global Tailwind CSS uslublari
    ├── types/                   # TypeScript interfeyslari va turlari
    ├── utils/                   # Moliya formulalari (DTI, kredit amortizatsiyasi, i18n)
    ├── services/                # Ma'lumotlarni saqlash (LocalStorage) va demo ma'lumotlar
    └── components/
        ├── common/              # Header, Sidebar, BottomNav, PinLock, Modal
        ├── dashboard/           # Asosiy ko'rsatkichlar, Yillik hisobotlar (Recharts)
        ├── loans/               # Kreditlar va qarzlar boshqaruvi
        ├── strategy/            # Snowball / Avalanche kredit to'lash strategiyalari
        ├── incomes/             # Oila a'zolari daromadlari
        ├── expenses/            # Xarajatlar va toifalar
        ├── utilities/           # Kommunal to'lovlar
        ├── investments/         # Jamg'arma maqsadlari va investitsiyalar
        ├── ai/                  # AI Moliyaviy maslahatchi
        └── settings/            # Til, valyuta, PIN, zaxira va eksport
```

---

## 🌟 Asosiy Imkoniyatlar

1. **Dashboard va Yillik Hisobotlar:** Recharts yordamida 12 oylik daromad va xarajatlar dinamikasi, jamg'arish tezligi (Saving Velocity) va animatsiyalar.
2. **Kreditlarni optimallashtirish:** DTI hisoblash, foiz tejash, muddatidan oldin to'lash rejasi.
3. **Ofline va PWA:** Internetsiz to'liq ishlash, telefonga ilova kabi o'rnatish.
4. **Xavfsizlik:** 4 xonali PIN-kod himoyasi, barcha ma'lumotlar foydalanuvchining o'z qurilmasida saqlanadi.
5. **Eksport va Zaxira:** CSV va JSON formatlarida yuklab olish.
