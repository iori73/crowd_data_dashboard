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
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';
import type { CrowdData } from './lib/dataLoader';
import type { WeeklyStats, OverallStats } from './lib/dataProcessor';
import type { FilterState } from '@/types/filter';

function App() {
  const [data, setData] = useState<CrowdData[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
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
      const generatedInsights = dataProcessor.generateInsights(processedOverallStats, processedWeeklyStats);

      setWeeklyStats(processedWeeklyStats);
      setOverallStats(processedOverallStats);
      setInsights(generatedInsights);
    }
  }, [currentFilter, data, dataProcessor]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertDescription className="text-center">
              <div className="text-4xl mb-4">😞</div>
              <h2 className="text-lg font-semibold mb-2">データの読み込みエラー</h2>
              <p className="mb-4">{error}</p>
              <Button onClick={() => loadData(true)} variant="outline">
                再試行
              </Button>
            </AlertDescription>
          </Alert>
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
        <div className="container mx-auto space-y-10 sm:space-y-6 px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 md:pb-12">
          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">データを読み込み中...</p>
            </div>
          ) : (
            <>
              {/* Page Header */}
              <div className="flex flex-col space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">曜日別・時間別 混雑状況分析</h1>
                <p className="text-muted-foreground">
                  フィットネス施設の混雑パターンを可視化し、最適な利用時間を特定できます
                </p>
              </div>

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
              
                <h2 className="text-headline-large text-optimized font-bold tracking-tight">週間分析</h2>
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
