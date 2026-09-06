import { useState, type FormEvent } from 'react'
import { Activity, ArrowRight, MinusCircle, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'

type Mode = 'login' | 'register'

export function AuthPage() {
  const { login, register, deviceUsers, selectUser, removeAccount } = useAuth()
  const { toast } = useToast()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const error =
      mode === 'login' ? await login(email, password) : await register(name, email, password)
    setBusy(false)
    if (error) {
      toast(error, 'error')
      return
    }
    toast(mode === 'login' ? 'Session authenticated' : 'Account created', 'success')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        {/* Brand panel */}
        <div className="glass-panel flex flex-col justify-between p-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-apex-accentBlue/30 bg-apex-accentBlue/10">
                <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-apex-accentBlue opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-apex-accentBlue" />
              </div>
              <div>
                <h1 className="font-mono text-lg font-extrabold tracking-wider text-white">
                  APEX <span className="text-apex-accentBlue">//</span> LEDGER
                </h1>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-apex-muted">
                  Professional finance telemetry
                </p>
              </div>
            </div>
            <p className="mt-8 max-w-sm text-sm leading-relaxed text-zinc-400">
              Track income, expenses, reserves and savings targets in a single precision
              dashboard. Each account on this device owns an isolated ledger.
            </p>
            <div className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-apex-accentGreen">
              <ShieldCheck className="h-4 w-4" />
              Local-first private storage
            </div>
          </div>
          <div className="mt-10 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-apex-muted">
            <Activity className="h-3.5 w-3.5 text-apex-accentBlue" />
            Live asset velocity tracking
          </div>
        </div>

        {/* Auth panel */}
        <div className="glass-panel p-8">
          <div className="mb-6 flex rounded-lg border border-zinc-800 bg-apex-black/70 p-1">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md py-2 font-mono text-xs font-bold uppercase tracking-wider transition ${
                  mode === m ? 'bg-apex-accentBlue text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Display Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'register' && (
                <p className="mt-1 text-[10px] text-apex-muted">At least 6 characters.</p>
              )}
            </div>
            <button type="submit" disabled={busy} className="btn w-full bg-apex-accentBlue text-black hover:bg-cyan-400 border border-transparent">
              <ArrowRight className="h-4 w-4" />
              {busy ? 'Processing...' : mode === 'login' ? 'Open Ledger' : 'Create Workspace'}
            </button>
          </form>

          {deviceUsers.length > 0 && (
            <div className="mt-8 border-t border-zinc-800 pt-5">
              <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-apex-muted">
                <Users className="h-3.5 w-3.5" /> Accounts on this device
              </div>
              <div className="space-y-2">
                {deviceUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-2.5">
                    <button onClick={() => selectUser(u.id)} className="flex items-center gap-3 text-left">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-apex-accentBlue/15 font-mono text-xs font-bold text-apex-accentBlue">
                        {u.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{u.name}</div>
                        <div className="text-[10px] text-apex-muted">{u.email}</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${u.name}'s account and its ledger permanently?`)) {
                          removeAccount(u.id)
                          toast('Account deleted', 'info')
                        }
                      }}
                      className="text-apex-muted hover:text-apex-accentRed"
                      title="Delete account"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
