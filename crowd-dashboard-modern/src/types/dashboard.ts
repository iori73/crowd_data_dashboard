export interface CrowdDataRow {
  datetime: string
  date: string
  time: string
  hour: number
  weekday: string
  count: number
  status_label: string
  status_code: number
  status_min: number
  status_max: number
  raw_text: string
}

export interface HourlyData {
  average: number
  count: number
  min: number
  max: number
  hasData: boolean
}

export interface WeekdayData {
  [hour: number]: HourlyData
}

export interface ProcessedData {
  [weekday: string]: WeekdayData
}

export interface DayStatistics {
  hourly: {
    [hour: number]: {
      count: number
      average: number
      min: number
      max: number
      sum: number
      standardDeviation: number
      records: any[]
    }
  }
  daily: {
    totalRecords: number
    averageCount: number
    minCount: number
    maxCount: number
    hoursWithData: number
  }
}

export interface Statistics {
  [weekday: string]: DayStatistics
}

export interface DataProcessorResult {
  hourlyData: ProcessedData
  statistics: Statistics
  rawData: CrowdDataRow[]
  metadata: {
    totalRecords: number
    processingTime: number
    weekdays: string[]
    dateRange: {
      start: string
      end: string
      days: number
    }
  }
}

export type WeekdayNames = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'

export interface ChartConfig {
  weekday: WeekdayNames
  canvasId: string
  displayName: string
}