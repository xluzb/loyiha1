import React, { useState, useEffect, useMemo } from 'react';
import {
  AppData,
  CurrencyType,
  LanguageType,
  ThemeType,
  Loan,
  Debt,
  Income,
  Expense,
  ExpenseCategory,
  UtilityBill,
  SavingsGoal,
  Investment,
  FamilyMember,
} from './types';
import {
  loadAppData,
  saveAppData,
} from './services/storageService';
import { calculateDTI } from './utils/finance';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { PinLockScreen } from './components/common/PinLockScreen';
import { OnboardingModal } from './components/common/OnboardingModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { StrategyModuleView } from './components/strategy/StrategyModuleView';
import { LoansView } from './components/loans/LoansView';
import { IncomesView } from './components/incomes/IncomesView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { UtilitiesView } from './components/utilities/UtilitiesView';
import { InvestmentsView } from './components/investments/InvestmentsView';
import { AIAdvisorView } from './components/ai/AIAdvisorView';
import { SettingsView } from './components/settings/SettingsView';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const pin = loadAppData().userSettings.pinCode;
    return Boolean(pin && pin.length === 4);
  });
  const [isQuickAddExpenseOpen, setIsQuickAddExpenseOpen] = useState(false);

  // Sync data to localStorage on changes
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // Handle Theme (dark/light)
  useEffect(() => {
    const root = document.documentElement;
    if (data.userSettings.theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [data.userSettings.theme]);

  // Recalculate DTI score for sidebar and badges
  const dtiScore = useMemo(() => {
    const totalIncome = data.incomes.reduce(
      (sum: number, inc: Income) => (inc.isRecurring ? sum + inc.amount : sum),
      0
    );
    const totalLoanPayments = data.loans
      .filter((l: Loan) => !l.isPaidOff)
      .reduce((sum: number, l: Loan) => sum + l.monthlyPayment, 0);
    return calculateDTI(totalLoanPayments, totalIncome).dti;
  }, [data.loans, data.incomes]);

  // Currency & Theme toggles
  const handleToggleCurrency = () => {
    setData((prev: AppData) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        currency: prev.userSettings.currency === 'UZS' ? 'USD' : 'UZS',
      },
    }));
  };

  const handleToggleTheme = () => {
    setData((prev: AppData) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        theme: prev.userSettings.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  };

  const handleChangeLanguage = (lang: LanguageType) => {
    setData((prev: AppData) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        language: lang,
      },
    }));
  };

  const handleSetPin = (pin?: string) => {
    setData((prev: AppData) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        pinCode: pin,
      },
    }));
    if (!pin) {
      setIsLocked(false);
    }
  };

  const handleCompleteOnboarding = () => {
    setData((prev: AppData) => ({
      ...prev,
      userSettings: {
        ...prev.userSettings,
        hasCompletedOnboarding: true,
      },
    }));
  };

  // Loans & Debts handlers
  const handleAddLoan = (loan: Loan) => {
    setData((prev: AppData) => ({ ...prev, loans: [loan, ...prev.loans] }));
  };

  const handleUpdateLoan = (updatedLoan: Loan) => {
    setData((prev: AppData) => ({
      ...prev,
      loans: prev.loans.map((l: Loan) => (l.id === updatedLoan.id ? updatedLoan : l)),
    }));
  };

  const handleDeleteLoan = (id: string) => {
    setData((prev: AppData) => ({
      ...prev,
      loans: prev.loans.filter((l: Loan) => l.id !== id),
    }));
  };

  const handlePayLoanMonth = (loanId: string) => {
    setData((prev: AppData) => ({
      ...prev,
      loans: prev.loans.map((l: Loan) => {
        if (l.id === loanId) {
          const estimatedPrincipalPaid = Math.round(l.monthlyPayment * 0.7);
          const nextRemaining = Math.max(0, l.remainingPrincipal - estimatedPrincipalPaid);
          return {
            ...l,
            remainingPrincipal: nextRemaining,
            isPaidOff: nextRemaining <= 0,
          };
        }
        return l;
      }),
    }));
  };

  const handleAddDebt = (debt: Debt) => {
    setData((prev: AppData) => ({ ...prev, debts: [debt, ...prev.debts] }));
  };

  const handleResolveDebt = (debtId: string) => {
    setData((prev: AppData) => ({
      ...prev,
      debts: prev.debts.map((d: Debt) =>
        d.id === debtId ? { ...d, isResolved: true, remainingAmount: 0 } : d
      ),
    }));
  };

  const handleDeleteDebt = (debtId: string) => {
    setData((prev: AppData) => ({
      ...prev,
      debts: prev.debts.filter((d: Debt) => d.id !== debtId),
    }));
  };

  // Income handlers
  const handleAddIncome = (income: Income) => {
    setData((prev: AppData) => ({ ...prev, incomes: [income, ...prev.incomes] }));
  };

  const handleDeleteIncome = (id: string) => {
    setData((prev: AppData) => ({
      ...prev,
      incomes: prev.incomes.filter((i: Income) => i.id !== id),
    }));
  };

  // Expense handlers
  const handleAddExpense = (expense: Expense) => {
    setData((prev: AppData) => ({ ...prev, expenses: [expense, ...prev.expenses] }));
  };

  const handleDeleteExpense = (id: string) => {
    setData((prev: AppData) => ({
      ...prev,
      expenses: prev.expenses.filter((e: Expense) => e.id !== id),
    }));
  };

  const handleAddCategory = (category: ExpenseCategory) => {
    setData((prev: AppData) => ({
      ...prev,
      expenseCategories: [...prev.expenseCategories, category],
    }));
  };

  // Utilities handlers
  const handleAddUtility = (bill: UtilityBill) => {
    setData((prev: AppData) => ({ ...prev, utilities: [bill, ...prev.utilities] }));
  };

  const handleToggleUtilityPaid = (id: string) => {
    setData((prev: AppData) => ({
      ...prev,
      utilities: prev.utilities.map((u: UtilityBill) =>
        u.id === id ? { ...u, isPaid: !u.isPaid } : u
      ),
    }));
  };

  const handleDeleteUtility = (id: string) => {
    setData((prev: AppData) => ({
      ...prev,
      utilities: prev.utilities.filter((u: UtilityBill) => u.id !== id),
    }));
  };

  // Goals & Investments handlers
  const handleAddGoal = (goal: SavingsGoal) => {
    setData((prev: AppData) => ({ ...prev, savingsGoals: [...prev.savingsGoals, goal] }));
  };

  const handleUpdateGoalProgress = (id: string, newAmount: number) => {
    setData((prev: AppData) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g: SavingsGoal) =>
        g.id === id ? { ...g, currentAmount: newAmount, isAchieved: newAmount >= g.targetAmount } : g
      ),
    }));
  };

  const handleAddInvestment = (inv: Investment) => {
    setData((prev: AppData) => ({ ...prev, investments: [...prev.investments, inv] }));
  };

  // Family Members
  const handleAddMember = (member: FamilyMember) => {
    setData((prev: AppData) => ({
      ...prev,
      familyMembers: [...prev.familyMembers, member],
    }));
  };

  const handleDeleteMember = (id: string) => {
    setData((prev: AppData) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((m: FamilyMember) => m.id !== id),
    }));
  };

  const handleReloadAllData = () => {
    setData(loadAppData());
  };

  // If PIN protected and currently locked, show Pin Screen
  if (data.userSettings.pinCode && data.userSettings.pinCode.length === 4 && isLocked) {
    return (
      <PinLockScreen
        correctPin={data.userSettings.pinCode}
        onUnlock={() => setIsLocked(false)}
        onResetPin={() => {
          handleSetPin(undefined);
          setIsLocked(false);
        }}
      />
    );
  }

  // Monthly income sum
  const monthlyIncome = data.incomes.reduce(
    (sum: number, inc: Income) => (inc.isRecurring ? sum + inc.amount : sum),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Offline Status Bar */}
      <OfflineIndicator />

      {/* Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currency={data.userSettings.currency}
        onToggleCurrency={handleToggleCurrency}
        theme={data.userSettings.theme}
        onToggleTheme={handleToggleTheme}
        isPinProtected={Boolean(data.userSettings.pinCode)}
        onLockApp={() => setIsLocked(true)}
        language={data.userSettings.language}
        onChangeLanguage={handleChangeLanguage}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          dtiScore={dtiScore}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              incomes={data.incomes}
              loans={data.loans}
              expenses={data.expenses}
              categories={data.expenseCategories}
              utilities={data.utilities}
              savingsGoals={data.savingsGoals}
              currency={data.userSettings.currency}
              onNavigateTab={setCurrentTab}
              onQuickAddExpense={() => setIsQuickAddExpenseOpen(true)}
            />
          )}

          {currentTab === 'strategy' && (
            <StrategyModuleView
              loans={data.loans}
              monthlyIncome={monthlyIncome}
              expenses={data.expenses}
              categories={data.expenseCategories}
              savingsGoals={data.savingsGoals}
              currency={data.userSettings.currency}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'loans' && (
            <LoansView
              loans={data.loans}
              debts={data.debts}
              currency={data.userSettings.currency}
              onAddLoan={handleAddLoan}
              onUpdateLoan={handleUpdateLoan}
              onDeleteLoan={handleDeleteLoan}
              onPayLoanMonth={handlePayLoanMonth}
              onAddDebt={handleAddDebt}
              onResolveDebt={handleResolveDebt}
              onDeleteDebt={handleDeleteDebt}
            />
          )}

          {currentTab === 'incomes' && (
            <IncomesView
              incomes={data.incomes}
              members={data.familyMembers}
              currency={data.userSettings.currency}
              onAddIncome={handleAddIncome}
              onDeleteIncome={handleDeleteIncome}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesView
              expenses={data.expenses}
              categories={data.expenseCategories}
              members={data.familyMembers}
              currency={data.userSettings.currency}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onAddCategory={handleAddCategory}
              isQuickAddOpen={isQuickAddExpenseOpen}
              onCloseQuickAdd={() => setIsQuickAddExpenseOpen(false)}
            />
          )}

          {currentTab === 'utilities' && (
            <UtilitiesView
              utilities={data.utilities}
              currency={data.userSettings.currency}
              onAddUtility={handleAddUtility}
              onTogglePaid={handleToggleUtilityPaid}
              onDeleteUtility={handleDeleteUtility}
            />
          )}

          {currentTab === 'investments' && (
            <InvestmentsView
              savingsGoals={data.savingsGoals}
              investments={data.investments}
              loans={data.loans}
              currency={data.userSettings.currency}
              onAddGoal={handleAddGoal}
              onUpdateGoalProgress={handleUpdateGoalProgress}
              onAddInvestment={handleAddInvestment}
            />
          )}

          {currentTab === 'ai' && (
            <AIAdvisorView
              loans={data.loans}
              incomes={data.incomes}
              expenses={data.expenses}
              categories={data.expenseCategories}
              goals={data.savingsGoals}
              currency={data.userSettings.currency}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              members={data.familyMembers}
              currency={data.userSettings.currency}
              language={data.userSettings.language}
              theme={data.userSettings.theme}
              pinCode={data.userSettings.pinCode || undefined}
              loans={data.loans}
              incomes={data.incomes}
              expenses={data.expenses}
              onAddMember={handleAddMember}
              onDeleteMember={handleDeleteMember}
              onChangeCurrency={handleToggleCurrency}
              onChangeLanguage={handleChangeLanguage}
              onToggleTheme={handleToggleTheme}
              onSetPin={handleSetPin}
              onReloadAllData={handleReloadAllData}
            />
          )}

          {/* Mandatory Disclaimer on every page */}
          <DisclaimerBanner />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onQuickAddExpense={() => {
          setCurrentTab('expenses');
          setIsQuickAddExpenseOpen(true);
        }}
        theme={data.userSettings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* 3-step First-time Onboarding Modal (only if explicitly set to false) */}
      {data.userSettings.hasCompletedOnboarding === false && (
        <OnboardingModal
          onComplete={handleCompleteOnboarding}
          onNavigateTab={(tab) => {
            handleCompleteOnboarding();
            setCurrentTab(tab);
          }}
        />
      )}
    </div>
  );
}
