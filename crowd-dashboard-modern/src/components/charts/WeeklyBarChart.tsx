import { useMemo } from 'react';
import type { CrowdData } from '../../lib/dataLoader';
import { useTranslation } from '../../hooks/useTranslation';
import type { Language } from '../../lib/translations';

interface WeeklyBarChartProps {
  data: CrowdData[];
  className?: string;
  language?: Language;
}

const DAYS_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function WeeklyBarChart({ data, className = '', language = 'en' }: WeeklyBarChartProps) {
  const { t } = useTranslation(language);
  
  const weeklyData = useMemo(() => {
    const weeklyStats = DAYS_ORDER.map((day) => ({
      day,
      total: 0,
      count: 0,
      average: 0,
    }));

    // データを曜日ごとに集計
    data.forEach((item) => {
      const dayIndex = DAYS_ORDER.indexOf(item.weekday);
      if (dayIndex !== -1 && item.count !== undefined && item.count > 0) {
        weeklyStats[dayIndex].total += item.count;
        weeklyStats[dayIndex].count += 1;
      }
    });

    // 平均を計算
    weeklyStats.forEach((stat) => {
      stat.average = stat.count > 0 ? stat.total / stat.count : 0;
    });

    const maxAverage = Math.max(...weeklyStats.map((s) => s.average));
    
    // 最も混雑している日と最も空いている日を特定
    const peakDayIndex = weeklyStats.reduce((maxIndex, stat, index) => 
      stat.average > weeklyStats[maxIndex].average ? index : maxIndex, 0
    );
    const leastCrowdedIndex = weeklyStats.reduce((minIndex, stat, index) => 
      stat.average < weeklyStats[minIndex].average ? index : minIndex, 0
    );

    return weeklyStats.map((stat, index) => {
      // 曜日の翻訳キーマッピング
      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
      
      return {
        ...stat,
        shortDay: t(dayKeys[index]),
        normalizedValue: maxAverage > 0 ? stat.average / maxAverage : (index === 2 ? 1 : 0.7), // デフォルトで火曜日をピークに
        isPeak: index === peakDayIndex || (maxAverage === 0 && index === 2), // データがない場合は火曜日をピークに
        isLeastCrowded: index === leastCrowdedIndex && maxAverage > 0, // 最も空いている日
      };
    });
  }, [data, t]);


  return (
    <div className={`box-border flex flex-row gap-4 items-end justify-center relative ${className}`}>
      {weeklyData.map((dayData) => {
        // バーの高さを正規化値に基づいて計算（80px - 180px の範囲）
        const minHeight = 60;
        const maxHeight = 180;
        const barHeight = minHeight + (dayData.normalizedValue * (maxHeight - minHeight));
        
        // 色の決定: ピーク日は赤、最も空いている日はライトグレー、その他はグレー
        let barColor;
        if (dayData.isPeak) {
          barColor = '#FF5E5E'; // 赤色
        } else if (dayData.isLeastCrowded) {
          barColor = 'rgb(229, 231, 235)'; // ライトグレー
        } else {
          barColor = '#9CA3AF'; // グレー
        }

        return (
          <div key={dayData.day} className="flex flex-col gap-3 items-center justify-end relative shrink-0">
            <div
              className="w-8 rounded-sm transition-all duration-200 hover:opacity-80"
              style={{
                height: `${barHeight}px`,
                backgroundColor: barColor,
              }}
            />
            <div className="font-medium text-[16px] text-zinc-900 tracking-[0.5px] leading-[1.2] whitespace-pre">
              {dayData.shortDay}
            </div>
          </div>
        );
      })}
    </div>
  );
}
