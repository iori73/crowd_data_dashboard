#!/usr/bin/env python3
"""
ジム混雑状況 完全自動化システム（ファイルベース版）
- Apple メモを使わない安定システム
- iCloudファイル直接処理
- 完全なトランザクション保証
"""

import csv
import json
import re
import os
import shutil
import datetime as dt
from pathlib import Path
import logging
from collections import defaultdict


class GymAnalysisAutomation:
    def __init__(self):
        self.project_dir = Path("/Users/i_kawano/Documents/training_waitnum_analysis")
        self.csv_file = self.project_dir / "data" / "fit_place24_data.csv"
        self.backup_dir = self.project_dir / "backups"
        self.log_file = self.project_dir / "logs" / "automation.log"
        
        # iCloudパス設定
        self.icloud_base = Path.home() / "Library/Mobile Documents/com~apple~CloudDocs/Shortcuts/FIT_PLACE24"
        self.inbox_file = self.icloud_base / "inbox.csv"
        
        # ステータスマッピング
        self.status_map = {
            "空いています": "low",
            "やや空いています": "mid-low", 
            "普通": "mid",
            "やや混雑": "mid-high",
            "やや混んでいます": "mid-high",
            "混雑": "high",
            "混んでいます": "high",
            "かなり混雑": "very-high",
        }
        
        self._setup_directories()
        self._setup_logging()

    def _setup_directories(self):
        """必要なディレクトリを作成"""
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.csv_file.parent.mkdir(parents=True, exist_ok=True)
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        self.icloud_base.mkdir(parents=True, exist_ok=True)

    def _setup_logging(self):
        """ログ設定"""
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s - %(levelname)s - %(message)s",
            handlers=[
                logging.FileHandler(self.log_file, encoding="utf-8"),
                logging.StreamHandler(),
            ],
        )
        self.logger = logging.getLogger(__name__)

    def read_existing_csv_data(self):
        """既存のCSVデータを読み込み"""
        existing_data = []
        existing_keys = set()
        
        if self.csv_file.exists():
            try:
                with self.csv_file.open(newline="", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        existing_data.append(row)
                        # 重複チェック用キー（日時+場所+人数）
                        key = (row.get("datetime", ""), row.get("location", ""), str(row.get("count", "")))
                        existing_keys.add(key)
            except Exception as e:
                self.logger.error(f"既存CSV読み込みエラー: {e}")
        
        return existing_data, existing_keys

    def read_inbox_csv(self):
        """inbox.csvからデータを読み込み"""
        if not self.inbox_file.exists():
            self.logger.info("inbox.csvが存在しません")
            return []
        
        try:
            with self.inbox_file.open("r", encoding="utf-8", newline="") as f:
                reader = csv.reader(f)
                rows = []
                
                for line_num, row in enumerate(reader, 1):
                    if len(row) < 7:
                        self.logger.warning(f"inbox.csv 行{line_num}: カラム不足 ({len(row)}/7)")
                        continue
                    
                    source, ts_local, people, status, location, device, raw = row[:7]
                    
                    # データ正規化
                    people_num = None
                    if people:
                        match = re.search(r"(\d{1,3})", people)
                        if match:
                            people_num = int(match.group(1))
                    
                    # ステータス正規化
                    normalized_status = self.status_map.get(status, status or "")
                    
                    processed_row = {
                        "source": source,
                        "ts_local": ts_local,
                        "people": people_num if people_num is not None else "",
                        "status": normalized_status,
                        "location": location,
                        "device": device,
                        "raw": raw,
                        "line_num": line_num
                    }
                    rows.append(processed_row)
                
                self.logger.info(f"inbox.csvから{len(rows)}件のデータを読み込み")
                return rows
                
        except Exception as e:
            self.logger.error(f"inbox.csv読み込みエラー: {e}")
            return []

    def convert_to_dashboard_format(self, inbox_data):
        """inbox.csvデータをダッシュボード形式に変換"""
        converted_data = []
        
        for row in inbox_data:
            try:
                # 日時解析
                ts_str = row["ts_local"]
                if not ts_str:
                    continue
                
                # ISO 8601形式をパース
                try:
                    dt_obj = dt.datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                except ValueError:
                    # 別の形式を試行
                    dt_obj = dt.datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S")
                
                # タイムゾーンを統一（naive datetimeに変換）
                if dt_obj.tzinfo is not None:
                    dt_obj = dt_obj.replace(tzinfo=None)
                
                # 未来のデータを拒否
                now = dt.datetime.now()
                if dt_obj > now:
                    dt_obj = dt_obj - dt.timedelta(days=1)
                    self.logger.info(f"未来時刻を昨日のデータとして解釈: {dt_obj}")
                
                # 古すぎるデータを拒否（7日以上前）
                if (now - dt_obj).days > 7:
                    self.logger.warning(f"古すぎるデータをスキップ: {dt_obj}")
                    continue
                
                people = row["people"]
                if not isinstance(people, int):
                    continue
                
                # ステータス情報を生成
                status_info = self._generate_status_info(people, row["status"])
                
                converted_row = {
                    "datetime": dt_obj.strftime("%Y-%m-%d %H:%M:%S"),
                    "date": dt_obj.strftime("%Y-%m-%d"),
                    "time": dt_obj.strftime("%H:%M"),
                    "hour": dt_obj.hour,
                    "weekday": dt_obj.strftime("%A"),
                    "count": people,
                    "status_label": status_info["label"],
                    "status_code": status_info["code"],
                    "status_min": status_info["min"],
                    "status_max": status_info["max"],
                    "raw_text": row["raw"],
                }
                
                converted_data.append(converted_row)
                
            except Exception as e:
                self.logger.warning(f"データ変換エラー (行{row.get('line_num', '?')}): {e}")
                continue
        
        self.logger.info(f"{len(converted_data)}件のデータを変換完了")
        return converted_data

    def _generate_status_info(self, people_count, status_text):
        """人数とステータステキストから詳細ステータス情報を生成"""
        # テキストベースの判定
        if "空いています" in status_text and "やや" not in status_text:
            return {"code": 5, "label": "空いています（~10人）", "min": 0, "max": 10}
        elif "やや空いています" in status_text:
            return {"code": 4, "label": "やや空いています（~20人）", "min": 11, "max": 20}
        elif "やや混んでいます" in status_text or "やや混雑" in status_text:
            return {"code": 3, "label": "少し混んでいます（~30人）", "min": 21, "max": 30}
        elif "混んでいます" in status_text or "混雑" in status_text:
            return {"code": 2, "label": "混んでいます（~40人）", "min": 31, "max": 40}
        else:
            # 人数ベースの判定
            if people_count <= 10:
                return {"code": 5, "label": "空いています（~10人）", "min": 0, "max": 10}
            elif people_count <= 20:
                return {"code": 4, "label": "やや空いています（~20人）", "min": 11, "max": 20}
            elif people_count <= 30:
                return {"code": 3, "label": "少し混んでいます（~30人）", "min": 21, "max": 30}
            else:
                return {"code": 2, "label": "混んでいます（~40人）", "min": 31, "max": 40}

    def dedupe_data(self, all_data):
        """重複データを除去"""
        seen = set()
        unique_data = []
        
        for row in sorted(all_data, key=lambda x: x.get("datetime", "")):
            # 重複チェックキー
            key = (row.get("datetime", ""), row.get("location", "矢向"), str(row.get("count", "")))
            
            if key in seen:
                self.logger.debug(f"重複データをスキップ: {key}")
                continue
            
            seen.add(key)
            unique_data.append(row)
        
        removed = len(all_data) - len(unique_data)
        if removed > 0:
            self.logger.info(f"重複データ{removed}件を除去")
        
        return unique_data

    def write_csv(self, data):
        """CSVファイルに書き込み"""
        fieldnames = [
            "datetime", "date", "time", "hour", "weekday",
            "count", "status_label", "status_code", "status_min", "status_max", "raw_text"
        ]
        
        # 一時ファイルに書き込み後、アトミック移動
        tmp_file = self.csv_file.with_suffix(".tmp.csv")
        
        try:
            with tmp_file.open("w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for row in data:
                    # フィールド名に合わせてデータを整理
                    clean_row = {field: row.get(field, "") for field in fieldnames}
                    writer.writerow(clean_row)
            
            # アトミック移動
            shutil.move(str(tmp_file), str(self.csv_file))
            self.logger.info(f"CSVファイル更新完了: {len(data)}件")
            return True
            
        except Exception as e:
            if tmp_file.exists():
                tmp_file.unlink()
            self.logger.error(f"CSV書き込みエラー: {e}")
            return False

    def backup_inbox(self):
        """処理済みinbox.csvをバックアップ"""
        if not self.inbox_file.exists():
            return True
        
        timestamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.backup_dir / f"inbox_{timestamp}.csv"
        
        try:
            shutil.move(str(self.inbox_file), str(backup_path))
            self.logger.info(f"inbox.csvをバックアップ: {backup_path.name}")
            return True
        except Exception as e:
            self.logger.error(f"inboxバックアップエラー: {e}")
            return False

    def analyze_data(self):
        """データ分析を実行"""
        try:
            existing_data, _ = self.read_existing_csv_data()
            
            if not existing_data:
                self.logger.warning("分析対象データがありません")
                return
            
            # 時間帯別分析
            hourly_analysis = defaultdict(list)
            
            for row in existing_data:
                if row.get("hour") and row.get("count"):
                    try:
                        hour = int(row["hour"])
                        count = int(row["count"])
                        hourly_analysis[hour].append(count)
                    except ValueError:
                        continue
            
            self.logger.info(f"📊 データ分析結果（総データ数: {len(existing_data)}件）")
            
            # 最適時間帯
            best_times = []
            for hour in sorted(hourly_analysis.keys()):
                counts = hourly_analysis[hour]
                avg_count = sum(counts) / len(counts)
                if avg_count <= 15:
                    best_times.append((hour, avg_count))
            
            if best_times:
                best_times.sort(key=lambda x: x[1])
                self.logger.info("🎯 最適利用時間帯（空いている時間帯）:")
                for hour, avg in best_times:
                    self.logger.info(f"  {hour:2d}:00 - 平均 {avg:.1f}人 ⭐️")
            
            # 混雑時間帯
            busy_times = []
            for hour in sorted(hourly_analysis.keys()):
                counts = hourly_analysis[hour]
                avg_count = sum(counts) / len(counts)
                if avg_count >= 20:
                    busy_times.append((hour, avg_count))
            
            if busy_times:
                busy_times.sort(key=lambda x: x[1], reverse=True)
                self.logger.info("⚠️ 混雑時間帯（避けるべき時間帯）:")
                for hour, avg in busy_times:
                    self.logger.info(f"  {hour:2d}:00 - 平均 {avg:.1f}人 ⚠️")
                    
        except Exception as e:
            self.logger.error(f"分析エラー: {e}")

    def run_weekly_automation(self):
        """週次自動実行（メイン処理）"""
        self.logger.info("🚀 週次自動実行を開始します...")
        
        try:
            # 1. inbox.csvから新データを読み込み
            self.logger.info("📂 inbox.csvから新データを読み込み中...")
            inbox_data = self.read_inbox_csv()
            
            if not inbox_data:
                self.logger.info("📋 新しいデータはありませんでした")
                return True
            
            # 2. データをダッシュボード形式に変換
            self.logger.info("🔄 データを変換中...")
            converted_data = self.convert_to_dashboard_format(inbox_data)
            
            if not converted_data:
                self.logger.warning("⚠️ 変換可能なデータがありませんでした")
                self.backup_inbox()  # 空でもバックアップ
                return True
            
            # 3. 既存データと統合
            self.logger.info("🔗 既存データと統合中...")
            existing_data, _ = self.read_existing_csv_data()
            all_data = existing_data + converted_data
            
            # 4. 重複除去
            unique_data = self.dedupe_data(all_data)
            
            # 5. CSVファイル更新
            self.logger.info("💾 CSVファイルを更新中...")
            if not self.write_csv(unique_data):
                self.logger.error("❌ CSV更新に失敗")
                return False
            
            new_count = len(converted_data)
            total_count = len(unique_data)
            
            self.logger.info(f"✅ {new_count}件の新データを追加")
            self.logger.info(f"📁 総データ数: {total_count}件")
            
            # 6. inbox.csvをバックアップ
            self.logger.info("🗃️ inbox.csvをバックアップ中...")
            if not self.backup_inbox():
                self.logger.warning("⚠️ バックアップに失敗しましたが、処理を継続")
            
            # 7. データ分析
            self.logger.info("📊 データ分析を実行中...")
            self.analyze_data()
            
            self.logger.info("🎉 週次自動実行が完了しました！")
            return True
            
        except Exception as e:
            self.logger.error(f"週次自動実行エラー: {e}")
            return False

    def diagnose_system(self):
        """システム診断"""
        self.logger.info("🔍 システム診断を開始...")
        
        # iCloudディレクトリの確認
        if not self.icloud_base.exists():
            self.logger.error(f"❌ iCloudディレクトリが存在しません: {self.icloud_base}")
            return False
        
        # inbox.csvの確認
        if self.inbox_file.exists():
            try:
                with self.inbox_file.open("r", encoding="utf-8") as f:
                    lines = f.readlines()
                self.logger.info(f"📂 inbox.csv: {len(lines)}行のデータ")
            except Exception as e:
                self.logger.error(f"❌ inbox.csv読み込みエラー: {e}")
        else:
            self.logger.info("📂 inbox.csv: ファイルが存在しません")
        
        # 既存CSVの確認
        if self.csv_file.exists():
            existing_data, _ = self.read_existing_csv_data()
            self.logger.info(f"💾 既存CSV: {len(existing_data)}件のデータ")
        else:
            self.logger.info("💾 既存CSV: ファイルが存在しません")
        
        # ディレクトリ権限の確認
        for path in [self.icloud_base, self.backup_dir, self.csv_file.parent]:
            if path.exists() and os.access(path, os.R_OK | os.W_OK):
                self.logger.info(f"✅ {path.name}: 読み書き権限OK")
            else:
                self.logger.warning(f"⚠️ {path.name}: 権限不足または存在しない")
        
        self.logger.info("🔍 システム診断完了")
        return True

    def create_sample_inbox(self):
        """テスト用のサンプルinbox.csvを作成"""
        sample_data = [
            ["FIT_PLACE24", "2025-08-15T19:30:00+09:00", "20", "やや空いています", "矢向", "iPhone", "混雑状況 20人 やや空いています"],
            ["FIT_PLACE24", "2025-08-15T14:15:00+09:00", "15", "空いています", "矢向", "iPhone", "混雑状況 15人 空いています"],
        ]
        
        try:
            with self.inbox_file.open("w", encoding="utf-8", newline="") as f:
                writer = csv.writer(f)
                writer.writerows(sample_data)
            self.logger.info(f"📝 サンプルinbox.csvを作成: {self.inbox_file}")
            return True
        except Exception as e:
            self.logger.error(f"サンプル作成エラー: {e}")
            return False


def main():
    """メイン実行関数"""
    automation = GymAnalysisAutomation()
    
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "--weekly":
            automation.run_weekly_automation()
        elif command == "diagnose":
            automation.diagnose_system()
        elif command == "analyze":
            automation.analyze_data()
        elif command == "sample":
            automation.create_sample_inbox()
        else:
            print(f"❌ 不明なコマンド: {command}")
            print("利用可能なコマンド: --weekly, diagnose, analyze, sample")
    else:
        # インタラクティブモード
        print("🤖 ジム混雑状況 自動化システム（ファイルベース版）")
        print("=" * 60)
        print("1. 🚀 週次自動実行")
        print("2. 🔍 システム診断")
        print("3. 📊 データ分析のみ")
        print("4. 📝 サンプルinbox.csv作成")
        
        choice = input("\n選択してください (1-4): ")
        
        if choice == "1":
            automation.run_weekly_automation()
        elif choice == "2":
            automation.diagnose_system()
        elif choice == "3":
            automation.analyze_data()
        elif choice == "4":
            automation.create_sample_inbox()
        else:
            print("❌ 無効な選択です")


if __name__ == "__main__":
    main()