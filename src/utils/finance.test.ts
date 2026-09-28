import {
  calculateAnnuityPayment,
  calculateDifferentialInitialPayment,
  generateAmortizationSchedule,
  calculateDTI,
  calculateLoanPriorityScore,
  simulateStrategies,
  recommendBudgetDistribution,
  simulateWhatIfExtraPayment,
  calculateRefinanceBenefit,
  calculateCompoundInterest,
  calculateFinancialHealthScore,
} from './finance';
import { Loan } from '../types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`FAIL: ${msg}`);
  }
  console.log(`✓ PASS: ${msg}`);
}

console.log('--- RUNNING FINANCE UNIT TESTS ---');

// 1. Annuity formula test
// 10 000 000 UZS loan, 24% annual interest, 12 months
// r = 24 / 12 / 100 = 0.02
// P = 10,000,000 * 0.02 / (1 - (1.02)^-12) = 200,000 / (1 - 0.78849) = ~945,596
const pAnnuity = calculateAnnuityPayment(10000000, 24, 12);
assert(pAnnuity > 940000 && pAnnuity < 950000, `Annuity formula test. Result: ${pAnnuity}`);

// 2. Differential initial payment test
// Principal part = 10m / 12 = 833,333. Interest part = 10m * 0.02 = 200,000. Total = 1,033,333
const pDiff = calculateDifferentialInitialPayment(10000000, 24, 12);
assert(pDiff > 1030000 && pDiff < 1040000, `Differential payment test. Result: ${pDiff}`);

// 3. Amortization schedule test
const schedule = generateAmortizationSchedule(10000000, 24, 12, 'annuity');
assert(schedule.length === 12, `Schedule length should be 12 months`);
assert(schedule[11].remainingPrincipal === 0, `Last month remaining balance should be 0`);

// 4. DTI test
// 2 400 000 loan payments on 8 000 000 income = 30% (Me'yorda)
const dti30 = calculateDTI(2400000, 8000000);
assert(dti30.dti === 30, `DTI ratio is 30%`);
assert(dti30.status === 'normal', `DTI status should be normal`);

// 4 800 000 on 8 000 000 = 60% (Kritik)
const dti60 = calculateDTI(4800000, 8000000);
assert(dti60.dti === 60, `DTI ratio is 60%`);
assert(dti60.status === 'critical', `DTI status should be critical`);

// 5. Loan priority test
const mockMicroloan: Loan = {
  id: 'loan-1',
  name: 'Mikroqarz',
  bankName: 'Bank',
  type: 'mikroqarz',
  originalPrincipal: 5000000,
  remainingPrincipal: 3000000,
  annualInterestRate: 36,
  paymentType: 'annuity',
  startDate: '2026-01-01',
  termMonths: 12,
  monthlyPayment: 500000,
  paymentDueDay: 15,
  prepaymentPenaltyRate: 0,
  isPaidOff: false,
};
const priority = calculateLoanPriorityScore(mockMicroloan, 8000000);
assert(priority > 60, `High interest microloan should have high priority score. Got: ${priority}`);

// 6. Strategy simulation test
const mockIpoteka: Loan = {
  id: 'loan-2',
  name: 'Ipoteka',
  bankName: 'Ipoteka Bank',
  type: 'ipoteka',
  originalPrincipal: 150000000,
  remainingPrincipal: 140000000,
  annualInterestRate: 18,
  paymentType: 'annuity',
  startDate: '2025-01-01',
  termMonths: 120,
  monthlyPayment: 2500000,
  paymentDueDay: 10,
  prepaymentPenaltyRate: 0,
  isPaidOff: false,
};
const strategies = simulateStrategies([mockMicroloan, mockIpoteka], 800000);
assert(strategies.avalanche.totalInterestPaid > 0, `Avalanche simulation generated interest`);
assert(strategies.snowball.totalInterestPaid > 0, `Snowball simulation generated interest`);
assert(strategies.avalanche.totalInterestSaved >= 0, `Avalanche generates interest savings`);

// 7. Budget distribution recommendation test
const budget = recommendBudgetDistribution(8000000, 3200000, [mockMicroloan], 5000000);
assert(budget.freeCashFlow > 0, `Free cash flow should be positive`);
assert(budget.allocation.extraLoanAmount > 0, `Should recommend extra loan payment to high interest loan`);

// 8. What-if simulation test
const whatIf = simulateWhatIfExtraPayment(mockMicroloan, 500000);
assert(whatIf.monthsSaved > 0, `Extra payment should save months`);
assert(whatIf.interestSaved > 0, `Extra payment should save interest`);

// 9. Financial health score test
const health = calculateFinancialHealthScore(8000000, 3500000, 1500000, 15000000);
assert(health.score >= 60, `Healthy finances should have score >= 60. Got: ${health.score}`);

console.log('ALL FINANCE UNIT TESTS PASSED!');
