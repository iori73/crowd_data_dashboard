interface DataInsightsProps {
  insights: string[];
}

export function DataInsights({ insights }: DataInsightsProps) {
  return (
    <section className="insights-section">
      <h3 className="insights-title">データインサイト</h3>
      <div className="insights-grid" id="insights-container">
        {insights.map((insight, index) => (
          <div key={index} className="insight-card">
            <p className="insight-text">{insight}</p>
          </div>
        ))}
      </div>
    </section>
  );
}