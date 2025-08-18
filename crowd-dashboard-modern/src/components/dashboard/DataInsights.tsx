import { TimeRadialChart } from '../charts/TimeRadialChart';
import { WeeklyBarChart } from '../charts/WeeklyBarChart';
import { Legend } from '../ui/Legend';
import { InsightCard } from '../ui/InsightCard';
import { InsightIcons } from '../ui/InsightIcons';
import type { CrowdData } from '../../lib/dataLoader';
import '../../styles/spacing.css';
import '../../styles/typography.css';

interface DataInsightsProps {
  data: CrowdData[];
}

export function DataInsights({ data }: DataInsightsProps) {
  return (
    <div className="space-y-4">
      {/* Header Section - データインサイト */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Header Text Container */}
          <div className="flex flex-col">
            <h2 className="text-2xl text-optimized font-bold tracking-tight">データインサイト</h2>
            <p className="text-body-medium text-optimized text-gray-600">適用中の表示期間からわかる分析結果</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4">
        {/* Charts Container - 時間帯 */}
        <div className="flex flex-col xl:flex-row gap-4 w-full">
          {/* Chart Card - 時間帯 */}
          <div
            className="flex flex-col rounded-lg p-4 pt-6 lg:p-8 shadow-sm w-full xl:flex-shrink-0 xl:self-start xl:w-auto bg-gray-200"
          >
            <div className="flex justify-center">
              <div className="w-[220px] h-[180px] sm:w-[240px] sm:h-[200px] lg:w-[265px] lg:h-[232px]">
                <TimeRadialChart data={data} />
              </div>
            </div>
          </div>

          {/* Text Section - 時間帯の説明 */}
          <div className="flex flex-col gap-2 lg:gap-3">
            {/* Header with icon and title */}
            <div className="flex items-center gap-2" style={{ alignItems: 'baseline' }}>
              <div className="bg-gray-100 rounded-full p-1.5 w-7 h-7 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#09090B" strokeWidth="1.33" fill="none" />
                  <path d="M8 4V8L11 11" stroke="#09090B" strokeWidth="1.33" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-xl text-optimized font-medium text-gray-600">時間帯</h3>
            </div>

            {/* Legend Container */}
            <div className="py-2">
              <Legend
                items={[
                  { color: '#FF5E5E', label: 'ピーク', width: 'lg' },
                  { color: 'white', label: '10人未満', width: 'lg' },
                ]}
                backgroundColor="transparent"
              />
            </div>

            {/* Structured Content */}
            <InsightCard
              items={[
                {
                  title: '平日の傾向',
                  content: '夕方から夜にかけて人数が最も多くなります。平日のデータが強く反映されています。',
                  icon: <InsightIcons.Weekday />,
                  highlight: true,
                },
                {
                  title: '休日の傾向',
                  content: '午前10時〜12時、夕方16時〜19時の2つのピークがあります。平日とは異なるパターンを示します。',
                  icon: <InsightIcons.Weekend />,
                },
                {
                  title: 'データ特性',
                  content: '表示されるデータは平日と休日の混合ですが、平日のデータがより強く反映されています。',
                  icon: <InsightIcons.Info />,
                },
              ]}
            />
          </div>
        </div>

        {/* Charts Container - 曜日 */}
        <div className="flex flex-col xl:flex-row gap-4 w-full">
          {/* Chart Card - 曜日 */}
          <div
            className="flex flex-col rounded-lg p-4 lg:p-8 shadow-sm w-full xl:flex-shrink-0 xl:self-start xl:w-auto bg-gray-200"
          >
            <div className="flex justify-center">
              <div className="w-[220px] h-[180px] sm:w-[240px] sm:h-[200px] lg:w-[265px] lg:h-[232px]">
                <WeeklyBarChart data={data} />
              </div>
            </div>
          </div>

          {/* Text Section - 曜日の説明 */}
          <div className="flex flex-col gap-2 lg:gap-3">
            {/* Header with icon and title */}
            <div className="flex items-center gap-2" style={{ alignItems: 'baseline' }}>
              <div className="bg-gray-100 rounded-full p-1.5 w-7 h-7 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="2" y="2.67" width="12" height="12" rx="1" stroke="#09090B" strokeWidth="1.33" fill="none" />
                  <path
                    d="M5.33 1.33V2.67M10.67 1.33V2.67M2 6.67H14"
                    stroke="#09090B"
                    strokeWidth="1.33"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="text-xl text-optimized font-medium text-gray-600">曜日</h3>
            </div>

            {/* Legend Container */}
            <div className="py-2">
              <Legend
                items={[
                  { color: '#FF5E5E', label: '最も多い', width: 'lg' },
                  { color: 'white', label: '最も少ない', width: 'lg' },
                ]}
                backgroundColor="transparent"
              />
            </div>

            {/* Structured Content */}
            <InsightCard
              items={[
                {
                  title: '最も混雑',
                  content: '火曜日が最も混雑する傾向があります。平日の中でも特に利用者が多い日です。',
                  icon: <InsightIcons.Peak />,
                  highlight: true,
                },
                {
                  title: '最も空いている',
                  content: '水曜日が最も空いている傾向があります。週の中で最も利用しやすい時間帯です。',
                  icon: <InsightIcons.Weekday />,
                },
                {
                  title: '週末の特徴',
                  content: '土日は平日と異なる行動パターンを示し、混雑度にも独特の変化が現れます。',
                  icon: <InsightIcons.Weekend />,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}