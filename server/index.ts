#!/usr/bin/env node
/**
 * OpenClaw Live Cost Server
 * Reads session JSONL files and serves per-minute cost data via HTTP.
 * Usage: yarn server
 */

import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'
import readline from 'readline'

const PORT = 29847
const SESSIONS_DIR = path.join(os.homedir(), '.openclaw', 'agents', 'main', 'sessions')

interface RawCost {
  total?: number
  input?: number
  output?: number
  cacheRead?: number
  cacheWrite?: number
}

interface CostEvent {
  timestamp: number
  cost: RawCost
  model: string
  provider: string
}

interface MinuteBucket {
  timestamp: number
  label: string
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  total: number
  calls: number
}

async function parseJsonlFile(filePath: string): Promise<unknown[]> {
  const entries: unknown[] = []
  try {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity,
    })
    for await (const line of rl) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        entries.push(JSON.parse(trimmed))
      } catch {
        // skip malformed lines
      }
    }
  } catch {
    // file unreadable
  }
  return entries
}

async function loadAllCostEvents(): Promise<CostEvent[]> {
  let files: string[] = []
  try {
    files = fs.readdirSync(SESSIONS_DIR)
  } catch {
    return []
  }

  const jsonlFiles = files.filter(f => f.endsWith('.jsonl') || f.includes('.jsonl.reset.'))
  const events: CostEvent[] = []

  for (const file of jsonlFiles) {
    const filePath = path.join(SESSIONS_DIR, file)
    const entries = await parseJsonlFile(filePath)
    for (const entry of entries) {
      if (
        entry !== null &&
        typeof entry === 'object' &&
        (entry as Record<string, unknown>).type === 'message'
      ) {
        const e = entry as Record<string, unknown>
        const msg = e.message as Record<string, unknown> | undefined
        if (
          msg?.role === 'assistant' &&
          (msg.usage as Record<string, unknown> | undefined)?.cost !== undefined &&
          ((msg.usage as Record<string, unknown>).cost as Record<string, unknown>).total != null &&
          msg.timestamp
        ) {
          const cost = (msg.usage as Record<string, unknown>).cost as RawCost
          events.push({
            timestamp: msg.timestamp as number,
            cost,
            model: (msg.model as string) || 'unknown',
            provider: (msg.provider as string) || 'unknown',
          })
        }
      }
    }
  }

  events.sort((a, b) => a.timestamp - b.timestamp)
  return events
}

function groupByMinute(events: CostEvent[]): MinuteBucket[] {
  const buckets: Record<number, MinuteBucket> = {}

  for (const ev of events) {
    const minuteMs = Math.floor(ev.timestamp / 60000) * 60000
    if (!buckets[minuteMs]) {
      buckets[minuteMs] = {
        timestamp: minuteMs,
        label: new Date(minuteMs).toISOString().slice(0, 16).replace('T', ' '),
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        total: 0,
        calls: 0,
      }
    }
    const b = buckets[minuteMs]
    b.input += ev.cost.input ?? 0
    b.output += ev.cost.output ?? 0
    b.cacheRead += ev.cost.cacheRead ?? 0
    b.cacheWrite += ev.cost.cacheWrite ?? 0
    b.total += ev.cost.total ?? 0
    b.calls += 1
  }

  return Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp)
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  if (req.url === '/api/costs' && req.method === 'GET') {
    try {
      const events = await loadAllCostEvents()
      const minuteData = groupByMinute(events)
      const totalCost = events.reduce((s, e) => s + (e.cost.total ?? 0), 0)

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        updatedAt: Date.now(),
        sessionsDir: SESSIONS_DIR,
        totalEvents: events.length,
        totalCost,
        minuteData,
      }))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: (err as Error).message }))
    }
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`OpenClaw cost server running at http://127.0.0.1:${PORT}`)
  console.log(`Data source: ${SESSIONS_DIR}`)
  console.log('Run yarn dev to start both server and frontend.')
  console.log('Press Ctrl+C to stop.')
})
