import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/dashboard/Header';
import { StatisticsSummary } from './components/dashboard/StatisticsSummary';
import { WeeklyChartsGrid } from './components/dashboard/WeeklyChartsGrid';
import { DataInsights } from './components/dashboard/DataInsights';
import { HelpSection } from './components/dashboard/HelpSection';
import { Footer } from './components/dashboard/Footer';

import { DataLoader } from './lib/dataLoader';
import { DataProcessor } from './lib/dataProcessor';
import { ExportUtils } from './lib/exportUtils';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/toaster';
import type { CrowdData } from './lib/dataLoader';
import type { WeeklyStats, OverallStats } from './lib/dataProcessor';
import type { FilterState } from './types/filter';

function App() {
  const [data, setData] = useState<CrowdData[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterState>({
    period: 'all',
    startDate: null,
    endDate: null,
  });

  const dataLoader = DataLoader.getInstance();
  const dataProcessor = DataProcessor.getInstance();

  const loadData = useCallback(
    async (forceReload = false) => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Loading crowd data...');
        const loadedData = await dataLoader.loadCSVData(forceReload);

        if (loadedData.length === 0) {
          throw new Error('データが見つかりませんでした');
        }

        setData(loadedData);

        console.log('✅ Data loaded and processed successfully');

        if (forceReload) {
          ExportUtils.showToast('データを更新しました', 'success');
        } else {
          // 初回読み込み完了の確認
          setTimeout(() => {
            ExportUtils.showToast('データの読み込みが完了しました', 'success');
          }, 500);
        }
      } catch (err) {
        console.error('❌ Error loading data:', err);
        const errorMessage = err instanceof Error ? err.message : 'データの読み込みに失敗しました';
        setError(errorMessage);
        ExportUtils.showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    },
    [dataLoader],
  );

  const handleRefresh = () => {
    loadData(true);
  };

  const handleFilterChange = (newFilter: FilterState) => {
    console.log('🔍 Applying filter:', newFilter);
    setCurrentFilter(newFilter);
    ExportUtils.showToast('フィルターが適用されました', 'success');
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
  }, [loadData]);

  // Re-process data when filter changes
  useEffect(() => {
    if (data.length > 0) {
      const processedWeeklyStats = dataProcessor.processWeeklyData(data, currentFilter);
      const processedOverallStats = dataProcessor.calculateOverallStats(data, currentFilter);
      setWeeklyStats(processedWeeklyStats);
      setOverallStats(processedOverallStats);
    }
  }, [currentFilter, data, dataProcessor]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">データの読み込みに失敗しました</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => loadData(true)} 
                className="min-h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                再度試行する
              </Button>
              <p className="text-sm text-gray-500">
                問題が続く場合は、ネットワーク接続を確認してください
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <Header
        onRefresh={handleRefresh}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
        onFilterChange={handleFilterChange}
        isLoading={loading}
        currentFilter={currentFilter}
      />

      <main className="flex-1">
        <div className="container mx-auto space-y-8 sm:space-y-6 px-4 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 md:pb-12">
          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-gray-900">データを読み込み中</p>
                <p className="text-sm text-gray-600">混雑状況データを解析しています...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Page Header */}
              <header className="flex flex-col space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">曜日別・時間別 混雑状況分析</h1>
                <p className="text-gray-700 text-lg leading-relaxed">
                  フィットネス施設の混雑パターンを可視化し、最適な利用時間を特定できます
                </p>
              </header>

              {/* Statistics Summary */}
              {overallStats && (
                <section className="space-y-3">
                  <StatisticsSummary stats={overallStats} />
                </section>
              )}

              {/* Data Insights */}
              <section className="space-y-4">
                <DataInsights data={data} />
              </section>

              {/* Charts Grid */}
              <section className="space-y-4">
              
                <h2 className="text-2xl text-optimized font-bold tracking-tight">週間分析</h2>
                <WeeklyChartsGrid weeklyStats={weeklyStats} />
              </section>

              {/* Help Section */}
              <section className="space-y-4">
                <HelpSection />
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}

export default App;
