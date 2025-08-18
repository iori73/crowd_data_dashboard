import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, PieChart, Clock, Star } from 'lucide-react';
import type { OverallStats } from '@/lib/dataProcessor';

interface StatisticsSummaryProps {
  stats: OverallStats;
}

export function StatisticsSummary({ stats }: StatisticsSummaryProps) {
  const statsData = [
    {
      icon: BarChart3,
      label: '総データ数',
      value: stats.totalEntries.toLocaleString(),
      description: '記録された観測数',
      color: 'text-blue-600',
    },
    {
      icon: PieChart,
      label: '平均混雑度',
      value: stats.averageCrowdLevel.toFixed(1),
      description: '全体の平均値',
      color: 'text-green-600',
    },
    {
      icon: Clock,
      label: 'ピーク時間',
      value: `${stats.peakHour}:00`,
      description: '最も混雑する時間帯',
      color: 'text-orange-600',
    },
    {
      icon: Star,
      label: '最適時間',
      value: `${stats.quietHour}:00`,
      description: '最も空いている時間帯',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="min-h-[180px] border border-gray-200 shadow-sm">
            <CardContent className="p-4 h-full flex flex-col gap-3">
              <div className="flex justify-start">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 ${stat.color}`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-start">
                <p className="text-sm font-normal text-gray-900 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-label-small text-optimized text-gray-600 leading-normal">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
