import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import type { ChartOptions, TooltipItem } from 'chart.js';
import type { ProcessedData } from './dataLoader';
import type { WeeklyStats } from './dataProcessor';
import type { Language } from './translations';
import { translations } from './translations';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, annotationPlugin);

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor: string | string[];
    borderWidth: number;
  }[];
}

export class ChartConfig {
  static createBarChartOptions(_weekday: string, weeklyStats?: WeeklyStats, language: Language = 'en'): ChartOptions<'bar'> {
    const t = (key: keyof typeof translations.en) => translations[language][key];
    // Calculate average from hourly data
    let averagePeople = 0;
    if (weeklyStats && weeklyStats.hourlyData) {
      const validData = weeklyStats.hourlyData.filter((h: ProcessedData) => h.dataPoints > 0);
      if (validData.length > 0) {
        const sum = validData.reduce((acc: number, h: ProcessedData) => acc + h.avgCount, 0);
        averagePeople = sum / validData.length;
      }
    }
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: t('averagePeople'),
            color: 'rgb(107, 114, 128)',
            font: {
              size: 14,
              family: 'Inter, sans-serif',
              weight: 500,
            },
          },
          ticks: {
            color: 'rgb(107, 114, 128)', // gray-500
            font: {
              size: 12,
              family: 'Inter, sans-serif',
            },
            padding: 8,
            callback: function (value) {
              return value.toString();
            },
          },
          grid: {
            color: 'rgba(113, 113, 122, 0.1)', // zinc-500 with opacity
            drawTicks: false,
          },
          border: {
            display: false,
          },
        },
        x: {
          title: {
            display: true,
            text: t('timeLabel'),
            color: 'rgb(107, 114, 128)',
            font: {
              size: 14,
              family: 'Inter, sans-serif',
              weight: 500,
            },
          },
          ticks: {
            color: 'rgb(107, 114, 128)', // gray-500
            font: {
              size: 11,
              family: 'Inter, sans-serif',
            },
            maxRotation: 45,
            minRotation: 0,
            padding: 8,
          },
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgb(113, 113, 122)', // zinc-500
          borderWidth: 1,
          callbacks: {
            title: function (context: TooltipItem<'bar'>[]) {
              const hour = context[0].dataIndex;
              return `${hour}:00 - ${hour + 1}:00`;
            },
            label: function (context: TooltipItem<'bar'>) {
              const value = context.parsed.y;
              return `${t('averagePeople')}: ${Math.round(value)}${t('peopleUnit')}`;
            },
          },
        },
        annotation: {
          annotations: {
            averageLine: {
              type: 'line',
              yMin: averagePeople,
              yMax: averagePeople,
              borderColor: 'rgb(34, 197, 94)', // green-500
              borderWidth: 2,
              borderDash: [6, 4],
              label: {
                display: false, // ラベルを非表示に
              },
            },
          },
        },
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart',
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
    };
  }

  static createChartData(hourlyData: { hour: number; avgCount: number; dataPoints: number }[], language: Language = 'en'): ChartData {
    const t = (key: keyof typeof translations.en) => translations[language][key];
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const data = Array.from({ length: 24 }, (_, hour) => {
      const hourData = hourlyData.find((d) => d.hour === hour);
      return hourData?.dataPoints && hourData.dataPoints > 0 ? hourData.avgCount || 0 : 0;
    });

    // Generate colors - zinc palette for data, lighter zinc for no data
    const backgroundColor = data.map((value) => {
      if (value === 0) return 'rgba(161, 161, 170, 0.3)'; // zinc-400 for no data
      return 'rgba(113, 113, 122, 0.8)'; // zinc-500 for all data
    });

    const borderColor = backgroundColor.map((color) => color.replace('0.8', '1').replace('0.3', '0.6'));

    return {
      labels,
      datasets: [
        {
          label: t('averagePeople'),
          data,
          backgroundColor,
          borderColor,
          borderWidth: 2,
        },
      ],
    };
  }

  static getColorForCrowdLevel(level: number): string {
    if (level === 0) return 'text-gray-500';
    if (level <= 1.5) return 'text-lime-600';
    if (level <= 2.5) return 'text-yellow-600';
    if (level <= 3.5) return 'text-orange-600';
    return 'text-red-600';
  }

  static getCrowdLevelText(level: number, language: Language = 'en'): string {
    const t = (key: keyof typeof translations.en) => translations[language][key];
    if (level === 0) return t('noCrowdData');
    if (level <= 1.5) return t('notCrowded');
    if (level <= 2.5) return t('slightlyCrowded');
    if (level <= 3.5) return t('crowded');
    return t('veryCrowded');
  }
}
