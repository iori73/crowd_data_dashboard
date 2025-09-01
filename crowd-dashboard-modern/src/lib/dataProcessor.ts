import type { CrowdData, ProcessedData } from './dataLoader';
import type { FilterState } from '../types/filter';

export interface WeeklyStats {
  weekday: string;
  englishDay: string;
  totalEntries: number;
  avgCrowdLevel: number;
  peakHour: number;
  peakCount: number;
  quietHour: number;
  quietCount: number;
  hourlyData: ProcessedData[];
}

export interface OverallStats {
  totalEntries: number;
  averageCrowdLevel: number;
  peakWeekday: string;
  quietWeekday: string;
  peakHour: number;
  quietHour: number;
  crowdDistribution: {
    empty: number;
    moderate: number;
    busy: number;
  };
}

export class DataProcessor {
  private static instance: DataProcessor;

  static getInstance(): DataProcessor {
    if (!DataProcessor.instance) {
      DataProcessor.instance = new DataProcessor();
    }
    return DataProcessor.instance;
  }

  filterData(data: CrowdData[], filter: FilterState): CrowdData[] {
    if (filter.period === 'all') {
      return data;
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (filter.period === 'custom') {
      if (!filter.startDate || !filter.endDate) {
        return data;
      }
      startDate = new Date(filter.startDate);
      endDate = new Date(filter.endDate);
      // Set end time to end of day
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Calculate date range for preset periods
      const daysMap = {
        week: 7,
        twoWeeks: 14,
        month: 30,
      };

      const days = daysMap[filter.period as keyof typeof daysMap];
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
    }

    return data.filter((item) => {
      if (!item.datetime) return true; // Keep items without datetime for backward compatibility

      const itemDate = new Date(item.datetime);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }

  processWeeklyData(data: CrowdData[], filter?: FilterState): WeeklyStats[] {
    const filteredData = filter ? this.filterData(data, filter) : data;

    const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const englishDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return weekdays.map((weekday, index) => {
      const englishDay = englishDays[index];
      const dayData = filteredData.filter((item) => item.weekday === englishDay);
      const hourlyData = this.aggregateHourlyData(dayData);

      const avgCrowdLevel = this.calculateAverageCrowdLevel(dayData);
      const peakHour = this.findPeakHour(hourlyData);
      const quietHour = this.findQuietHour(hourlyData);

      return {
        weekday,
        englishDay,
        totalEntries: dayData.length,
        avgCrowdLevel,
        peakHour: peakHour.hour,
        peakCount: peakHour.count,
        quietHour: quietHour.hour,
        quietCount: quietHour.count,
        hourlyData,
      };
    });
  }

  private aggregateHourlyData(data: CrowdData[]): ProcessedData[] {
    const hourlyMap = new Map<number, number[]>();

    // Initialize all hours (0-23)
    for (let hour = 0; hour < 24; hour++) {
      hourlyMap.set(hour, []);
    }

    // Group data by hour
    data.forEach((item) => {
      const hour = item.hour;
      const crowdValue = item.count; // Use actual count instead of status_code

      if (crowdValue !== null && typeof crowdValue === 'number') {
        const hourData = hourlyMap.get(hour) || [];
        hourData.push(crowdValue);
        hourlyMap.set(hour, hourData);
      }
    });

    // Calculate averages
    return Array.from(hourlyMap.entries()).map(([hour, values]) => ({
      weekday: '', // Will be set by caller
      hour,
      avgCount: values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
      dataPoints: values.length,
    }));
  }

  private convertCrowdLevelToNumber(crowdLevel: string | number): number | null {
    // If it's already a number (status_code), use it directly
    if (typeof crowdLevel === 'number') {
      return crowdLevel;
    }

    // If it's a string, parse it
    if (typeof crowdLevel === 'string') {
      if (crowdLevel.includes('空いている') || crowdLevel.includes('空き')) return 1;
      if (crowdLevel.includes('やや混雑') || crowdLevel.includes('やや')) return 2;
      if (crowdLevel.includes('混雑') || crowdLevel.includes('忙しい')) return 3;
      if (crowdLevel.includes('非常に混雑') || crowdLevel.includes('満員')) return 4;

      // Try to extract number if present
      const match = crowdLevel.match(/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  private calculateAverageCrowdLevel(data: CrowdData[]): number {
    const validData = data
      .map((item) => item.count)
      .filter((val) => val !== null && typeof val === 'number') as number[];

    return validData.length > 0 ? validData.reduce((sum, val) => sum + val, 0) / validData.length : 0;
  }

  private findPeakHour(hourlyData: ProcessedData[]): { hour: number; count: number } {
    let maxHour = 0;
    let maxCount = 0;

    hourlyData.forEach((data) => {
      if (data.avgCount > maxCount && data.dataPoints > 0) {
        maxCount = data.avgCount;
        maxHour = data.hour;
      }
    });

    return { hour: maxHour, count: maxCount };
  }

  private findQuietHour(hourlyData: ProcessedData[]): { hour: number; count: number } {
    let minHour = 0;
    let minCount = Infinity;

    hourlyData.forEach((data) => {
      if (data.avgCount < minCount && data.dataPoints > 0) {
        minCount = data.avgCount;
        minHour = data.hour;
      }
    });

    return {
      hour: minHour,
      count: minCount === Infinity ? 0 : minCount,
    };
  }

  calculateOverallStats(data: CrowdData[], filter?: FilterState): OverallStats {
    const weeklyStats = this.processWeeklyData(data, filter);
    const filteredData = filter ? this.filterData(data, filter) : data;

    // Find peak and quiet weekdays
    const peakWeekday = weeklyStats.reduce((peak, current) =>
      current.avgCrowdLevel > peak.avgCrowdLevel ? current : peak,
    );

    const quietWeekday = weeklyStats.reduce((quiet, current) =>
      current.avgCrowdLevel < quiet.avgCrowdLevel ? current : quiet,
    );

    // Calculate crowd distribution
    const crowdDistribution = this.calculateCrowdDistribution(filteredData);

    // Calculate overall peak and quiet hours directly from raw data
    const hourlyTotals = new Map<number, { sum: number; count: number }>();

    // Aggregate all data points by hour
    filteredData.forEach((item) => {
      const existing = hourlyTotals.get(item.hour) || { sum: 0, count: 0 };
      existing.sum += item.count;
      existing.count += 1;
      hourlyTotals.set(item.hour, existing);
    });

    let peakHour = 0;
    let peakAvg = 0;
    let quietHour = 0;
    let quietAvg = Infinity;

    // Calculate averages and find peak/quiet hours
    hourlyTotals.forEach((totals, hour) => {
      // Only consider hours with sufficient data points (at least 2 samples)
      if (totals.count >= 2) {
        const avg = totals.sum / totals.count;
        if (avg > peakAvg) {
          peakAvg = avg;
          peakHour = hour;
        }
        if (avg < quietAvg) {
          quietAvg = avg;
          quietHour = hour;
        }
      }
    });

    return {
      totalEntries: filteredData.length,
      averageCrowdLevel: this.calculateAverageCrowdLevel(filteredData),
      peakWeekday: peakWeekday.weekday,
      quietWeekday: quietWeekday.weekday,
      peakHour,
      quietHour,
      crowdDistribution,
    };
  }

  private calculateCrowdDistribution(data: CrowdData[]): { empty: number; moderate: number; busy: number } {
    let empty = 0;
    let moderate = 0;
    let busy = 0;

    data.forEach((item) => {
      const level = this.convertCrowdLevelToNumber(item.status_code);
      if (level === 1) empty++;
      else if (level === 2) moderate++;
      else if (level && level >= 3) busy++;
    });

    const total = empty + moderate + busy;

    return {
      empty: total > 0 ? Math.round((empty / total) * 100) : 0,
      moderate: total > 0 ? Math.round((moderate / total) * 100) : 0,
      busy: total > 0 ? Math.round((busy / total) * 100) : 0,
    };
  }

  generateInsights(stats: OverallStats, weeklyStats: WeeklyStats[]): string[] {
    const insights: string[] = [];

    // Helper function to format hour in 24-hour format
    const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

    // Peak time insights
    insights.push(`最も混雑する時間帯は${formatHour(stats.peakHour)}頃です`);
    insights.push(`最も空いている時間帯は${formatHour(stats.quietHour)}頃です`);

    // Weekday insights
    insights.push(`${stats.peakWeekday}が最も混雑する曜日です`);
    insights.push(`${stats.quietWeekday}が最も空いている曜日です`);

    // Distribution insights
    if (stats.crowdDistribution.empty > 50) {
      insights.push('施設は比較的空いている時間が多いです');
    }

    // Weekly pattern insights
    const weekendStats = weeklyStats.filter((day) => day.weekday === '土曜日' || day.weekday === '日曜日');
    const weekdayStats = weeklyStats.filter((day) => !['土曜日', '日曜日'].includes(day.weekday));

    const weekendAvg = weekendStats.reduce((sum, day) => sum + day.avgCrowdLevel, 0) / weekendStats.length;
    const weekdayAvg = weekdayStats.reduce((sum, day) => sum + day.avgCrowdLevel, 0) / weekdayStats.length;

    if (weekendAvg > weekdayAvg) {
      insights.push('週末は平日より混雑する傾向があります');
    } else {
      insights.push('平日の方が週末より混雑する傾向があります');
    }

    return insights.slice(0, 5); // Limit to 5 insights
  }
}
