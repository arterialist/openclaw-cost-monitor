import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { MinuteBucket } from '../types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function fillMinuteGaps(data: MinuteBucket[]): MinuteBucket[] {
  if (data.length === 0) return []
  const result: MinuteBucket[] = []
  const step = 60_000
  const start = data[0].timestamp
  const end = data[data.length - 1].timestamp
  const map = new Map(data.map(d => [d.timestamp, d]))
  for (let t = start; t <= end; t += step) {
    result.push(map.get(t) ?? {
      timestamp: t,
      label: '',
      input: 0, output: 0, cacheRead: 0, cacheWrite: 0,
      total: 0, calls: 0,
    })
  }
  return result
}

const OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: true,
  animation: { duration: 300 },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1c2128',
      borderColor: '#30363d',
      borderWidth: 1,
      titleColor: '#e6edf3',
      bodyColor: '#7d8590',
      callbacks: {
        title: items => items[0]?.label ?? '',
        label: item => {
          const v = item.raw as number
          if (v === 0) return ''
          return ` ${item.dataset.label}: $${v.toFixed(6)}`
        },
        afterBody: items => {
          const total = items.reduce((s, i) => s + ((i.raw as number) || 0), 0)
          return ['', ` Total: $${total.toFixed(6)}`]
        },
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      grid: { color: '#21262d' },
      ticks: { color: '#7d8590', font: { size: 10 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 24 },
    },
    y: {
      stacked: true,
      grid: { color: '#21262d' },
      ticks: {
        color: '#7d8590',
        font: { size: 10 },
        callback: v => '$' + (v as number).toFixed(4),
      },
      beginAtZero: true,
    },
  },
}

interface CostChartProps {
  data: MinuteBucket[]
}

export function CostChart({ data }: CostChartProps) {
  const filled = fillMinuteGaps(data)

  const labels = filled.map(d => {
    const dt = new Date(d.timestamp)
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  })

  const chartData = {
    labels,
    datasets: [
      { label: 'Input',       data: filled.map(d => d.input),      backgroundColor: 'rgba(255, 90, 45, 0.75)',  stack: 'cost' },
      { label: 'Output',      data: filled.map(d => d.output),     backgroundColor: 'rgba(63, 185, 80, 0.75)', stack: 'cost' },
      { label: 'Cache Read',  data: filled.map(d => d.cacheRead),  backgroundColor: 'rgba(88, 166, 255, 0.75)', stack: 'cost' },
      { label: 'Cache Write', data: filled.map(d => d.cacheWrite), backgroundColor: 'rgba(210, 168, 255, 0.75)', stack: 'cost' },
    ],
  }

  return (
    <>
      <Bar data={chartData} options={OPTIONS} style={{ maxHeight: 340 }} />
      <div className="legend-row">
        <div className="legend-item"><div className="legend-dot" style={{ background: '#ff5a2d' }} />Input</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#3fb950' }} />Output</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#58a6ff' }} />Cache Read</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#d2a8ff' }} />Cache Write</div>
      </div>
    </>
  )
}
