#!/usr/bin/env python3
"""
ジム混雑状況 画像ベース完全自動化システム（無料OCR版）
- iPhoneスクリーンショット → 無料OCR → CSV統合
- 既存の正規表現ロジックを最大活用
- 完全無料実装（EasyOCR + Tesseract）
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

# 無料OCRライブラリ
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    logging.warning("EasyOCR not available. Install with: pip install easyocr")

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logging.warning("Tesseract not available. Install with: pip install pytesseract pillow")


class GymImageOCRPipeline:
    def __init__(self):
        self.project_dir = Path("/Users/i_kawano/Documents/training_waitnum_analysis")
        self.csv_file = self.project_dir / "data" / "fit_place24_data.csv"
        self.backup_dir = self.project_dir / "backups"
        self.log_file = self.project_dir / "logs" / "weekly_ocr.log"
        
        # 画像処理関連パス
        self.icloud_images = Path.home() / "Library/Mobile Documents/iCloud~is~workflow~my~workflows/Documents/FIT_PLACE24"
        self.archive_base = self.project_dir / "archive" / "screens"
        self.processed_dir = self.archive_base / "processed"
        self.failed_dir = self.archive_base / "failed"
        
        # ステータスマッピング（既存ロジック流用）
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
        
        # OCRエンジン初期化（ログ設定後に実行）
        self.easyocr_reader = None
        if EASYOCR_AVAILABLE:
            try:
                self.easyocr_reader = easyocr.Reader(['ja', 'en'], gpu=False)
                self.logger.info("EasyOCR初期化完了")
            except Exception as e:
                self.logger.warning(f"EasyOCR初期化失敗: {e}")

    def _setup_directories(self):
        """必要なディレクトリを作成"""
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        self.csv_file.parent.mkdir(parents=True, exist_ok=True)
        self.log_file.parent.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        self.failed_dir.mkdir(parents=True, exist_ok=True)

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

    def find_new_images(self):
        """iCloudから新しい画像ファイルを検索"""
        if not self.icloud_images.exists():
            self.logger.error(f"iCloudディレクトリが存在しません: {self.icloud_images}")
            return []
        
        # PNG画像を検索（ファイル名パターン: FP24_20250815_222321.png or 2025:08:15, 22:23.png）
        image_files = []
        for pattern in ["*.png", "*.PNG", "*.jpg", "*.JPEG"]:
            for img_path in self.icloud_images.glob(pattern):
                if img_path.is_file():
                    image_files.append(img_path)
        
        self.logger.info(f"iCloudから{len(image_files)}個の画像ファイルを発見")
        return sorted(image_files, key=lambda x: x.stat().st_mtime)

    def extract_text_from_image(self, image_path):
        """画像からテキストを抽出（EasyOCR → Tesseract フォールバック）"""
        extracted_text = ""
        
        # Primary: EasyOCR
        if self.easyocr_reader:
            try:
                results = self.easyocr_reader.readtext(str(image_path))
                text_parts = [result[1] for result in results if result[2] > 0.3]  # 信頼度30%以上
                extracted_text = " ".join(text_parts)
                self.logger.info(f"EasyOCR抽出成功: {len(text_parts)}個のテキスト要素")
            except Exception as e:
                self.logger.warning(f"EasyOCR失敗: {e}")
        
        # Fallback: Tesseract OCR
        if not extracted_text and TESSERACT_AVAILABLE:
            try:
                image = Image.open(image_path)
                extracted_text = pytesseract.image_to_string(image, lang='jpn+eng')
                self.logger.info("Tesseract OCR抽出成功")
            except Exception as e:
                self.logger.warning(f"Tesseract OCR失敗: {e}")
        
        if not extracted_text:
            self.logger.error(f"OCR抽出失敗: {image_path}")
        
        return extracted_text.strip()

    def parse_filename_timestamp(self, image_path):
        """ファイル名から日時情報を抽出"""
        filename = image_path.name
        
        # パターン1: 2025:08:15, 22:23.png (iOS Shortcut形式)
        pattern1 = r"(\d{4}):(\d{2}):(\d{2}),\s*(\d{2}):(\d{2})"
        match1 = re.search(pattern1, filename)
        if match1:
            year, month, day, hour, minute = match1.groups()
            try:
                dt_obj = dt.datetime(int(year), int(month), int(day), int(hour), int(minute))
                return dt_obj
            except ValueError as e:
                self.logger.warning(f"日時解析エラー (パターン1): {e}")
        
        # パターン2: FP24_20250815_222321.png
        pattern2 = r"FP24_(\d{8})_(\d{6})"
        match2 = re.search(pattern2, filename)
        if match2:
            date_part, time_part = match2.groups()
            try:
                dt_obj = dt.datetime.strptime(f"{date_part}_{time_part}", "%Y%m%d_%H%M%S")
                return dt_obj
            except ValueError as e:
                self.logger.warning(f"日時解析エラー (パターン2): {e}")
        
        # フォールバック: ファイルの変更日時
        file_mtime = dt.datetime.fromtimestamp(image_path.stat().st_mtime)
        self.logger.info(f"ファイル名から日時抽出失敗、ファイル更新日時を使用: {file_mtime}")
        return file_mtime

    def parse_gym_data(self, text, timestamp):
        """既存の正規表現ロジックでジムデータを解析"""
        # 人数抽出（既存ロジック流用）
        people_patterns = [
            r"(\d{1,3})\s*人",
            r"混雑状況\s*(\d{1,3})",
            r"現在\s*(\d{1,3})\s*人",
        ]
        
        people_count = None
        for pattern in people_patterns:
            match = re.search(pattern, text)
            if match:
                people_count = int(match.group(1))
                break
        
        # ステータス抽出（完全一致での正確な抽出）
        status_text = ""
        # 完全なフレーズのみをマッチング（優先順位順）
        exact_status_patterns = [
            "やや空いています",
            "少し混んでいます", 
            "かなり混んでいます",
            "やや混んでいます",
            "空いています",
            "混んでいます",
            "かなり混雑",
            "普通"
        ]
        
        # 完全一致でのみ抽出
        for pattern in exact_status_patterns:
            if pattern in text:
                status_text = pattern
                break
        
        # データ構造化
        if people_count is not None:
            # 既存の_generate_status_infoロジックを適用
            status_info = self._generate_status_info(people_count, status_text)
            
            converted_data = {
                "datetime": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "date": timestamp.strftime("%Y-%m-%d"),
                "time": timestamp.strftime("%H:%M"),
                "hour": timestamp.hour,
                "weekday": timestamp.strftime("%A"),
                "count": people_count,
                "status_label": status_info["label"],
                "status_code": status_info["code"],
                "status_min": status_info["min"],
                "status_max": status_info["max"],
                "raw_text": text[:200],  # 最初の200文字のみ保存
            }
            
            return converted_data
        
        self.logger.warning(f"人数情報の抽出に失敗: {text[:100]}")
        return None

    def _generate_status_info(self, people_count, status_text):
        """正しい5段階ステータス判定: 人数とステータステキストから詳細ステータス情報を生成"""
        # テキストベースの判定（順序重要：より具体的なパターンを先に判定）
        if "やや空いています" in status_text:
            return {"code": 4, "label": "やや空いています（~20人）", "min": 11, "max": 20}
        elif "やや混んでいます" in status_text or "少し混んでいます" in status_text:
            return {"code": 3, "label": "少し混んでいます（~30人）", "min": 21, "max": 30}
        elif "かなり混んでいます" in status_text or "かなり混雑" in status_text:
            return {"code": 1, "label": "かなり混んでいます（~50人）", "min": 41, "max": 50}
        elif "空いています" in status_text:
            return {"code": 5, "label": "空いています（~10人）", "min": 0, "max": 10}
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
            elif people_count <= 40:
                return {"code": 2, "label": "混んでいます（~40人）", "min": 31, "max": 40}
            else:
                return {"code": 1, "label": "かなり混んでいます（~50人）", "min": 41, "max": 50}

    def read_existing_csv_data(self):
        """既存のCSVデータを読み込み（既存ロジック流用）"""
        existing_data = []
        existing_keys = set()
        
        if self.csv_file.exists():
            try:
                with self.csv_file.open(newline="", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        existing_data.append(row)
                        # 重複チェック用キー（日時+場所+人数）
                        key = (row.get("datetime", ""), "矢向", str(row.get("count", "")))
                        existing_keys.add(key)
            except Exception as e:
                self.logger.error(f"既存CSV読み込みエラー: {e}")
        
        return existing_data, existing_keys

    def dedupe_data(self, all_data):
        """重複データを除去（既存ロジック流用）"""
        seen = set()
        unique_data = []
        
        for row in sorted(all_data, key=lambda x: x.get("datetime", "")):
            # 重複チェックキー
            key = (row.get("datetime", ""), "矢向", str(row.get("count", "")))
            
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
        """CSVファイルに書き込み（既存ロジック流用）"""
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

    def archive_image(self, image_path, success=True):
        """処理済み画像をアーカイブ"""
        timestamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
        archive_dir = self.processed_dir if success else self.failed_dir
        
        new_name = f"{timestamp}_{image_path.name}"
        archive_path = archive_dir / new_name
        
        try:
            shutil.move(str(image_path), str(archive_path))
            status = "processed" if success else "failed"
            self.logger.info(f"画像を{status}にアーカイブ: {new_name}")
            return True
        except Exception as e:
            self.logger.error(f"画像アーカイブエラー: {e}")
            return False

    def analyze_data(self):
        """データ分析を実行（既存ロジック流用）"""
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
            
        except Exception as e:
            self.logger.error(f"分析エラー: {e}")

    def run_weekly_ocr_pipeline(self):
        """週次画像OCR処理パイプライン（メイン処理）"""
        self.logger.info("🚀 週次画像OCR処理を開始します...")
        
        try:
            # 1. 新しい画像ファイルを検索
            self.logger.info("📂 iCloudから新しい画像を検索中...")
            image_files = self.find_new_images()
            
            if not image_files:
                self.logger.info("📋 新しい画像はありませんでした")
                return True
            
            # 2. 画像からデータを抽出
            self.logger.info(f"🔍 {len(image_files)}個の画像を処理中...")
            new_data = []
            processed_count = 0
            failed_count = 0
            
            for image_path in image_files:
                try:
                    # OCRでテキスト抽出
                    extracted_text = self.extract_text_from_image(image_path)
                    if not extracted_text:
                        self.archive_image(image_path, success=False)
                        failed_count += 1
                        continue
                    
                    # ファイル名から日時抽出
                    timestamp = self.parse_filename_timestamp(image_path)
                    
                    # データ解析
                    parsed_data = self.parse_gym_data(extracted_text, timestamp)
                    if parsed_data:
                        new_data.append(parsed_data)
                        self.archive_image(image_path, success=True)
                        processed_count += 1
                        self.logger.info(f"✅ 処理成功: {image_path.name} -> {parsed_data['count']}人")
                    else:
                        self.archive_image(image_path, success=False)
                        failed_count += 1
                        
                except Exception as e:
                    self.logger.error(f"画像処理エラー {image_path.name}: {e}")
                    self.archive_image(image_path, success=False)
                    failed_count += 1
            
            self.logger.info(f"📊 画像処理完了: 成功{processed_count}件, 失敗{failed_count}件")
            
            if not new_data:
                self.logger.warning("⚠️ 処理可能なデータがありませんでした")
                return True
            
            # 3. 既存データと統合
            self.logger.info("🔗 既存データと統合中...")
            existing_data, _ = self.read_existing_csv_data()
            all_data = existing_data + new_data
            
            # 4. 重複除去
            unique_data = self.dedupe_data(all_data)
            
            # 5. CSVファイル更新
            self.logger.info("💾 CSVファイルを更新中...")
            if not self.write_csv(unique_data):
                self.logger.error("❌ CSV更新に失敗")
                return False
            
            new_count = len(new_data)
            total_count = len(unique_data)
            
            self.logger.info(f"✅ {new_count}件の新データを追加")
            self.logger.info(f"📁 総データ数: {total_count}件")
            
            # 6. データ分析
            self.logger.info("📊 データ分析を実行中...")
            self.analyze_data()
            
            self.logger.info("🎉 週次画像OCR処理が完了しました！")
            return True
            
        except Exception as e:
            self.logger.error(f"週次OCR処理エラー: {e}")
            return False

    def diagnose_system(self):
        """システム診断"""
        self.logger.info("🔍 システム診断を開始...")
        
        # iCloudディレクトリの確認
        if not self.icloud_images.exists():
            self.logger.error(f"❌ iCloudディレクトリが存在しません: {self.icloud_images}")
            return False
        
        # 画像ファイルの確認
        image_files = self.find_new_images()
        self.logger.info(f"📂 iCloud画像ファイル: {len(image_files)}個")
        
        # OCRエンジンの確認
        if self.easyocr_reader:
            self.logger.info("✅ EasyOCR: 利用可能")
        else:
            self.logger.warning("⚠️ EasyOCR: 利用不可")
        
        if TESSERACT_AVAILABLE:
            self.logger.info("✅ Tesseract OCR: 利用可能")
        else:
            self.logger.warning("⚠️ Tesseract OCR: 利用不可")
        
        # 既存CSVの確認
        if self.csv_file.exists():
            existing_data, _ = self.read_existing_csv_data()
            self.logger.info(f"💾 既存CSV: {len(existing_data)}件のデータ")
        else:
            self.logger.info("💾 既存CSV: ファイルが存在しません")
        
        # ディレクトリ権限の確認
        for path in [self.icloud_images, self.processed_dir, self.failed_dir, self.csv_file.parent]:
            if path.exists() and os.access(path, os.R_OK | os.W_OK):
                self.logger.info(f"✅ {path.name}: 読み書き権限OK")
            else:
                self.logger.warning(f"⚠️ {path.name}: 権限不足または存在しない")
        
        self.logger.info("🔍 システム診断完了")
        return True


def main():
    """メイン実行関数"""
    pipeline = GymImageOCRPipeline()
    
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "--weekly":
            pipeline.run_weekly_ocr_pipeline()
        elif command == "diagnose":
            pipeline.diagnose_system()
        elif command == "analyze":
            pipeline.analyze_data()
        else:
            print(f"❌ 不明なコマンド: {command}")
            print("利用可能なコマンド: --weekly, diagnose, analyze")
    else:
        # インタラクティブモード
        print("🤖 ジム混雑状況 画像OCR自動化システム（無料版）")
        print("=" * 60)
        print("1. 🚀 週次画像OCR実行")
        print("2. 🔍 システム診断")
        print("3. 📊 データ分析のみ")
        
        choice = input("\\n選択してください (1-3): ")
        
        if choice == "1":
            pipeline.run_weekly_ocr_pipeline()
        elif choice == "2":
            pipeline.diagnose_system()
        elif choice == "3":
            pipeline.analyze_data()
        else:
            print("❌ 無効な選択です")


if __name__ == "__main__":
    main()