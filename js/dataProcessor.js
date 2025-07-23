/**
 * Data Processing Module - Handles CSV parsing, validation, and statistical analysis
 * @author Dashboard Team
 * @version 2.0
 */

import { CONFIG, UTILS } from './config.js';

/**
 * データ処理クラス
 * CSVパース、データ変換、統計計算を担当
 */
export class DataProcessor {
  constructor() {
    this.rawData = [];
    this.processedData = {};
    this.statistics = {};
  }

  /**
   * CSVテキストを解析してデータオブジェクトに変換
   * @param {string} csvText - CSVテキストデータ
   * @returns {Promise<object>} 処理されたデータオブジェクト
   */
  async processCSVData(csvText) {
    const startTime = performance.now();
    
    try {
      this.log('info', '📊 Starting CSV data processing...');
      
      // Step 1: Parse CSV
      const rawData = this.parseCSV(csvText);
      this.log('info', `✅ Parsed ${rawData.length} records`);

      // Step 2: Validate data
      const validatedData = this.validateData(rawData);
      this.log('info', `✅ Validated ${validatedData.length} records`);

      // Step 3: Process and group data
      const groupedData = this.groupByWeekday(validatedData);
      this.log('info', `✅ Grouped data by weekdays: ${Object.keys(groupedData).length} days`);

      // Step 4: Calculate statistics
      const statistics = this.calculateStatistics(groupedData);
      this.log('info', '✅ Statistics calculated');

      // Step 5: Generate hourly averages
      const hourlyData = this.generateHourlyData(groupedData);
      this.log('info', '✅ Hourly averages generated');

      const processingTime = performance.now() - startTime;
      this.log('info', `🎯 Processing completed in ${processingTime.toFixed(2)}ms`);

      // Store results
      this.rawData = validatedData;
      this.processedData = hourlyData;
      this.statistics = statistics;

      return {
        hourlyData,
        statistics,
        rawData: validatedData,
        metadata: {
          totalRecords: validatedData.length,
          processingTime: processingTime,
          weekdays: Object.keys(groupedData),
          dateRange: this.getDateRange(validatedData)
        }
      };

    } catch (error) {
      this.log('error', `❌ Processing failed: ${error.message}`);
      throw new Error(`Data processing failed: ${error.message}`);
    }
  }

  /**
   * CSVテキストをパースしてオブジェクト配列に変換
   * @param {string} csvText - CSVテキスト
   * @returns {Array<object>} パースされたデータ配列
   */
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must contain at least header and one data row');
    }

    const headers = this.parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        const row = {};

        headers.forEach((header, index) => {
          const value = values[index] ? values[index].trim() : '';
          row[header] = this.convertValue(header, value);
        });

        // Skip empty rows
        if (Object.values(row).some(val => val !== '' && val !== null && val !== undefined)) {
          row._lineNumber = i + 1; // For error reporting
          data.push(row);
        }

      } catch (error) {
        this.log('warn', `⚠️ Skipping line ${i + 1}: ${error.message}`);
      }
    }

    return data;
  }

  /**
   * CSVの一行をパース（引用符とエスケープ処理対応）
   * @param {string} line - CSV行
   * @returns {Array<string>} 分割された値の配列
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // エスケープされた引用符
          current += '"';
          i += 2;
        } else {
          // 引用符の開始/終了
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * 値を適切な型に変換
   * @param {string} header - カラム名
   * @param {string} value - 値
   * @returns {*} 変換された値
   */
  convertValue(header, value) {
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    const dataTypes = CONFIG.VALIDATION.DATA_TYPES;
    
    switch (dataTypes[header]) {
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      
      case 'integer':
        const int = parseInt(value, 10);
        return isNaN(int) ? null : int;
      
      case 'boolean':
        return value.toLowerCase() === 'true' || value === '1';
      
      case 'date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      
      default:
        return value.toString();
    }
  }

  /**
   * データの検証とクリーニング
   * @param {Array<object>} data - 生データ
   * @returns {Array<object>} 検証済みデータ
   */
  validateData(data) {
    const validData = [];
    const errors = [];

    for (const row of data) {
      try {
        // Required fields check
        for (const required of CONFIG.VALIDATION.REQUIRED_COLUMNS) {
          if (row[required] === null || row[required] === undefined || row[required] === '') {
            throw new Error(`Missing required field: ${required}`);
          }
        }

        // Range validation
        for (const [field, range] of Object.entries(CONFIG.VALIDATION.RANGES)) {
          if (row[field] !== null && row[field] !== undefined) {
            if (row[field] < range.min || row[field] > range.max) {
              throw new Error(`${field} value ${row[field]} out of range [${range.min}-${range.max}]`);
            }
          }
        }

        // Custom validation
        if (row.weekday && !CONFIG.WEEKDAYS.ORDER.includes(row.weekday)) {
          throw new Error(`Invalid weekday: ${row.weekday}`);
        }

        validData.push(row);

      } catch (error) {
        errors.push({
          line: row._lineNumber,
          error: error.message,
          data: row
        });
        this.log('warn', `⚠️ Validation error on line ${row._lineNumber}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      this.log('warn', `⚠️ ${errors.length} rows failed validation out of ${data.length} total rows`);
    }

    if (validData.length === 0) {
      throw new Error('No valid data records found after validation');
    }

    return validData;
  }

  /**
   * データを曜日別にグループ化
   * @param {Array<object>} data - 検証済みデータ
   * @returns {object} 曜日別グループ化データ
   */
  groupByWeekday(data) {
    const grouped = {};

    for (const row of data) {
      const weekday = row.weekday;
      const hour = row.hour;
      const count = row.count;

      if (!grouped[weekday]) {
        grouped[weekday] = {};
      }

      if (!grouped[weekday][hour]) {
        grouped[weekday][hour] = [];
      }

      grouped[weekday][hour].push({
        count: count,
        datetime: row.datetime,
        status_label: row.status_label,
        status_code: row.status_code,
        raw_text: row.raw_text
      });
    }

    return grouped;
  }

  /**
   * 統計情報を計算
   * @param {object} groupedData - 曜日別グループ化データ
   * @returns {object} 統計情報
   */
  calculateStatistics(groupedData) {
    const stats = {};

    for (const [weekday, hours] of Object.entries(groupedData)) {
      stats[weekday] = {
        hourly: {},
        daily: {
          totalRecords: 0,
          averageCount: 0,
          minCount: Infinity,
          maxCount: -Infinity,
          hoursWithData: 0
        }
      };

      let dailySum = 0;
      let dailyRecords = 0;

      for (const [hour, records] of Object.entries(hours)) {
        const counts = records.map(r => r.count);
        const hourStats = {
          count: records.length,
          average: counts.reduce((a, b) => a + b, 0) / counts.length,
          min: Math.min(...counts),
          max: Math.max(...counts),
          sum: counts.reduce((a, b) => a + b, 0),
          standardDeviation: this.calculateStandardDeviation(counts),
          records: records
        };

        stats[weekday].hourly[hour] = hourStats;
        
        // Update daily stats
        dailySum += hourStats.sum;
        dailyRecords += records.length;
        stats[weekday].daily.minCount = Math.min(stats[weekday].daily.minCount, hourStats.min);
        stats[weekday].daily.maxCount = Math.max(stats[weekday].daily.maxCount, hourStats.max);
        stats[weekday].daily.hoursWithData++;
      }

      stats[weekday].daily.totalRecords = dailyRecords;
      stats[weekday].daily.averageCount = dailyRecords > 0 ? dailySum / dailyRecords : 0;

      // Fix infinity values
      if (stats[weekday].daily.minCount === Infinity) {
        stats[weekday].daily.minCount = 0;
      }
      if (stats[weekday].daily.maxCount === -Infinity) {
        stats[weekday].daily.maxCount = 0;
      }
    }

    return stats;
  }

  /**
   * 時間別の平均データを生成（全24時間対応）
   * @param {object} groupedData - 曜日別グループ化データ
   * @returns {object} 時間別平均データ
   */
  generateHourlyData(groupedData) {
    const hourlyData = {};

    for (const [weekday, hours] of Object.entries(groupedData)) {
      hourlyData[weekday] = {};

      // 全24時間分のデータを生成
      for (let hour = 0; hour < 24; hour++) {
        if (hours[hour] && hours[hour].length > 0) {
          const counts = hours[hour].map(r => r.count);
          hourlyData[weekday][hour] = {
            average: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length),
            count: counts.length,
            min: Math.min(...counts),
            max: Math.max(...counts),
            hasData: true
          };
        } else {
          // データがない時間は0で埋める
          hourlyData[weekday][hour] = {
            average: 0,
            count: 0,
            min: 0,
            max: 0,
            hasData: false
          };
        }
      }
    }

    return hourlyData;
  }

  /**
   * 標準偏差を計算
   * @param {Array<number>} values - 数値配列
   * @returns {number} 標準偏差
   */
  calculateStandardDeviation(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * データの日付範囲を取得
   * @param {Array<object>} data - データ配列
   * @returns {object} 日付範囲情報
   */
  getDateRange(data) {
    if (data.length === 0) return { start: null, end: null, days: 0 };

    const dates = data.map(row => new Date(row.datetime)).filter(date => !isNaN(date.getTime()));
    
    if (dates.length === 0) return { start: null, end: null, days: 0 };

    const sortedDates = dates.sort((a, b) => a - b);
    const start = sortedDates[0];
    const end = sortedDates[sortedDates.length - 1];
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
      days: days
    };
  }

  /**
   * データをエクスポート用に変換
   * @param {string} format - エクスポート形式 ('csv' | 'json')
   * @returns {string} エクスポートデータ
   */
  exportData(format = 'json') {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportAsCSV();
      case 'json':
        return this.exportAsJSON();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * CSV形式でエクスポート
   * @returns {string} CSV文字列
   */
  exportAsCSV() {
    const headers = ['weekday', 'hour', 'average', 'count', 'min', 'max', 'hasData'];
    const rows = [headers.join(',')];

    for (const [weekday, hours] of Object.entries(this.processedData)) {
      for (const [hour, data] of Object.entries(hours)) {
        rows.push([
          weekday,
          hour,
          data.average,
          data.count,
          data.min,
          data.max,
          data.hasData
        ].join(','));
      }
    }

    return rows.join('\n');
  }

  /**
   * JSON形式でエクスポート
   * @returns {string} JSON文字列
   */
  exportAsJSON() {
    return JSON.stringify({
      processedData: this.processedData,
      statistics: this.statistics,
      metadata: {
        totalRecords: this.rawData.length,
        weekdays: Object.keys(this.processedData),
        exportedAt: new Date().toISOString()
      }
    }, null, 2);
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
      console[level === 'debug' ? 'log' : level](`[DataProcessor] ${message}`);
    }
  }
}

// シングルトンインスタンス
export const dataProcessor = new DataProcessor();

// デフォルトエクスポート
export default DataProcessor;