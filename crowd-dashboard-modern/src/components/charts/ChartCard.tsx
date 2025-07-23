import { Bar } from 'react-chartjs-2';
import { ChartConfig } from '@/lib/chartConfig';
import type { WeeklyStats } from '@/lib/dataProcessor';

interface ChartCardProps {
  weeklyStats: WeeklyStats;
}

export function ChartCard({ weeklyStats }: ChartCardProps) {
  const chartData = ChartConfig.createChartData(weeklyStats.hourlyData);
  const chartOptions = ChartConfig.createBarChartOptions(weeklyStats.weekday);

  const getDataIndicator = () => {
    if (weeklyStats.totalEntries === 0) {
      return { status: 'no-data', text: 'データなし' };
    } else if (weeklyStats.totalEntries < 10) {
      return { status: 'low-data', text: 'データ少' };
    } else {
      return { status: 'sufficient-data', text: 'データ充分' };
    }
  };

  const indicator = getDataIndicator();

  return (
    <div className="chart-card" data-weekday={weeklyStats.englishDay.toLowerCase()}>
      <div className="chart-header">
        <h3 className="chart-title">{weeklyStats.weekday}</h3>
        <div className={`data-indicator ${indicator.status}`}>
          <span className="indicator-dot"></span>
          <span className="indicator-text">{indicator.text}</span>
        </div>
      </div>
      
      <div className="chart-body">
        {weeklyStats.totalEntries > 0 ? (
          <div className="chart-wrapper">
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="no-data-container">
            <div className="no-data-content">
              <div className="no-data-icon">📊</div>
              <div className="no-data-text">データがありません</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="chart-footer">
        <div className="legend-item">
          <span className="legend-dot"></span>
          <span className="legend-text">平均人数</span>
        </div>
      </div>
    </div>
  );
}