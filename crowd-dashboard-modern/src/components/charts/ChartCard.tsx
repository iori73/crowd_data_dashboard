import { Bar } from 'react-chartjs-2';
import { ChartConfig } from '../../lib/chartConfig';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { BarChart3, Database, AlertTriangle } from 'lucide-react';
import type { WeeklyStats } from '../../lib/dataProcessor';
import { useTranslation } from '../../hooks/useTranslation';
import type { Language } from '../../lib/translations';

interface ChartCardProps {
  weeklyStats: WeeklyStats;
  language: Language;
}

export function ChartCard({ weeklyStats, language }: ChartCardProps) {
  const { t } = useTranslation(language);
  const chartData = ChartConfig.createChartData(weeklyStats.hourlyData, language);
  const chartOptions = ChartConfig.createBarChartOptions(weeklyStats.weekday, weeklyStats, language);

  const getDataIndicator = () => {
    if (weeklyStats.totalEntries === 0) {
      return {
        variant: 'destructive' as const,
        icon: AlertTriangle,
        text: t('noData'),
      };
    } else if (weeklyStats.totalEntries < 10) {
      return {
        variant: 'secondary' as const,
        icon: Database,
        text: t('limitedData'),
      };
    } else {
      return {
        variant: 'default' as const,
        icon: BarChart3,
        text: t('sufficientData'),
      };
    }
  };

  const indicator = getDataIndicator();
  const IconComponent = indicator.icon;
  
  // 曜日名を翻訳
  const getTranslatedWeekday = () => {
    const dayMap: { [key: string]: keyof typeof import('../../lib/translations').translations.en } = {
      '日曜日': 'sunday',
      '月曜日': 'monday', 
      '火曜日': 'tuesday',
      '水曜日': 'wednesday',
      '木曜日': 'thursday',
      '金曜日': 'friday',
      '土曜日': 'saturday',
    };
    
    const translationKey = dayMap[weeklyStats.weekday];
    return translationKey ? t(translationKey) : weeklyStats.weekday;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">{getTranslatedWeekday()}</CardTitle>
        <Badge variant={indicator.variant} className="shrink-0">
          <IconComponent className="mr-1 h-3 w-3" />
          {indicator.text}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="h-[200px] w-full">
          {weeklyStats.totalEntries > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">{t('noData')}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 min-h-[44px]">
        <div className="flex items-center text-sm text-muted-foreground">
          <div className="h-3 w-3 rounded-full bg-green-600"></div>
          <span className="ml-2">{t('averagePeople')}</span>
          <div
            className="ml-2 px-2 py-1 rounded text-sm font-medium"
            style={{ backgroundColor: '#e1efe5', color: '#1c963a' }}
          >
{Math.round(weeklyStats.avgCrowdLevel)}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
