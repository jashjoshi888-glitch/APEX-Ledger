import { X } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, icon, children, footer, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] bg-apex-black/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className={`glass-panel w-full ${maxWidth} max-h-[92vh] flex flex-col border border-zinc-800 my-4`}>
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            {icon}
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="text-apex-muted hover:text-white transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-zinc-800 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}
