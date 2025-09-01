import { Card, CardContent } from '../ui/card';
import { BarChart3, PieChart, Clock, Star } from 'lucide-react';
import type { OverallStats } from '../../lib/dataProcessor';
import { useTranslation } from '../../hooks/useTranslation';
import type { Language } from '../../lib/translations';

interface StatisticsSummaryProps {
  stats: OverallStats;
  language: Language;
}

export function StatisticsSummary({ stats, language }: StatisticsSummaryProps) {
  const { t } = useTranslation(language);
  
  const statsData = [
    {
      icon: BarChart3,
      label: t('totalData'),
      value: stats.totalEntries.toLocaleString(),
      description: t('recordedObservations'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: PieChart,
      label: t('averageCrowd'),
      value: stats.averageCrowdLevel.toFixed(1),
      description: t('overallAverage'),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Clock,
      label: t('peakTime'),
      value: `${stats.peakHour}:00`,
      description: t('mostCrowdedTime'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Star,
      label: t('quietTime'),
      value: `${stats.quietHour}:00`,
      description: t('leastCrowdedTime'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="min-h-[180px] border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg">
            <CardContent className="p-4 h-full flex flex-col gap-3">
              <div className="flex justify-start">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.bgColor} ${stat.color}`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-start">
                <p className="text-base font-medium text-gray-700 mb-1 tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">{stat.value}</p>
                <p className="text-base text-gray-600 leading-relaxed">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
