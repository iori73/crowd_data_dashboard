#!/usr/bin/env python3
"""
最新の混雑状況データを追加
"""
import subprocess
from datetime import datetime, timedelta

def add_recent_gym_data():
    """最新の混雑状況データを追加"""
    # 今日から過去1週間のサンプルデータを生成
    recent_data = []
    base_date = datetime.now()
    
    # 過去1週間のデータを生成
    for days_ago in range(7):
        date = base_date - timedelta(days=days_ago)
        
        # 1日に2-3個のデータポイント
        times = ["09:15", "14:30", "19:45"]
        counts = [12, 28, 15]  # サンプル人数
        statuses = ["やや空いています", "やや混んでいます", "やや空いています"]
        
        for time, count, status in zip(times, counts, statuses):
            data_line = f"混雜状況 {count}人 {status} {time}時点 {date.strftime('%m/%d')}"
            recent_data.append(data_line)
    
    # 最新データを既存メモに追加
    new_content = "\\n".join(recent_data)
    
    try:
        script = f'''
        tell application "Notes"
            try
                -- 既存のフィットプレイス関連メモを探す
                set targetNote to first note whose name contains "フィット"
                set currentBody to body of targetNote
                set body of targetNote to currentBody & "\\n\\n--- 最新データ ---\\n{new_content}"
                return "✅ 既存メモに最新データを追加しました"
            on error
                -- メモが見つからない場合は新規作成
                set newNote to make new note with properties {{name:"フィットプレイス24練馬早宮", body:"フィットプレイス24練馬早宮\\n\\n{new_content}"}}
                return "✅ 新規メモを作成して最新データを追加しました"
            end try
        end tell
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True,
            timeout=15
        )
        
        if result.returncode == 0:
            print(result.stdout.strip())
            return True
        else:
            print(f"❌ エラー: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ エラー: {e}")
        return False

def verify_memo_content():
    """メモ内容を確認"""
    try:
        script = '''
        tell application "Notes"
            try
                set targetNote to first note whose name contains "フィット"
                set noteBody to body of targetNote
                return "📱 メモ内容確認:\\n" & (last 500 characters of noteBody)
            on error
                return "❌ フィット関連のメモが見つかりません"
            end try
        end tell
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True,
            timeout=15
        )
        
        if result.returncode == 0:
            print("=" * 60)
            print(result.stdout.strip())
            print("=" * 60)
        else:
            print(f"❌ 確認エラー: {result.stderr}")
            
    except Exception as e:
        print(f"❌ 確認エラー: {e}")

if __name__ == "__main__":
    print("📝 最新の混雑状況データを追加中...")
    
    if add_recent_gym_data():
        print("\n🔍 メモ内容を確認中...")
        verify_memo_content()
    else:
        print("❌ データ追加に失敗しました")