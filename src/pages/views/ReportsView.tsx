import { useMemo, useState } from 'react'
import { Archive, Eye, FileText, Printer } from 'lucide-react'
import { useLedger } from '../../context/LedgerContext'
import { useToast } from '../../components/ui/Toast'
import { Modal } from '../../components/ui/Modal'
import { calculatePeriodBalances, formatCurrency } from '../../lib/ledger'
import { MonthlyStatement, type StatementModel } from '../../components/MonthlyStatement'

export function ReportsView() {
  const { data, closePeriod } = useLedger()
  const { toast } = useToast()
  const [currentOpen, setCurrentOpen] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)

  const totals = useMemo(() => calculatePeriodBalances(data), [data])

  const currentModel: StatementModel = useMemo(
    () => ({
      period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
      dateLabel: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      totals,
      transactions: data.transactions,
    }),
    [totals, data.transactions],
  )

  const viewingArchive = data.archivedMonths.find((a) => a.id === viewingId)

  const archivedModel: StatementModel | null = useMemo(() => {
    if (!viewingArchive) return null
    const incomeByCategory: Record<string, number> = {}
    const expenseByCategory: Record<string, number> = {}
    for (const tx of viewingArchive.transactions) {
      const bucket = tx.type === 'income' ? incomeByCategory : expenseByCategory
      bucket[tx.category] = (bucket[tx.category] || 0) + Number(tx.amount)
    }
    return {
      period: viewingArchive.period,
      dateLabel: new Date(viewingArchive.dateClosed).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      totals: {
        totalInflow: viewingArchive.totalInflow,
        totalOutflow: viewingArchive.totalOutflow,
        totalLocked: viewingArchive.totalLocked,
        netBalance: viewingArchive.netBalance,
        margin: viewingArchive.margin,
        incomeByCategory,
        expenseByCategory,
      },
      transactions: viewingArchive.transactions,
      readonly: true,
    }
  }, [viewingArchive])

  const sortedArchives = useMemo(
    () => [...data.archivedMonths].sort((a, b) => new Date(b.dateClosed).getTime() - new Date(a.dateClosed).getTime()),
    [data.archivedMonths],
  )

  const handleClosePeriod = () => {
    if (data.transactions.length === 0) {
      toast('Active ledger requires records to build a statement', 'error')
      return
    }
    const record = closePeriod()
    if (record) {
      setCurrentOpen(false)
      toast(`${record.period} archived successfully`, 'success')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Financial Reports</h2>
          <p className="text-xs text-apex-muted">Compile balance sheets and review archived statements</p>
        </div>
        <button
          onClick={() => {
            if (data.transactions.length === 0) {
              toast('Add ledger records before compiling a statement', 'error')
              return
            }
            setCurrentOpen(true)
          }}
          className="btn bg-apex-accentBlue text-black hover:bg-cyan-400 border border-transparent"
        >
          <FileText className="h-4 w-4" />
          Compile Current Statement
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportMetric label="Active Records" value={String(data.transactions.length)} />
        <ReportMetric label="Current Net" value={formatCurrency(totals.netBalance, data.currencySymbol)} tone="text-apex-accentBlue" />
        <ReportMetric label="Archived Periods" value={String(data.archivedMonths.length)} />
      </div>

      <section className="glass-panel p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <Archive className="h-5 w-5 text-apex-accentAmber" />
          <div>
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">Archived Months</h3>
            <p className="text-[10px] text-apex-muted">Historically finalized statements</p>
          </div>
        </div>
        {sortedArchives.length === 0 ? (
          <div className="py-10 text-center font-mono text-[10px] uppercase tracking-widest text-apex-muted">
            No closed periods recorded
          </div>
        ) : (
          <div className="space-y-2">
            {sortedArchives.map((archive) => (
              <div key={archive.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 hover:border-zinc-700">
                <div className="flex items-center gap-2.5">
                  <Archive className="h-4 w-4 text-apex-accentGreen" />
                  <span className="font-mono text-xs font-bold uppercase text-white">{archive.period}</span>
                  <span className="chip bg-zinc-900 text-apex-muted">{archive.transactions.length} records</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="font-bold text-apex-accentBlue">{formatCurrency(archive.netBalance, data.currencySymbol)}</span>
                  <button
                    onClick={() => setViewingId(archive.id)}
                    className="rounded-lg p-2 text-apex-muted hover:bg-zinc-800 hover:text-white"
                    title="View statement"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Current statement modal */}
      <Modal
        open={currentOpen}
        onClose={() => setCurrentOpen(false)}
        title="Compile Financial Balance Sheet"
        icon={<FileText className="h-5 w-5 text-apex-accentBlue" />}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={() => window.print()} className="btn border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white">
              <Printer className="h-4 w-4" />
              Print Sheet
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={() => setCurrentOpen(false)} className="btn border border-zinc-800 text-zinc-300 hover:bg-zinc-800">
                Keep Ledger Open
              </button>
              <button onClick={handleClosePeriod} className="btn bg-apex-accentRed text-white hover:bg-red-700 border border-transparent">
                Close Period Register
              </button>
            </div>
          </div>
        }
      >
        <MonthlyStatement model={currentModel} currencySymbol={data.currencySymbol} />
      </Modal>

      {/* Archived statement modal */}
      <Modal
        open={!!viewingArchive}
        onClose={() => setViewingId(null)}
        title={`Archived ${viewingArchive?.period ?? ''}`}
        icon={<Archive className="h-5 w-5 text-apex-accentAmber" />}
        maxWidth="max-w-3xl"
        footer={
          <button onClick={() => window.print()} className="btn border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white">
            <Printer className="h-4 w-4" />
            Print Sheet
          </button>
        }
      >
        {archivedModel && <MonthlyStatement model={archivedModel} currencySymbol={data.currencySymbol} />}
      </Modal>
    </div>
  )
}

function ReportMetric({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="glass-panel p-5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-apex-muted">{label}</div>
      <div className={`mt-2 font-mono text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  )
}
