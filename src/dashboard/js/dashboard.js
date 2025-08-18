/**
 * Dashboard Main Controller - Orchestrates all dashboard functionality
 * @author Dashboard Team  
 * @version 2.0
 */

import { CONFIG, UTILS } from './config.js';
import { dataLoader } from './dataLoader.js';
import { dataProcessor } from './dataProcessor.js';
import { chartManager } from './chartManager.js';

/**
 * ダッシュボードコントローラークラス
 * 全体の初期化、状態管理、ユーザーインタラクションを管理
 */
export class Dashboard {
  constructor() {
    this.isInitialized = false;
    this.isLoading = false;
    this.currentData = null;
    this.statistics = null;
    this.lastUpdateTime = null;
    this.retryCount = 0;
    this.eventListeners = new Map();
    this.currentFilter = {
      period: CONFIG.FILTERS.DEFAULT_PERIOD,
      startDate: null,
      endDate: null
    };
  }

  /**
   * ダッシュボードを初期化
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      this.log('warn', '⚠️ Dashboard already initialized');
      return;
    }

    const startTime = performance.now();
    this.log('info', '🚀 Initializing Crowd Data Dashboard v2.0...');

    try {
      // Step 1: DOM readiness check
      await this.ensureDOMReady();
      this.log('info', '✅ DOM is ready');

      // Step 2: Dependency checks
      this.checkDependencies();
      this.log('info', '✅ Dependencies verified');

      // Step 3: UI setup
      this.setupUI();
      this.log('info', '✅ UI setup completed');

      // Step 4: Event listeners
      this.setupEventListeners();
      this.log('info', '✅ Event listeners attached');

      // Step 4.5: Load filter settings
      this.loadFilterSettings();
      this.log('info', '✅ Filter settings loaded');

      // Step 5: Load and process data
      await this.loadData();
      this.log('info', '✅ Data loaded and processed');

      // Step 6: Create charts
      await this.createCharts();
      this.log('info', '✅ Charts created');

      // Step 7: Post-initialization
      this.postInitialization();

      const initTime = performance.now() - startTime;
      this.log('info', `🎯 Dashboard initialization completed in ${initTime.toFixed(2)}ms`);
      
      this.isInitialized = true;
      this.lastUpdateTime = new Date();

    } catch (error) {
      this.log('error', `❌ Dashboard initialization failed: ${error.message}`);
      this.handleInitializationError(error);
      throw error;
    }
  }

  /**
   * DOMの準備完了を確認
   * @returns {Promise<void>}
   */
  async ensureDOMReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        const checkReady = () => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            setTimeout(checkReady, 10);
          }
        };
        checkReady();
      }
    });
  }

  /**
   * 依存関係をチェック
   */
  checkDependencies() {
    // Chart.js availability
    if (typeof Chart === 'undefined') {
      throw new Error('Chart.js library is not loaded. Please include Chart.js before dashboard.js');
    }

    // Required DOM elements
    const requiredElements = Object.values(CONFIG.WEEKDAYS.MAPPING);
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
      throw new Error(`Missing required DOM elements: ${missingElements.join(', ')}`);
    }

    // Browser features
    if (!window.fetch) {
      throw new Error('Fetch API is not supported in this browser');
    }

    if (!window.Promise) {
      throw new Error('Promise is not supported in this browser');
    }
  }

  /**
   * UIセットアップ
   */
  setupUI() {
    // Loading states
    this.showGlobalLoading();
    
    // Add version info if debug mode
    if (CONFIG.DEBUG.ENABLED) {
      this.addVersionInfo();
    }

    // Add export buttons if enabled
    this.addExportButtons();

    // Update page title with data info
    this.updatePageTitle();
  }

  /**
   * バージョン情報を追加（デバッグモード時）
   */
  addVersionInfo() {
    const footer = document.querySelector('.footer-text');
    if (footer && !footer.querySelector('.debug-info')) {
      const debugInfo = document.createElement('span');
      debugInfo.className = 'debug-info';
      debugInfo.style.cssText = 'margin-left: 1rem; font-size: 0.75rem; opacity: 0.7;';
      debugInfo.textContent = `[DEBUG MODE] Dashboard v2.0`;
      footer.appendChild(debugInfo);
    }
  }

  /**
   * エクスポートボタンの状態を管理
   */
  addExportButtons() {
    const exportButtons = document.querySelectorAll('[data-action^="export"]');
    exportButtons.forEach(button => {
      button.disabled = !this.currentData;
      if (!this.currentData) {
        button.title = 'データが読み込まれてからエクスポート可能になります';
      }
    });
  }

  /**
   * ページタイトルを更新
   */
  updatePageTitle() {
    const title = document.title;
    if (!title.includes('v2.0')) {
      document.title = title + ' | Enhanced Dashboard';
    }
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // Window events
    this.addEventListener(window, 'resize', () => {
      this.debounce(() => {
        chartManager.handleResize();
        this.log('debug', '📐 Window resized, charts updated');
      }, 250)();
    });

    this.addEventListener(window, 'beforeunload', () => {
      this.cleanup();
    });

    // Error handling
    this.addEventListener(window, 'error', (event) => {
      this.log('error', `❌ Global error: ${event.error?.message || event.message}`);
    });

    this.addEventListener(window, 'unhandledrejection', (event) => {
      this.log('error', `❌ Unhandled promise rejection: ${event.reason}`);
    });

    // Data refresh button
    const refreshButton = document.querySelector('[data-action="refresh"]');
    if (refreshButton) {
      this.addEventListener(refreshButton, 'click', () => this.refreshData());
    }

    // Export buttons
    const exportCsvButton = document.querySelector('[data-action="export-csv"]');
    const exportJsonButton = document.querySelector('[data-action="export-json"]');
    
    if (exportCsvButton) {
      this.addEventListener(exportCsvButton, 'click', () => this.exportData('csv'));
    }
    
    if (exportJsonButton) {
      this.addEventListener(exportJsonButton, 'click', () => this.exportData('json'));
    }

    // Period filter events
    const periodSelect = document.getElementById('period-filter');
    const applyFilterBtn = document.getElementById('apply-filter');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    if (periodSelect) {
      this.addEventListener(periodSelect, 'change', () => this.handlePeriodChange());
    }

    if (applyFilterBtn) {
      this.addEventListener(applyFilterBtn, 'click', () => this.applyFilter());
    }

    if (startDateInput && endDateInput) {
      this.addEventListener(startDateInput, 'change', () => this.handleCustomDateChange());
      this.addEventListener(endDateInput, 'change', () => this.handleCustomDateChange());
    }

    // Keyboard shortcuts
    this.addEventListener(document, 'keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'r':
            event.preventDefault();
            this.refreshData();
            break;
          case 's':
            event.preventDefault();
            this.exportData('json');
            break;
        }
      }
    });

    this.log('info', '👂 Event listeners configured');
  }

  /**
   * データを読み込みと処理
   * @returns {Promise<void>}
   */
  async loadData() {
    if (this.isLoading) {
      this.log('warn', '⚠️ Data loading already in progress');
      return;
    }

    this.isLoading = true;
    
    try {
      this.log('info', '📊 Loading data...');
      this.updateLoadingStatus('CSVファイルを読み込んでいます...');

      // Load CSV data
      const csvData = await dataLoader.loadCSV();
      
      this.log('info', '🔄 Processing data...');
      this.updateLoadingStatus('データを処理しています...');

      // Process data with current filter
      const result = await dataProcessor.processCSVData(csvData, this.currentFilter);
      
      this.currentData = result.hourlyData;
      this.statistics = result.statistics;
      
      this.log('info', `✅ Data processing completed: ${result.metadata.totalRecords} records`);
      this.log('info', `📅 Date range: ${result.metadata.dateRange.start} to ${result.metadata.dateRange.end}`);

    } catch (error) {
      this.log('error', `❌ Data loading failed: ${error.message}`);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * チャートを作成
   * @returns {Promise<void>}
   */
  async createCharts() {
    if (!this.currentData || !this.statistics) {
      throw new Error('No data available for chart creation');
    }

    try {
      this.updateLoadingStatus('チャートを作成しています...');
      
      const charts = await chartManager.createAllCharts(this.currentData, this.statistics);
      
      this.log('info', `📈 Created ${charts.size} charts`);
      
      // Update UI with statistics
      this.updateStatisticsDisplay();
      
    } catch (error) {
      this.log('error', `❌ Chart creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * データを更新
   * @returns {Promise<void>}
   */
  async refreshData() {
    if (this.isLoading) {
      this.log('warn', '⚠️ Refresh already in progress');
      return;
    }

    this.log('info', '🔄 Refreshing data...');
    this.showRefreshIndicator();

    try {
      // Clear cache to force fresh data
      dataLoader.clearCache();
      
      // Reload data
      await this.loadData();
      
      // Update charts
      await this.createCharts();
      
      this.lastUpdateTime = new Date();
      this.updateLastUpdateDisplay();
      
      this.showSuccessMessage('データが更新されました');
      this.log('info', '✅ Data refresh completed');

    } catch (error) {
      this.log('error', `❌ Data refresh failed: ${error.message}`);
      this.showErrorMessage(`更新に失敗しました: ${error.message}`);
    } finally {
      this.hideRefreshIndicator();
    }
  }

  /**
   * 期間選択の変更をハンドル
   */
  handlePeriodChange() {
    const periodSelect = document.getElementById('period-filter');
    const customDateRange = document.getElementById('custom-date-range');
    
    if (!periodSelect || !customDateRange) return;

    const selectedPeriod = periodSelect.value;
    
    // カスタム期間の場合は日付入力を表示
    if (selectedPeriod === 'custom') {
      customDateRange.style.display = 'flex';
      this.setDefaultCustomDates();
    } else {
      customDateRange.style.display = 'none';
    }

    // プリセット期間の場合は即座に適用
    if (selectedPeriod !== 'custom') {
      this.currentFilter.period = selectedPeriod;
      this.applyFilter();
    }
  }

  /**
   * カスタム日付の変更をハンドル
   */
  handleCustomDateChange() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (!startDateInput || !endDateInput) return;

    this.currentFilter.startDate = startDateInput.value;
    this.currentFilter.endDate = endDateInput.value;
  }

  /**
   * フィルターを適用
   */
  async applyFilter() {
    const periodSelect = document.getElementById('period-filter');
    if (!periodSelect) return;

    try {
      this.log('info', '🔍 Applying filter...');
      
      // カスタム期間の場合の検証
      if (periodSelect.value === 'custom') {
        if (!this.currentFilter.startDate || !this.currentFilter.endDate) {
          this.showErrorMessage('開始日と終了日を指定してください');
          return;
        }
        
        const start = new Date(this.currentFilter.startDate);
        const end = new Date(this.currentFilter.endDate);
        
        if (start > end) {
          this.showErrorMessage('開始日は終了日より前である必要があります');
          return;
        }
        
        this.currentFilter.period = 'custom';
      }

      // データを再読み込み
      await this.loadData();
      
      // チャートを更新
      await this.createCharts();
      
      // フィルター状態を表示
      this.updateFilterDisplay();
      
      // フィルター設定を保存
      this.saveFilterSettings();
      
      this.showSuccessMessage('フィルターが適用されました');
      this.log('info', '✅ Filter applied successfully');

    } catch (error) {
      this.log('error', `❌ Filter application failed: ${error.message}`);
      this.showErrorMessage(`フィルターの適用に失敗しました: ${error.message}`);
    }
  }

  /**
   * デフォルトのカスタム日付を設定
   */
  setDefaultCustomDates() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (!startDateInput || !endDateInput) return;

    // 現在の日付から1ヶ月前を開始日、今日を終了日に設定
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    startDateInput.value = UTILS.formatDate(oneMonthAgo);
    endDateInput.value = UTILS.formatDate(today);
    
    this.currentFilter.startDate = startDateInput.value;
    this.currentFilter.endDate = endDateInput.value;
  }

  /**
   * フィルター状態表示を更新
   */
  updateFilterDisplay() {
    const filterStatus = document.getElementById('filter-status');
    if (!filterStatus) return;

    const period = CONFIG.FILTERS.PRESET_PERIODS[this.currentFilter.period];
    let displayText = '';
    let detailsText = '';

    if (this.currentFilter.period === 'all') {
      filterStatus.classList.remove('active');
      return;
    }

    if (this.currentFilter.period === 'custom') {
      displayText = `カスタム期間: ${this.currentFilter.startDate} 〜 ${this.currentFilter.endDate}`;
      detailsText = '指定期間のデータ';
    } else {
      displayText = period.label;
      detailsText = period.description;
    }

    filterStatus.className = 'filter-status active';
    filterStatus.innerHTML = `
      <div class="filter-status-content">
        <span class="filter-status-icon">📅</span>
        <span class="filter-status-text">${displayText}</span>
        <span class="filter-status-details">${detailsText}</span>
      </div>
    `;
  }

  /**
   * データをエクスポート
   * @param {string} format - エクスポート形式 ('csv' | 'json')
   */
  async exportData(format = 'json') {
    try {
      this.log('info', `📤 Exporting data as ${format.toUpperCase()}...`);
      
      const exportData = dataProcessor.exportData(format);
      const filename = `crowd_data_${new Date().toISOString().split('T')[0]}.${format}`;
      
      this.downloadFile(exportData, filename, format === 'json' ? 'application/json' : 'text/csv');
      
      this.showSuccessMessage(`${format.toUpperCase()}ファイルをダウンロードしました`);
      this.log('info', `✅ Data exported as ${filename}`);

    } catch (error) {
      this.log('error', `❌ Export failed: ${error.message}`);
      this.showErrorMessage(`エクスポートに失敗しました: ${error.message}`);
    }
  }

  /**
   * 初期化後の処理
   */
  postInitialization() {
    // Hide loading state
    this.hideGlobalLoading();
    
    // Show success message
    this.showSuccessMessage(CONFIG.UI.MESSAGES.SUCCESS);
    
    // Enable interactive features
    this.enableInteractiveFeatures();
    
    // Update last update time
    this.updateLastUpdateDisplay();
    
    // Start periodic updates if configured
    if (CONFIG.DATA.AUTO_REFRESH_INTERVAL) {
      this.startAutoRefresh();
    }

    this.log('info', '🎉 Dashboard is ready for use');
  }

  /**
   * インタラクティブ機能を有効化
   */
  enableInteractiveFeatures() {
    // Enable export buttons
    const exportButtons = document.querySelectorAll('[data-action^="export"]');
    exportButtons.forEach(button => {
      button.disabled = false;
      button.title = button.getAttribute('aria-label') || '';
    });

    // Update data indicators
    this.updateDataIndicators();

    // Add chart hover effects
    this.addChartHoverEffects();
  }

  /**
   * データ表示インジケーターを更新
   */
  updateDataIndicators() {
    Object.keys(CONFIG.WEEKDAYS.MAPPING).forEach(weekday => {
      const indicator = document.querySelector(`[data-weekday="${weekday}"]`);
      if (indicator) {
        const hasData = this.currentData && this.currentData[weekday];
        const dot = indicator.querySelector('.indicator-dot');
        const text = indicator.querySelector('.indicator-text');
        
        if (hasData) {
          indicator.className = 'data-indicator has-data';
          if (text) text.textContent = 'データあり';
        } else {
          indicator.className = 'data-indicator no-data';
          if (text) text.textContent = 'データなし';
        }
      }
    });
  }

  /**
   * チャートホバー効果を追加
   */
  addChartHoverEffects() {
    const chartCards = document.querySelectorAll('.chart-card');
    chartCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '';
      });
    });
  }

  /**
   * 自動更新を開始
   */
  startAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    this.autoRefreshInterval = setInterval(() => {
      this.refreshData();
    }, CONFIG.DATA.AUTO_REFRESH_INTERVAL);
    
    this.log('info', `🔄 Auto-refresh enabled: ${CONFIG.DATA.AUTO_REFRESH_INTERVAL}ms`);
  }

  /**
   * 初期化エラーを処理
   * @param {Error} error - エラーオブジェクト
   */
  handleInitializationError(error) {
    this.hideGlobalLoading();
    
    let userMessage = 'ダッシュボードの初期化に失敗しました';
    let suggestions = [];

    // Error type-specific handling
    if (error.message.includes('CORS') || error.message.includes('fetch')) {
      userMessage = CONFIG.UI.MESSAGES.ERROR_CORS;
      suggestions = [
        'ローカルサーバーを起動してください',
        'python3 -m http.server 3000',
        'http://localhost:3000 でアクセス'
      ];
    } else if (error.message.includes('Chart.js')) {
      userMessage = 'Chart.jsライブラリが読み込まれていません';
      suggestions = [
        'Chart.jsのCDNリンクを確認してください',
        'インターネット接続を確認してください'
      ];
    } else if (error.message.includes('DOM elements')) {
      userMessage = '必要なHTML要素が見つかりません';
      suggestions = [
        'HTMLファイルが正しく読み込まれているか確認してください'
      ];
    }

    this.showFatalError(userMessage, suggestions);
  }

  // UI Helper Methods

  /**
   * 更新インジケーターを表示
   */
  showRefreshIndicator() {
    const refreshButton = document.querySelector('[data-action="refresh"]');
    if (refreshButton) {
      refreshButton.disabled = true;
      refreshButton.innerHTML = `
        <div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
        更新中...
      `;
    }
  }

  /**
   * 更新インジケーターを隠す
   */
  hideRefreshIndicator() {
    const refreshButton = document.querySelector('[data-action="refresh"]');
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
        更新
      `;
    }
  }

  /**
   * グローバルローディング表示
   */
  showGlobalLoading() {
    const containers = document.querySelectorAll('.chart-container');
    containers.forEach(container => {
      // Canvas要素を保持したままローディング状態を表示
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.style.display = 'none';
      }
      
      // 既存のローディング状態があれば削除
      const existingLoading = container.querySelector('.loading-state');
      if (existingLoading) {
        existingLoading.remove();
      }
      
      // ローディング要素を追加
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-state';
      loadingDiv.innerHTML = `
        <div class="loading-spinner"></div>
        <p class="loading-text">${CONFIG.UI.MESSAGES.LOADING}</p>
      `;
      
      container.appendChild(loadingDiv);
    });
  }

  /**
   * グローバルローディング非表示
   */
  hideGlobalLoading() {
    const containers = document.querySelectorAll('.chart-container');
    containers.forEach(container => {
      // ローディング状態を削除
      const loadingState = container.querySelector('.loading-state');
      if (loadingState) {
        loadingState.remove();
      }
      
      // Canvas要素を再表示
      const canvas = container.querySelector('canvas');
      if (canvas) {
        canvas.style.display = 'block';
      }
    });
  }

  /**
   * ローディング状態を更新
   * @param {string} message - ローディングメッセージ
   */
  updateLoadingStatus(message) {
    const loadingTexts = document.querySelectorAll('.loading-text');
    loadingTexts.forEach(text => {
      text.textContent = message;
    });
    this.log('info', `⏳ Loading status: ${message}`);
  }

  /**
   * 統計情報表示を更新
   */
  updateStatisticsDisplay() {
    if (!this.statistics) return;

    // Add statistics to page header if element exists
    const statsContainer = document.querySelector('.page-statistics');
    if (statsContainer) {
      const totalDays = Object.keys(this.statistics).length;
      const totalRecords = Object.values(this.statistics)
        .reduce((sum, day) => sum + day.daily.totalRecords, 0);
      
      // フィルター情報を取得
      const filterInfo = this.getFilterInfo();
      
      statsContainer.innerHTML = `
        <div class="stats-item">
          <span class="stats-label">対象曜日:</span>
          <span class="stats-value">${totalDays}曜日</span>
        </div>
        <div class="stats-item">
          <span class="stats-label">データ数:</span>
          <span class="stats-value">${totalRecords}件</span>
        </div>
        ${filterInfo ? `
        <div class="stats-item">
          <span class="stats-label">対象期間:</span>
          <span class="stats-value">${filterInfo}</span>
        </div>
        ` : ''}
        <div class="stats-item">
          <span class="stats-label">最終更新:</span>
          <span class="stats-value" id="last-update-time">-</span>
        </div>
      `;
    }
  }

  /**
   * 現在のフィルター情報を取得
   * @returns {string|null} フィルター情報
   */
  getFilterInfo() {
    if (this.currentFilter.period === 'all') {
      return null;
    }

    if (this.currentFilter.period === 'custom') {
      return `${this.currentFilter.startDate} 〜 ${this.currentFilter.endDate}`;
    }

    const period = CONFIG.FILTERS.PRESET_PERIODS[this.currentFilter.period];
    return period ? period.label : null;
  }

  /**
   * フィルター設定を読み込み
   */
  loadFilterSettings() {
    try {
      // URLパラメータから読み込み
      const urlParams = new URLSearchParams(window.location.search);
      let filterLoaded = false;

      if (urlParams.has('period')) {
        const period = urlParams.get('period');
        if (CONFIG.FILTERS.PRESET_PERIODS[period]) {
          this.currentFilter.period = period;
          filterLoaded = true;

          if (period === 'custom') {
            this.currentFilter.startDate = urlParams.get('start') || null;
            this.currentFilter.endDate = urlParams.get('end') || null;
          }
        }
      }

      // URLパラメータがない場合はsessionStorageから読み込み
      if (!filterLoaded) {
        const savedFilter = sessionStorage.getItem('dashboard-filter');
        if (savedFilter) {
          try {
            const parsed = JSON.parse(savedFilter);
            if (CONFIG.FILTERS.PRESET_PERIODS[parsed.period]) {
              this.currentFilter = { ...this.currentFilter, ...parsed };
              filterLoaded = true;
            }
          } catch (e) {
            this.log('warn', 'Failed to parse saved filter settings');
          }
        }
      }

      // UIを更新
      this.updateFilterUI();
      
      if (filterLoaded) {
        this.log('info', `📅 Loaded filter: ${this.currentFilter.period}`);
      }

    } catch (error) {
      this.log('warn', `Failed to load filter settings: ${error.message}`);
    }
  }

  /**
   * フィルター設定を保存
   */
  saveFilterSettings() {
    try {
      // sessionStorageに保存
      sessionStorage.setItem('dashboard-filter', JSON.stringify(this.currentFilter));
      
      // URLパラメータを更新
      this.updateURLParams();
      
      this.log('debug', '💾 Filter settings saved');
    } catch (error) {
      this.log('warn', `Failed to save filter settings: ${error.message}`);
    }
  }

  /**
   * URLパラメータを更新
   */
  updateURLParams() {
    try {
      const url = new URL(window.location);
      
      // 既存のフィルターパラメータをクリア
      url.searchParams.delete('period');
      url.searchParams.delete('start');
      url.searchParams.delete('end');

      // 新しいパラメータを設定
      if (this.currentFilter.period !== 'all') {
        url.searchParams.set('period', this.currentFilter.period);
        
        if (this.currentFilter.period === 'custom') {
          if (this.currentFilter.startDate) {
            url.searchParams.set('start', this.currentFilter.startDate);
          }
          if (this.currentFilter.endDate) {
            url.searchParams.set('end', this.currentFilter.endDate);
          }
        }
      }

      // URLを更新（ページをリロードしない）
      window.history.replaceState({}, '', url.toString());
      
    } catch (error) {
      this.log('warn', `Failed to update URL params: ${error.message}`);
    }
  }

  /**
   * フィルターUIを更新
   */
  updateFilterUI() {
    const periodSelect = document.getElementById('period-filter');
    const customDateRange = document.getElementById('custom-date-range');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    if (periodSelect) {
      periodSelect.value = this.currentFilter.period;
    }

    if (customDateRange) {
      if (this.currentFilter.period === 'custom') {
        customDateRange.style.display = 'flex';
        
        if (startDateInput && this.currentFilter.startDate) {
          startDateInput.value = this.currentFilter.startDate;
        }
        if (endDateInput && this.currentFilter.endDate) {
          endDateInput.value = this.currentFilter.endDate;
        }
      } else {
        customDateRange.style.display = 'none';
      }
    }
  }

  /**
   * 最終更新時刻を表示
   */
  updateLastUpdateDisplay() {
    const updateElement = document.getElementById('last-update-time');
    if (updateElement && this.lastUpdateTime) {
      updateElement.textContent = this.lastUpdateTime.toLocaleString('ja-JP');
    }
  }

  /**
   * 成功メッセージを表示
   * @param {string} message - メッセージ
   */
  showSuccessMessage(message) {
    this.showToast(message, 'success', CONFIG.UI.SUCCESS_DISPLAY_DURATION);
  }

  /**
   * エラーメッセージを表示
   * @param {string} message - メッセージ
   */
  showErrorMessage(message) {
    this.showToast(message, 'error', CONFIG.UI.ERROR_DISPLAY_DURATION);
  }

  /**
   * 致命的エラーを表示
   * @param {string} message - メッセージ
   * @param {Array<string>} suggestions - 解決策
   */
  showFatalError(message, suggestions = []) {
    const containers = document.querySelectorAll('.chart-container');
    containers.forEach(container => {
      container.innerHTML = `
        <div class="fatal-error">
          <div class="error-icon">⚠️</div>
          <h3 class="error-title">エラーが発生しました</h3>
          <p class="error-message">${message}</p>
          ${suggestions.length > 0 ? `
            <div class="error-suggestions">
              <h4>解決方法:</h4>
              <ul>
                ${suggestions.map(s => `<li>${s}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    });
  }

  /**
   * トースト通知を表示
   * @param {string} message - メッセージ
   * @param {string} type - タイプ ('success' | 'error' | 'info')
   * @param {number} duration - 表示時間
   */
  showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto remove
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, duration);
  }

  // Utility Methods

  /**
   * イベントリスナーを追加（クリーンアップ対応）
   * @param {EventTarget} target - イベントターゲット
   * @param {string} event - イベント名
   * @param {Function} handler - ハンドラー関数
   */
  addEventListener(target, event, handler) {
    target.addEventListener(event, handler);
    
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, []);
    }
    this.eventListeners.get(target).push({ event, handler });
  }

  /**
   * デバウンス関数
   * @param {Function} func - 実行する関数
   * @param {number} wait - 待機時間
   * @returns {Function} デバウンスされた関数
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * ファイルダウンロード
   * @param {string} content - ファイル内容
   * @param {string} filename - ファイル名
   * @param {string} mimeType - MIMEタイプ
   */
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  /**
   * リソースクリーンアップ
   */
  cleanup() {
    this.log('info', '🧹 Cleaning up dashboard resources...');
    
    // Remove event listeners
    this.eventListeners.forEach((listeners, target) => {
      listeners.forEach(({ event, handler }) => {
        target.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();

    // Destroy charts
    chartManager.destroyAllCharts();
    
    // Clear caches
    dataLoader.clearCache();
    
    this.log('info', '✅ Cleanup completed');
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
      console[level === 'debug' ? 'log' : level](`[Dashboard] ${message}`);
    }
  }
}

// シングルトンインスタンス
export const dashboard = new Dashboard();

// Auto-initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    dashboard.initialize().catch(error => {
      console.error('❌ Dashboard auto-initialization failed:', error);
    });
  });
} else {
  // DOM already loaded
  dashboard.initialize().catch(error => {
    console.error('❌ Dashboard auto-initialization failed:', error);
  });
}

// デフォルトエクスポート
export default Dashboard;