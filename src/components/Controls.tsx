interface ControlsProps {
  currentRange: number
  currentInterval: number
  onRangeChange: (minutes: number) => void
  onIntervalChange: (ms: number) => void
}

const INTERVALS = [
  { label: '1s', ms: 1000 },
  { label: '5s', ms: 5000 },
  { label: '10s', ms: 10000 },
  { label: '15s', ms: 15000 },
  { label: '30s', ms: 30000 },
  { label: '60s', ms: 60000 },
]

const RANGES = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '3h', minutes: 180 },
  { label: '12h', minutes: 720 },
  { label: '24h', minutes: 1440 },
  { label: 'All', minutes: 0 },
]

export function Controls({ currentRange, currentInterval, onRangeChange, onIntervalChange }: ControlsProps) {
  return (
    <div className="chart-controls">
      <div className="btn-group">
        {INTERVALS.map(({ label, ms }) => (
          <button
            key={ms}
            className={currentInterval === ms ? 'active' : undefined}
            onClick={() => onIntervalChange(ms)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="btn-group">
        {RANGES.map(({ label, minutes }) => (
          <button
            key={minutes}
            className={currentRange === minutes ? 'active' : undefined}
            onClick={() => onRangeChange(minutes)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
