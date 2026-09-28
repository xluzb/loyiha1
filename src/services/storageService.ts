import {
  FamilyMember,
  Income,
  Loan,
  Debt,
  ExpenseCategory,
  Expense,
  UtilityBill,
  SavingsGoal,
  Investment,
  UserSettings,
} from '../types';
import {
  initialMembers,
  initialIncomes,
  initialLoans,
  initialDebts,
  initialCategories,
  initialExpenses,
  initialUtilities,
  initialSavingsGoals,
  initialInvestments,
  initialSettings,
} from './demoData';

export interface AppDatabase {
  version: number;
  members: FamilyMember[];
  incomes: Income[];
  loans: Loan[];
  debts: Debt[];
  categories: ExpenseCategory[];
  expenses: Expense[];
  utilities: UtilityBill[];
  savingsGoals: SavingsGoal[];
  investments: Investment[];
  settings: UserSettings;
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

const STORAGE_KEY = 'oila_moliya_data_v1';

export class StorageService {
  private static getInitialDb(): AppDatabase {
    return {
      version: 1,
      members: initialMembers,
      incomes: initialIncomes,
      loans: initialLoans,
      debts: initialDebts,
      categories: initialCategories,
      expenses: initialExpenses,
      utilities: initialUtilities,
      savingsGoals: initialSavingsGoals,
      investments: initialInvestments,
      settings: initialSettings,
    };
  }

  public static load(): AppDatabase {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = this.getInitialDb();
        this.save(initial);
        return initial;
      }
      const parsed = JSON.parse(raw);
      return {
        version: parsed.version || 1,
        members: parsed.members || parsed.familyMembers || initialMembers,
        incomes: parsed.incomes || initialIncomes,
        loans: parsed.loans || initialLoans,
        debts: parsed.debts || initialDebts,
        categories: parsed.categories || parsed.expenseCategories || initialCategories,
        expenses: parsed.expenses || initialExpenses,
        utilities: parsed.utilities || initialUtilities,
        savingsGoals: parsed.savingsGoals || initialSavingsGoals,
        investments: parsed.investments || initialInvestments,
        settings: { ...initialSettings, ...(parsed.settings || parsed.userSettings || {}) },
      };
    } catch (e) {
      console.error('Failed to load from storage, using demo data', e);
      return this.getInitialDb();
    }
  }

  public static save(db: AppDatabase): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public static resetToDemo(): AppDatabase {
    const demo = this.getInitialDb();
    this.save(demo);
    return demo;
  }

  public static clearAllData(): AppDatabase {
    const emptyDb: AppDatabase = {
      version: 1,
      members: [{ id: 'mem-1', name: 'Oila boshlig\'i', role: 'ota', avatarColor: '#059669' }],
      incomes: [],
      loans: [],
      debts: [],
      categories: initialCategories,
      expenses: [],
      utilities: [],
      savingsGoals: [],
      investments: [],
      settings: { ...initialSettings, hasCompletedOnboarding: false },
    };
    this.save(emptyDb);
    return emptyDb;
  }

  // Export database as JSON file download
  public static exportJSON(db: AppDatabase): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `oila_moliya_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Import JSON file
  public static async importJSON(file: File): Promise<AppDatabase> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (!parsed || !Array.isArray(parsed.incomes) || !Array.isArray(parsed.loans)) {
            throw new Error('Noto\'g\'ri fayl formati');
          }
          const validDb: AppDatabase = {
            version: parsed.version || 1,
            members: parsed.members || parsed.familyMembers || initialMembers,
            incomes: parsed.incomes || [],
            loans: parsed.loans || [],
            debts: parsed.debts || [],
            categories: parsed.categories || parsed.expenseCategories || initialCategories,
            expenses: parsed.expenses || [],
            utilities: parsed.utilities || [],
            savingsGoals: parsed.savingsGoals || [],
            investments: parsed.investments || [],
            settings: { ...initialSettings, ...(parsed.settings || parsed.userSettings || {}) },
          };
          this.save(validDb);
          resolve(validDb);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  }

  // Export expenses and loans as CSV
  public static exportCSV(db: AppDatabase): void {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';

    // 1. Incomes Section
    csvContent += "=== DAROMADLAR ===\n";
    csvContent += "Nomi,Summa (so'm),Oy kuni,Davriy,Toifa\n";
    for (const inc of db.incomes) {
      csvContent += `"${inc.title.replace(/"/g, '""')}",${inc.amount},${inc.dayOfMonth},${inc.isRecurring ? 'Ha' : 'Yo\'q'},${inc.category}\n`;
    }
    csvContent += "\n";

    // 2. Loans Section
    csvContent += "=== KREDITLAR VA QARZLAR ===\n";
    csvContent += "Kredit nomi,Bank/Tashkilot,Turi,Asl summa,Qolgan qarz,Yillik foiz %,Oylik to'lov,To'lov turi\n";
    for (const l of db.loans) {
      csvContent += `"${l.name.replace(/"/g, '""')}","${l.bankName.replace(/"/g, '""')}",${l.type},${l.originalPrincipal},${l.remainingPrincipal},${l.annualInterestRate},${l.monthlyPayment},${l.paymentType}\n`;
    }
    csvContent += "\n";

    // 3. Expenses Section
    csvContent += "=== XARAJATLAR ===\n";
    csvContent += "Sana,Nomi,Summa (so'm),Toifa,Izoh\n";
    for (const exp of db.expenses) {
      const cat = db.categories.find(c => c.id === exp.categoryId)?.name || 'Boshqa';
      csvContent += `${exp.date},"${exp.title.replace(/"/g, '""')}",${exp.amount},"${cat}","${(exp.notes || '').replace(/"/g, '""')}"\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `oila_moliya_hisoboti_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

// Standalone Helper functions
export function loadAppData(): AppData {
  const db = StorageService.load();
  return {
    version: db.version,
    familyMembers: db.members,
    incomes: db.incomes,
    loans: db.loans,
    debts: db.debts,
    expenseCategories: db.categories,
    expenses: db.expenses,
    utilities: db.utilities,
    savingsGoals: db.savingsGoals,
    investments: db.investments,
    userSettings: db.settings,
  };
}

export function saveAppData(appData: AppData): void {
  const db: AppDatabase = {
    version: appData.version,
    members: appData.familyMembers,
    incomes: appData.incomes,
    loans: appData.loans,
    debts: appData.debts,
    categories: appData.expenseCategories,
    expenses: appData.expenses,
    utilities: appData.utilities,
    savingsGoals: appData.savingsGoals,
    investments: appData.investments,
    settings: appData.userSettings,
  };
  StorageService.save(db);
}

export function exportDataToJSON(): void {
  const db = StorageService.load();
  StorageService.exportJSON(db);
}

export function exportLoansToCSV(loans: Loan[]): void {
  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
  csvContent += "Kredit nomi,Bank/Tashkilot,Turi,Asl summa,Qolgan qarz,Yillik foiz %,Oylik to'lov,To'lov turi,To'lov kuni\n";
  for (const l of loans) {
    csvContent += `"${l.name.replace(/"/g, '""')}","${l.bankName.replace(/"/g, '""')}",${l.type},${l.originalPrincipal},${l.remainingPrincipal},${l.annualInterestRate},${l.monthlyPayment},${l.paymentType},${l.paymentDueDay}\n`;
  }
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', `kreditlar_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function exportExpensesToCSV(expenses: Expense[]): void {
  let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
  csvContent += "Sana,Nomi,Summa (so'm),Toifa ID,Izoh\n";
  for (const exp of expenses) {
    csvContent += `${exp.date},"${exp.title.replace(/"/g, '""')}",${exp.amount},${exp.categoryId},"${(exp.notes || '').replace(/"/g, '""')}"\n`;
  }
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', `xarajatlar_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function importDataFromJSON(jsonText: string): boolean {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed) return false;
    const db: AppDatabase = {
      version: parsed.version || 1,
      members: parsed.members || parsed.familyMembers || initialMembers,
      incomes: parsed.incomes || [],
      loans: parsed.loans || [],
      debts: parsed.debts || [],
      categories: parsed.categories || parsed.expenseCategories || initialCategories,
      expenses: parsed.expenses || [],
      utilities: parsed.utilities || [],
      savingsGoals: parsed.savingsGoals || [],
      investments: parsed.investments || [],
      settings: { ...initialSettings, ...(parsed.settings || parsed.userSettings || {}) },
    };
    StorageService.save(db);
    return true;
  } catch (e) {
    console.error('Import failed', e);
    return false;
  }
}

export function resetToDemoData(): void {
  StorageService.resetToDemo();
}

