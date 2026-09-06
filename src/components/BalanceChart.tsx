import { useMemo } from 'react'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Activity, TrendingUp } from 'lucide-react'
import type { LedgerData } from '../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

export function BalanceChart({ data }: { data: LedgerData }) {
  const { labels, points } = useMemo(() => {
    const timeline = [...data.transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    const byDay = new Map<string, { income: number; expense: number }>()
    for (const tx of timeline) {
      const key = tx.date
      const bucket = byDay.get(key) ?? { income: 0, expense: 0 }
      if (tx.type === 'income') bucket.income += tx.amount
      else bucket.expense += tx.amount
      byDay.set(key, bucket)
    }
    const sortedDays = Array.from(byDay.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    )
    let running = 0
    const labels: string[] = []
    const points: number[] = []
    for (const [day, bucket] of sortedDays) {
      running += bucket.income - bucket.expense
      labels.push(day)
      points.push(running)
    }
    return { labels, points }
  }, [data.transactions])

  if (data.transactions.length === 0) {
    return (
      <div className="flex h-64 md:h-80 flex-col items-center justify-center text-apex-muted">
        <Activity className="h-8 w-8 opacity-30" />
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest">
          Record system flow to initialize diagram
        </p>
      </div>
    )
  }

  return (
    <div className="h-64 md:h-80">
      <Line
        data={{
          labels,
          datasets: [
            {
              label: 'NET OPERATING ASSETS',
              data: points,
              borderColor: '#00F0FF',
              backgroundColor: (ctx) => {
                const { chart } = ctx
                const { ctx: c, chartArea } = chart
                if (!chartArea) return 'rgba(0,240,255,0.15)'
                const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
                gradient.addColorStop(0, 'rgba(0,240,255,0.28)')
                gradient.addColorStop(1, 'rgba(0,240,255,0)')
                return gradient
              },
              borderWidth: 2,
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#00F0FF',
              pointRadius: 3,
              pointHoverRadius: 6,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#09090b',
              borderColor: '#27272a',
              borderWidth: 1,
              titleColor: '#fff',
              bodyColor: '#00F0FF',
              titleFont: { family: 'JetBrains Mono', size: 10 },
              bodyFont: { family: 'JetBrains Mono', size: 12 },
              callbacks: {
                label: (ctxItem) =>
                  `${data.currencySymbol}${Number(ctxItem.parsed.y ?? 0).toLocaleString('en-US')}`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.03)' },
              ticks: { color: '#71717a', font: { family: 'JetBrains Mono', size: 9 } },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.03)' },
              ticks: {
                color: '#71717a',
                font: { family: 'JetBrains Mono', size: 9 },
                callback: (value) => `${data.currencySymbol}${value}`,
              },
            },
          },
        }}
      />
      <div className="mt-2 flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-widest text-apex-muted">
        <TrendingUp className="h-3 w-3 text-apex-accentBlue" />
        Daily cumulative operating balance (reserves excluded)
      </div>
    </div>
  )
}
