import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { Bell, CheckCircle2, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID()
    setItems((prev) => [...prev, { id, type, message }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }, 3800)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {items.map((item) => {
          const styles =
            item.type === 'success'
              ? 'border-apex-accentGreen/30 text-apex-accentGreen'
              : item.type === 'error'
                ? 'border-apex-accentRed/30 text-apex-accentRed'
                : 'border-apex-accentBlue/30 text-apex-accentBlue'
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl border bg-apex-black/95 px-4 py-3 shadow-xl backdrop-blur ${styles}`}
            >
              {item.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : item.type === 'error' ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              <span className="font-mono text-[11px] font-bold uppercase">{item.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
