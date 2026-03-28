import type { MinuteBucket } from '../types'

interface StatCardsProps {
  allData: MinuteBucket[]
  visibleData: MinuteBucket[]
  totalCost: number
}

function fmt$(v: number | null | undefined): string {
  if (v == null) return '–'
  if (v < 0.001) return '<$0.001'
  return '$' + v.toFixed(4)
}

export function StatCards({ allData, visibleData, totalCost }: StatCardsProps) {
  const now = Date.now()
  const last1h = allData.filter(d => d.timestamp >= now - 3_600_000)
  const last10m = allData.filter(d => d.timestamp >= now - 600_000)

  const totalCalls = visibleData.reduce((s, d) => s + d.calls, 0)
  const peakMinute = [...visibleData].sort((a, b) => b.total - a.total)[0]

  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="label">Total Cost (all time)</div>
        <div className="value cost">{fmt$(totalCost)}</div>
      </div>
      <div className="stat-card">
        <div className="label">Cost (last hour)</div>
        <div className="value cost">{fmt$(last1h.reduce((s, d) => s + d.total, 0))}</div>
      </div>
      <div className="stat-card">
        <div className="label">Cost (last 10 min)</div>
        <div className="value cost">{fmt$(last10m.reduce((s, d) => s + d.total, 0))}</div>
      </div>
      <div className="stat-card">
        <div className="label">Peak minute</div>
        <div className="value">{peakMinute ? fmt$(peakMinute.total) : '–'}</div>
      </div>
      <div className="stat-card">
        <div className="label">API calls (visible)</div>
        <div className="value green">{totalCalls || '–'}</div>
      </div>
    </div>
  )
}
