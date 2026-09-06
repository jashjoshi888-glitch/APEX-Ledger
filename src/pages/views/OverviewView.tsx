import { useMemo } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  ChevronRight,
  Wallet,
} from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { BalanceChart } from '../../components/BalanceChart'
import { TransactionForm } from '../../components/TransactionForm'
import { getWorstExpenseCategory, formatCurrency, calculatePeriodBalances } from '../../lib/ledger'
import { useLedger } from '../../context/LedgerContext'
import { useToast } from '../../components/ui/Toast'
import type { Transaction } from '../../types'

export function OverviewView({ onNavigate }: { onNavigate: (tab: 'transactions') => void }) {
  const { data, addTransaction } = useLedger()
  const { toast } = useToast()
  const balances = useMemo(() => calculatePeriodBalances(data), [data])
  const fx = (v: number) => formatCurrency(v, data.currencySymbol)
  const worst = getWorstExpenseCategory(balances)

  const recent = useMemo(
    () =>
      [...data.transactions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 8),
    [data.transactions],
  )

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Net Liquid Position"
          value={fx(balances.netBalance)}
          icon={Wallet}
          tone={balances.netBalance >= 0 ? 'blue' : 'red'}
          sub={`Net cash reserve rate: ${balances.margin}%`}
        />
        <StatCard
          label="Period Inflows"
          value={fx(balances.totalInflow)}
          icon={ArrowUpRight}
          tone="green"
          sub={balances.totalInflow > 0 ? 'Ingestion channel active' : 'No ingest recorded'}
        />
        <StatCard
          label="Period Outflows"
          value={fx(balances.totalOutflow)}
          icon={ArrowDownLeft}
          tone="red"
          sub={worst ? `Primary drag: ${worst.category}` : 'System operating cold'}
        />
        <StatCard
          label="Savings Lockout"
          value={fx(balances.totalLocked)}
          icon={Boxes}
          tone="amber"
          sub={`${data.funds.length} active reserve${data.funds.length === 1 ? '' : 's'}`}
        />
      </section>

      <section className="glass-panel p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Asset Velocity Graph</h2>
            <p className="mt-0.5 text-xs text-apex-muted">Time-series tracking of period flows against core equity</p>
          </div>
          <button onClick={() => onNavigate('transactions')} className="hidden items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-apex-accentBlue hover:text-cyan-300 sm:flex">
            View ledger <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <BalanceChart data={data} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-panel border-l-2 border-l-apex-accentBlue p-6">
          <div className="mb-5 flex items-center gap-3">
            <ArrowUpRight className="h-5 w-5 text-apex-accentBlue" />
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Record Ledger Entry</h2>
              <p className="text-xs text-apex-muted">Inject verified financial records into active system registry</p>
            </div>
          </div>
          <TransactionForm
            data={data}
            onSubmit={(input) => {
              const tx = addTransaction(input)
              toast(`Committed ${tx.category} of ${fx(tx.amount)}`, 'success')
            }}
          />
        </div>

        <div className="glass-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Latest Activity</h2>
              <p className="text-xs text-apex-muted">Most recent records in the active period</p>
            </div>
          </div>
          {recent.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-apex-muted">
              <Boxes className="h-7 w-7 opacity-40" />
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest">Registry scan empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((tx) => (
                <RecentRow key={tx.id} tx={tx} symbol={data.currencySymbol} />
              ))}
            </div>
          )}
          {data.transactions.length > 0 && (
            <button
              onClick={() => onNavigate('transactions')}
              className="mt-4 w-full rounded-lg border border-zinc-800 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-apex-muted hover:border-zinc-700 hover:text-white"
            >
              Open full transaction ledger
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function RecentRow({ tx, symbol }: { tx: Transaction; symbol: string }) {
  const isIncome = tx.type === 'income'
  return (
    <div className={`flex items-center justify-between rounded-xl border p-3 ${isIncome ? 'border-apex-accentGreen/20 bg-apex-accentGreen/[0.03]' : 'border-apex-accentRed/20 bg-apex-accentRed/[0.03]'}`}>
      <div className="min-w-0">
        <div className="truncate text-xs font-bold uppercase text-white">{tx.category}</div>
        <div className="truncate text-[11px] italic text-apex-muted">{tx.note}</div>
      </div>
      <div className={`ml-3 shrink-0 font-mono text-xs font-bold ${isIncome ? 'text-apex-accentGreen' : 'text-apex-accentRed'}`}>
        {isIncome ? '+' : '-'}
        {formatCurrency(tx.amount, symbol)}
      </div>
    </div>
  )
}
