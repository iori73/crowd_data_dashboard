import { ChartCard } from '@/components/charts/ChartCard';
import type { WeeklyStats } from '@/lib/dataProcessor';

interface WeeklyChartsGridProps {
  weeklyStats: WeeklyStats[];
}

export function WeeklyChartsGrid({ weeklyStats }: WeeklyChartsGridProps) {
  return (
    <div className="charts-grid">
      {weeklyStats.map((stats) => (
        <ChartCard key={stats.englishDay} weeklyStats={stats} />
      ))}
    </div>
  );
}