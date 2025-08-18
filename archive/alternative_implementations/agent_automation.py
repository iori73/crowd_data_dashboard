#!/usr/bin/env python3
"""
FIT PLACE24 混雑状況分析システム - nAgentモード版
Cursor nAgentによる継続的なバックグラウンド実行
"""

import asyncio
import schedule
import time
from datetime import datetime, timedelta
import threading
import os
import json
from pathlib import Path

# 既存の自動化クラスをインポート
from weekly_automation import GymAnalysisAutomation


class nAgentGymAutomation:
    def __init__(self):
        self.automation = GymAnalysisAutomation()
        self.project_dir = Path(__file__).parent
        self.state_file = self.project_dir / "nagent_state.json"
        self.is_running = False
        self.last_execution = None

        # 設定
        self.config = {
            "weekly_schedule": "sunday 00:01",  # 週次実行
            "data_check_interval": 60,  # 1分ごとにデータチェック
            "memo_watch_enabled": True,  # メモ監視機能
            "auto_cleanup": True,  # 自動クリーニング
            "debug_mode": False,  # デバッグモード
        }

        self.load_state()
        self.setup_schedule()

    def load_state(self):
        """nAgentの状態を読み込み"""
        if self.state_file.exists():
            try:
                with open(self.state_file, "r", encoding="utf-8") as f:
                    state = json.load(f)
                    self.last_execution = state.get("last_execution")
                    self.config.update(state.get("config", {}))
            except Exception as e:
                print(f"⚠️ 状態ファイル読み込みエラー: {e}")

    def save_state(self):
        """nAgentの状態を保存"""
        state = {
            "last_execution": self.last_execution,
            "config": self.config,
            "updated_at": datetime.now().isoformat(),
        }
        try:
            with open(self.state_file, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"⚠️ 状態ファイル保存エラー: {e}")

    def setup_schedule(self):
        """スケジュール設定"""
        # 週次実行（日曜日00:01）
        schedule.every().sunday.at("00:01").do(self.run_weekly_task)

        # デイリーチェック（毎日12:00）
        schedule.every().day.at("12:00").do(self.run_daily_check)

        # データ変更検知（1時間ごと）
        schedule.every().hour.do(self.check_data_changes)

        print("📅 nAgent スケジュール設定完了:")
        print("   - 週次実行: 日曜日 00:01")
        print("   - デイリーチェック: 毎日 12:00")
        print("   - データ監視: 1時間ごと")

    async def run_weekly_task(self):
        """週次メインタスク"""
        print("🚀 週次自動実行を開始（nAgentモード）...")

        try:
            # 既存の自動化を実行
            success = self.automation.run_weekly_automation(clean_memo=True)

            if success:
                self.last_execution = datetime.now().isoformat()
                self.save_state()
                print("✅ 週次実行完了")

                # Cursor通知（可能であれば）
                await self.notify_cursor("週次データ処理が完了しました")
            else:
                print("❌ 週次実行に失敗")
                await self.notify_cursor("週次データ処理に失敗しました", level="error")

        except Exception as e:
            print(f"❌ 週次タスクエラー: {e}")
            await self.notify_cursor(f"週次処理エラー: {e}", level="error")

    async def run_daily_check(self):
        """デイリーヘルスチェック"""
        print("🔍 デイリーチェック実行中...")

        try:
            # データファイルの存在確認
            csv_file = Path(self.automation.csv_file)
            if not csv_file.exists():
                await self.notify_cursor(
                    "⚠️ データファイルが見つかりません", level="warning"
                )
                return

            # メモアプリの接続確認
            memo_content = self.automation.get_memo_content()
            if not memo_content:
                await self.notify_cursor(
                    "⚠️ メモアプリに接続できません", level="warning"
                )
                return

            print("✅ デイリーチェック完了")

        except Exception as e:
            print(f"❌ デイリーチェックエラー: {e}")

    async def check_data_changes(self):
        """データ変更の監視"""
        if not self.config.get("memo_watch_enabled"):
            return

        try:
            # 新しいデータがあるかチェック
            memo_content = self.automation.get_memo_content()
            if memo_content:
                gym_data, _ = self.automation.extract_gym_data(memo_content)

                if len(gym_data) > 0:
                    print(f"📊 新しいデータを{len(gym_data)}件発見")
                    await self.notify_cursor(
                        f"新しい混雑データ{len(gym_data)}件を検出しました"
                    )

                    # 即座にデータ処理（オプション）
                    if self.config.get("auto_process_new_data", False):
                        await self.run_incremental_update()

        except Exception as e:
            print(f"⚠️ データチェックエラー: {e}")

    async def run_incremental_update(self):
        """増分データ更新"""
        print("🔄 増分データ更新中...")

        try:
            success = self.automation.run_weekly_automation(clean_memo=False)
            if success:
                await self.notify_cursor("データが更新されました")

        except Exception as e:
            print(f"❌ 増分更新エラー: {e}")

    async def notify_cursor(self, message: str, level: str = "info"):
        """Cursor通知（nAgent機能使用）"""
        # nAgentのネイティブ通知機能を使用
        notification = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": message,
            "source": "FIT PLACE24 Automation",
        }

        print(f"🔔 {level.upper()}: {message}")

        # Cursorログに記録
        log_file = self.project_dir / "nagent_notifications.jsonl"
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(notification, ensure_ascii=False) + "\n")

    def start_background_scheduler(self):
        """バックグラウンドスケジューラー開始"""

        def scheduler_worker():
            print("⏰ nAgent スケジューラー開始...")
            while self.is_running:
                schedule.run_pending()
                time.sleep(1)

        self.is_running = True
        scheduler_thread = threading.Thread(target=scheduler_worker, daemon=True)
        scheduler_thread.start()
        print("✅ バックグラウンドスケジューラー起動完了")

    def stop(self):
        """nAgent停止"""
        self.is_running = False
        self.save_state()
        print("🛑 nAgent停止")

    async def run_interactive_mode(self):
        """インタラクティブモード"""
        print("🤖 nAgent インタラクティブモード")
        print("=" * 50)
        print("1. 🚀 今すぐ週次実行")
        print("2. 🔍 データチェック")
        print("3. 📊 状態確認")
        print("4. ⚙️ 設定変更")
        print("5. 🛑 停止")

        while True:
            try:
                choice = input("\n選択してください (1-5): ")

                if choice == "1":
                    await self.run_weekly_task()
                elif choice == "2":
                    await self.check_data_changes()
                elif choice == "3":
                    await self.show_status()
                elif choice == "4":
                    await self.configure_settings()
                elif choice == "5":
                    self.stop()
                    break
                else:
                    print("❌ 無効な選択です")

            except KeyboardInterrupt:
                self.stop()
                break

    async def show_status(self):
        """状態表示"""
        print("\n📊 nAgent 状態:")
        print(f"   実行中: {'✅' if self.is_running else '❌'}")
        print(f"   最終実行: {self.last_execution or 'なし'}")
        print(f"   次回実行: {schedule.next_run()}")
        print(f"   設定: {json.dumps(self.config, indent=2, ensure_ascii=False)}")

    async def configure_settings(self):
        """設定変更"""
        print("\n⚙️ 設定変更:")
        print("1. メモ監視の有効/無効")
        print("2. 自動クリーニングの有効/無効")
        print("3. デバッグモードの有効/無効")

        choice = input("変更する設定 (1-3): ")

        if choice == "1":
            self.config["memo_watch_enabled"] = not self.config["memo_watch_enabled"]
            print(
                f"メモ監視: {'有効' if self.config['memo_watch_enabled'] else '無効'}"
            )
        elif choice == "2":
            self.config["auto_cleanup"] = not self.config["auto_cleanup"]
            print(
                f"自動クリーニング: {'有効' if self.config['auto_cleanup'] else '無効'}"
            )
        elif choice == "3":
            self.config["debug_mode"] = not self.config["debug_mode"]
            print(f"デバッグモード: {'有効' if self.config['debug_mode'] else '無効'}")

        self.save_state()


# nAgentエントリーポイント
async def main():
    """nAgentメイン関数"""
    nagent = nAgentGymAutomation()

    # バックグラウンドスケジューラー開始
    nagent.start_background_scheduler()

    # インタラクティブモード開始
    await nagent.run_interactive_mode()


if __name__ == "__main__":
    # nAgentモードの場合はasyncio実行
    asyncio.run(main())
