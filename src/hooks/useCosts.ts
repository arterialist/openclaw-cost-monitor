import { useState, useEffect, useCallback, useRef } from 'react'
import type { MinuteBucket, CostsResponse } from '../types'

const LS_RANGE = 'oclaw_range'
const LS_INTERVAL = 'oclaw_interval'

interface UseCostsResult {
  allData: MinuteBucket[]
  totalCost: number
  totalEvents: number
  updatedAt: number | null
  error: string | null
  loading: boolean
  currentRange: number
  currentInterval: number
  setRange: (minutes: number) => void
  setInterval_: (ms: number) => void
}

export function useCosts(): UseCostsResult {
  const [allData, setAllData] = useState<MinuteBucket[]>([])
  const [totalCost, setTotalCost] = useState(0)
  const [totalEvents, setTotalEvents] = useState(0)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [currentRange, setCurrentRange] = useState<number>(
    () => parseInt(localStorage.getItem(LS_RANGE) ?? '0')
  )
  const [currentInterval, setCurrentInterval] = useState<number>(
    () => parseInt(localStorage.getItem(LS_INTERVAL) ?? '15000')
  )

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/costs')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: CostsResponse = await res.json()
      setAllData(data.minuteData ?? [])
      setTotalCost(data.totalCost)
      setTotalEvents(data.totalEvents)
      setUpdatedAt(data.updatedAt)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Restart interval whenever currentInterval changes
  useEffect(() => {
    fetchData()
    timerRef.current = setInterval(fetchData, currentInterval)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchData, currentInterval])

  const setRange = useCallback((minutes: number) => {
    setCurrentRange(minutes)
    localStorage.setItem(LS_RANGE, String(minutes))
  }, [])

  const setInterval_ = useCallback((ms: number) => {
    setCurrentInterval(ms)
    localStorage.setItem(LS_INTERVAL, String(ms))
  }, [])

  return {
    allData,
    totalCost,
    totalEvents,
    updatedAt,
    error,
    loading,
    currentRange,
    currentInterval,
    setRange,
    setInterval_,
  }
}
