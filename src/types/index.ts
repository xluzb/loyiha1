export type CurrencyType = 'UZS' | 'USD';

export type LanguageType = 'uz' | 'ru' | 'en';

export type ThemeType = 'light' | 'dark' | 'system';

export interface FamilyMember {
  id: string;
  name: string;
  role: 'ota' | 'ona' | 'farzand' | 'ota_ona' | 'bobo' | 'buvi' | 'boshqa' | string;
  avatarColor: string;
}

export type IncomeCategory =
  | 'maosh'
  | 'biznes'
  | 'ijara'
  | 'pensiya'
  | 'nafaqa'
  | 'qoshimcha'
  | 'boshqa';

export interface Income {
  id: string;
  title: string;
  memberId: string;
  amount: number; // In UZS
  dayOfMonth: number; // 1-31
  isRecurring: boolean;
  category: IncomeCategory;
  dateCreated: string;
}

export type LoanType =
  | 'bank'
  | 'mikroqarz'
  | 'nasiya'
  | 'ipoteka'
  | 'avtokredit'
  | 'kredit_karta'
  | 'shaxsiy';

export type PaymentType = 'annuity' | 'differential';

export interface PaymentScheduleItem {
  monthIndex: number; // 1, 2, 3...
  paymentDate: string; // YYYY-MM-DD
  principalPayment: number;
  interestPayment: number;
  totalMonthlyPayment: number;
  remainingPrincipal: number;
  isPaid: boolean;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  principalPart: number;
  interestPart: number;
  note?: string;
}

export interface Loan {
  id: string;
  name: string; // e.g. "Ipoteka xonadon"
  bankName: string; // e.g. "Ipoteka Bank"
  type: LoanType;
  originalPrincipal: number; // Asl summa
  remainingPrincipal: number; // Qolgan asosiy qarz
  annualInterestRate: number; // Yillik foiz stavkasi (%) e.g. 24
  paymentType: PaymentType; // annuitet / differensial
  startDate: string; // YYYY-MM-DD
  termMonths: number; // Muddati (oy)
  monthlyPayment: number; // Oylik to'lov summasi
  paymentDueDay: number; // Oyning to'lov kuni (1-31)
  prepaymentPenaltyRate: number; // Muddatidan oldin to'lash jarimasi (%)
  isPaidOff: boolean;
  notes?: string;
  schedule?: PaymentScheduleItem[];
  paymentsHistory?: LoanPayment[];
}

export type DebtType = 'lent' | 'borrowed'; // 'lent' = men berganman (qaytarib olishim kerak), 'borrowed' = men olganman (qaytarishim kerak)

export interface Debt {
  id: string;
  type: DebtType;
  counterparty: string; // Shaxs/qarindosh ismi
  originalAmount: number;
  remainingAmount: number;
  dueDate: string; // YYYY-MM-DD
  isInterestFree: boolean;
  annualInterestRate?: number;
  notes?: string;
  isResolved: boolean;
  dateCreated: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  iconName: string;
  budgetLimit: number; // Monthly limit
  color: string;
  isEssential: boolean; // Majburiy minimummi?
  isCustom?: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  memberId?: string;
  date: string; // YYYY-MM-DD
  isRecurring: boolean;
  notes?: string;
}

export type UtilityType =
  | 'electricity'
  | 'gas'
  | 'cold_water'
  | 'hot_water'
  | 'trash'
  | 'internet'
  | 'phone'
  | 'housing'
  | 'tv'
  | 'other';

export interface UtilityBill {
  id: string;
  type: UtilityType;
  name: string;
  accountNumber?: string;
  amount: number;
  meterReadingCurrent?: number;
  meterReadingPrevious?: number;
  isPaid: boolean;
  dueDate: string; // YYYY-MM-DD
  lastPaidDate?: string;
  monthYear: string; // e.g. "2026-09"
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category: string; // "Uy", "Avtomobil", "Haj", "Ta'lim", "Zaxira"
  monthlyContributionNeeded: number;
  isAchieved: boolean;
}

export type InvestmentType =
  | 'deposit'
  | 'gold'
  | 'currency'
  | 'stocks'
  | 'real_estate'
  | 'business'
  | 'crypto';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  investedAmount: number;
  currentValue: number;
  expectedAnnualReturnRate: number; // %
  startDate: string;
  notes?: string;
}

export interface UserSettings {
  currency: CurrencyType;
  usdExchangeRate: number;
  language: LanguageType;
  theme: ThemeType;
  monthStartDay: number;
  pinCode?: string | null;
  isLocked: boolean;
  onboardingCompleted: boolean;
  hasCompletedOnboarding?: boolean;
}

export interface AppData {
  version: number;
  familyMembers: FamilyMember[];
  incomes: Income[];
  loans: Loan[];
  debts: Debt[];
  expenseCategories: ExpenseCategory[];
  expenses: Expense[];
  utilities: UtilityBill[];
  savingsGoals: SavingsGoal[];
  investments: Investment[];
  userSettings: UserSettings;
}

export interface FinancialHealthBreakdown {
  score: number; // 0-100
  dtiScore: number; // 0-40
  savingsScore: number; // 0-30
  balanceScore: number; // 0-30
  statusText: string;
  statusColor: string;
  insights: string[];
}

export interface StrategySimulationItem {
  strategyName: 'avalanche' | 'snowball' | 'hybrid';
  label: string;
  description: string;
  totalMonthsToPayoff: number;
  totalInterestPaid: number;
  totalInterestSaved: number;
  debtFreeDate: string;
  payoffOrder: Array<{
    loanId: string;
    loanName: string;
    monthsToClose: number;
  }>;
}

export interface BudgetRecommendationResult {
  monthlyIncome: number;
  essentialExpensesTotal: number;
  mandatoryLoanPaymentsTotal: number;
  freeCashFlow: number;
  dtiRatio: number;
  dtiStatus: 'good' | 'normal' | 'danger' | 'critical';
  dtiLabel: string;
  dtiColor: string;
  emergencyFundCurrent: number;
  emergencyFundTarget: number; // 3 months of essential expenses
  emergencyFundShortage: number;
  allocation: {
    essentialPct: number;
    essentialAmount: number;
    mandatoryLoanPct: number;
    mandatoryLoanAmount: number;
    extraLoanPct: number;
    extraLoanAmount: number;
    emergencySavingsPct: number;
    emergencySavingsAmount: number;
    investmentPct: number;
    investmentAmount: number;
    lifestylePct: number;
    lifestyleAmount: number;
  };
  acceleratedLoan?: Loan;
  warningAlert?: string;
  summaryText: string;
}
