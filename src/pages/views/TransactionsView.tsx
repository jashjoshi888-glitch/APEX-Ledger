import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useLedger } from '../../context/LedgerContext'
import { useToast } from '../../components/ui/Toast'
import { Modal } from '../../components/ui/Modal'
import { TransactionForm } from '../../components/TransactionForm'
import { calculatePeriodBalances, formatCurrency } from '../../lib/ledger'
import type { NewTransactionInput } from '../../context/LedgerContext'

type Filter = 'all' | 'income' | 'expense'

export function TransactionsView() {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useLedger()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return [...data.transactions]
      .filter((tx) => (filter === 'all' ? true : tx.type === filter))
      .filter((tx) => {
        if (!q) return true
        return (
          tx.category.toLowerCase().includes(q) ||
          tx.note.toLowerCase().includes(q) ||
          String(tx.amount).includes(q)
        )
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [data.transactions, query, filter])

  const editingTx = data.transactions.find((t) => t.id === editingId)
  const totals = calculatePeriodBalances(data)
  const fx = (v: number) => formatCurrency(v, data.currencySymbol)

  const initialForEdit = editingTx
    ? {
        type: editingTx.type,
        amount: editingTx.amount,
        category: editingTx.category,
        note: editingTx.note,
        date: editingTx.date,
      } satisfies NewTransactionInput
    : undefined

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Active Ledger Registry</h2>
          <p className="text-xs text-apex-muted">{data.transactions.length} transactions this period</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn bg-apex-accentBlue text-black hover:bg-cyan-400 border border-transparent">
          <Plus className="h-4 w-4" />
          New Entry
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-apex-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by category, note or amount..."
            className="input pl-10 font-mono"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider ${
                filter === f
                  ? 'border-apex-accentBlue/40 bg-apex-accentBlue/10 text-apex-accentBlue'
                  : 'border-zinc-800 text-apex-muted hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-apex-muted">
            <Search className="h-7 w-7 opacity-40" />
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest">No matching records</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/70">
            {filtered.map((tx) => {
              const isIncome = tx.type === 'income'
              return (
                <div key={tx.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 h-8 w-1 shrink-0 rounded-full ${isIncome ? 'bg-apex-accentGreen' : 'bg-apex-accentRed'}`} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold uppercase text-white">{tx.category}</span>
                        <span className="chip bg-zinc-900 text-apex-muted">{tx.date}</span>
                        {isIncome ? (
                          <span className="chip bg-apex-accentGreen/10 text-apex-accentGreen">Inflow</span>
                        ) : (
                          <span className="chip bg-apex-accentRed/10 text-apex-accentRed">Outflow</span>
                        )}
                      </div>
                      <p className="mt-1 text-xs italic text-apex-muted">{tx.note}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:pl-4">
                    <span className={`font-mono text-sm font-bold ${isIncome ? 'text-apex-accentGreen' : 'text-apex-accentRed'}`}>
                      {isIncome ? '+' : '-'}
                      {fx(tx.amount)}
                    </span>
                    <button
                      onClick={() => setEditingId(tx.id)}
                      className="rounded-lg p-2 text-apex-muted hover:bg-zinc-800 hover:text-apex-accentBlue"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${tx.category} of ${fx(tx.amount)}?`)) {
                          deleteTransaction(tx.id)
                          toast('Transaction removed', 'error')
                        }
                      }}
                      className="rounded-lg p-2 text-apex-muted hover:bg-zinc-800 hover:text-apex-accentRed"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Summary label="Inflows" value={fx(totals.totalInflow)} tone="text-apex-accentGreen" />
        <Summary label="Outflows" value={fx(totals.totalOutflow)} tone="text-apex-accentRed" />
        <Summary label="Net" value={fx(totals.netBalance)} tone={totals.netBalance >= 0 ? 'text-apex-accentBlue' : 'text-apex-accentRed'} />
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Record Ledger Entry"
        icon={<Plus className="h-5 w-5 text-apex-accentBlue" />}
      >
        <TransactionForm
          data={data}
          onSubmit={(input) => {
            const tx = addTransaction(input)
            toast(`Committed ${tx.category}`, 'success')
            setCreating(false)
          }}
        />
      </Modal>

      <Modal
        open={!!editingTx}
        onClose={() => setEditingId(null)}
        title="Edit Ledger Entry"
        icon={<Pencil className="h-5 w-5 text-apex-accentBlue" />}
      >
        {editingTx && initialForEdit && (
          <TransactionForm
            data={data}
            initial={initialForEdit}
            submitLabel="Save Changes"
            onSubmit={(input) => {
              updateTransaction(editingTx.id, input)
              toast('Transaction updated', 'success')
              setEditingId(null)
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function Summary({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="glass-panel flex items-center justify-between px-4 py-3">
      <span className="font-mono text-[10px] uppercase tracking-widest text-apex-muted">{label}</span>
      <span className={`font-mono text-sm font-bold ${tone}`}>{value}</span>
    </div>
  )
}
