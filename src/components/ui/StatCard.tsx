import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Tone = 'blue' | 'green' | 'red' | 'amber'

const toneMap: Record<Tone, { glow: string; icon: string }> = {
  blue: { glow: 'shadow-glowBlue', icon: 'text-apex-accentBlue' },
  green: { glow: 'shadow-glowGreen', icon: 'text-apex-accentGreen' },
  red: { glow: 'shadow-glowRed', icon: 'text-apex-accentRed' },
  amber: { glow: 'shadow-glowAmber', icon: 'text-apex-accentAmber' },
}

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  tone?: Tone
  sub?: ReactNode
}

export function StatCard({ label, value, icon: Icon, tone = 'blue', sub }: StatCardProps) {
  const palette = toneMap[tone]
  return (
    <div className={`glass-panel relative overflow-hidden p-6 ${palette.glow}`}>
      <div className="flex items-center justify-between text-[10px] font-mono text-apex-muted tracking-wider uppercase mb-4">
        <span>{label}</span>
        <Icon className={`h-5 w-5 ${palette.icon}`} />
      </div>
      <div className="text-3xl font-mono font-bold tracking-tight text-white">{value}</div>
      <div className="mt-3 text-xs text-apex-muted">{sub}</div>
    </div>
  )
}
