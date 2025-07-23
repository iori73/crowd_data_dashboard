#!/usr/bin/env python3
"""
ジム混雑状況 完全自動化システム（週次実行対応版）
- メモクリーニング機能付き
- 自動実行対応
- 安全なデータ処理
"""

import subprocess
import re
import csv
import os
import shutil
import json
from datetime import datetime, timedelta
from collections import defaultdict
import logging

class GymAnalysisAutomation:
    def __init__(self):
        self.project_dir = "/Users/i_kawano/Documents/training_waitnum_analysis"
        self.csv_file = os.path.join(self.project_dir, "fit_place24_data.csv")
        self.backup_dir = os.path.join(self.project_dir, "backups")
        self.log_file = os.path.join(self.project_dir, "automation.log")
        self.memo_name = "📸ShortcutでFIT PLACE24の混雑状況OCR"
        
        # ディレクトリとログの初期化
        self._setup_directories()
        self._setup_logging()
        
    def _setup_directories(self):
        """必要なディレクトリを作成"""
        os.makedirs(self.backup_dir, exist_ok=True)
        
    def _setup_logging(self):
        """ログ設定"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.log_file, encoding='utf-8'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def get_memo_content(self):
        """メモアプリから内容を取得"""
        script = f'''
        tell application "Notes"
            set noteContent to body of note "{self.memo_name}"
            return noteContent
        end tell
        '''
        
        try:
            result = subprocess.run(['osascript', '-e', script], 
                                  capture_output=True, text=True, encoding='utf-8')
            return result.stdout.strip()
        except Exception as e:
            self.logger.error(f"メモ取得エラー: {e}")
            return None
    
    def backup_memo_content(self, memo_content):
        """メモ内容をバックアップ"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(self.backup_dir, f"memo_backup_{timestamp}.txt")
        
        try:
            with open(backup_file, 'w', encoding='utf-8') as f:
                f.write(memo_content)
            self.logger.info(f"メモバックアップ作成: {backup_file}")
            return backup_file
        except Exception as e:
            self.logger.error(f"バックアップエラー: {e}")
            return None
    
    def extract_gym_data(self, memo_content):
        """メモから混雑状況データを抽出・構造化"""
        # HTMLタグを除去してクリーンなテキストに変換
        lines = memo_content.split('\n')
        clean_lines = []
        for line in lines:
            clean_line = re.sub(r'<[^>]*>', '', line).strip()
            if clean_line:
                clean_lines.append(clean_line)
        
        # 混雑状況データを抽出
        gym_data = []
        processed_lines = []  # 処理したライン番号を記録
        
        i = 0
        while i < len(clean_lines):
            line = clean_lines[i]
            if '混雜状況' in line or '混雑状況' in line:
                # 次の3行を取得
                try:
                    count_line = clean_lines[i+1] if i+1 < len(clean_lines) else ''
                    location_line = clean_lines[i+2] if i+2 < len(clean_lines) else ''
                    status_line = clean_lines[i+3] if i+3 < len(clean_lines) else ''
                    
                    # 人数を抽出
                    count_match = re.search(r'(\d+)人', count_line)
                    if count_match:
                        count = int(count_match.group(1))
                    else:
                        i += 1
                        continue
                    
                    # 時刻を抽出
                    time_match = re.search(r'(\d{1,2}):(\d{2})時点', status_line)
                    if time_match:
                        hour = int(time_match.group(1))
                        minute = int(time_match.group(2))
                    else:
                        i += 1
                        continue
                    
                    # 状態を抽出
                    status_text = status_line.replace(f'{hour}:{minute:02d}時点', '').strip()
                    
                    # 混雑度を判定
                    if '空いています' in status_text:
                        status_code = 5
                        status_label = '空いています（~10人）'
                        status_min, status_max = 0, 10
                    elif 'やや空いています' in status_text:
                        status_code = 4
                        status_label = 'やや空いています（~20人）'
                        status_min, status_max = 11, 20
                    elif 'やや混んでいます' in status_text:
                        status_code = 3
                        status_label = '少し混んでいます（~30人）'
                        status_min, status_max = 21, 30
                    elif '少し混んでいます' in status_text:
                        status_code = 3
                        status_label = '少し混んでいます（~30人）'
                        status_min, status_max = 21, 30
                    elif '混んでいます' in status_text:
                        status_code = 2
                        status_label = '混んでいます（~40人）'
                        status_min, status_max = 31, 40
                    else:
                        status_code = 4
                        status_label = 'やや空いています（~20人）'
                        status_min, status_max = 11, 20
                    
                    # 日時を設定（今日の日付）
                    today = datetime.now().date()
                    datetime_str = f'{today} {hour:02d}:{minute:02d}:00'
                    date_str = str(today)
                    time_str = f'{hour:02d}:{minute:02d}'
                    weekday = today.strftime('%A')
                    
                    # 生データを作成
                    raw_text = f'混雜状況 {count}人 {location_line} {status_text} {hour}:{minute:02d}時点'
                    
                    gym_data.append({
                        'datetime': datetime_str,
                        'date': date_str,
                        'time': time_str,
                        'hour': hour,
                        'weekday': weekday,
                        'count': count,
                        'status_label': status_label,
                        'status_code': status_code,
                        'status_min': status_min,
                        'status_max': status_max,
                        'raw_text': raw_text
                    })
                    
                    # 処理したライン範囲を記録
                    processed_lines.extend([i, i+1, i+2, i+3])
                    i += 4  # 4行分進む
                except Exception as e:
                    self.logger.error(f'データ解析エラー: {e}')
                    i += 1
            else:
                i += 1
        
        return gym_data, processed_lines
    
    def get_existing_csv_data(self):
        """既存のCSVデータを取得"""
        existing_data = []
        existing_datetimes = set()
        
        if os.path.exists(self.csv_file):
            try:
                with open(self.csv_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        existing_data.append(row)
                        existing_datetimes.add(row['datetime'])
            except Exception as e:
                self.logger.error(f"CSV読み込みエラー: {e}")
        
        return existing_data, existing_datetimes
    
    def update_csv(self, new_gym_data):
        """CSVファイルを更新"""
        existing_data, existing_datetimes = self.get_existing_csv_data()
        
        # 新しいデータのみフィルタリング
        new_data = []
        for data in new_gym_data:
            if data['datetime'] not in existing_datetimes:
                new_data.append(data)
        
        # 新しいデータを追加
        if new_data:
            # 全データを統合
            all_data = existing_data + new_data
            
            # 日時順にソート
            all_data.sort(key=lambda x: x['datetime'])
            
            # CSVファイルに書き込み
            try:
                with open(self.csv_file, 'w', encoding='utf-8', newline='') as f:
                    fieldnames = ['datetime', 'date', 'time', 'hour', 'weekday', 'count', 'status_label', 'status_code', 'status_min', 'status_max', 'raw_text']
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(all_data)
                
                self.logger.info(f"CSVファイルを更新: {len(new_data)}件追加, 総数{len(all_data)}件")
                return len(new_data), len(all_data)
            except Exception as e:
                self.logger.error(f"CSV書き込みエラー: {e}")
                return 0, len(existing_data)
        else:
            return 0, len(existing_data)
    
    def identify_processed_memo_content(self, memo_content, cutoff_date):
        """処理済みメモ内容を特定"""
        lines = memo_content.split('\n')
        lines_to_remove = []
        
        # HTMLタグを除去して解析
        clean_lines = []
        for i, line in enumerate(lines):
            clean_line = re.sub(r'<[^>]*>', '', line).strip()
            clean_lines.append(clean_line)
        
        i = 0
        while i < len(clean_lines):
            line = clean_lines[i]
            if '混雜状況' in line or '混雑状況' in line:
                try:
                    # 時刻情報を含む行を探す
                    for j in range(i, min(i+5, len(clean_lines))):
                        time_match = re.search(r'(\d{1,2}):(\d{2})時点', clean_lines[j])
                        if time_match:
                            hour = int(time_match.group(1))
                            minute = int(time_match.group(2))
                            
                            # 今日の日付で時刻を作成
                            today = datetime.now().date()
                            data_datetime = datetime.combine(today, datetime.min.time().replace(hour=hour, minute=minute))
                            
                            # カットオフ日時より前なら削除対象
                            if data_datetime.date() < cutoff_date:
                                lines_to_remove.extend(list(range(i, j+1)))
                                self.logger.info(f"削除対象特定: {hour:02d}:{minute:02d} ({data_datetime.date()})")
                            break
                    
                    i = j + 1 if 'time_match' in locals() else i + 1
                except Exception as e:
                    self.logger.error(f"メモ解析エラー: {e}")
                    i += 1
            else:
                i += 1
        
        return list(set(lines_to_remove))  # 重複除去
    
    def clean_memo_content(self, dry_run=False):
        """処理済みメモ内容を削除"""
        self.logger.info("🧹 メモクリーニング開始...")
        
        # 現在のメモ内容を取得
        memo_content = self.get_memo_content()
        if not memo_content:
            self.logger.error("メモ内容の取得に失敗")
            return False
        
        # バックアップ作成
        backup_file = self.backup_memo_content(memo_content)
        if not backup_file:
            self.logger.error("バックアップ作成に失敗")
            return False
        
        # 削除対象を特定（昨日以前のデータ）
        cutoff_date = datetime.now().date()
        lines_to_remove = self.identify_processed_memo_content(memo_content, cutoff_date)
        
        if not lines_to_remove:
            self.logger.info("削除対象のデータはありませんでした")
            return True
        
        if dry_run:
            self.logger.info(f"DRY RUN: {len(lines_to_remove)}行が削除対象です")
            return True
        
        # 新しいメモ内容を作成
        lines = memo_content.split('\n')
        new_lines = [line for i, line in enumerate(lines) if i not in lines_to_remove]
        new_content = '\n'.join(new_lines)
        
        # メモを更新
        try:
            # f-stringでのバックスラッシュエラーを回避するため、事前に処理
            escaped_content = new_content.replace('"', '\\"')
            script = f'''
            tell application "Notes"
                set body of note "{self.memo_name}" to "{escaped_content}"
            end tell
            '''
            
            result = subprocess.run(['osascript', '-e', script], 
                                  capture_output=True, text=True, encoding='utf-8')
            
            if result.returncode == 0:
                self.logger.info(f"✅ メモクリーニング完了: {len(lines_to_remove)}行削除")
                return True
            else:
                self.logger.error(f"メモ更新エラー: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"メモクリーニングエラー: {e}")
            return False
    
    def analyze_data(self):
        """データ分析を実行"""
        try:
            existing_data, _ = self.get_existing_csv_data()
            
            if not existing_data:
                self.logger.warning("分析対象データがありません")
                return
            
            # 時間帯別分析
            hourly_analysis = defaultdict(list)
            
            for row in existing_data:
                if row['hour'] and row['count']:
                    hour = int(row['hour'])
                    count = int(row['count'])
                    hourly_analysis[hour].append(count)
            
            self.logger.info(f'📊 データ分析結果（総データ数: {len(existing_data)}件）')
            
            # 最適時間帯の特定
            best_times = []
            for hour in sorted(hourly_analysis.keys()):
                counts = hourly_analysis[hour]
                avg_count = sum(counts) / len(counts)
                if avg_count <= 15:
                    best_times.append((hour, avg_count))
            
            if best_times:
                best_times.sort(key=lambda x: x[1])
                self.logger.info('🎯 最適利用時間帯（空いている時間帯）:')
                for hour, avg in best_times:
                    self.logger.info(f'  {hour:2d}:00 - 平均 {avg:.1f}人 ⭐️')
            
            # 混雑時間帯の特定
            busy_times = []
            for hour in sorted(hourly_analysis.keys()):
                counts = hourly_analysis[hour]
                avg_count = sum(counts) / len(counts)
                if avg_count >= 20:
                    busy_times.append((hour, avg_count))
            
            if busy_times:
                busy_times.sort(key=lambda x: x[1], reverse=True)
                self.logger.info('⚠️  混雑時間帯（避けるべき時間帯）:')
                for hour, avg in busy_times:
                    self.logger.info(f'  {hour:2d}:00 - 平均 {avg:.1f}人 ⚠️')
                    
        except Exception as e:
            self.logger.error(f"分析エラー: {e}")
    
    def run_weekly_automation(self, clean_memo=True):
        """週次自動実行"""
        self.logger.info("🚀 週次自動実行を開始します...")
        
        try:
            # 1. メモから新データを取得
            self.logger.info("📱 メモアプリからデータを取得中...")
            memo_content = self.get_memo_content()
            if not memo_content:
                self.logger.error("❌ メモデータの取得に失敗しました")
                return False
            
            # 2. 混雑状況データを抽出・構造化
            self.logger.info("🔍 混雑状況データを抽出中...")
            gym_data, processed_lines = self.extract_gym_data(memo_content)
            self.logger.info(f"📊 混雑状況データを {len(gym_data)} 件抽出しました")
            
            # 3. CSVファイルを更新
            self.logger.info("💾 CSVファイルを更新中...")
            new_count, total_count = self.update_csv(gym_data)
            
            if new_count > 0:
                self.logger.info(f"✅ {new_count} 件の新データをCSVに追加しました")
            else:
                self.logger.info("ℹ️  追加する新データはありませんでした")
            
            self.logger.info(f"📁 総データ数: {total_count} 件")
            
            # 4. メモクリーニング（オプション）
            if clean_memo:
                self.logger.info("🧹 メモクリーニングを実行中...")
                clean_success = self.clean_memo_content()
                if not clean_success:
                    self.logger.warning("⚠️  メモクリーニングに失敗しましたが、処理を継続します")
            
            # 5. データ分析を実行
            self.logger.info("📊 データ分析を実行中...")
            self.analyze_data()
            
            self.logger.info("🎉 週次自動実行が完了しました！")
            return True
            
        except Exception as e:
            self.logger.error(f"週次自動実行エラー: {e}")
            return False
    
    def run_manual_mode(self):
        """手動実行モード"""
        self.logger.info("🤖 ジム混雑状況 自動化システム")
        print("=" * 60)
        print("1. 🚀 通常の自動化を実行")
        print("2. 📱 メモ内容を確認")
        print("3. 🧹 メモクリーニング（ドライラン）")
        print("4. 🧹 メモクリーニング（実行）")
        print("5. 📊 分析のみ実行")
        print("6. 🔄 週次自動実行（フル機能）")
        
        choice = input("\n選択してください (1-6): ")
        
        if choice == "1":
            # 通常の自動化実行（クリーニングなし）
            self.run_weekly_automation(clean_memo=False)
        elif choice == "2":
            memo_content = self.get_memo_content()
            if memo_content:
                print("📱 メモ内容（最新1000文字）:")
                print("=" * 50)
                print(memo_content[-1000:])
                print("=" * 50)
        elif choice == "3":
            # ドライラン
            self.clean_memo_content(dry_run=True)
        elif choice == "4":
            # 実際のクリーニング
            self.clean_memo_content(dry_run=False)
        elif choice == "5":
            self.analyze_data()
        elif choice == "6":
            # フル週次自動実行
            self.run_weekly_automation(clean_memo=True)
        else:
            print("❌ 無効な選択です")

def main():
    """メイン実行関数"""
    automation = GymAnalysisAutomation()
    
    # 引数チェック（自動実行用）
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--weekly":
        # 週次自動実行
        automation.run_weekly_automation(clean_memo=True)
    else:
        # 手動実行モード
        automation.run_manual_mode()

if __name__ == "__main__":
    main()
