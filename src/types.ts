export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  note: string
  date: string // YYYY-MM-DD (user-facing transaction date)
  createdAt: string
}

export interface ReserveFund {
  id: string
  name: string
  target: number
  current: number
  createdAt: string
}

export interface ArchiveRecord {
  id: string
  period: string
  dateClosed: string
  totalInflow: number
  totalOutflow: number
  totalLocked: number
  netBalance: number
  margin: number
  transactions: Transaction[]
}

export interface AppCategories {
  income: string[]
  expense: string[]
}

export interface LedgerData {
  transactions: Transaction[]
  funds: ReserveFund[]
  archivedMonths: ArchiveRecord[]
  currencySymbol: string
  categories: AppCategories
}

export interface UserProfile {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export interface PeriodBalances {
  totalInflow: number
  totalOutflow: number
  totalLocked: number
  netBalance: number
  margin: number
  expenseByCategory: Record<string, number>
  incomeByCategory: Record<string, number>
}
