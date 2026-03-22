// 交易记录
export interface Transaction {
  id: string;
  amount: number;
  category: 'FOOD' | 'TRANSPORT' | 'SHOPPING' | 'BILLS' | 'OTHER';
  description: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
}

// 新增/修改交易时发给后端的数据
export interface TransactionRequest {
  amount: number;
  category: string;
  description: string;
  type: string;
  date: string;
}

// 月度统计
export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  byCategory: Record<string, number>;
}

// 趋势数据（每个月的收支）
export interface TrendData {
  month: string;
  totalExpense: number;
  totalIncome: number;
}