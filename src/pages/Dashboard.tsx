import { useMemo, useState } from 'react'
import {
  BarChart3,
  Import,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLedger } from '../context/LedgerContext'
import { OverviewView } from './views/OverviewView'
import { TransactionsView } from './views/TransactionsView'
import { ReservesView } from './views/ReservesView'
import { ReportsView } from './views/ReportsView'
import { SettingsView } from './views/SettingsView'
import { useToast } from '../components/ui/Toast'

type Tab = 'overview' | 'transactions' | 'reserves' | 'reports' | 'settings'

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Import },
  { id: 'reserves', label: 'Reserves', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Dashboard() {
  const { user, logout, deviceUsers, selectUser } = useAuth()
  const { data } = useLedger()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [menuOpen, setMenuOpen] = useState(false)

  const activePeriod = useMemo(
    () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
    [],
  )

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-apex-black/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-apex-accentBlue/30 bg-apex-accentBlue/10">
              <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-apex-accentBlue opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-apex-accentBlue" />
            </div>
            <div>
              <div className="font-mono text-sm font-extrabold tracking-wider text-white">
                APEX <span className="text-apex-accentBlue">//</span> LEDGER
              </div>
              <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-apex-muted">
                {user?.name ?? 'Operator'}
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-1 rounded-lg border border-zinc-800 bg-apex-black/50 p-1 md:flex">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                    activeTab === tab.id
                      ? 'bg-apex-accentBlue/15 text-apex-accentBlue'
                      : 'text-apex-muted hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          <div className="relative flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 lg:flex">
              <span className="font-mono text-[9px] uppercase tracking-widest text-apex-muted">
                Period
              </span>
              <span className="font-mono text-xs font-bold text-zinc-200">{activePeriod}</span>
            </div>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 font-mono text-xs font-bold text-apex-accentBlue"
            >
              {user?.name.slice(0, 1).toUpperCase()}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-zinc-800 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur">
                <div className="px-3 py-2">
                  <div className="text-sm font-bold text-white">{user?.name}</div>
                  <div className="text-[10px] text-apex-muted">{user?.email}</div>
                </div>
                <div className="border-t border-zinc-800 py-1">
                  {deviceUsers
                    .filter((u) => u.id !== user?.id)
                    .map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          selectUser(u.id)
                          setMenuOpen(false)
                          toast(`Switched to ${u.name}`, 'info')
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
                      >
                        <User className="h-3.5 w-3.5 text-apex-muted" />
                        Switch to {u.name}
                      </button>
                    ))}
                </div>
                <button
                  onClick={() => {
                    logout()
                    toast('Signed out', 'info')
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold text-apex-accentRed hover:bg-apex-accentRed/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  activeTab === tab.id
                    ? 'border-apex-accentBlue/40 bg-apex-accentBlue/10 text-apex-accentBlue'
                    : 'border-zinc-800 text-apex-muted'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'overview' && <OverviewView onNavigate={setActiveTab} />}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'reserves' && <ReservesView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      <footer className="border-t border-zinc-800/80 bg-apex-black/85 px-4 py-4 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-apex-muted sm:flex-row">
          <span>APEX // CORE — High Performance Ledger</span>
          <span>Currency: {data.currencySymbol}</span>
        </div>
      </footer>
    </div>
  )
}
