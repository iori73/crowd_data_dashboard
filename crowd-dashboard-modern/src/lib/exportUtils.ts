import type { CrowdData } from './dataLoader';
import type { WeeklyStats, OverallStats } from './dataProcessor';

export class ExportUtils {
  static exportToJSON(data: CrowdData[], stats: OverallStats, weeklyStats: WeeklyStats[]): void {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: data.length,
        version: '2.0'
      },
      overallStats: stats,
      weeklyStats: weeklyStats,
      rawData: data
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `crowd-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('📄 JSON export completed');
  }

  static exportToCSV(data: CrowdData[]): void {
    const headers = ['日付', '時刻', '混雑度', '曜日', '時間帯'];
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = [
        `"${row.date}"`,
        `"${row.time}"`,
        `"${row.count}"`,
        `"${row.weekday || ''}"`,
        `"${row.status_label || ''}"`
      ];
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `crowd-data-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('📊 CSV export completed');
  }

  static showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const existingToast = document.getElementById('export-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'export-toast';
    toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 1500);
  }
}