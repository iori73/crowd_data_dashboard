import { ChartCard } from '../charts/ChartCard';
import type { WeeklyStats } from '../../lib/dataProcessor';

interface WeeklyChartsGridProps {
  weeklyStats: WeeklyStats[];
}

export function WeeklyChartsGrid({ weeklyStats }: WeeklyChartsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {weeklyStats.map((stats) => (
        <ChartCard key={stats.englishDay} weeklyStats={stats} />
      ))}
    </div>
  );
}
