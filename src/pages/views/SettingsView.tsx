import { useRef, useState } from 'react'
import { AlertTriangle, Download, Plus, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLedger } from '../../context/LedgerContext'
import { useToast } from '../../components/ui/Toast'
import { Modal } from '../../components/ui/Modal'
import type { LedgerData, TransactionType } from '../../types'

const CURRENCIES = ['$', '€', '£', '¥', '₹'] as const

export function SettingsView() {
  const { user } = useAuth()
  const {
    data,
    setCurrencySymbol,
    addCategory,
    removeCategory,
    resetLedger,
    importLedgerData,
    exportLedgerData,
  } = useLedger()
  const { toast } = useToast()
  const [customCurrency, setCustomCurrency] = useState('')
  const [newIncomeCat, setNewIncomeCat] = useState('')
  const [newExpenseCat, setNewExpenseCat] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as LedgerData
        if (!Array.isArray(parsed.transactions) || !parsed.categories) {
          throw new Error('Invalid format')
        }
        importLedgerData(parsed)
        toast('Ledger data imported', 'success')
      } catch {
        toast('Invalid ledger export file', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExport = () => {
    const payload = exportLedgerData()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `apex-ledger-${user?.email ?? 'backup'}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Ledger data exported', 'success')
  }

  const handleCurrency = (symbol: string) => {
    setCurrencySymbol(symbol || '$')
    setCustomCurrency('')
    toast(`Currency set to ${symbol || '$'}`, 'success')
  }

  const handleAddCategory = (type: TransactionType) => {
    const input = type === 'income' ? newIncomeCat : newExpenseCat
    const setter = type === 'income' ? setNewIncomeCat : setNewExpenseCat
    if (addCategory(type, input)) {
      setter('')
      toast('Category added', 'success')
    } else {
      toast('Category already exists or is empty', 'error')
    }
  }

  const categoryRows: { type: TransactionType; items: string[]; title: string; tone: string }[] = [
    { type: 'income', items: data.categories.income, title: 'Inflow / Income', tone: 'text-apex-accentGreen' },
    { type: 'expense', items: data.categories.expense, title: 'Outflow / Expense', tone: 'text-apex-accentRed' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Ledger System Settings</h2>
        <p className="text-xs text-apex-muted">Currency, categories, data management and destructive actions</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Currency */}
        <section className="glass-panel p-6">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">1.0 Currency Configuration</h3>
          <p className="mt-1 text-[11px] text-apex-muted">Modifies all balance calculations, ledger summaries, and reports instantly.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {CURRENCIES.map((currency) => (
              <button
                key={currency}
                onClick={() => handleCurrency(currency)}
                className={`rounded-lg border px-4 py-2 font-mono text-xs font-bold transition ${
                  data.currencySymbol === currency
                    ? 'border-apex-accentBlue bg-apex-accentBlue/10 text-apex-accentBlue'
                    : 'border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {currency} {currency === '$' ? '(USD/CAD)' : currency === '€' ? '(EUR)' : currency === '£' ? '(GBP)' : currency === '¥' ? '(JPY/CNY)' : '(INR)'}
              </button>
            ))}
            <div className="flex min-w-[160px] flex-1 items-center gap-2">
              <input
                value={customCurrency}
                onChange={(e) => setCustomCurrency(e.target.value)}
                placeholder="Custom Symbol"
                className="input font-mono"
              />
              <button onClick={() => customCurrency.trim() && handleCurrency(customCurrency.trim())} className="btn border border-zinc-800 text-zinc-300 hover:border-apex-accentBlue hover:text-apex-accentBlue">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Data management */}
        <section className="glass-panel p-6">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">2.0 Data Management</h3>
          <p className="mt-1 text-[11px] text-apex-muted">Backup or restore this account's ledger as a JSON file.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button onClick={handleExport} className="btn border border-apex-accentBlue/40 text-apex-accentBlue hover:bg-apex-accentBlue/10">
              <Download className="h-4 w-4" />
              Export JSON
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="btn border border-zinc-700 text-zinc-300 hover:border-apex-accentBlue hover:text-apex-accentBlue">
              <Upload className="h-4 w-4" />
              Import JSON
            </button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </div>
          <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs">
            <div className="text-[10px] font-mono uppercase tracking-widest text-apex-muted">Account</div>
            <div className="mt-1 font-bold text-white">{user?.name}</div>
            <div className="text-[10px] text-apex-muted">{user?.email}</div>
          </div>
        </section>
      </div>

      {/* Categories */}
      <section className="glass-panel p-6">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">3.0 Dynamic Category Registry</h3>
        <p className="mt-1 text-[11px] text-apex-muted">Manage classifications shown in the ledger transaction options.</p>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {categoryRows.map((row) => (
            <div key={row.type} className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
              <div className={`mb-3 text-[10px] font-mono font-bold uppercase tracking-wider ${row.tone}`}>{row.title}</div>
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={row.type === 'income' ? newIncomeCat : newExpenseCat}
                  onChange={(e) => (row.type === 'income' ? setNewIncomeCat(e.target.value) : setNewExpenseCat(e.target.value))}
                  placeholder="Add custom category"
                  className="input"
                />
                <button onClick={() => handleAddCategory(row.type)} className="btn shrink-0 border border-zinc-800 p-2.5 text-zinc-300 hover:border-apex-accentBlue hover:text-apex-accentBlue">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[180px] space-y-1.5 overflow-y-auto pr-1">
                {row.items.length === 0 && <div className="py-2 text-center text-[10px] uppercase text-apex-muted">No categories</div>}
                {row.items.map((cat) => (
                  <div key={cat} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs">
                    <span className="truncate text-zinc-300">{cat}</span>
                    <button
                      onClick={() => {
                        removeCategory(row.type, cat)
                        toast('Category removed', 'error')
                      }}
                      className="ml-2 text-apex-muted hover:text-apex-accentRed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Destructive */}
      <section className="glass-panel border-l-2 border-l-apex-accentRed p-6">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-apex-accentRed">4.0 Destructive Actions</h3>
        <p className="mt-1 text-[11px] text-apex-muted">
          Hard reset irrevocably wipes this account's transactions, reserves, archives, categories and currency.
        </p>
        <button onClick={() => setConfirmReset(true)} className="btn mt-4 border border-apex-accentRed/30 bg-apex-accentRed/10 text-apex-accentRed hover:bg-apex-accentRed hover:text-white">
          <AlertTriangle className="h-4 w-4" />
          Hard Reset Ledger
        </button>
      </section>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="System Wipe Warning"
        icon={<AlertTriangle className="h-6 w-6 text-apex-accentRed" />}
        footer={
          <div className="flex gap-3">
            <button onClick={() => setConfirmReset(false)} className="btn flex-1 border border-zinc-800 text-zinc-300 hover:bg-zinc-800">
              Cancel
            </button>
            <button
              onClick={() => {
                resetLedger()
                setConfirmReset(false)
                toast('System core wipe complete', 'error')
              }}
              className="btn flex-1 bg-apex-accentRed text-white hover:bg-red-700 border border-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              Wipe Memory
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="font-semibold text-zinc-200">Are you absolutely sure you want to perform a hard reset?</p>
          <p className="text-zinc-400">
            This permanently deletes all records, reserves, categories, historical month closures, and custom currency
            configurations for this account. This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  )
}
