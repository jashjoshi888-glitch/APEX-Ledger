import type { AppCategories, LedgerData, PeriodBalances } from '../types'

export const DEFAULT_CATEGORIES: AppCategories = {
  income: [
    'Active Capital (Salary/Inflow)',
    'Passive Yield (Investments/Dividends)',
    'Extraordinary Capital',
  ],
  expense: [
    'Housing & Utilities',
    'Operations & Hardware',
    'Nutrition & Health',
    'Travel & Commute',
    'Education & Tech',
    'Unplanned Outflows',
  ],
}

export function createDefaultLedgerData(): LedgerData {
  return {
    transactions: [],
    funds: [],
    archivedMonths: [],
    currencySymbol: '$',
    categories: {
      income: [...DEFAULT_CATEGORIES.income],
      expense: [...DEFAULT_CATEGORIES.expense],
    },
  }
}

export function calculatePeriodBalances(data: LedgerData): PeriodBalances {
  let totalInflow = 0
  let totalOutflow = 0
  const incomeByCategory: Record<string, number> = {}
  const expenseByCategory: Record<string, number> = {}

  for (const tx of data.transactions) {
    const amount = Number(tx.amount) || 0
    if (tx.type === 'income') {
      totalInflow += amount
      incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + amount
    } else {
      totalOutflow += amount
      expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + amount
    }
  }

  const totalLocked = data.funds.reduce((acc, f) => acc + (Number(f.current) || 0), 0)
  const netBalance = totalInflow - totalOutflow - totalLocked
  let margin = totalInflow > 0 ? Math.round((netBalance / totalInflow) * 100) : 0
  margin = Math.max(0, Math.min(100, margin))

  return {
    totalInflow,
    totalOutflow,
    totalLocked,
    netBalance,
    margin,
    incomeByCategory,
    expenseByCategory,
  }
}

export function formatCurrency(value: number, symbol = '$'): string {
  const isNegative = value < 0
  const absolute = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return isNegative ? `-${symbol}${absolute}` : `${symbol}${absolute}`
}

export function sanitizeAmount(value: string | number): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return 0
  return Math.round(parsed * 100) / 100
}

export function getWorstExpenseCategory(balances: PeriodBalances): {
  category: string
  amount: number
} | null {
  let worst: { category: string; amount: number } | null = null
  for (const [category, amount] of Object.entries(balances.expenseByCategory)) {
    if (!worst || amount > worst.amount) {
      worst = { category, amount }
    }
  }
  return worst
}
