/**
 * Chart Management Module - Handles Chart.js chart creation and management
 * @author Dashboard Team
 * @version 2.0
 */

import { CONFIG, UTILS } from './config.js';

/**
 * チャート管理クラス
 * Chart.jsを使用したチャートの作成、更新、破棄を管理
 */
export class ChartManager {
  constructor() {
    this.charts = new Map();
    this.isChartJSLoaded = false;
    this.defaultConfig = this.getDefaultConfig();
  }

  /**
   * Chart.jsの読み込み状態をチェック
   * @returns {boolean} Chart.jsが利用可能かどうか
   */
  checkChartJS() {
    this.isChartJSLoaded = typeof Chart !== 'undefined';
    if (!this.isChartJSLoaded) {
      this.log('error', '❌ Chart.js library is not loaded');
      throw new Error('Chart.js library is required but not loaded');
    }
    return true;
  }

  /**
   * 全てのチャートを作成
   * @param {object} hourlyData - 時間別データ
   * @param {object} statistics - 統計情報
   * @returns {Promise<Map>} 作成されたチャートのMap
   */
  async createAllCharts(hourlyData, statistics) {
    this.checkChartJS();
    
    const startTime = performance.now();
    this.log('info', '📊 Creating all charts...');

    // 既存のチャートを破棄
    this.destroyAllCharts();

    const createdCharts = new Map();
    const errors = [];

    for (const weekday of CONFIG.WEEKDAYS.ORDER) {
      try {
        if (hourlyData[weekday]) {
          const chart = await this.createChart(weekday, hourlyData[weekday], statistics[weekday]);
          if (chart) {
            createdCharts.set(weekday, chart);
            this.log('info', `✅ Chart created for ${weekday}`);
          }
        } else {
          this.log('warn', `⚠️ No data available for ${weekday}`);
          this.showNoDataMessage(weekday);
        }
      } catch (error) {
        errors.push({ weekday, error: error.message });
        this.log('error', `❌ Failed to create chart for ${weekday}: ${error.message}`);
        this.showErrorMessage(weekday, error.message);
      }
    }

    const createTime = performance.now() - startTime;
    this.log('info', `🎯 Chart creation completed in ${createTime.toFixed(2)}ms`);
    this.log('info', `✅ Successfully created ${createdCharts.size} charts`);

    if (errors.length > 0) {
      this.log('warn', `⚠️ ${errors.length} charts failed to create`);
    }

    this.charts = createdCharts;
    return createdCharts;
  }

  /**
   * 単一のチャートを作成
   * @param {string} weekday - 曜日
   * @param {object} hourlyData - その曜日の時間別データ
   * @param {object} dayStatistics - その曜日の統計情報
   * @returns {Promise<Chart>} 作成されたチャートインスタンス
   */
  async createChart(weekday, hourlyData, dayStatistics) {
    const canvasId = UTILS.getCanvasId(weekday);
    if (!canvasId) {
      throw new Error(`No canvas ID found for weekday: ${weekday}`);
    }

    // Canvas要素の取得と検証
    const canvas = this.getCanvas(canvasId);
    const ctx = canvas.getContext('2d');

    // チャートデータの準備
    const chartData = this.prepareChartData(hourlyData, dayStatistics);
    
    // チャート設定の生成
    const config = {
      ...this.defaultConfig,
      data: chartData,
      options: {
        ...this.defaultConfig.options,
        plugins: {
          ...this.defaultConfig.options.plugins,
          tooltip: {
            ...this.defaultConfig.options.plugins.tooltip,
            callbacks: {
              title: (context) => {
                const hour = context[0].label;
                return `${UTILS.getDisplayName(weekday)} ${hour}`;
              },
              label: (context) => {
                const data = hourlyData[context.dataIndex];
                const lines = [
                  `平均人数: ${context.parsed.y}人`,
                  `データ数: ${data.count}件`
                ];
                if (data.hasData && data.count > 0) {
                  lines.push(`最小: ${data.min}人`);
                  lines.push(`最大: ${data.max}人`);
                }
                return lines;
              }
            }
          },
          annotation: this.createAnnotations(dayStatistics)
        }
      }
    };

    // チャートの作成
    try {
      const chart = new Chart(ctx, config);
      
      // チャートのメタデータを保存
      chart.weekday = weekday;
      chart.canvasId = canvasId;
      chart.statistics = dayStatistics;
      
      this.log('debug', `📈 Chart created for ${weekday} with ${Object.keys(hourlyData).length} data points`);
      
      return chart;
    } catch (error) {
      this.log('error', `❌ Chart.js creation failed for ${weekday}: ${error.message}`);
      throw error;
    }
  }

  /**
   * チャートデータを準備
   * @param {object} hourlyData - 時間別データ
   * @param {object} dayStatistics - 統計情報
   * @returns {object} Chart.js用のデータオブジェクト
   */
  prepareChartData(hourlyData, dayStatistics) {
    const labels = [];
    const data = [];
    const backgroundColors = [];
    const borderColors = [];

    // 全24時間のデータを準備
    for (let hour = 0; hour < 24; hour++) {
      const hourData = hourlyData[hour];
      
      if (CONFIG.CHARTS.DISPLAY.SHOW_ALL_HOURS || hourData.hasData) {
        labels.push(`${hour.toString().padStart(2, '0')}:00`);
        data.push(hourData.average);
        
        // データの有無に応じて色を変更
        if (hourData.hasData && hourData.count > 0) {
          backgroundColors.push(CONFIG.CHARTS.COLORS.PRIMARY);
          borderColors.push(CONFIG.CHARTS.COLORS.PRIMARY);
        } else {
          backgroundColors.push(CONFIG.CHARTS.COLORS.SECONDARY + '40'); // 透明度追加
          borderColors.push(CONFIG.CHARTS.COLORS.SECONDARY);
        }
      }
    }

    return {
      labels: labels,
      datasets: [{
        label: '平均人数',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        barThickness: 'flex',
        maxBarThickness: 30,
        minBarLength: 2,
      }]
    };
  }

  /**
   * デフォルトのチャート設定を取得
   * @returns {object} Chart.js設定オブジェクト
   */
  getDefaultConfig() {
    return {
      type: 'bar',
      options: {
        responsive: CONFIG.CHARTS.RESPONSIVE,
        maintainAspectRatio: CONFIG.CHARTS.MAINTAIN_ASPECT_RATIO,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: CONFIG.CHARTS.DISPLAY.SHOW_LEGEND,
          },
          tooltip: {
            enabled: CONFIG.CHARTS.DISPLAY.SHOW_TOOLTIPS,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: CONFIG.CHARTS.COLORS.PRIMARY,
            borderWidth: 1,
            cornerRadius: 4,
            displayColors: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '平均人数',
              color: CONFIG.CHARTS.COLORS.SECONDARY,
              font: {
                size: 14,
                family: 'Inter, sans-serif',
                weight: '500'
              }
            },
            grid: {
              color: CONFIG.CHARTS.COLORS.GRID,
              drawTicks: false,
            },
            ticks: {
              color: CONFIG.CHARTS.COLORS.SECONDARY,
              font: {
                size: 12,
                family: 'Inter, sans-serif'
              },
              padding: 8,
              callback: function(value) {
                return value + '人';
              }
            },
            border: {
              display: false
            }
          },
          x: {
            title: {
              display: true,
              text: '時間',
              color: CONFIG.CHARTS.COLORS.SECONDARY,
              font: {
                size: 14,
                family: 'Inter, sans-serif',
                weight: '500'
              }
            },
            grid: {
              display: false,
            },
            ticks: {
              color: CONFIG.CHARTS.COLORS.SECONDARY,
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              maxRotation: 45,
              minRotation: 0,
              padding: 8
            },
            border: {
              display: false
            }
          }
        },
        animation: {
          duration: CONFIG.CHARTS.ANIMATION_DURATION,
          easing: 'easeInOutQuart',
        },
        onHover: (event, activeElements, chart) => {
          event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
        }
      }
    };
  }

  /**
   * 統計情報に基づいてアノテーションを作成
   * @param {object} dayStatistics - 統計情報
   * @returns {object} アノテーション設定
   */
  createAnnotations(dayStatistics) {
    if (!dayStatistics || !CONFIG.CHARTS.DISPLAY.SHOW_STATISTICS) {
      return {};
    }

    return {
      annotations: {
        averageLine: {
          type: 'line',
          yMin: dayStatistics.daily.averageCount,
          yMax: dayStatistics.daily.averageCount,
          borderColor: CONFIG.CHARTS.COLORS.WARNING,
          borderWidth: 2,
          borderDash: [5, 5],
          label: {
            content: `平均: ${Math.round(dayStatistics.daily.averageCount)}人`,
            enabled: true,
            position: 'end',
            backgroundColor: CONFIG.CHARTS.COLORS.WARNING + '20',
            color: CONFIG.CHARTS.COLORS.WARNING,
            font: {
              size: 11
            }
          }
        }
      }
    };
  }

  /**
   * Canvas要素を取得して検証
   * @param {string} canvasId - Canvas要素のID
   * @returns {HTMLCanvasElement} Canvas要素
   */
  getCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
      throw new Error(`Canvas element with id '${canvasId}' not found`);
    }

    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Element with id '${canvasId}' is not a canvas element`);
    }

    if (!canvas.parentElement) {
      throw new Error(`Canvas '${canvasId}' is not attached to DOM`);
    }

    return canvas;
  }

  /**
   * 特定のチャートを更新
   * @param {string} weekday - 曜日
   * @param {object} hourlyData - 新しい時間別データ
   * @param {object} dayStatistics - 新しい統計情報
   * @returns {Promise<Chart>} 更新されたチャート
   */
  async updateChart(weekday, hourlyData, dayStatistics) {
    const existingChart = this.charts.get(weekday);
    
    if (existingChart) {
      // 既存チャートのデータを更新
      const newData = this.prepareChartData(hourlyData, dayStatistics);
      existingChart.data = newData;
      existingChart.update('active');
      
      this.log('info', `🔄 Chart updated for ${weekday}`);
      return existingChart;
    } else {
      // 新しいチャートを作成
      return await this.createChart(weekday, hourlyData, dayStatistics);
    }
  }

  /**
   * チャートのリサイズを処理
   */
  handleResize() {
    this.charts.forEach((chart, weekday) => {
      if (chart && chart.resize) {
        chart.resize();
        this.log('debug', `📐 Chart resized for ${weekday}`);
      }
    });
  }

  /**
   * 特定のチャートを破棄
   * @param {string} weekday - 曜日
   */
  destroyChart(weekday) {
    const chart = this.charts.get(weekday);
    if (chart) {
      chart.destroy();
      this.charts.delete(weekday);
      this.log('info', `🗑️ Chart destroyed for ${weekday}`);
    }
  }

  /**
   * 全てのチャートを破棄
   */
  destroyAllCharts() {
    this.charts.forEach((chart, weekday) => {
      chart.destroy();
      this.log('debug', `🗑️ Chart destroyed for ${weekday}`);
    });
    this.charts.clear();
    this.log('info', '🗑️ All charts destroyed');
  }

  /**
   * データなしメッセージを表示
   * @param {string} weekday - 曜日
   */
  showNoDataMessage(weekday) {
    const canvasId = UTILS.getCanvasId(weekday);
    try {
      const canvas = this.getCanvas(canvasId);
      const container = canvas.parentElement;
      
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p class="empty-title">${UTILS.getDisplayName(weekday)}</p>
          <p class="empty-message">データがありません</p>
        </div>
      `;
    } catch (error) {
      this.log('error', `❌ Failed to show no data message for ${weekday}: ${error.message}`);
    }
  }

  /**
   * エラーメッセージを表示
   * @param {string} weekday - 曜日
   * @param {string} errorMessage - エラーメッセージ
   */
  showErrorMessage(weekday, errorMessage) {
    const canvasId = UTILS.getCanvasId(weekday);
    try {
      const canvas = this.getCanvas(canvasId);
      const container = canvas.parentElement;
      
      container.innerHTML = `
        <div class="empty-state error-state">
          <div class="empty-icon">⚠️</div>
          <p class="empty-title">${UTILS.getDisplayName(weekday)}</p>
          <p class="empty-message">チャートの読み込みに失敗しました</p>
          <small class="error-details">${errorMessage}</small>
        </div>
      `;
    } catch (error) {
      this.log('error', `❌ Failed to show error message for ${weekday}: ${error.message}`);
    }
  }

  /**
   * チャート情報を取得
   * @returns {object} チャートの統計情報
   */
  getChartInfo() {
    return {
      totalCharts: this.charts.size,
      weekdays: Array.from(this.charts.keys()),
      isChartJSLoaded: this.isChartJSLoaded,
      charts: Array.from(this.charts.entries()).map(([weekday, chart]) => ({
        weekday,
        canvasId: chart.canvasId,
        hasData: chart.data.datasets[0].data.length > 0
      }))
    };
  }

  /**
   * チャートデータをエクスポート
   * @param {string} weekday - 曜日（省略時は全て）
   * @returns {object} エクスポートデータ
   */
  exportChartData(weekday = null) {
    if (weekday) {
      const chart = this.charts.get(weekday);
      return chart ? this.extractChartData(chart) : null;
    }

    const exportData = {};
    this.charts.forEach((chart, day) => {
      exportData[day] = this.extractChartData(chart);
    });
    
    return exportData;
  }

  /**
   * チャートからデータを抽出
   * @param {Chart} chart - Chart.jsインスタンス
   * @returns {object} 抽出されたデータ
   */
  extractChartData(chart) {
    return {
      weekday: chart.weekday,
      labels: chart.data.labels,
      data: chart.data.datasets[0].data,
      statistics: chart.statistics
    };
  }

  /**
   * ログ出力
   * @param {string} level - ログレベル
   * @param {string} message - メッセージ
   */
  log(level, message) {
    if (!CONFIG.DEBUG.ENABLED) return;

    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(CONFIG.DEBUG.LOG_LEVEL);
    const messageLevel = levels.indexOf(level);

    if (messageLevel >= configLevel) {
      console[level === 'debug' ? 'log' : level](`[ChartManager] ${message}`);
    }
  }
}

// シングルトンインスタンス
export const chartManager = new ChartManager();

// デフォルトエクスポート
export default ChartManager;