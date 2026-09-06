import { AuthProvider, useAuth } from './context/AuthContext'
import { LedgerProvider } from './context/LedgerContext'
import { ToastProvider } from './components/ui/Toast'
import { AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'

function AppShell() {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="font-mono text-xs uppercase tracking-widest text-apex-muted">Booting ledger...</div>
      </div>
    )
  }
  if (!user) return <AuthPage />
  return (
    <LedgerProvider>
      <Dashboard />
    </LedgerProvider>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  )
}
