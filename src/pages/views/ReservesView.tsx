import { useState, type FormEvent } from 'react'
import { Plus, ShoppingBag, Target, Trash2, Undo2, Wallet } from 'lucide-react'
import { useLedger } from '../../context/LedgerContext'
import { useToast } from '../../components/ui/Toast'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency, sanitizeAmount } from '../../lib/ledger'

export function ReservesView() {
  const {
    data,
    addReserve,
    depositReserve,
    liquidateReserve,
    retireReserve,
    purchaseReserve,
  } = useLedger()
  const { toast } = useToast()
  const [creating, setCreating] = useState(false)
  const [depositId, setDepositId] = useState<string | null>(null)

  const depositTarget = data.funds.find((f) => f.id === depositId)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
            Allocated Reserves & Savings
          </h2>
          <p className="text-xs text-apex-muted">Partition specialized cash blocks for capital expenditures</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn border border-apex-accentAmber/40 text-apex-accentAmber hover:bg-apex-accentAmber/10 border-t">
          <Plus className="h-4 w-4" />
          Create Reserve
        </button>
      </div>

      {data.funds.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center border border-dashed border-zinc-800 py-16 text-apex-muted">
          <Target className="h-7 w-7 opacity-40" />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest">No partitioned reserves detected</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {data.funds.map((fund) => {
            const progress = Math.min(100, Math.round((fund.current / fund.target) * 100))
            const complete = fund.current >= fund.target
            return (
              <div key={fund.id} className="glass-panel relative overflow-hidden p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-mono text-xs font-bold uppercase text-white">{fund.name}</h3>
                    <span className="text-[9px] font-mono uppercase tracking-widest text-apex-muted">
                      Capital accumulation segment
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Retire reserve "${fund.name}"?`)) {
                        retireReserve(fund.id)
                        toast('Reserve retired', 'error')
                      }
                    }}
                    className="text-apex-muted hover:text-apex-accentRed"
                    title="Retire reserve"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-apex-accentAmber">{formatCurrency(fund.current, data.currencySymbol)}</span>
                      <span className="text-[9px] text-apex-muted">/ {formatCurrency(fund.target, data.currencySymbol)}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${complete ? 'text-apex-accentGreen' : 'text-apex-accentAmber'}`}>{progress}%</span>
                  </div>
                  <div className="w-full rounded-lg border border-zinc-800 bg-[#0c0c0e] p-[2px]">
                    <div
                      className="h-2 rounded-md bg-gradient-to-r from-amber-500 to-apex-accentGreen transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[9px]">
                    <button
                      onClick={() => setDepositId(fund.id)}
                      className="rounded-lg border border-zinc-800 bg-zinc-900 py-2 font-bold uppercase tracking-wider text-zinc-300 hover:border-apex-accentAmber/40 hover:text-apex-accentAmber"
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => {
                        if (fund.current <= 0) {
                          toast('No funds accumulated in this reserve', 'error')
                          return
                        }
                        if (purchaseReserve(fund.id)) {
                          toast(`${fund.name} recognized as expense`, 'success')
                        }
                      }}
                      className="flex items-center justify-center gap-1 rounded-lg border border-apex-accentGreen/30 bg-apex-accentGreen/15 py-2 font-bold uppercase tracking-wider text-apex-accentGreen hover:bg-apex-accentGreen hover:text-black"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      Bought
                    </button>
                    <button
                      onClick={() => {
                        liquidateReserve(fund.id)
                        toast(`Reassigned ${formatCurrency(fund.current, data.currencySymbol)} to liquid balance`, 'info')
                      }}
                      className="flex items-center justify-center gap-1 rounded-lg border border-zinc-900 bg-zinc-950 py-2 font-bold uppercase tracking-wider text-apex-muted hover:border-apex-accentRed/40 hover:text-apex-accentRed"
                    >
                      <Undo2 className="h-3 w-3" />
                      Reassign
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {creating && (
        <CreateReserveModal
          onClose={() => setCreating(false)}
          onCreate={(input) => {
            const ok = addReserve(input)
            if (ok) {
              toast('Reserve deployed', 'success')
              setCreating(false)
            } else {
              toast('Insufficient liquid resources or invalid values', 'error')
            }
          }}
        />
      )}

      <Modal
        open={!!depositTarget}
        onClose={() => setDepositId(null)}
        title={`Allocate to ${depositTarget?.name ?? ''}`}
        icon={<Wallet className="h-5 w-5 text-apex-accentGreen" />}
      >
        {depositTarget && (
          <DepositForm
            target={depositTarget.current}
            cap={depositTarget.target}
            symbol={data.currencySymbol}
            onSubmit={(amount) => {
              const ok = depositReserve(depositTarget.id, amount)
              if (ok) {
                toast('Assets transferred to reserve', 'success')
                setDepositId(null)
              } else {
                toast('Insufficient liquidity or amount exceeds cap', 'error')
              }
            }}
          />
        )}
      </Modal>
    </div>
  )
}

function CreateReserveModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (input: { name: string; target: number; initial: number }) => void
}) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [initial, setInitial] = useState('0')

  const handle = (e: FormEvent) => {
    e.preventDefault()
    onCreate({
      name: name.trim(),
      target: sanitizeAmount(target),
      initial: sanitizeAmount(initial),
    })
  }

  return (
    <Modal open onClose={onClose} title="Create Capital Reserve" icon={<Target className="h-5 w-5 text-apex-accentAmber" />}>
      <form onSubmit={handle} className="space-y-4">
        <div>
          <label className="label">Reserve Objective Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Server Array, Operational Buffer" className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Target Cap</label>
            <input required type="number" step="0.01" min="1" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="2500" className="input font-mono" />
          </div>
          <div>
            <label className="label">Initial Deposit</label>
            <input required type="number" step="0.01" min="0" value={initial} onChange={(e) => setInitial(e.target.value)} placeholder="0" className="input font-mono" />
          </div>
        </div>
        <button type="submit" className="btn w-full bg-apex-accentAmber text-black hover:bg-amber-400 border border-transparent">
          <Target className="h-4 w-4" />
          Deploy Allocated Goal
        </button>
      </form>
    </Modal>
  )
}

function DepositForm({
  target,
  cap,
  symbol,
  onSubmit,
}: {
  target: number
  cap: number
  symbol: string
  onSubmit: (amount: number) => void
}) {
  const [amount, setAmount] = useState('')
  const space = Math.max(0, Math.round((cap - target) * 100) / 100)
  const fx = (v: number) => formatCurrency(v, symbol)

  const handle = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(sanitizeAmount(amount))
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <p className="text-xs text-apex-muted">
        Current: <span className="font-mono text-apex-accentAmber">{fx(target)}</span> — cap:{' '}
        <span className="font-mono text-zinc-300">{fx(cap)}</span> — remaining:{' '}
        <span className="font-mono text-zinc-300">{fx(space)}</span>
      </p>
      <div>
        <label className="label">Allocation Quantity ({symbol})</label>
        <input required type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="input font-mono" />
      </div>
      <button type="submit" className="btn w-full bg-apex-accentGreen text-black hover:bg-green-400 border border-transparent">
        Execute Asset Translation
      </button>
    </form>
  )
}
