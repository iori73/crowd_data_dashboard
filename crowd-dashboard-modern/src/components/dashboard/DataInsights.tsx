import { TimeRadialChart } from '../charts/TimeRadialChart';
import { WeeklyBarChart } from '../charts/WeeklyBarChart';
import { TextSection } from '../ui/TextSection';
import { TimeIcon } from '../ui/TimeIcon';
import { CalendarIcon } from '../ui/CalendarIcon';
import type { CrowdData } from '../../lib/dataLoader';
import type { FilterState } from '../../types/filter';
import { useTranslation } from '../../hooks/useTranslation';
import type { Language } from '../../lib/translations';
import '../../styles/spacing.css';
import '../../styles/typography.css';

interface DataInsightsProps {
  data: CrowdData[];
  currentFilter: FilterState;
  language: Language;
}

export function DataInsights({ data, currentFilter, language }: DataInsightsProps) {
  const { t } = useTranslation(language);
  // フィルター期間に応じた説明文を生成
  const getFilterDescription = () => {
    switch (currentFilter.period) {
      case 'week':
        return t('lastWeekAnalysis');
      case 'twoWeeks':
        return t('lastTwoWeeksAnalysis');
      case 'month':
        return t('lastMonthAnalysis');
      case 'custom':
        if (currentFilter.startDate && currentFilter.endDate) {
          const start = new Date(currentFilter.startDate).toLocaleDateString();
          const end = new Date(currentFilter.endDate).toLocaleDateString();
          return `${start} - ${end}: ${t('customPeriodAnalysis')}`;
        }
        return t('customPeriodAnalysis');
      case 'all':
      default:
        return t('allDataAnalysis');
    }
  };

  return (
    <section className="mt-20">
      {/* Header Section - データインサイト */}
      <section>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Header Text Container */}
          <div className="flex flex-col">
            <h2 className="text-3xl text-optimized font-bold tracking-tight">{t('dataInsights')}</h2>
            <p className="text-lg text-optimized text-gray-600">{getFilterDescription()}</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-8 mt-4">
        {/* Chart Container - 時間帯 (Figma Design) */}
        <div className="flex flex-col gap-4 items-start justify-start relative w-full">
          {/* Header Section with Time Icon */}
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center">
              <TimeIcon className="text-gray-600" />
            </div>
            <h3 className="text-2xl font-medium text-gray-600">{t('timeZone')}</h3>
          </div>

          {/* Chart Card */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 flex flex-col gap-4 items-center justify-center p-4 relative shrink-0 w-full max-w-md aspect-square mx-auto md:mx-0">
            <div className="flex justify-center items-center h-full w-full">
              <div className="w-full h-full">
                <TimeRadialChart data={data} />
              </div>
            </div>
          </div>

          {/* Text Section */}
          <TextSection
            items={[
              {
                title: t('weekdayTrend'),
                content: t('weekdayTrendDesc'),
              },
              {
                title: t('weekendTrend'),
                content: t('weekendTrendDesc'),
              },
            ]}
          />
        </div>

        {/* Day Chart Container - 曜日 (Figma Design) */}
        <div className="flex flex-col gap-4 items-start justify-start relative w-full">
          {/* Header Section with Calendar Icon */}
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-lg bg-white flex items-center justify-center">
              <CalendarIcon className="text-gray-600" />
            </div>
            <h3 className="text-2xl font-medium text-gray-600">{t('dayOfWeek')}</h3>
          </div>

          {/* Chart Card */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 flex flex-col gap-4 items-center justify-center p-4 relative shrink-0 w-full max-w-md aspect-square mx-auto md:mx-0">
            <div className="flex justify-center items-center h-full w-full">
              <WeeklyBarChart data={data} language={language} />
            </div>
          </div>

          {/* Text Section */}
          <div className="w-full mx-auto md:mx-0">
            <TextSection
              items={[
                {
                  title: t('mostCrowded'),
                  content: t('mostCrowdedDesc'),
                  color: '#ef4444',
                },
                {
                  title: t('leastCrowded'),
                  content: t('leastCrowdedDesc'),
                  color: '#9ca3af',
                },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}