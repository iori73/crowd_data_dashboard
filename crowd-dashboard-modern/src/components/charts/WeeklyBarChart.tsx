import { useMemo } from 'react';
import type { CrowdData } from '@/lib/dataLoader';

interface WeeklyBarChartProps {
  data: CrowdData[];
  className?: string;
}

const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function WeeklyBarChart({ data, className = '' }: WeeklyBarChartProps) {
  const weeklyData = useMemo(() => {
    const weeklyStats = DAYS_ORDER.map((day) => ({
      day,
      total: 0,
      count: 0,
      average: 0,
    }));

    // データを曜日ごとに集計
    data.forEach((item) => {
      const dayIndex = DAYS_ORDER.indexOf(item.weekday); // weekdayカラムを使用
      if (dayIndex !== -1 && item.count !== undefined && item.count > 0) {
        weeklyStats[dayIndex].total += item.count;
        weeklyStats[dayIndex].count += 1;
      }
    });

    // 平均を計算し、正規化
    weeklyStats.forEach((stat) => {
      stat.average = stat.count > 0 ? stat.total / stat.count : 0;
    });

    const maxAverage = Math.max(...weeklyStats.map((s) => s.average));

    return weeklyStats.map((stat, index) => ({
      ...stat,
      shortDay: DAYS_SHORT[index],
      normalizedValue: maxAverage > 0 ? stat.average / maxAverage : 0,
    }));
  }, [data]);


  return (
    <div className={`w-full h-full flex justify-center items-center ${className}`}>
      <div className="flex items-end justify-center space-x-4 h-[120px]">
        {weeklyData.map((dayData) => {
          // 実際のデータに基づいてバーの高さを計算
          const maxHeight = 98; // 最大高さ
          const minHeight = 58; // 最小高さ
          const maxAvgForHeight = Math.max(...weeklyData.map((d) => d.average));
          const barHeight =
            dayData.average > 0 ? minHeight + (dayData.average / maxAvgForHeight) * (maxHeight - minHeight) : minHeight;

          // 実際のデータに基づいて最高値と最低値を特定
          const averages = weeklyData.map((d) => d.average);
          const maxAverage = Math.max(...averages);
          const minAverage = Math.min(...averages.filter((avg) => avg > 0)); // 0より大きい値のみから最小値を取得

          const isHighest = dayData.average === maxAverage && dayData.average > 0;
          const isLowest = dayData.average === minAverage && dayData.average > 0;

          // 色の決定: 最高値は赤、最低値は白、その他はグレー
          let barColor;
          if (isHighest) {
            barColor = '#FF5E5E';
          } else if (isLowest) {
            barColor = '#fff';
          } else {
            barColor = '#A3A3A3';
          }

          return (
            <div key={dayData.day} className="flex flex-col items-center space-y-2">
              <div
                className="w-4"
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: barColor,
                  borderRadius: '4px 4px 0px 0px',
                  border: isLowest ? '1px solid #E5E7EB' : 'none',
                }}
              />
              <span className="text-label-small font-normal text-black tracking-wider">{dayData.shortDay}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
