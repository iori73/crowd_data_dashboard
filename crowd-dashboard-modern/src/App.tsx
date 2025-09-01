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
import { useTranslation } from './hooks/useTranslation';
import type { Language } from './lib/translations';

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
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const { t } = useTranslation(currentLanguage);

  const dataLoader = DataLoader.getInstance();
  const dataProcessor = DataProcessor.getInstance();

  // フィルタリングされたデータを計算
  const filteredData = dataProcessor.filterData(data, currentFilter);

  const loadData = useCallback(
    async (forceReload = false) => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔄 Loading crowd data...');
        const loadedData = await dataLoader.loadCSVData(forceReload);

        if (loadedData.length === 0) {
          // Get translations directly without dependency
          const errorMsg = currentLanguage === 'ja' ? 'データが見つかりませんでした' : 'No data found';
          throw new Error(errorMsg);
        }

        setData(loadedData);

        console.log('Data loaded and processed successfully');

        if (forceReload) {
          const refreshMsg = currentLanguage === 'ja' ? 'データを更新しました' : 'Data refreshed';
          ExportUtils.showToast(refreshMsg, 'success');
        } else {
          // 初回読み込み完了の確認
          setTimeout(() => {
            const loadedMsg = currentLanguage === 'ja' ? 'データの読み込みが完了しました' : 'Data loaded successfully';
            ExportUtils.showToast(loadedMsg, 'success');
          }, 500);
        }
      } catch (err) {
        console.error('❌ Error loading data:', err);
        const errorMessage = err instanceof Error ? err.message : 
          (currentLanguage === 'ja' ? 'データの読み込みに失敗しました' : 'Failed to load data');
        setError(errorMessage);
        ExportUtils.showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    },
    [dataLoader, currentLanguage],
  );

  const handleRefresh = () => {
    loadData(true);
  };

  const handleFilterChange = (newFilter: FilterState) => {
    console.log('🔍 Applying filter:', newFilter);
    setCurrentFilter(newFilter);
    ExportUtils.showToast(t('filterApplied'), 'success');
  };

  const handleExportJSON = () => {
    if (!overallStats || weeklyStats.length === 0) {
      const msg = currentLanguage === 'ja' ? 'エクスポートするデータがありません' : 'No data to export';
      ExportUtils.showToast(msg, 'warning');
      return;
    }

    ExportUtils.exportToJSON(data, overallStats, weeklyStats);
    const msg = currentLanguage === 'ja' ? 'JSONファイルをダウンロードしました' : 'JSON file downloaded';
    ExportUtils.showToast(msg, 'success');
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      const msg = currentLanguage === 'ja' ? 'エクスポートするデータがありません' : 'No data to export';
      ExportUtils.showToast(msg, 'warning');
      return;
    }

    ExportUtils.exportToCSV(data);
    const msg = currentLanguage === 'ja' ? 'CSVファイルをダウンロードしました' : 'CSV file downloaded';
    ExportUtils.showToast(msg, 'success');
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('dataLoadError')}</h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => loadData(true)}
                className="min-h-[44px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {t('retryAgain')}
              </Button>
              <p className="text-base text-gray-500">{t('networkIssue')}</p>
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
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 md:pb-12">
          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-medium text-gray-900">{t('loadingData')}</p>
                <p className="text-base text-gray-600">{t('analyzingCrowdData')}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Page Header */}
              <header className="flex flex-col space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{t('mainTitle')}</h1>
                <p className="text-gray-700 text-xl leading-relaxed">{t('mainSubtitle')}</p>
              </header>

              {/* Statistics Summary */}
              {overallStats && (
                <section className="space-y-3 mt-8">
                  <StatisticsSummary stats={overallStats} language={currentLanguage} />
                </section>
              )}

              {/* Data Insights */}
              <section>
                <DataInsights data={filteredData} currentFilter={currentFilter} language={currentLanguage} />
              </section>

              {/* Charts Grid */}
              <section className="space-y-4 mt-20">
                <h2 className="text-3xl text-optimized font-bold tracking-tight">{t('weeklyAnalysis')}</h2>
                <WeeklyChartsGrid weeklyStats={weeklyStats} language={currentLanguage} />
              </section>

              {/* Help Section */}
              <section className="space-y-4 mt-20">
                <HelpSection language={currentLanguage} />
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
