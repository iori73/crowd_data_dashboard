export const translations = {
  en: {
    // Header
    appTitle: 'Crowd Data Dashboard',
    refresh: 'Refresh',
    download: 'Download',
    exportJSON: 'Export JSON',
    exportCSV: 'Export CSV',
    
    // Filter
    allPeriods: 'All Periods',
    lastWeek: 'Last Week',
    lastTwoWeeks: 'Last 2 Weeks',
    lastMonth: 'Last Month',
    customPeriod: 'Custom Period',
    
    // Main Title
    mainTitle: 'Crowd Analysis by Day & Time',
    mainSubtitle: 'Visualize fitness facility crowd patterns and identify optimal usage times',
    
    // Statistics
    totalData: 'Total Data',
    recordedObservations: 'Recorded observations',
    averageCrowd: 'Average Crowd',
    overallAverage: 'Overall average',
    peakTime: 'Peak Time',
    mostCrowdedTime: 'Most crowded time',
    quietTime: 'Quiet Time',
    leastCrowdedTime: 'Least crowded time',
    
    // Data Insights
    dataInsights: 'Data Insights',
    weeklyAnalysis: 'Weekly Analysis',
    
    // Time Analysis
    timeZone: 'Time Zone',
    weekdayTrend: 'Weekday Trend',
    weekdayTrendDesc: 'Crowds are highest from evening to night. Weekday data is strongly reflected.',
    weekendTrend: 'Weekend Trend',
    weekendTrendDesc: 'Two peaks at 10-12 AM and 4-7 PM. Shows different patterns from weekdays.',
    
    // Day Analysis
    dayOfWeek: 'Day of Week',
    mostCrowded: 'Most Crowded',
    mostCrowdedDesc: 'Tuesday tends to be the most crowded. Especially busy among weekdays.',
    leastCrowded: 'Least Crowded',
    leastCrowdedDesc: 'Wednesday tends to be the least crowded. Most accessible time of the week.',
    
    // Loading
    loadingData: 'Loading Data',
    analyzingCrowdData: 'Analyzing crowd situation data...',
    
    // Error
    dataLoadError: 'Failed to Load Data',
    retryAgain: 'Try Again',
    networkIssue: 'If the problem persists, please check your network connection',
    
    // Help Section
    howToUse: 'How to Use & Operations',
    dashboardUsage: 'Effective ways to use the dashboard',
    
    // Filter descriptions
    allDataAnalysis: 'Analysis results from all data',
    lastWeekAnalysis: 'Analysis results from the past week data',
    lastTwoWeeksAnalysis: 'Analysis results from the past 2 weeks data',
    lastMonthAnalysis: 'Analysis results from the past month data',
    customPeriodAnalysis: 'Analysis results from custom period data',
    
    // Chart sections
    timeAnalysis: 'Time Analysis',
    dayAnalysis: 'Day Analysis',
    
    // Footer
    footerText: 'Built with React + TypeScript + Tailwind CSS',
    
    // Filter UI
    apply: 'Apply',
    filterActive: 'Filter Active',
    filterApplied: 'Filter applied',
    
    // Chart Cards
    noData: 'No Data',
    limitedData: 'Limited Data',
    sufficientData: 'Sufficient Data',
    
    // Help Section
    howToReadCharts: 'How to Read Charts',
    chartInterpretation: 'Understanding data interpretation methods',
    operationMethods: 'Operation Methods',
    interfaceUsage: 'How to use the interface',
    usageTips: 'Usage Tips',
    effectiveUsage: 'Effective usage methods and tips',
    
    // Chart interpretation
    yAxisLabel: 'Y-axis: Average number of people (congestion level for that time period)',
    xAxisLabel: 'X-axis: Time (24-hour format from 0:00-23:00)',
    barHeightMeaning: 'Higher bars indicate more congested time periods',
    grayBarsMeaning: 'Gray bars indicate time periods with insufficient data',
    
    // Operation methods
    hoverDetails: 'Hover over charts to display detailed information',
    refreshButton: 'Click "Refresh" button to update data to latest',
    downloadButton: 'Click "JSON/CSV" button to download data',
    keyboardShortcuts: 'Keyboard shortcuts: Ctrl+R (refresh), Ctrl+S (save JSON)',
    
    // Usage tips
    avoidCrowds: 'Target less crowded time periods for comfortable use',
    planByWeekday: 'Understand weekday trends and adjust your schedule',
    dataAverage: 'Average values are based on past performance data',
    realTimeCheck: 'Please check real-time conditions on-site',
    
    // Chart labels and units
    timeLabel: 'Time',
    peopleUnit: 'people',
    averagePeople: 'Average People',
    personCount: 'person',
    peopleCount: 'people',
    
    // Crowd level texts
    noCrowdData: 'No Data',
    notCrowded: 'Not Crowded',
    slightlyCrowded: 'Slightly Crowded',
    crowded: 'Crowded',
    veryCrowded: 'Very Crowded',
    
    // Days of week
    sunday: 'SUN',
    monday: 'MON', 
    tuesday: 'TUE',
    wednesday: 'WED',
    thursday: 'THU',
    friday: 'FRI',
    saturday: 'SAT',
    
    // Notifications
    dataRefreshed: 'Data refreshed',
    dataLoaded: 'Data loaded successfully',
    noDataToExport: 'No data to export',
    jsonDownloaded: 'JSON file downloaded',
    csvDownloaded: 'CSV file downloaded',
    dataNotFound: 'No data found',
  },
  ja: {
    // Header
    appTitle: 'Crowd Data Dashboard',
    refresh: '更新',
    download: 'Download',
    exportJSON: 'JSONエクスポート',
    exportCSV: 'CSVエクスポート',
    
    // Filter
    allPeriods: '全期間',
    lastWeek: '直近1週間',
    lastTwoWeeks: '直近2週間',
    lastMonth: '直近1ヶ月',
    customPeriod: 'カスタム期間',
    
    // Main Title
    mainTitle: '曜日別・時間別 混雑状況分析',
    mainSubtitle: 'フィットネス施設の混雑パターンを可視化し、最適な利用時間を特定できます',
    
    // Statistics
    totalData: '総データ数',
    recordedObservations: '記録された観測数',
    averageCrowd: '平均混雑度',
    overallAverage: '全体の平均値',
    peakTime: 'ピーク時間',
    mostCrowdedTime: '最も混雑する時間帯',
    quietTime: '最適時間',
    leastCrowdedTime: '最も空いている時間帯',
    
    // Data Insights
    dataInsights: 'データインサイト',
    weeklyAnalysis: '週間分析',
    
    // Time Analysis
    timeZone: '時間帯',
    weekdayTrend: '平日の傾向',
    weekdayTrendDesc: '夕方から夜にかけて人数が最も多くなります。平日のデータが強く反映されています。',
    weekendTrend: '週末の傾向',
    weekendTrendDesc: '午前10時〜12時、夕方16時〜19時の2つのピークがあります。平日とは異なるパターンを示します。',
    
    // Day Analysis
    dayOfWeek: '曜日',
    mostCrowded: '最も混雑',
    mostCrowdedDesc: '火曜日が最も混雑する傾向があります。平日の中でも特に利用者が多い日です。',
    leastCrowded: '最も空いている',
    leastCrowdedDesc: '水曜日が最も空いている傾向があります。週の中で最も利用しやすい時間帯です。',
    
    // Loading
    loadingData: 'データを読み込み中',
    analyzingCrowdData: '混雑状況データを解析しています...',
    
    // Error
    dataLoadError: 'データの読み込みに失敗しました',
    retryAgain: '再度試行する',
    networkIssue: '問題が続く場合は、ネットワーク接続を確認してください',
    
    // Help Section
    howToUse: '使い方・操作方法',
    dashboardUsage: 'ダッシュボードの効果的な活用方法',
    
    // Filter descriptions
    allDataAnalysis: '全データから分析した結果',
    lastWeekAnalysis: '過去1週間のデータから分析した結果',
    lastTwoWeeksAnalysis: '過去2週間のデータから分析した結果',
    lastMonthAnalysis: '過去1ヶ月のデータから分析した結果',
    customPeriodAnalysis: 'カスタム期間のデータから分析した結果',
    
    // Chart sections
    timeAnalysis: '時間帯分析',
    dayAnalysis: '曜日分析',
    
    // Footer
    footerText: 'React + TypeScript + Tailwind CSS で構築',
    
    // Filter UI
    apply: '適用',
    filterActive: 'フィルター適用中',
    filterApplied: 'フィルターが適用されました',
    
    // Chart Cards
    noData: 'データなし',
    limitedData: 'データ少',
    sufficientData: 'データ充分',
    
    // Help Section
    howToReadCharts: 'グラフの見方',
    chartInterpretation: 'データの解釈方法を理解する',
    operationMethods: '操作方法',
    interfaceUsage: 'インターフェースの使い方',
    usageTips: '活用のヒント',
    effectiveUsage: '効果的な利用方法とコツ',
    
    // Chart interpretation
    yAxisLabel: '縦軸: 平均人数（その時間帯の混雑度）',
    xAxisLabel: '横軸: 時間（0:00-23:00の24時間表示）',
    barHeightMeaning: 'バーの高さが高いほど混雑している時間帯',
    grayBarsMeaning: 'グレーのバーはデータが不足している時間帯',
    
    // Operation methods
    hoverDetails: 'グラフにマウスを合わせると詳細情報が表示',
    refreshButton: '「更新」ボタンでデータを最新に更新',
    downloadButton: '「JSON/CSV」ボタンでデータをダウンロード',
    keyboardShortcuts: 'キーボードショートカット: Ctrl+R (更新), Ctrl+S (JSON保存)',
    
    // Usage tips
    avoidCrowds: '混雑の少ない時間帯を狙って快適に利用',
    planByWeekday: '曜日別の傾向を把握してスケジュール調整',
    dataAverage: 'データの平均値は過去の実績に基づいています',
    realTimeCheck: 'リアルタイム状況は現地で確認してください',
    
    // Chart labels and units
    timeLabel: '時間',
    peopleUnit: '人',
    averagePeople: '平均人数',
    personCount: '人',
    peopleCount: '人',
    
    // Crowd level texts
    noCrowdData: 'データなし',
    notCrowded: '空いている',
    slightlyCrowded: 'やや混雑',
    crowded: '混雑',
    veryCrowded: '非常に混雑',
    
    // Days of week
    sunday: '日',
    monday: '月', 
    tuesday: '火',
    wednesday: '水',
    thursday: '木',
    friday: '金',
    saturday: '土',
    
    // Notifications
    dataRefreshed: 'データを更新しました',
    dataLoaded: 'データの読み込みが完了しました',
    noDataToExport: 'エクスポートするデータがありません',
    jsonDownloaded: 'JSONファイルをダウンロードしました',
    csvDownloaded: 'CSVファイルをダウンロードしました',
    dataNotFound: 'データが見つかりませんでした',
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;