import {
  Loan,
  PaymentScheduleItem,
  StrategySimulationItem,
  BudgetRecommendationResult,
  FinancialHealthBreakdown,
} from '../types';

/**
 * Format currency in Uzbek Sum or other currency
 * Format: 1 250 000 so'm
 */
export function formatCurrency(
  amount: number,
  currency: 'UZS' | 'USD' = 'UZS',
  usdRate = 12850
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 ' + (currency === 'UZS' ? "so'm" : '$');
  }

  const value = currency === 'USD' ? amount / usdRate : amount;
  const rounded = Math.round(value);

  // Group thousands by space (standard Uzbek format: 1 250 000)
  const formatted = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  if (currency === 'USD') {
    return `$${formatted}`;
  }
  return `${formatted} so'm`;
}

/**
 * Annuitet oylik to'lov formulasi:
 * P = S * r / (1 - (1 + r)^-n)
 * bunda S = asosiy summa, r = yillik foiz / 12 / 100, n = muddat (oy)
 */
export function calculateAnnuityPayment(
  principal: number,
  annualInterestRate: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualInterestRate <= 0) {
    return Math.round(principal / termMonths);
  }

  const r = annualInterestRate / 12 / 100;
  const monthlyPayment =
    (principal * r) / (1 - Math.pow(1 + r, -termMonths));

  return Math.round(monthlyPayment);
}

/**
 * Differensial birinchi oylik to'lov
 * Asosiy qarz = S / n
 * Foiz = S * r
 * Jami = S / n + S * r
 */
export function calculateDifferentialInitialPayment(
  principal: number,
  annualInterestRate: number,
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  const principalPart = principal / termMonths;
  const r = annualInterestRate / 12 / 100;
  const interestPart = principal * r;
  return Math.round(principalPart + interestPart);
}

/**
 * Generate full amortization schedule for annuity or differential loan
 */
export function generateAmortizationSchedule(
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  paymentType: 'annuity' | 'differential' = 'annuity',
  startDate: string = new Date().toISOString().slice(0, 10)
): PaymentScheduleItem[] {
  if (principal <= 0 || termMonths <= 0) return [];

  const schedule: PaymentScheduleItem[] = [];
  const r = annualInterestRate / 12 / 100;
  let remaining = principal;
  const start = new Date(startDate);

  const fixedMonthlyPayment =
    paymentType === 'annuity'
      ? calculateAnnuityPayment(principal, annualInterestRate, termMonths)
      : 0;
  const fixedPrincipalPart =
    paymentType === 'differential' ? principal / termMonths : 0;

  for (let month = 1; month <= termMonths; month++) {
    const payDate = new Date(start);
    payDate.setMonth(start.getMonth() + month);
    const dateStr = payDate.toISOString().slice(0, 10);

    const interestPart = r > 0 ? remaining * r : 0;
    let principalPart = 0;
    let totalPayment = 0;

    if (paymentType === 'annuity') {
      if (month === termMonths) {
        // Last month handles minor rounding diffs
        principalPart = remaining;
        totalPayment = principalPart + interestPart;
        remaining = 0;
      } else {
        principalPart = fixedMonthlyPayment - interestPart;
        if (principalPart > remaining) {
          principalPart = remaining;
        }
        totalPayment = fixedMonthlyPayment;
        remaining = Math.max(0, remaining - principalPart);
      }
    } else {
      // Differential
      principalPart = month === termMonths ? remaining : fixedPrincipalPart;
      totalPayment = principalPart + interestPart;
      remaining = Math.max(0, remaining - principalPart);
    }

    schedule.push({
      monthIndex: month,
      paymentDate: dateStr,
      principalPayment: Math.round(principalPart),
      interestPayment: Math.round(interestPart),
      totalMonthlyPayment: Math.round(totalPayment),
      remainingPrincipal: Math.round(remaining),
      isPaid: false,
    });

    if (remaining <= 0) break;
  }

  return schedule;
}

/**
 * Qarz yuki ko'rsatkichi (DTI = oylik kredit to'lovlari / oylik daromad):
 * 0–20%: "Yaxshi" (yashil)
 * 20–35%: "Me'yorda" (sariq-yashil)
 * 35–50%: "Xavfli" (to'q sariq)
 * 50% dan yuqori: "Kritik" (qizil)
 */
export function calculateDTI(
  monthlyLoanPayments: number,
  monthlyIncome: number
): {
  dti: number;
  status: 'good' | 'normal' | 'danger' | 'critical';
  label: string;
  color: string;
  badgeBg: string;
} {
  if (monthlyIncome <= 0) {
    if (monthlyLoanPayments > 0) {
      return {
        dti: 100,
        status: 'critical',
        label: 'Kritik (Daromad kiritilmagan)',
        color: '#ef4444',
        badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
      };
    }
    return {
      dti: 0,
      status: 'good',
      label: 'Yaxshi (Qarz yo\'q)',
      color: '#10b981',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    };
  }

  const dti = Math.round((monthlyLoanPayments / monthlyIncome) * 100);

  if (dti <= 20) {
    return {
      dti,
      status: 'good',
      label: 'Yaxshi',
      color: '#10b981',
      badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    };
  }
  if (dti <= 35) {
    return {
      dti,
      status: 'normal',
      label: "Me'yorda",
      color: '#84cc16',
      badgeBg: 'bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300',
    };
  }
  if (dti <= 50) {
    return {
      dti,
      status: 'danger',
      label: 'Xavfli',
      color: '#f97316',
      badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    };
  }
  return {
    dti,
    status: 'critical',
    label: 'Kritik (Xavfli darajada yuqori)',
    color: '#ef4444',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  };
}

/**
 * Ustuvorlik bali (Priority Score)
 * Hisobga oladi:
 * - Foiz stavkasi (yuqori foiz = eng yuqori ustuvorlik)
 * - Qolgan qarz miqdori (kichik qarzlar tez yopiladi)
 * - Jarima bormi
 * - Oylik to'lovning daromadga nisbati (og'irlik darajasi)
 */
export function calculateLoanPriorityScore(
  loan: Loan,
  monthlyIncome = 8000000
): number {
  if (loan.isPaidOff || loan.remainingPrincipal <= 0) return 0;

  // 1. Foiz stavkasi asosi (0-60 ball): 40% foiz = 48 ball
  let score = loan.annualInterestRate * 1.2;

  // 2. Kichik qarz motivatsiyasi (0-20 ball): 5 mln dan kichik bo'lsa tez yopiladi
  if (loan.remainingPrincipal <= 3000000) {
    score += 20;
  } else if (loan.remainingPrincipal <= 10000000) {
    score += 12;
  } else if (loan.remainingPrincipal <= 25000000) {
    score += 6;
  }

  // 3. Oylik to'lov yuki (0-15 ball)
  if (monthlyIncome > 0) {
    const paymentBurden = loan.monthlyPayment / monthlyIncome;
    if (paymentBurden > 0.2) score += 15;
    else if (paymentBurden > 0.1) score += 8;
  }

  // 4. Jarima borligi (jarima bo'lsa muddatidan oldin yopish biroz noqulay bo'lishi mumkin)
  if (loan.prepaymentPenaltyRate > 0) {
    score -= loan.prepaymentPenaltyRate * 2;
  }

  return Math.max(1, Math.min(100, Math.round(score)));
}

/**
 * Uch strategiyani taqqoslash simulyatsiyasi:
 * 1. Avalanche ("Ko'chki"): eng yuqori foizli kreditdan boshlab yopish
 * 2. Snowball ("Qor to'pi"): eng kichik qarzdan boshlab yopish
 * 3. Hybrid ("Aralash"): foiz va miqdorni birga baholovchi
 */
export function simulateStrategies(
  loans: Loan[],
  extraMonthlyBudget: number
): {
  avalanche: StrategySimulationItem;
  snowball: StrategySimulationItem;
  hybrid: StrategySimulationItem;
  baselineTotalInterest: number;
} {
  const activeLoans = loans.filter(
    (l) => !l.isPaidOff && l.remainingPrincipal > 0
  );

  // Baseline calculation (paying only minimum payments without extra budget)
  let baselineTotalInterest = 0;
  for (const loan of activeLoans) {
    const r = loan.annualInterestRate / 12 / 100;
    // Approximate remaining interest based on remaining term & balance
    const estMonths = Math.max(
      1,
      loan.monthlyPayment > 0
        ? Math.ceil(loan.remainingPrincipal / loan.monthlyPayment)
        : loan.termMonths
    );
    const estInterest = (loan.remainingPrincipal * r * (estMonths + 1)) / 2;
    baselineTotalInterest += estInterest;
  }

  interface SimLoanItem {
    id: string;
    name: string;
    balance: number;
    rate: number;
    minPayment: number;
    monthlyRate: number;
  }

  function runSim(
    sortFn: (a: SimLoanItem, b: SimLoanItem) => number,
    name: 'avalanche' | 'snowball' | 'hybrid',
    label: string,
    desc: string
  ): StrategySimulationItem {
    if (activeLoans.length === 0) {
      return {
        strategyName: name,
        label,
        description: desc,
        totalMonthsToPayoff: 0,
        totalInterestPaid: 0,
        totalInterestSaved: 0,
        debtFreeDate: new Date().toISOString().slice(0, 10),
        payoffOrder: [],
      };
    }

    // Clone loans state
    const simLoans = activeLoans.map((l) => ({
      id: l.id,
      name: l.name,
      balance: l.remainingPrincipal,
      rate: l.annualInterestRate,
      minPayment: l.monthlyPayment,
      monthlyRate: l.annualInterestRate / 12 / 100,
    }));

    simLoans.sort(sortFn);

    let currentExtra = extraMonthlyBudget;
    let months = 0;
    let totalInterest = 0;
    const payoffOrder: Array<{
      loanId: string;
      loanName: string;
      monthsToClose: number;
    }> = [];
    const maxSafetyMonths = 360;

    while (simLoans.some((l) => l.balance > 0) && months < maxSafetyMonths) {
      months++;

      // 1. Accrue monthly interest
      for (const loan of simLoans) {
        if (loan.balance > 0) {
          const interest = loan.balance * loan.monthlyRate;
          loan.balance += interest;
          totalInterest += interest;
        }
      }

      // 2. Pay minimums
      for (const loan of simLoans) {
        if (loan.balance > 0) {
          const pay = Math.min(loan.balance, loan.minPayment);
          loan.balance -= pay;
          if (loan.balance <= 0) {
            currentExtra += loan.minPayment; // Snowball / Avalanche rollover effect
            if (!payoffOrder.some((p) => p.loanId === loan.id)) {
              payoffOrder.push({
                loanId: loan.id,
                loanName: loan.name,
                monthsToClose: months,
              });
            }
          }
        }
      }

      // 3. Apply extra rollover budget to current target loan
      let extraLeft = currentExtra;
      for (const loan of simLoans) {
        if (loan.balance > 0 && extraLeft > 0) {
          const extraPay = Math.min(loan.balance, extraLeft);
          loan.balance -= extraPay;
          extraLeft -= extraPay;
          if (loan.balance <= 0) {
            currentExtra += loan.minPayment;
            if (!payoffOrder.some((p) => p.loanId === loan.id)) {
              payoffOrder.push({
                loanId: loan.id,
                loanName: loan.name,
                monthsToClose: months,
              });
            }
          }
        }
      }
    }

    const freeDate = new Date();
    freeDate.setMonth(freeDate.getMonth() + months);

    return {
      strategyName: name,
      label,
      description: desc,
      totalMonthsToPayoff: months,
      totalInterestPaid: Math.round(totalInterest),
      totalInterestSaved: Math.max(
        0,
        Math.round(baselineTotalInterest - totalInterest)
      ),
      debtFreeDate: freeDate.toISOString().slice(0, 7),
      payoffOrder,
    };
  }

  // 1. Avalanche: Highest interest first
  const avalanche = runSim(
    (a, b) => b.rate - a.rate,
    'avalanche',
    "Ko'chki (Avalanche)",
    "Eng yuqori foizli kreditdan boshlab yopish. Eng ko'p foiz tejaladi va sof moliyaviy jihatdan eng foydali."
  );

  // 2. Snowball: Smallest balance first
  const snowball = runSim(
    (a, b) => a.balance - b.balance,
    'snowball',
    "Qor to'pi (Snowball)",
    "Eng kichik qarzdan boshlab yopish. Kreditlar soni tez kamayadi va kuchli psixologik motivatsiya beradi."
  );

  // 3. Hybrid: Weighted Priority Score
  const hybrid = runSim(
    (a, b) => {
      // Score = rate * 2 + (balance < 5m ? 25 : 0)
      const scoreA =
        a.rate * 2 +
        (a.balance <= 5000000 ? 30 : a.balance <= 15000000 ? 15 : 0);
      const scoreB =
        b.rate * 2 +
        (b.balance <= 5000000 ? 30 : b.balance <= 15000000 ? 15 : 0);
      return scoreB - scoreA;
    },
    'hybrid',
    "Aralash (Tavsiya etilgan)",
    "Ham yuqori foiz stavkasini, ham kichik qarzlar motivatsiyasini o'zida birlashtirgan muvozanatli yo'l."
  );

  return {
    avalanche,
    snowball,
    hybrid,
    baselineTotalInterest: Math.round(baselineTotalInterest),
  };
}

/**
 * Oylik byudjetni taqsimlash tavsiyasi (algoritm):
 * 1. Majburiy xarajatlarni ayir: kommunal, oziq-ovqat minimumi, transport, bolalar/ta'lim, sog'liq.
 * 2. Qolgan mablag'dan barcha kreditlarning minimal oylik to'lovlarini ayir.
 * 3. Qolgan "erkin summa"ni foiz stavkasi va qarz kattaligiga qarab taqsimla:
 *    - Agar qarzda foiz > 25%: erkin summaning 50–70% qismini shu kreditni tezroq yopishga
 *    - Agar foiz 15–25%: 30–50% kreditga, qolganini jamg'arma va investitsiyaga
 *    - Agar foiz < 15%: 10–30% kreditga, ko'proq jamg'arma va investitsiyaga
 *    - DTI 50% dan oshsa: yangi kredit olmaslik ogohlantirishi
 * 4. Favqulodda zaxira (avariya jamg'armasi) 3 oylik xarajatga yetguncha uni to'ldirishni tavsiya qil.
 */
export function recommendBudgetDistribution(
  monthlyIncome: number,
  essentialExpensesTotal: number,
  loans: Loan[],
  currentEmergencyFund = 0
): BudgetRecommendationResult {
  const activeLoans = loans.filter(
    (l) => !l.isPaidOff && l.remainingPrincipal > 0
  );
  const mandatoryLoanPaymentsTotal = activeLoans.reduce(
    (sum, l) => sum + (l.monthlyPayment || 0),
    0
  );

  const dtiInfo = calculateDTI(mandatoryLoanPaymentsTotal, monthlyIncome);

  // Free cash flow ("erkin summa")
  const baseExpenses = essentialExpensesTotal + mandatoryLoanPaymentsTotal;
  const freeCashFlow = Math.max(0, monthlyIncome - baseExpenses);

  // Target emergency fund = 3 months of essential expenses
  const emergencyFundTarget = Math.max(
    10000000,
    essentialExpensesTotal * 3
  );
  const emergencyFundShortage = Math.max(
    0,
    emergencyFundTarget - currentEmergencyFund
  );

  // Find most dangerous/highest interest loan to accelerate
  const sortedLoans = [...activeLoans].sort(
    (a, b) => b.annualInterestRate - a.annualInterestRate
  );
  const highestInterestLoan = sortedLoans[0];
  const maxInterestRate = highestInterestLoan?.annualInterestRate || 0;

  let extraLoanPct = 0;
  let emergencySavingsPct = 0;
  let investmentPct = 0;
  let lifestylePct = 0;

  if (activeLoans.length > 0) {
    if (maxInterestRate >= 25) {
      // Very high interest loan (e.g. 26% - 40% microloans or installments)
      extraLoanPct = 0.65; // 65% of free cash to kill the high interest
      emergencySavingsPct = 0.2; // 20% to emergency fund
      investmentPct = 0.05; // 5% token investment
      lifestylePct = 0.1; // 10% breathing room
    } else if (maxInterestRate >= 15) {
      // Moderate interest rate (15% - 24% standard bank auto/mortgage)
      extraLoanPct = 0.4;
      emergencySavingsPct = 0.25;
      investmentPct = 0.15;
      lifestylePct = 0.2;
    } else {
      // Low interest loans (< 15% subsidized or family loan)
      extraLoanPct = 0.2;
      emergencySavingsPct = 0.3;
      investmentPct = 0.3;
      lifestylePct = 0.2;
    }
  } else {
    // Zero debt!
    extraLoanPct = 0;
    if (emergencyFundShortage > 0) {
      emergencySavingsPct = 0.5;
      investmentPct = 0.3;
      lifestylePct = 0.2;
    } else {
      emergencySavingsPct = 0.2;
      investmentPct = 0.55;
      lifestylePct = 0.25;
    }
  }

  // Adjust if emergency fund is completely empty
  if (currentEmergencyFund < essentialExpensesTotal && freeCashFlow > 0) {
    // If not even 1 month of expenses saved, boost emergency allocation
    emergencySavingsPct = Math.min(0.4, emergencySavingsPct + 0.15);
    extraLoanPct = Math.max(0.3, extraLoanPct - 0.1);
  }

  const extraLoanAmount = Math.round(freeCashFlow * extraLoanPct);
  const emergencySavingsAmount = Math.round(
    freeCashFlow * emergencySavingsPct
  );
  const investmentAmount = Math.round(freeCashFlow * investmentPct);
  const lifestyleAmount = Math.max(
    0,
    freeCashFlow -
      extraLoanAmount -
      emergencySavingsAmount -
      investmentAmount
  );

  let warningAlert: string | undefined = undefined;
  if (dtiInfo.dti >= 50) {
    warningAlert =
      "DIQQAT: Qarz yuki (DTI) 50% dan yuqori! Yangi kredit yoki nasiya olish mutlaqo tavsiya etilmaydi. Majburiy bo'lmagan xarajatlarni qisqartiring va favqulodda tejash rejimini yoqing.";
  } else if (monthlyIncome < baseExpenses) {
    warningAlert = `Ogohlantirish: Oylik daromad (${formatCurrency(
      monthlyIncome
    )}) majburiy xarajatlar va kreditlardan (${formatCurrency(
      baseExpenses
    )}) kamroq. Byudjet defitsiti: ${formatCurrency(
      baseExpenses - monthlyIncome
    )}.`;
  }

  const incomeTotal = monthlyIncome || 1;
  const essentialPct = Math.round(
    (essentialExpensesTotal / incomeTotal) * 100
  );
  const mandatoryLoanPct = Math.round(
    (mandatoryLoanPaymentsTotal / incomeTotal) * 100
  );

  let summaryText = '';
  if (highestInterestLoan && extraLoanAmount > 0) {
    summaryText = `Oylik daromad: ${formatCurrency(
      monthlyIncome
    )}. Kreditlarga jami: ${formatCurrency(
      mandatoryLoanPaymentsTotal + extraLoanAmount
    )} (${Math.round(
      ((mandatoryLoanPaymentsTotal + extraLoanAmount) / incomeTotal) * 100
    )}%) — shundan ${formatCurrency(
      mandatoryLoanPaymentsTotal
    )} majburiy, ${formatCurrency(
      extraLoanAmount
    )} qo'shimcha to'lov sifatida "${
      highestInterestLoan.name
    }"ga (${highestInterestLoan.annualInterestRate}% stavka). Jamg'armaga: ${formatCurrency(
      emergencySavingsAmount
    )}. Investitsiyaga: ${formatCurrency(
      investmentAmount
    )}. Erkin qoldiq: ${formatCurrency(lifestyleAmount)}.`;
  } else {
    summaryText = `Oylik daromad: ${formatCurrency(
      monthlyIncome
    )}. Majburiy xarajatlar: ${formatCurrency(
      essentialExpensesTotal
    )}. Kredit to'lovlari: ${formatCurrency(
      mandatoryLoanPaymentsTotal
    )}. Jamg'arma va zaxiraga: ${formatCurrency(
      emergencySavingsAmount
    )}. Investitsiyaga: ${formatCurrency(investmentAmount)}.`;
  }

  return {
    monthlyIncome,
    essentialExpensesTotal,
    mandatoryLoanPaymentsTotal,
    freeCashFlow,
    dtiRatio: dtiInfo.dti,
    dtiStatus: dtiInfo.status,
    dtiLabel: dtiInfo.label,
    dtiColor: dtiInfo.color,
    emergencyFundCurrent: currentEmergencyFund,
    emergencyFundTarget,
    emergencyFundShortage,
    allocation: {
      essentialPct,
      essentialAmount: essentialExpensesTotal,
      mandatoryLoanPct,
      mandatoryLoanAmount: mandatoryLoanPaymentsTotal,
      extraLoanPct: Math.round((extraLoanAmount / incomeTotal) * 100),
      extraLoanAmount,
      emergencySavingsPct: Math.round(
        (emergencySavingsAmount / incomeTotal) * 100
      ),
      emergencySavingsAmount,
      investmentPct: Math.round((investmentAmount / incomeTotal) * 100),
      investmentAmount,
      lifestylePct: Math.round((lifestyleAmount / incomeTotal) * 100),
      lifestyleAmount,
    },
    acceleratedLoan: highestInterestLoan,
    warningAlert,
    summaryText,
  };
}

/**
 * "Nima bo'ladi agar?" kalkulyatori:
 * Agar qo'shimcha X so'm to'lasam, kredit necha oy oldin tugaydi va qancha foiz tejaladi?
 */
export function simulateWhatIfExtraPayment(
  loan: Loan,
  extraMonthly: number
): {
  originalMonths: number;
  newMonths: number;
  monthsSaved: number;
  originalInterest: number;
  newInterest: number;
  interestSaved: number;
} {
  const principal = loan.remainingPrincipal;
  const baseMonthly = loan.monthlyPayment;
  const r = loan.annualInterestRate / 12 / 100;

  if (principal <= 0 || baseMonthly <= 0) {
    return {
      originalMonths: 0,
      newMonths: 0,
      monthsSaved: 0,
      originalInterest: 0,
      newInterest: 0,
      interestSaved: 0,
    };
  }

  // Baseline months
  let origBal = principal;
  let origMonths = 0;
  let origInterest = 0;
  while (origBal > 0 && origMonths < 360) {
    origMonths++;
    const interest = origBal * r;
    origInterest += interest;
    origBal = origBal + interest - baseMonthly;
    if (origBal < 0) origBal = 0;
  }

  // With extra payment
  let newBal = principal;
  let newMonths = 0;
  let newInterest = 0;
  const totalPay = baseMonthly + extraMonthly;

  while (newBal > 0 && newMonths < 360) {
    newMonths++;
    const interest = newBal * r;
    newInterest += interest;
    newBal = newBal + interest - totalPay;
    if (newBal < 0) newBal = 0;
  }

  const monthsSaved = Math.max(0, origMonths - newMonths);
  const interestSaved = Math.max(0, Math.round(origInterest - newInterest));

  return {
    originalMonths: origMonths,
    newMonths,
    monthsSaved,
    originalInterest: Math.round(origInterest),
    newInterest: Math.round(newInterest),
    interestSaved,
  };
}

/**
 * Qayta moliyalash (refinanslash) kalkulyatori
 * Yuqori foizli kreditni pastroq foizli yangi kredit bilan almashtirish foydalimi?
 */
export function calculateRefinanceBenefit(
  loan: Loan,
  newAnnualRate: number,
  newTermMonths: number
): {
  currentMonthly: number;
  newMonthly: number;
  monthlyDifference: number;
  currentRemainingTotalInterest: number;
  newTotalInterest: number;
  netLifetimeSavings: number;
  isBeneficial: boolean;
} {
  const principal = loan.remainingPrincipal;
  const currentMonthly = loan.monthlyPayment;
  const currentRateMonthly = loan.annualInterestRate / 12 / 100;

  // Approximate remaining interest on current loan
  const currentEstMonths = Math.max(
    1,
    Math.ceil(principal / (currentMonthly || 1))
  );
  const currentRemainingTotalInterest =
    (principal * currentRateMonthly * (currentEstMonths + 1)) / 2;

  // New loan annuity payment
  const newMonthly = calculateAnnuityPayment(
    principal,
    newAnnualRate,
    newTermMonths
  );
  const newTotalPayments = newMonthly * newTermMonths;
  const newTotalInterest = Math.max(0, newTotalPayments - principal);

  const netLifetimeSavings = Math.round(
    currentRemainingTotalInterest - newTotalInterest
  );
  const monthlyDifference = Math.round(currentMonthly - newMonthly);

  return {
    currentMonthly: Math.round(currentMonthly),
    newMonthly: Math.round(newMonthly),
    monthlyDifference,
    currentRemainingTotalInterest: Math.round(currentRemainingTotalInterest),
    newTotalInterest: Math.round(newTotalInterest),
    netLifetimeSavings,
    isBeneficial: netLifetimeSavings > 0,
  };
}

/**
 * Murakkab foiz (Compound Interest) kalkulyatori
 * "Oyiga X so'm jamg'arsam, Y yildan keyin qancha bo'ladi?"
 */
export function calculateCompoundInterest(
  initialDeposit: number,
  monthlyContribution: number,
  annualReturnRate: number, // %
  years: number
): Array<{
  year: number;
  totalDeposited: number;
  futureValue: number;
  interestEarned: number;
}> {
  const results = [];
  const monthlyRate = annualReturnRate / 12 / 100;
  let currentBalance = initialDeposit;
  let totalDeposited = initialDeposit;

  for (let y = 1; y <= years; y++) {
    for (let m = 1; m <= 12; m++) {
      currentBalance =
        currentBalance * (1 + monthlyRate) + monthlyContribution;
      totalDeposited += monthlyContribution;
    }

    results.push({
      year: y,
      totalDeposited: Math.round(totalDeposited),
      futureValue: Math.round(currentBalance),
      interestEarned: Math.round(currentBalance - totalDeposited),
    });
  }

  return results;
}

/**
 * Moliyaviy salomatlik bali (0–100):
 * - Qarz yuki (DTI) yuki: 40 ball gacha
 * - Jamg'arma va zaxira: 30 ball gacha
 * - Xarajatlar balansi (daromaddan ortishi): 30 ball gacha
 */
export function calculateFinancialHealthScore(
  monthlyIncome: number,
  monthlyExpenses: number,
  monthlyLoanPayments: number,
  emergencyFundTotal: number
): FinancialHealthBreakdown {
  if (monthlyIncome <= 0) {
    return {
      score: 20,
      dtiScore: 5,
      savingsScore: 5,
      balanceScore: 10,
      statusText: "Ma'lumotlar yetarli emas",
      statusColor: '#94a3b8',
      insights: [
        "Iltimos, aniq baholash uchun oilaviy oylik daromadni kiriting.",
      ],
    };
  }

  // 1. DTI Score (0 to 40)
  const dti = (monthlyLoanPayments / monthlyIncome) * 100;
  let dtiScore = 40;
  if (dti > 50) dtiScore = 5;
  else if (dti > 35) dtiScore = 18;
  else if (dti > 20) dtiScore = 30;
  else dtiScore = 40;

  // 2. Savings Score (0 to 30) - target is 3-6 months of expenses
  const monthlyOutflows = Math.max(1000000, monthlyExpenses + monthlyLoanPayments);
  const monthsOfRunway = emergencyFundTotal / monthlyOutflows;
  let savingsScore = 0;
  if (monthsOfRunway >= 3) savingsScore = 30;
  else if (monthsOfRunway >= 1.5) savingsScore = 20;
  else if (monthsOfRunway >= 0.5) savingsScore = 10;
  else savingsScore = 3;

  // 3. Balance / Free Cash Flow Score (0 to 30)
  const savingsRate =
    ((monthlyIncome - (monthlyExpenses + monthlyLoanPayments)) /
      monthlyIncome) *
    100;
  let balanceScore = 0;
  if (savingsRate >= 25) balanceScore = 30;
  else if (savingsRate >= 15) balanceScore = 22;
  else if (savingsRate >= 5) balanceScore = 14;
  else if (savingsRate >= 0) balanceScore = 8;
  else balanceScore = 0; // deficit!

  const totalScore = Math.max(0, Math.min(100, Math.round(dtiScore + savingsScore + balanceScore)));

  const insights: string[] = [];
  if (dti <= 20) {
    insights.push("Kredit yuki optimal darajada (20% dan past).");
  } else if (dti > 35) {
    insights.push("Qarz yuki xavfli zonada (DTI > 35%). Kreditlarni qisqartirish zarur.");
  }

  if (monthsOfRunway >= 3) {
    insights.push("Favqulodda zaxira jamg'armangiz yetarli (3 oydan ko'p).");
  } else {
    insights.push("Avariya zaxirasini kamida 3 oylik xarajat hajmiga yetkazing.");
  }

  if (savingsRate > 20) {
    insights.push("Daromadning 20%+ qismini saqlab qolayapsiz — ajoyib natija.");
  } else if (savingsRate < 0) {
    insights.push("Xarajatlar daromaddan oshib ketmoqda — byudjet defitsitda!");
  }

  let statusText = "O'rtacha";
  let statusColor = '#eab308';
  if (totalScore >= 80) {
    statusText = "A'lo";
    statusColor = '#10b981';
  } else if (totalScore >= 60) {
    statusText = 'Yaxshi';
    statusColor = '#84cc16';
  } else if (totalScore >= 40) {
    statusText = "E'tibor talab";
    statusColor = '#f97316';
  } else {
    statusText = 'Xavfli';
    statusColor = '#ef4444';
  }

  return {
    score: totalScore,
    dtiScore,
    savingsScore,
    balanceScore,
    statusText,
    statusColor,
    insights,
  };
}

export const calculateFinancialHealth = calculateFinancialHealthScore;
