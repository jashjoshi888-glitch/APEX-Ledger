import type { PeriodBalances, Transaction } from '../types'
import { formatCurrency } from '../lib/ledger'
import { Archive, Banknote } from 'lucide-react'

export interface StatementModel {
  period: string
  dateLabel: string
  totals: PeriodBalances
  transactions: Transaction[]
  readonly?: boolean
}

export function MonthlyStatement({ model, currencySymbol }: { model: StatementModel; currencySymbol: string }) {
  const { totals } = model
  const fx = (v: number) => formatCurrency(v, currencySymbol)

  return (
    <div className="space-y-6 text-zinc-200">
      {model.readonly && (
        <div className="flex items-center gap-2.5 rounded-xl border border-apex-accentAmber/25 bg-apex-accentAmber/10 p-3 text-xs font-mono text-apex-accentAmber">
          <Archive className="h-4 w-4" />
          Read-only archived ledger statement
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 border-b border-zinc-800 pb-4 sm:grid-cols-2">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-wider text-apex-muted">Reporting Frame</span>
          <h4 className="mt-1 font-mono text-lg font-bold uppercase text-white">{model.period}</h4>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[9px] font-mono uppercase tracking-wider text-apex-muted">Statement Date</span>
          <h4 className="mt-1 font-mono text-sm font-bold text-zinc-200">{model.dateLabel}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <section>
          <h5 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-apex-accentGreen">
            1.0 Operating Capital Revenue
          </h5>
          <StatementLines
            rows={Object.entries(totals.incomeByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => ({ label: cat, value: fx(amount) }))}
            empty="No operating income captured."
          />
          <div className="mt-2 flex justify-between border-t border-zinc-700 py-2 font-mono text-xs font-bold">
            <span className="text-zinc-300">Total Ingest Capacity</span>
            <span className="text-apex-accentGreen">{fx(totals.totalInflow)}</span>
          </div>
        </section>

        <section>
          <h5 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-apex-accentRed">
            2.0 Operating Outflows
          </h5>
          <StatementLines
            rows={Object.entries(totals.expenseByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amount]) => ({ label: cat, value: fx(amount) }))}
            empty="No operational expenses captured."
          />
          <div className="mt-2 flex justify-between border-t border-zinc-700 py-2 font-mono text-xs font-bold">
            <span className="text-zinc-300">Total Expenditures</span>
            <span className="text-apex-accentRed">{fx(totals.totalOutflow)}</span>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <section>
          <h5 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-apex-accentAmber">
            3.0 Target Reserves & Savings
          </h5>
          <div className="space-y-1.5 font-sans">
            {totals.totalLocked > 0 ? (
              <div className="text-sm text-zinc-300">
                <Banknote className="mr-1 inline h-4 w-4 text-apex-accentAmber" />
                {fx(totals.totalLocked)} is currently locked into allocated reserves.
              </div>
            ) : (
              <div className="text-xs italic text-apex-muted">No active target reserve allocations this period.</div>
            )}
          </div>
          <div className="mt-2 flex justify-between border-t border-zinc-700 py-2 font-mono text-xs font-bold">
            <span className="text-zinc-300">Total Savings Lockout</span>
            <span className="text-apex-accentAmber">{fx(totals.totalLocked)}</span>
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-apex-muted">Net Revolving Margin</span>
            <h4 className={`mt-1 font-mono text-3xl font-bold tracking-tight ${totals.netBalance >= 0 ? 'text-apex-accentBlue' : 'text-apex-accentRed'}`}>
              {fx(totals.netBalance)}
            </h4>
          </div>
          <div className="mt-4 space-y-1 border-t border-zinc-800 pt-3 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-apex-muted">Net Cash Recovery Efficiency:</span>
              <span className="font-bold text-white">{totals.margin}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-apex-muted">System Health:</span>
              <span className={`font-bold ${totals.netBalance >= 0 ? 'text-apex-accentGreen' : 'text-apex-accentRed'}`}>
                {totals.netBalance >= 0 ? 'Optimal (Surplus)' : 'Deficit Alert'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function StatementLines({ rows, empty }: { rows: { label: string; value: string }[]; empty: string }) {
  if (rows.length === 0) {
    return <div className="py-1 text-xs font-sans text-apex-muted">{empty}</div>
  }
  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between border-b border-zinc-800/50 py-1.5 text-xs font-sans">
          <span className="text-zinc-400">{row.label}</span>
          <span className="font-mono text-zinc-100">{row.value}</span>
        </div>
      ))}
    </div>
  )
}
