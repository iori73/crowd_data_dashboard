/**
 * Data Loading Module - Handles CSV file loading with robust error handling
 * @author Dashboard Team
 * @version 2.0
 */

import { CONFIG } from './config.js';

/**
 * CSVデータローダークラス
 * ファイル読み込み、キャッシュ、リトライ機能を提供
 */
export class DataLoader {
  constructor() {
    this.cache = new Map();
    this.retryCount = 0;
    this.isLoading = false;
  }

  /**
   * CSVファイルを読み込む
   * @param {string} filePath - CSVファイルのパス
   * @param {boolean} useCache - キャッシュを使用するか
   * @returns {Promise<string>} CSVテキストデータ
   */
  async loadCSV(filePath = CONFIG.DATA.CSV_FILE_PATH, useCache = true) {
    const startTime = performance.now();
    
    try {
      // キャッシュチェック
      if (useCache && this.isCacheValid(filePath)) {
        this.log('info', `📦 Using cached data for: ${filePath}`);
        return this.cache.get(filePath).data;
      }

      // 重複読み込み防止
      if (this.isLoading) {
        this.log('warn', '⚠️ Data loading already in progress, waiting...');
        return await this.waitForLoading();
      }

      this.isLoading = true;
      this.log('info', `📁 Loading CSV data from: ${filePath}`);

      const csvData = await this.fetchWithRetry(filePath);
      
      // データ検証
      this.validateCSVData(csvData);
      
      // キャッシュに保存
      this.cache.set(filePath, {
        data: csvData,
        timestamp: Date.now(),
        size: csvData.length
      });

      const loadTime = performance.now() - startTime;
      this.log('info', `✅ CSV loaded successfully in ${loadTime.toFixed(2)}ms (${csvData.length} characters)`);
      
      return csvData;

    } catch (error) {
      this.log('error', `❌ Failed to load CSV: ${error.message}`);
      throw this.enhanceError(error, filePath);
    } finally {
      this.isLoading = false;
      this.retryCount = 0;
    }
  }

  /**
   * リトライ機能付きfetch
   * @param {string} filePath - ファイルパス
   * @returns {Promise<string>} CSVデータ
   */
  async fetchWithRetry(filePath) {
    for (let attempt = 1; attempt <= CONFIG.DATA.RETRY_ATTEMPTS; attempt++) {
      try {
        if (attempt > 1) {
          this.log('info', `🔄 Retry attempt ${attempt}/${CONFIG.DATA.RETRY_ATTEMPTS}`);
          await this.delay(CONFIG.DATA.RETRY_DELAY * attempt);
        }

        const response = await fetch(filePath);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const csvData = await response.text();
        
        if (!csvData || csvData.trim().length === 0) {
          throw new Error('Empty file or no data received');
        }

        return csvData;

      } catch (error) {
        this.log('warn', `❌ Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === CONFIG.DATA.RETRY_ATTEMPTS) {
          throw error;
        }
      }
    }
  }

  /**
   * CSVデータの基本検証
   * @param {string} csvData - CSVデータ
   */
  validateCSVData(csvData) {
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least header and one data row');
    }

    const headers = this.parseCSVLine(lines[0]);
    const requiredColumns = CONFIG.VALIDATION.REQUIRED_COLUMNS;
    
    for (const required of requiredColumns) {
      if (!headers.includes(required)) {
        throw new Error(`Required column '${required}' not found in CSV headers`);
      }
    }

    this.log('info', `📊 CSV validation passed: ${headers.length} columns, ${lines.length - 1} data rows`);
  }

  /**
   * CSVラインを解析（引用符対応）
   * @param {string} line - CSVの行
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
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * キャッシュの有効性をチェック
   * @param {string} filePath - ファイルパス
   * @returns {boolean} キャッシュが有効かどうか
   */
  isCacheValid(filePath) {
    const cached = this.cache.get(filePath);
    if (!cached) return false;

    const age = Date.now() - cached.timestamp;
    return age < CONFIG.DATA.CACHE_DURATION;
  }

  /**
   * 他の読み込み処理を待機
   * @returns {Promise<string>} 読み込み完了後のデータ
   */
  async waitForLoading() {
    while (this.isLoading) {
      await this.delay(100);
    }
    // 読み込み完了後、キャッシュから取得
    const cachedData = this.cache.get(CONFIG.DATA.CSV_FILE_PATH);
    if (cachedData) {
      return cachedData.data;
    }
    throw new Error('Loading completed but no data available in cache');
  }

  /**
   * エラーを強化してより詳細な情報を追加
   * @param {Error} error - 元のエラー
   * @param {string} filePath - ファイルパス
   * @returns {Error} 強化されたエラー
   */
  enhanceError(error, filePath) {
    let enhancedMessage = error.message;
    let suggestions = [];

    // エラータイプ別の詳細情報と解決策
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      enhancedMessage = CONFIG.UI.MESSAGES.ERROR_FILE_NOT_FOUND;
      suggestions = [
        `ファイル '${filePath}' が存在することを確認してください`,
        'ファイル名とパスが正しいことを確認してください'
      ];
    } else if (error.message.includes('CORS') || 
               error.message.includes('fetch') || 
               window.location.protocol === 'file:') {
      enhancedMessage = CONFIG.UI.MESSAGES.ERROR_CORS;
      suggestions = [
        'ローカルサーバーを起動: python3 -m http.server 3000',
        'または: npx serve -p 3000',
        'http://localhost:3000 でアクセスしてください'
      ];
    } else if (error.message.includes('Empty') || error.message.includes('no data')) {
      enhancedMessage = CONFIG.UI.MESSAGES.ERROR_NO_DATA;
      suggestions = [
        'CSVファイルにデータが含まれていることを確認してください',
        'ファイルが破損していないか確認してください'
      ];
    }

    const enhancedError = new Error(enhancedMessage);
    enhancedError.originalError = error;
    enhancedError.suggestions = suggestions;
    enhancedError.filePath = filePath;
    
    return enhancedError;
  }

  /**
   * キャッシュをクリア
   * @param {string} filePath - 特定のファイルのキャッシュをクリア（省略時は全てクリア）
   */
  clearCache(filePath = null) {
    if (filePath) {
      this.cache.delete(filePath);
      this.log('info', `🗑️ Cache cleared for: ${filePath}`);
    } else {
      this.cache.clear();
      this.log('info', '🗑️ All cache cleared');
    }
  }

  /**
   * キャッシュ情報を取得
   * @returns {object} キャッシュの統計情報
   */
  getCacheInfo() {
    const info = {
      entries: this.cache.size,
      totalSize: 0,
      files: []
    };

    for (const [filePath, data] of this.cache.entries()) {
      info.totalSize += data.size;
      info.files.push({
        path: filePath,
        size: data.size,
        age: Date.now() - data.timestamp
      });
    }

    return info;
  }

  /**
   * 遅延処理
   * @param {number} ms - 遅延時間（ミリ秒）
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      console[level === 'debug' ? 'log' : level](`[DataLoader] ${message}`);
    }
  }
}

// シングルトンインスタンス
export const dataLoader = new DataLoader();

// デフォルトエクスポート
export default DataLoader;