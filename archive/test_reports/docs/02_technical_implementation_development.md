# 🛠️ FIT PLACE24 混雑状況分析システム - 技術実装・開発プロセス編

## 🏗️ システムアーキテクチャ実装詳細

### **3層ダッシュボード実装戦略**

複数の実装を並行開発することで、異なるニーズと技術要件に対応する設計を採用しました。

#### **📊 レイヤー1: メインダッシュボード（ES6実装）**

**選定理由**: 高機能性と軽量性のバランス、期間フィルター等の高度機能

```javascript
// js/dashboard.js - メインコントローラー
class Dashboard {
    constructor() {
        this.dataProcessor = new DataProcessor();
        this.chartManager = new ChartManager();
        this.config = DashboardConfig;
        this.currentFilter = null;
    }

    async initialize() {
        try {
            // データ読み込み
            const rawData = await this.dataProcessor.loadData();
            
            // 期間フィルター設定復元
            this.restoreFilterSettings();
            
            // チャート初期化
            await this.chartManager.initialize(rawData);
            
            // UIイベント設定
            this.setupEventListeners();
            
        } catch (error) {
            this.handleError('ダッシュボード初期化エラー', error);
        }
    }
}
```

**モジュール化アーキテクチャ**:
```javascript
// js/config.js - 設定管理
export const DashboardConfig = {
    dataFile: 'fit_place24_data.csv',
    charts: {
        weeklyAverage: { containerId: 'weeklyChart', type: 'bar' },
        timeDistribution: { containerId: 'timeChart', type: 'line' },
        statusDistribution: { containerId: 'statusChart', type: 'doughnut' }
    },
    filters: {
        periods: [
            { value: 'all', label: '全期間（累積平均）' },
            { value: 'week', label: '直近1週間' },
            { value: 'month', label: '直近1ヶ月' }
        ]
    }
};

// js/dataProcessor.js - データ処理
export class DataProcessor {
    applyDateFilter(data, filterOption) {
        if (filterOption.type === 'all') return data;
        
        const cutoffDate = this.calculateCutoffDate(filterOption);
        return data.filter(row => new Date(row.date) >= cutoffDate);
    }
    
    generateStatistics(filteredData) {
        const hourlyStats = this.groupBy(filteredData, 'hour');
        const weekdayStats = this.groupBy(filteredData, 'weekday');
        
        return {
            totalRecords: filteredData.length,
            averageByHour: this.calculateAverages(hourlyStats),
            averageByWeekday: this.calculateAverages(weekdayStats),
            optimalTimes: this.findOptimalTimes(hourlyStats)
        };
    }
}
```

#### **⚛️ レイヤー2: React版ダッシュボード（モダンUI）**

**選定理由**: 最新技術スタック、TypeScript型安全性、コンポーネント再利用性

```typescript
// src/types/dashboard.ts - 型定義
export interface GymData {
    datetime: string;
    date: string;
    time: string;
    hour: number;
    weekday: string;
    count: number;
    status_label: string;
    status_code: number;
    status_min: number;
    status_max: number;
    raw_text: string;
}

export interface ChartDataset {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
}
```

```tsx
// src/components/dashboard/WeeklyChartsGrid.tsx
import { ChartCard } from '@/components/charts/ChartCard';
import { useGymData } from '@/hooks/useGymData';

export function WeeklyChartsGrid() {
    const { data, loading, error } = useGymData();
    
    if (loading) return <div>データ読み込み中...</div>;
    if (error) return <div>エラー: {error.message}</div>;
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
                title="曜日別平均混雑状況"
                type="bar"
                data={data.weeklyAverages}
                options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' } }
                }}
            />
            <ChartCard
                title="時間帯別分布"
                type="line"
                data={data.hourlyDistribution}
            />
        </div>
    );
}
```

**Tailwind CSS + Radix UI実装**:
```tsx
// src/components/ui/card.tsx - 再利用可能コンポーネント
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-lg border bg-card text-card-foreground shadow-sm",
                className
            )}
            {...props}
        />
    );
}
```

#### **📂 レイヤー3: レガシー版（互換性重視）**

**選定理由**: 最小依存関係、古いブラウザ対応、シンプルな保守性

```javascript
// legacy/script.js - シンプル実装
function loadAndDisplayData() {
    fetch('fit_place24_data.csv')
        .then(response => response.text())
        .then(csvText => {
            const data = parseCSV(csvText);
            displayCharts(data);
        })
        .catch(error => console.error('データ読み込みエラー:', error));
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index];
        });
        return row;
    });
}
```

---

## 🤖 自動化システム実装

### **2重自動化アーキテクチャの設計思想**

異なる信頼性レベルと用途に対応する2つのシステムを並行実装。

#### **🔹 macOS launchd実装（本番環境）**

**実装アプローチ**: システムレベルでの確実な実行

```python
# weekly_automation.py - メインエンジン
class GymAnalysisAutomation:
    def __init__(self):
        self.project_dir = "/Users/i_kawano/Documents/training_waitnum_analysis"
        self.csv_file = os.path.join(self.project_dir, "fit_place24_data.csv")
        self.backup_dir = os.path.join(self.project_dir, "backups")
        self.log_file = os.path.join(self.project_dir, "automation.log")
        
        # Apple Notesのメモ名（OCRデータ）
        self.memo_name = "📸ShortcutでFIT PLACE24の混雑状況OCR"
        
        self._setup_directories()
        self._setup_logging()

    def get_memo_content(self):
        """AppleScriptでメモ内容を取得"""
        script = '''
        tell application "Notes"
            set noteContent to body of note 1
            return noteContent
        end tell
        '''
        
        try:
            result = subprocess.run(
                ["osascript", "-e", script],
                capture_output=True,
                text=True,
                encoding="utf-8",
            )
            return result.stdout.strip()
        except Exception as e:
            self.logger.error(f"メモ取得エラー: {e}")
            return None

    def extract_gym_data(self, memo_content):
        """正規表現でOCRデータを構造化"""
        lines = memo_content.split("\n")
        clean_lines = []
        for line in lines:
            clean_line = re.sub(r"<[^>]*>", "", line).strip()
            if clean_line:
                clean_lines.append(clean_line)

        gym_data = []
        i = 0
        while i < len(clean_lines):
            line = clean_lines[i]
            if "混雜状況" in line or "混雑状況" in line:
                # 次の3行でデータを構成
                count_line = clean_lines[i + 1] if i + 1 < len(clean_lines) else ""
                location_line = clean_lines[i + 2] if i + 2 < len(clean_lines) else ""
                status_line = clean_lines[i + 3] if i + 3 < len(clean_lines) else ""

                # 正規表現で抽出
                count_match = re.search(r"(\d+)人", count_line)
                time_match = re.search(r"(\d{1,2}):(\d{2})時点", status_line)
                
                if count_match and time_match:
                    count = int(count_match.group(1))
                    hour = int(time_match.group(1))
                    minute = int(time_match.group(2))
                    
                    # 状態判定ロジック
                    status_code, status_label, status_min, status_max = self.determine_status(status_line)
                    
                    gym_data.append({
                        "datetime": f"{datetime.now().date()} {hour:02d}:{minute:02d}:00",
                        "date": str(datetime.now().date()),
                        "time": f"{hour:02d}:{minute:02d}",
                        "hour": hour,
                        "weekday": datetime.now().strftime("%A"),
                        "count": count,
                        "status_label": status_label,
                        "status_code": status_code,
                        "status_min": status_min,
                        "status_max": status_max,
                        "raw_text": f"混雜状況 {count}人 {location_line} {status_line}"
                    })
                i += 4
            else:
                i += 1
        
        return gym_data
```

**launchd設定ファイル**:
```xml
<!-- com.user.gym.analysis.weekly.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.user.gym.analysis.weekly</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/i_kawano/Documents/training_waitnum_analysis/weekly_automation.py</string>
        <string>--weekly</string>
    </array>
    
    <key>StartCalendarInterval</key>
    <dict>
        <key>Weekday</key>
        <integer>0</integer>    <!-- 0 = Sunday -->
        <key>Hour</key>
        <integer>0</integer>    <!-- 00:01 -->
        <key>Minute</key>
        <integer>1</integer>
    </dict>
    
    <key>StandardOutPath</key>
    <string>/Users/i_kawano/Documents/training_waitnum_analysis/automation_output.log</string>
    
    <key>StandardErrorPath</key>
    <string>/Users/i_kawano/Documents/training_waitnum_analysis/automation_error.log</string>
</dict>
</plist>
```

#### **🔹 Cursor nAgent実装（開発環境）**

**実装アプローチ**: リアルタイム監視とCursor統合

```python
# nagent_automation.py - nAgent対応版
import asyncio
import schedule
import threading
from pathlib import Path

class nAgentGymAutomation:
    def __init__(self):
        self.automation = GymAnalysisAutomation()  # 基本機能を継承
        self.project_dir = Path(__file__).parent
        self.state_file = self.project_dir / "nagent_state.json"
        self.is_running = False
        
        # nAgent特有の設定
        self.config = {
            "weekly_schedule": "sunday 00:01",
            "data_check_interval": 60,  # 1分間隔
            "memo_watch_enabled": True,
            "auto_cleanup": True,
            "debug_mode": True  # Cursor連携用
        }
        
        self.setup_schedule()

    def setup_schedule(self):
        """Pythonスケジューラー設定"""
        # 週次実行
        schedule.every().sunday.at("00:01").do(self.run_weekly_task)
        
        # デイリーチェック
        schedule.every().day.at("12:00").do(self.run_daily_check)
        
        # データ変更監視
        schedule.every().hour.do(self.check_data_changes)

    def start_background_scheduler(self):
        """バックグラウンドでスケジューラー実行"""
        def scheduler_worker():
            while True:
                schedule.run_pending()
                time.sleep(1)
        
        scheduler_thread = threading.Thread(target=scheduler_worker, daemon=True)
        scheduler_thread.start()
        
        print("🤖 nAgent自動化システム開始")
        print(f"   次回実行: {schedule.next_run()}")

    def check_data_changes(self):
        """メモデータの変更を監視"""
        try:
            memo_content = self.automation.get_memo_content()
            if memo_content:
                gym_data, _ = self.automation.extract_gym_data(memo_content)
                if gym_data:
                    # 新しいデータが見つかった場合、増分処理実行
                    success = self.automation.run_weekly_automation(clean_memo=False)
                    if success:
                        print(f"✅ 増分データ処理完了: {len(gym_data)}件")
                        
        except Exception as e:
            print(f"❌ データ変更チェックエラー: {e}")
```

---

## 🎨 フロントエンド実装詳細

### **期間フィルター機能の実装**

**設計思想**: デフォルトの累積平均を維持しつつ、柔軟な期間分析を提供

```javascript
// js/dataProcessor.js - フィルター実装
class DataProcessor {
    applyDateFilter(data, filterOption) {
        if (filterOption.type === 'all') {
            return data; // 全期間（デフォルト）
        }
        
        const cutoffDate = this.calculateCutoffDate(filterOption);
        const filteredData = data.filter(row => new Date(row.date) >= cutoffDate);
        
        // 最小データ点チェック
        if (filteredData.length < 5) {
            throw new Error('選択期間のデータが不足しています（最小5件必要）');
        }
        
        return filteredData;
    }
    
    calculateCutoffDate(filterOption) {
        const today = new Date();
        
        switch (filterOption.type) {
            case 'week':
                return new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            case 'custom':
                return new Date(filterOption.startDate);
            default:
                return new Date(0); // 全期間
        }
    }
}

// URLパラメータとの同期
class FilterManager {
    saveFilterToURL(filterOption) {
        const url = new URL(window.location);
        url.searchParams.set('period', filterOption.type);
        
        if (filterOption.type === 'custom') {
            url.searchParams.set('start', filterOption.startDate);
            url.searchParams.set('end', filterOption.endDate);
        }
        
        window.history.replaceState({}, '', url);
    }
    
    loadFilterFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const period = urlParams.get('period') || 'all';
        
        if (period === 'custom') {
            return {
                type: 'custom',
                startDate: urlParams.get('start'),
                endDate: urlParams.get('end')
            };
        }
        
        return { type: period };
    }
}
```

### **Chart.js統合とカスタマイズ**

```javascript
// js/chartManager.js - チャート管理
class ChartManager {
    constructor() {
        this.charts = {};
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.y}人`;
                        }
                    }
                }
            }
        };
    }
    
    async createWeeklyChart(data) {
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        
        this.charts.weekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['月', '火', '水', '木', '金', '土', '日'],
                datasets: [{
                    label: '平均人数',
                    data: data.weeklyAverages,
                    backgroundColor: this.generateColors(7, 0.6),
                    borderColor: this.generateColors(7, 1),
                    borderWidth: 1
                }]
            },
            options: {
                ...this.chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '人数' }
                    }
                }
            }
        });
    }
    
    generateColors(count, alpha) {
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'];
        return colors.slice(0, count).map(color => color.replace(')', `, ${alpha})`).replace('#', 'rgba(').replace('rgba(', 'rgba(').split('').map((char, i) => i === 0 ? 'rgba(' : char).join(''));
    }
}
```

---

## 🔧 開発ツール・ワークフロー

### **開発環境構成**

**主要ツール**:
- **Cursor + Claude Code**: AI支援開発環境
- **nAgent**: リアルタイム開発支援・監視
- **macOS launchd**: 本番自動化
- **Chart.js**: データ可視化
- **Vite + TypeScript**: React版モダン開発

### **開発ワークフロー**

```bash
# 1. 開発環境起動
python3 -m http.server 8000  # メインダッシュボード
cd crowd-dashboard-modern && npm run dev  # React版

# 2. nAgent開発モード
python3 nagent_automation.py  # リアルタイム監視

# 3. テスト実行
python3 weekly_automation.py  # 手動実行テスト

# 4. 本番デプロイ
./setup_weekly_automation.sh  # launchd自動化設定
```

### **技術選定の理由**

#### **なぜPython？**
- **AppleScript統合**: macOSネイティブ機能との親和性
- **データ処理**: 正規表現、CSV操作の豊富なライブラリ
- **自動化**: schedule, threading等の豊富な自動化ライブラリ

#### **なぜChart.js？**
- **軽量性**: バンドルサイズが小さく、高速
- **カスタマイズ性**: 豊富なオプションと拡張性
- **安定性**: 長期サポートとコミュニティ

#### **なぜReact + TypeScript？**
- **型安全性**: データ構造の明確化と開発効率
- **コンポーネント再利用**: 保守性の向上
- **最新技術**: 将来的な拡張性

#### **なぜlaunchd？**
- **システム統合**: macOSネイティブスケジューラー
- **信頼性**: 98-99%の実行成功率
- **無人運用**: システムレベルでの確実な実行

---

## 📊 パフォーマンス最適化

### **フロントエンド最適化**

```javascript
// 大量データの効率的処理
class DataOptimizer {
    optimizeForLargeDatasets(data) {
        // データポイント数制限
        if (data.length > 1000) {
            return this.sampleData(data, 1000);
        }
        
        // メモリ効率的なグループ化
        return this.efficientGroupBy(data);
    }
    
    sampleData(data, maxPoints) {
        const step = Math.ceil(data.length / maxPoints);
        return data.filter((_, index) => index % step === 0);
    }
}

// 非同期データ読み込み
async function loadDataProgressively() {
    const response = await fetch('fit_place24_data.csv');
    const reader = response.body.getReader();
    
    let chunk = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunk += new TextDecoder().decode(value);
        // プログレッシブレンダリング
        this.updateChartPartially(chunk);
    }
}
```

### **バックエンド最適化**

```python
# メモリ効率的なCSV処理
def update_csv_efficiently(self, new_gym_data):
    """既存データと新データの効率的なマージ"""
    
    # 既存データのハッシュセット作成（重複チェック用）
    existing_hashes = set()
    if os.path.exists(self.csv_file):
        with open(self.csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                existing_hashes.add(hash(row['datetime']))
    
    # 新データのフィルタリング
    new_data = [
        data for data in new_gym_data 
        if hash(data['datetime']) not in existing_hashes
    ]
    
    # 追記処理（全体読み込みを避ける）
    if new_data:
        with open(self.csv_file, 'a', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=self.get_fieldnames())
            writer.writerows(new_data)
```

次回は今回のセッションで解決した重要なバグ修正について詳しく解説します。