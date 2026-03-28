import { useCosts } from './hooks/useCosts'
import { StatCards } from './components/StatCards'
import { CostChart } from './components/CostChart'
import { Controls } from './components/Controls'
import type { MinuteBucket } from './types'

function getVisibleData(data: MinuteBucket[], rangeMinutes: number): MinuteBucket[] {
  if (rangeMinutes === 0 || data.length === 0) return data
  const cutoff = Date.now() - rangeMinutes * 60 * 1000
  return data.filter(d => d.timestamp >= cutoff)
}

export function App() {
  const {
    allData, totalCost, totalEvents, updatedAt,
    error, loading,
    currentRange, currentInterval,
    setRange, setInterval_,
  } = useCosts()

  const visibleData = getVisibleData(allData, currentRange)

  const intervalLabel = currentInterval >= 60000
    ? `${currentInterval / 1000}s`
    : `${currentInterval / 1000}s`

  const isOffline = !!error

  return (
    <>
      <header>
        <h1>OpenClaw Cost Monitor</h1>
        <span
          className="badge live"
          id="status-badge"
          style={isOffline ? { color: '#f85149', background: '#2d1414', borderColor: '#6e2b2b', animation: 'none' } : undefined}
        >
          {isOffline ? '● OFFLINE' : '● LIVE'}
        </span>
        <span className="badge" style={{ color: loading ? undefined : '#3fb950' }}>
          {loading ? 'loading…' : isOffline ? '✗ offline' : '✓ live'}
        </span>
      </header>

      {error && (
        <div className="error-banner" style={{ display: 'block' }}>
          Cannot reach cost server: {error} — make sure to run: yarn server
        </div>
      )}

      <StatCards allData={allData} visibleData={visibleData} totalCost={totalCost} />

      <div className="chart-container">
        <div className="chart-header">
          <span className="chart-title">Cost per minute (USD)</span>
          <Controls
            currentRange={currentRange}
            currentInterval={currentInterval}
            onRangeChange={setRange}
            onIntervalChange={setInterval_}
          />
        </div>
        <CostChart data={visibleData} />
      </div>

      <div className="footer">
        <div id="last-updated">
          {updatedAt
            ? `Updated: ${new Date(updatedAt).toLocaleTimeString()} · ${totalEvents} API calls across all sessions`
            : 'Waiting for data…'}
        </div>
        <div>Refresh: {intervalLabel} · Server: <code>http://127.0.0.1:29847</code></div>
      </div>
    </>
  )
}
