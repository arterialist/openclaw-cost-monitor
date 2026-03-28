export interface MinuteBucket {
  timestamp: number
  label: string
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  total: number
  calls: number
}

export interface CostsResponse {
  updatedAt: number
  totalEvents: number
  totalCost: number
  minuteData: MinuteBucket[]
}
