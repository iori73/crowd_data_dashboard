import { useState, useEffect } from 'react';
import { Header } from './components/dashboard/Header';
import { StatisticsSummary } from './components/dashboard/StatisticsSummary';
import { WeeklyChartsGrid } from './components/dashboard/WeeklyChartsGrid';
import { DataInsights } from './components/dashboard/DataInsights';
import { HelpSection } from './components/dashboard/HelpSection';
import { Footer } from './components/dashboard/Footer';
import { DataLoader } from './lib/dataLoader';
import { DataProcessor } from './lib/dataProcessor';
import { ExportUtils } from './lib/exportUtils';
import type { CrowdData } from './lib/dataLoader';
import type { WeeklyStats, OverallStats } from './lib/dataProcessor';

function App() {
  const [data, setData] = useState<CrowdData[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dataLoader = DataLoader.getInstance();
  const dataProcessor = DataProcessor.getInstance();

  const loadData = async (forceReload = false) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading crowd data...');
      const loadedData = await dataLoader.loadCSVData(forceReload);
      
      if (loadedData.length === 0) {
        throw new Error('データが見つかりませんでした');
      }

      console.log('📊 Processing data...');
      const processedWeeklyStats = dataProcessor.processWeeklyData(loadedData);
      const processedOverallStats = dataProcessor.calculateOverallStats(loadedData);
      const generatedInsights = dataProcessor.generateInsights(processedOverallStats, processedWeeklyStats);

      setData(loadedData);
      setWeeklyStats(processedWeeklyStats);
      setOverallStats(processedOverallStats);
      setInsights(generatedInsights);

      console.log('✅ Data loaded and processed successfully');
      
      if (forceReload) {
        ExportUtils.showToast('データを更新しました', 'success');
      }
    } catch (err) {
      console.error('❌ Error loading data:', err);
      const errorMessage = err instanceof Error ? err.message : 'データの読み込みに失敗しました';
      setError(errorMessage);
      ExportUtils.showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const handleExportJSON = () => {
    if (!overallStats || weeklyStats.length === 0) {
      ExportUtils.showToast('エクスポートするデータがありません', 'warning');
      return;
    }

    ExportUtils.exportToJSON(data, overallStats, weeklyStats);
    ExportUtils.showToast('JSONファイルをダウンロードしました', 'success');
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      ExportUtils.showToast('エクスポートするデータがありません', 'warning');
      return;
    }

    ExportUtils.exportToCSV(data);
    ExportUtils.showToast('CSVファイルをダウンロードしました', 'success');
  };

  useEffect(() => {
    loadData();
  }, []);

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">😞</div>
          <h2 className="error-title">データの読み込みエラー</h2>
          <p className="error-message">{error}</p>
          <button
            onClick={() => loadData(true)}
            className="error-retry-button"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        onRefresh={handleRefresh}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        isLoading={loading}
      />

      <main className="main">
        <div className="container">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">データを読み込み中...</p>
            </div>
          ) : (
            <>
              {/* Page Header */}
              <div className="page-header">
                <h2 className="page-title">曜日別・時間別 混雑状況分析</h2>
                <p className="page-subtitle">
                  フィットネス施設の混雑パターンを可視化し、最適な利用時間を特定できます
                </p>
              </div>

              {/* Statistics Summary */}
              {overallStats && <StatisticsSummary stats={overallStats} />}

              {/* Charts Grid */}
              <WeeklyChartsGrid weeklyStats={weeklyStats} />

              {/* Data Insights */}
              {insights.length > 0 && <DataInsights insights={insights} />}

              {/* Help Section */}
              <HelpSection />
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default App;