import type { OverallStats } from '@/lib/dataProcessor';

interface StatisticsSummaryProps {
  stats: OverallStats;
}

export function StatisticsSummary({ stats }: StatisticsSummaryProps) {
  return (
    <div className="stats-container">
      <div className="stats-card">
        <div className="stats-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="m19 9-5 5-4-4-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="stats-content">
          <h3 className="stats-label">総データ数</h3>
          <p className="stats-value">{stats.totalEntries.toLocaleString()}</p>
          <span className="stats-description">記録された観測数</span>
        </div>
      </div>
      
      <div className="stats-card">
        <div className="stats-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v20m0-20a10 10 0 0 1 10 10H12z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <div className="stats-content">
          <h3 className="stats-label">平均混雑度</h3>
          <p className="stats-value">{stats.averageCrowdLevel.toFixed(1)}</p>
          <span className="stats-description">全体の平均値</span>
        </div>
      </div>
      
      <div className="stats-card">
        <div className="stats-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="stats-content">
          <h3 className="stats-label">ピーク時間</h3>
          <p className="stats-value">{stats.peakHour}:00</p>
          <span className="stats-description">最も混雑する時間帯</span>
        </div>
      </div>
      
      <div className="stats-card">
        <div className="stats-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="stats-content">
          <h3 className="stats-label">最適時間</h3>
          <p className="stats-value">{stats.quietHour}:00</p>
          <span className="stats-description">最も空いている時間帯</span>
        </div>
      </div>
    </div>
  );
}