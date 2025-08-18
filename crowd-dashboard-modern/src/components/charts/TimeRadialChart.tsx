import { useMemo } from 'react';
import type { CrowdData } from '@/lib/dataLoader';

interface TimeRadialChartProps {
  data: CrowdData[];
  className?: string;
}

export function TimeRadialChart({ data, className = '' }: TimeRadialChartProps) {
  const hourlyData = useMemo(() => {
    const hourlyStats: { [hour: number]: { total: number; count: number } } = {};

    // 0-23時の初期化
    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = { total: 0, count: 0 };
    }

    // データの集計
    data.forEach((record) => {
      const hour = record.hour;
      const count = record.count;

      if (hour >= 0 && hour < 24 && count >= 0) {
        hourlyStats[hour].total += count;
        hourlyStats[hour].count += 1;
      }
    });

    // 平均と正規化値の計算
    const processedData = Object.keys(hourlyStats).map((hourStr) => {
      const hour = parseInt(hourStr);
      const stat = hourlyStats[hour];
      const average = stat.count > 0 ? stat.total / stat.count : 0;
      return { hour, average };
    });

    // 正規化（最大値を基準に0-1の範囲に変換）
    const maxAverage = Math.max(...processedData.map((h) => h.average));
    return processedData.map((h) => ({
      ...h,
      normalizedValue: maxAverage > 0 ? h.average / maxAverage : 0,
    }));
  }, [data]);

  // SVG設定（Figmaサイズに合わせる）- 僅かに大きく調整
  const center = 125;
  const baseRadius = 34;
  const maxRadius = 82;

  // 時間ラベルの生成（Figmaに合わせて8つ）
  const timeLabels = [
    { hour: 0, label: '0:00', iconPath: '/icons/moon-zzz.svg' },
    { hour: 3, label: '3:00', iconPath: null },
    { hour: 6, label: '6:00', iconPath: '/icons/sunrise-fill.svg' },
    { hour: 9, label: '9:00', iconPath: null },
    { hour: 12, label: '12:00', iconPath: '/icons/sun-max-fill.svg' },
    { hour: 15, label: '15:00', iconPath: null },
    { hour: 18, label: '18:00', iconPath: '/icons/sunset-fill.svg' },
    { hour: 21, label: '21:00', iconPath: null },
  ];

  // 最大平均値を持つ時間帯を特定
  const maxAverage = Math.max(...hourlyData.map((h) => h.average));
  const peakHours = hourlyData.filter((h) => h.average === maxAverage && h.average > 0).map((h) => h.hour);

  // 放射状の線を生成
  const radialLines = hourlyData.map((hourData) => {
    const hour = hourData.hour;
    const angle = hour * 15 - 90; // 0時を上にするため-90度
    const angleRad = (angle * Math.PI) / 180;

    // 混雑レベルに応じた線の長さ
    const lineLength = baseRadius + hourData.normalizedValue * (maxRadius - baseRadius);

    const startX = center + baseRadius * Math.cos(angleRad);
    const startY = center + baseRadius * Math.sin(angleRad);
    const endX = center + lineLength * Math.cos(angleRad);
    const endY = center + lineLength * Math.sin(angleRad);

    // 主要な時間かどうか
    const isMajorHour = [0, 3, 6, 9, 12, 15, 18, 21].includes(hour);

    // 色の決定ロジック
    let strokeColor;
    if (hourData.average < 10) {
      strokeColor = '#FFFFFF'; // 10人未満は白
    } else if (peakHours.includes(hour)) {
      strokeColor = 'rgb(255, 94, 94)'; // 最も多い時間帯は赤
    } else {
      strokeColor = 'rgb(163, 163, 163)'; // それ以外はグレー
    }

    const strokeWidth = isMajorHour ? 4 : 3; // 主要時間で太さを決定
    const opacity = 0.8;

    return {
      startX,
      startY,
      endX,
      endY,
      strokeColor,
      strokeWidth,
      opacity,
      hour,
      average: hourData.average,
      isMajorHour,
    };
  });

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center ${className}`}>
      <svg width="100%" height="100%" viewBox="0 0 250 250" className="overflow-visible">
        {/* ベース円 */}
        <circle cx={125} cy={125} r={34} fill="none" stroke="rgba(163, 163, 163, 0.5)" strokeWidth="2" />

        {/* 最大範囲円 */}
        <circle cx={125} cy={125} r={82} fill="none" stroke="rgba(163, 163, 163, 0.3)" strokeWidth="2" />

        {/* 放射状の線 */}
        {radialLines.map((line) => (
          <line
            key={line.hour}
            x1={line.startX}
            y1={line.startY}
            x2={line.endX}
            y2={line.endY}
            stroke={line.strokeColor}
            strokeWidth={line.strokeWidth}
            opacity={line.opacity}
            strokeLinecap="round"
          />
        ))}

        {/* 時間ラベルとアイコン */}
        {timeLabels.map(({ hour, label, iconPath }) => {
          const angle = hour * 15 - 90;
          const angleRad = (angle * Math.PI) / 180;
          const labelRadius = 108;
          const x = 125 + labelRadius * Math.cos(angleRad);
          const y = 125 + labelRadius * Math.sin(angleRad);

          // 12:00の場合は位置を10px下に調整
          const yOffset = hour === 12 ? 10 : 0;

          return (
            <g key={hour}>
              {/* アイコン */}
              {iconPath && (
                <image x={x - 8} y={y - 28 + yOffset} width={16} height={16} href={iconPath} opacity={0.85} />
              )}
              {/* テキストラベル */}
              <text
                x={x}
                y={y + 4 + yOffset}
                textAnchor="middle"
                className="text-label-small font-normal fill-gray-600"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* 中央のドット */}
        <circle cx={125} cy={125} r="6" fill="#6B7280" />
      </svg>
    </div>
  );
}
