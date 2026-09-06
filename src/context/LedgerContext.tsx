import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ArchiveRecord, LedgerData, Transaction, TransactionType } from '../types'
import { getJSON, setJSON, STORAGE_KEYS } from '../lib/storage'
import { calculatePeriodBalances, createDefaultLedgerData, sanitizeAmount } from '../lib/ledger'
import { useAuth } from './AuthContext'

export interface NewTransactionInput {
  type: TransactionType
  amount: number
  category: string
  note: string
  date: string
}

export interface NewReserveInput {
  name: string
  target: number
  initial: number
}

interface LedgerContextValue {
  data: LedgerData
  addTransaction: (input: NewTransactionInput) => Transaction
  updateTransaction: (id: string, input: NewTransactionInput) => void
  deleteTransaction: (id: string) => void
  addReserve: (input: NewReserveInput) => boolean
  depositReserve: (id: string, amount: number) => boolean
  liquidateReserve: (id: string) => void
  retireReserve: (id: string) => void
  purchaseReserve: (id: string) => boolean
  closePeriod: () => ArchiveRecord | null
  setCurrencySymbol: (symbol: string) => void
  addCategory: (type: TransactionType, category: string) => boolean
  removeCategory: (type: TransactionType, category: string) => void
  resetLedger: () => void
  importLedgerData: (data: LedgerData) => void
  exportLedgerData: () => LedgerData
}

const LedgerContext = createContext<LedgerContextValue | null>(null)

function loadDataForUser(userId: string): LedgerData {
  const saved = getJSON<LedgerData | null>(STORAGE_KEYS.userData(userId), null)
  if (saved) {
    return {
      ...createDefaultLedgerData(),
      ...saved,
      categories: { ...createDefaultLedgerData().categories, ...(saved.categories || {}) },
    }
  }
  return createDefaultLedgerData()
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<LedgerData>(() =>
    user ? loadDataForUser(user.id) : createDefaultLedgerData(),
  )

  useEffect(() => {
    setData(user ? loadDataForUser(user.id) : createDefaultLedgerData())
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback(
    (next: LedgerData) => {
      if (!user) return
      setJSON(STORAGE_KEYS.userData(user.id), next)
    },
    [user],
  )

  const commit = useCallback(
    (mutator: (prev: LedgerData) => LedgerData) => {
      setData((prev) => {
        const next = mutator(prev)
        persist(next)
        return next
      })
    },
    [persist],
  )

  const addTransaction = useCallback(
    (input: NewTransactionInput) => {
      const amount = sanitizeAmount(input.amount)
      const tx: Transaction = {
        id: crypto.randomUUID(),
        type: input.type,
        amount,
        category: input.category,
        note: input.note,
        date: input.date,
        createdAt: new Date().toISOString(),
      }
      commit((prev) => ({ ...prev, transactions: [...prev.transactions, tx] }))
      return tx
    },
    [commit],
  )

  const updateTransaction = useCallback(
    (id: string, input: NewTransactionInput) => {
      commit((prev) => ({
        ...prev,
        transactions: prev.transactions.map((tx) =>
          tx.id === id
            ? {
                ...tx,
                type: input.type,
                amount: sanitizeAmount(input.amount),
                category: input.category,
                note: input.note,
                date: input.date,
              }
            : tx,
        ),
      }))
    },
    [commit],
  )

  const deleteTransaction = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((tx) => tx.id !== id),
      }))
    },
    [commit],
  )

  const addReserve = useCallback(
    (input: NewReserveInput) => {
      const currentEquity = calculatePeriodBalances(data).netBalance
      const initial = sanitizeAmount(input.initial)
      if (initial < 0) return false
      if (initial > 0 && initial > currentEquity) return false
      commit((prev) => ({
        ...prev,
        funds: [
          ...prev.funds,
          {
            id: crypto.randomUUID(),
            name: input.name,
            target: sanitizeAmount(input.target),
            current: initial,
            createdAt: new Date().toISOString(),
          },
        ],
      }))
      return true
    },
    [commit, data],
  )

  const depositReserve = useCallback(
    (id: string, amount: number) => {
      const currentEquity = calculatePeriodBalances(data).netBalance
      const deposit = sanitizeAmount(amount)
      if (deposit <= 0 || deposit > currentEquity) return false

      const fund = data.funds.find((f) => f.id === id)
      if (!fund) return false

      const spaceRemaining = fund.target - fund.current
      if (deposit > spaceRemaining) return false

      commit((prev) => ({
        ...prev,
        funds: prev.funds.map((f) =>
          f.id === id ? { ...f, current: Math.round((f.current + deposit) * 100) / 100 } : f,
        ),
      }))
      return true
    },
    [commit, data],
  )

  const liquidateReserve = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        funds: prev.funds.map((f) => (f.id === id ? { ...f, current: 0 } : f)),
      }))
    },
    [commit],
  )

  const retireReserve = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        funds: prev.funds.filter((f) => f.id !== id),
      }))
    },
    [commit],
  )

  const purchaseReserve = useCallback(
    (id: string) => {
      const fund = data.funds.find((f) => f.id === id)
      if (!fund || fund.current <= 0) return false

      const expenseCategory = data.categories.expense[0] || 'Operations & Hardware'
      const purchase: Transaction = {
        id: crypto.randomUUID(),
        type: 'expense',
        amount: fund.current,
        category: expenseCategory,
        note: `Acquisition: Purchased ${fund.name}`,
        date: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
      }

      commit((prev) => ({
        ...prev,
        transactions: [...prev.transactions, purchase],
        funds: prev.funds.filter((f) => f.id !== id),
      }))
      return true
    },
    [commit, data],
  )

  const closePeriod = useCallback(() => {
    const activeLabel = new Date()
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      .toUpperCase()
    const totals = calculatePeriodBalances(data)
    const record: ArchiveRecord = {
      id: crypto.randomUUID(),
      period: activeLabel,
      dateClosed: new Date().toISOString(),
      totalInflow: totals.totalInflow,
      totalOutflow: totals.totalOutflow,
      totalLocked: totals.totalLocked,
      netBalance: totals.netBalance,
      margin: totals.margin,
      transactions: [...data.transactions],
    }
    commit((prev) => ({
      ...prev,
      transactions: [],
      archivedMonths: [...prev.archivedMonths, record],
    }))
    return record
  }, [commit, data])

  const setCurrencySymbol = useCallback(
    (symbol: string) => {
      commit((prev) => ({ ...prev, currencySymbol: symbol || '$' }))
    },
    [commit],
  )

  const addCategory = useCallback(
    (type: TransactionType, category: string) => {
      const clean = category.trim()
      if (!clean) return false
      if (data.categories[type].includes(clean)) return false
      commit((prev) => ({
        ...prev,
        categories: {
          ...prev.categories,
          [type]: [...prev.categories[type], clean],
        },
      }))
      return true
    },
    [commit, data],
  )

  const removeCategory = useCallback(
    (type: TransactionType, category: string) => {
      commit((prev) => ({
        ...prev,
        categories: {
          ...prev.categories,
          [type]: prev.categories[type].filter((c) => c !== category),
        },
      }))
    },
    [commit],
  )

  const resetLedger = useCallback(() => {
    commit(() => createDefaultLedgerData())
  }, [commit])

  const importLedgerData = useCallback(
    (imported: LedgerData) => {
      commit(() => ({
        ...createDefaultLedgerData(),
        ...imported,
        categories: { ...createDefaultLedgerData().categories, ...(imported.categories || {}) },
      }))
    },
    [commit],
  )

  const exportLedgerData = useCallback(() => data, [data])

  const value = useMemo<LedgerContextValue>(
    () => ({
      data,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addReserve,
      depositReserve,
      liquidateReserve,
      retireReserve,
      purchaseReserve,
      closePeriod,
      setCurrencySymbol,
      addCategory,
      removeCategory,
      resetLedger,
      importLedgerData,
      exportLedgerData,
    }),
    [
      data,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addReserve,
      depositReserve,
      liquidateReserve,
      retireReserve,
      purchaseReserve,
      closePeriod,
      setCurrencySymbol,
      addCategory,
      removeCategory,
      resetLedger,
      importLedgerData,
      exportLedgerData,
    ],
  )

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
}

export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext)
  if (!ctx) throw new Error('useLedger must be used within LedgerProvider')
  return ctx
}
