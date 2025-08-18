import { Bar } from 'react-chartjs-2';
import { ChartConfig } from '../../lib/chartConfig';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { BarChart3, Database, AlertTriangle } from 'lucide-react';
import type { WeeklyStats } from '../../lib/dataProcessor';

interface ChartCardProps {
  weeklyStats: WeeklyStats;
}

export function ChartCard({ weeklyStats }: ChartCardProps) {
  const chartData = ChartConfig.createChartData(weeklyStats.hourlyData);
  const chartOptions = ChartConfig.createBarChartOptions(weeklyStats.weekday, weeklyStats);

  const getDataIndicator = () => {
    if (weeklyStats.totalEntries === 0) {
      return {
        variant: 'destructive' as const,
        icon: AlertTriangle,
        text: 'データなし',
      };
    } else if (weeklyStats.totalEntries < 10) {
      return {
        variant: 'secondary' as const,
        icon: Database,
        text: 'データ少',
      };
    } else {
      return {
        variant: 'default' as const,
        icon: BarChart3,
        text: 'データ充分',
      };
    }
  };

  const indicator = getDataIndicator();
  const IconComponent = indicator.icon;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold">{weeklyStats.weekday}</CardTitle>
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
                <p className="mt-2 text-sm text-muted-foreground">データなし</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 min-h-[44px]">
        <div className="flex items-center text-sm text-muted-foreground">
          <div className="h-3 w-3 rounded-full bg-green-600"></div>
          <span className="ml-2">平均人数</span>
          <div
            className="ml-2 px-2 py-1 rounded text-sm font-medium"
            style={{ backgroundColor: '#e1efe5', color: '#1c963a' }}
          >
            {Math.round(weeklyStats.avgCrowdLevel)}人
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
