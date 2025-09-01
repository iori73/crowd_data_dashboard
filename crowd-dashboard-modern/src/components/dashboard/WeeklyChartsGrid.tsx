import { ChartCard } from '../charts/ChartCard';
import type { WeeklyStats } from '../../lib/dataProcessor';
import type { Language } from '../../lib/translations';

interface WeeklyChartsGridProps {
  weeklyStats: WeeklyStats[];
  language: Language;
}

export function WeeklyChartsGrid({ weeklyStats, language }: WeeklyChartsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {weeklyStats.map((stats) => (
        <ChartCard key={stats.englishDay} weeklyStats={stats} language={language} />
      ))}
    </div>
  );
}
