/**
 * Configuration and constants for the Crowd Data Dashboard
 * @author Dashboard Team
 * @version 2.0
 */

export const CONFIG = {
  // Data source configuration
  DATA: {
    CSV_FILE_PATH: '../../data/fit_place24_data.csv',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },

  // Chart configuration
  CHARTS: {
    DEFAULT_HEIGHT: 300,
    ANIMATION_DURATION: 1000,
    RESPONSIVE: true,
    MAINTAIN_ASPECT_RATIO: false,
    
    // Color scheme
    COLORS: {
      PRIMARY: '#3B82F6',
      SECONDARY: '#6B7280',
      SUCCESS: '#10B981',
      WARNING: '#F59E0B',
      DANGER: '#EF4444',
      BACKGROUND: 'rgba(59, 130, 246, 0.1)',
      GRID: 'rgba(0, 0, 0, 0.1)',
    },

    // Data display options
    DISPLAY: {
      SHOW_ALL_HOURS: true, // Show 0-23 hours instead of 3-hour intervals
      SHOW_STATISTICS: true, // Show avg, min, max
      SHOW_TOOLTIPS: true,
      SHOW_LEGEND: false,
    }
  },

  // Weekday configuration
  WEEKDAYS: {
    MAPPING: {
      'Sunday': 'sundayChart',
      'Monday': 'mondayChart', 
      'Tuesday': 'tuesdayChart',
      'Wednesday': 'wednesdayChart',
      'Thursday': 'thursdayChart',
      'Friday': 'fridayChart',
      'Saturday': 'saturdayChart',
    },
    ORDER: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    DISPLAY_NAMES: {
      'Sunday': '日曜日',
      'Monday': '月曜日',
      'Tuesday': '火曜日', 
      'Wednesday': '水曜日',
      'Thursday': '木曜日',
      'Friday': '金曜日',
      'Saturday': '土曜日',
    }
  },

  // Data validation rules
  VALIDATION: {
    REQUIRED_COLUMNS: ['datetime', 'weekday', 'hour', 'count'],
    DATA_TYPES: {
      hour: 'number',
      count: 'number',
      weekday: 'string'
    },
    RANGES: {
      hour: { min: 0, max: 23 },
      count: { min: 0, max: 1000 }
    }
  },

  // Date range filter configuration
  FILTERS: {
    DEFAULT_PERIOD: 'all', // Default filter option
    PRESET_PERIODS: {
      'all': { 
        label: '全期間（累積平均）', 
        days: null,
        description: '全てのデータを使用した累積平均' 
      },
      'week': { 
        label: '直近1週間', 
        days: 7,
        description: '過去7日間のデータ' 
      },
      'twoWeeks': { 
        label: '直近2週間', 
        days: 14,
        description: '過去14日間のデータ' 
      },
      'month': { 
        label: '直近1ヶ月', 
        days: 30,
        description: '過去30日間のデータ' 
      },
      'custom': { 
        label: 'カスタム期間', 
        days: null,
        description: '日付範囲を指定' 
      }
    },
    DATE_FORMAT: 'YYYY-MM-DD',
    MIN_DATA_POINTS: 1, // Minimum data points required for analysis
  },

  // UI configuration
  UI: {
    LOADING_DELAY: 500,
    ERROR_DISPLAY_DURATION: 5000,
    SUCCESS_DISPLAY_DURATION: 3000,
    
    MESSAGES: {
      LOADING: 'データを読み込んでいます...',
      SUCCESS: 'データの読み込みが完了しました',
      ERROR_FILE_NOT_FOUND: 'CSVファイルが見つかりません',
      ERROR_CORS: 'ローカルサーバーを起動してアクセスしてください',
      ERROR_PARSE: 'データの解析に失敗しました',
      ERROR_NO_DATA: 'データが見つかりません',
      ERROR_CHART_CREATE: 'チャートの作成に失敗しました',
      ERROR_INVALID_DATE_RANGE: '無効な日付範囲です',
      ERROR_INSUFFICIENT_DATA: 'データが不足しています',
    }
  },

  // Development/Debug configuration
  DEBUG: {
    ENABLED: true,
    LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
    SHOW_PERFORMANCE: true,
    MOCK_DATA: false, // For testing without CSV file
  }
};

// Status code mappings from the data
export const STATUS_CODES = {
  1: { label: '非常に混んでいます', color: '#EF4444', range: '41+人' },
  2: { label: '混んでいます', color: '#F59E0B', range: '31-40人' },
  3: { label: '少し混んでいます', color: '#10B981', range: '21-30人' },
  4: { label: 'やや空いています', color: '#3B82F6', range: '11-20人' },
  5: { label: '空いています', color: '#6B7280', range: '0-10人' }
};

// Utility functions for configuration
export const UTILS = {
  /**
   * Get chart canvas ID for a weekday
   * @param {string} weekday - The weekday name
   * @returns {string} The canvas ID
   */
  getCanvasId(weekday) {
    return CONFIG.WEEKDAYS.MAPPING[weekday] || null;
  },

  /**
   * Get display name for a weekday
   * @param {string} weekday - The weekday name
   * @returns {string} The display name
   */
  getDisplayName(weekday) {
    return CONFIG.WEEKDAYS.DISPLAY_NAMES[weekday] || weekday;
  },

  /**
   * Check if debug mode is enabled
   * @returns {boolean} True if debug mode is on
   */
  isDebugMode() {
    return CONFIG.DEBUG.ENABLED;
  },

  /**
   * Get status information by code
   * @param {number} code - The status code
   * @returns {object} Status information
   */
  getStatusInfo(code) {
    return STATUS_CODES[code] || { label: '不明', color: '#6B7280', range: '不明' };
  },

  /**
   * Get filter period configuration
   * @param {string} periodKey - The period key
   * @returns {object} Period configuration
   */
  getFilterPeriod(periodKey) {
    return CONFIG.FILTERS.PRESET_PERIODS[periodKey] || CONFIG.FILTERS.PRESET_PERIODS[CONFIG.FILTERS.DEFAULT_PERIOD];
  },

  /**
   * Calculate date range for a period
   * @param {string} periodKey - The period key
   * @param {Date} endDate - End date (default: today)
   * @returns {object} Date range with start and end dates
   */
  getDateRange(periodKey, endDate = new Date()) {
    const period = this.getFilterPeriod(periodKey);
    
    if (periodKey === 'all' || !period.days) {
      return { start: null, end: null };
    }

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - period.days);
    
    return {
      start: startDate,
      end: endDate
    };
  },

  /**
   * Format date for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  formatDate(date) {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }
};

// Export configuration as default
export default CONFIG;