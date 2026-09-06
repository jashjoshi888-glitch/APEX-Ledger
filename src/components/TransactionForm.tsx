import { useMemo, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react'
import type { LedgerData, TransactionType } from '../types'
import type { NewTransactionInput } from '../context/LedgerContext'
import { sanitizeAmount } from '../lib/ledger'
import { useToast } from './ui/Toast'

interface TransactionFormProps {
  data: LedgerData
  onSubmit: (input: NewTransactionInput) => void
  initial?: NewTransactionInput
  submitLabel?: string
}

const today = () => new Date().toISOString().slice(0, 10)

export function TransactionForm({ data, onSubmit, initial, submitLabel = 'Commit to Active Ledger' }: TransactionFormProps) {
  const { toast } = useToast()
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'income')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [date, setDate] = useState(initial?.date ?? today())

  const categories = useMemo(() => data.categories[type], [data.categories, type])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const parsedAmount = sanitizeAmount(amount)
    if (parsedAmount <= 0) {
      toast('Enter a valid transaction amount.', 'error')
      return
    }
    if (!note.trim()) {
      toast('Add a memo/description for this record.', 'error')
      return
    }
    onSubmit({
      type,
      amount: parsedAmount,
      category,
      note: note.trim(),
      date,
    })
    setAmount('')
    setNote('')
    setDate(today())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Flow Direction</label>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg border border-zinc-800 bg-apex-black/80">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`btn !py-2 ${
              type === 'income'
                ? 'bg-apex-accentGreen/10 border border-apex-accentGreen/30 text-apex-accentGreen'
                : 'border border-transparent text-apex-muted hover:text-white'
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
            Inflow
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`btn !py-2 ${
              type === 'expense'
                ? 'bg-apex-accentRed/10 border border-apex-accentRed/30 text-apex-accentRed'
                : 'border border-transparent text-apex-muted hover:text-white'
            }`}
          >
            <ArrowDownLeft className="h-4 w-4" />
            Outflow
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Transaction Value ({data.currencySymbol})</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-apex-muted">
              {data.currencySymbol}
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="input pl-8 font-mono"
            />
          </div>
        </div>
        <div>
          <label className="label">Transaction Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input font-mono"
          />
        </div>
      </div>

      <div>
        <label className="label">Financial Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required className="input">
          <option value="" disabled>
            Select category...
          </option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          {category && !categories.includes(category) && (
            <option value={category}>{category} (legacy)</option>
          )}
        </select>
      </div>

      <div>
        <label className="label">Record Memo / Description</label>
        <input
          type="text"
          required
          maxLength={120}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Server retainer payment"
          className="input"
        />
      </div>

      <button type="submit" className="btn w-full bg-apex-accentBlue text-black hover:bg-cyan-400 border border-transparent">
        <Check className="h-4 w-4" />
        {submitLabel}
      </button>
    </form>
  )
}
