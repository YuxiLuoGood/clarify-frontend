export const CATEGORIES = ['FOOD', 'TRANSPORT', 'SHOPPING', 'BILLS', 'OTHER'] as const;
export type Category = (typeof CATEGORIES)[number];

export type TransactionType = 'INCOME' | 'EXPENSE';

/** A transaction as returned by the API. */
export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  description: string | null;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  createdAt: string | null;
}

/** Body for creating or updating a transaction. */
export interface TransactionRequest {
  amount: number;
  category: Category;
  description: string;
  type: TransactionType;
  date: string;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  byCategory: Record<string, number>;
}

export interface TrendData {
  month: string; // YYYY-MM
  totalExpense: number;
  totalIncome: number;
}

export interface ForecastPoint {
  month: string;
  predictedExpense: number;
  isForecast: boolean;
}

export interface TokenResponse {
  token: string;
}

/** Budget alert pushed over the WebSocket. */
export interface BudgetAlertMessage {
  type: 'BUDGET_EXCEEDED';
  category: string;
  spent: number;
  budget: number;
  message: string;
}
