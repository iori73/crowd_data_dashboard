#!/usr/bin/env python3
"""
Apple Notesのメモ内容を確認するスクリプト
"""
import subprocess
import sys
import os

def get_memo_content():
    """Apple Notesからメモ内容を取得"""
    try:
        # AppleScriptを実行してメモ内容を取得
        script = '''
        tell application "Notes"
            set targetNote to note "フィットプレイス24練馬早宮" of folder "フィットプレイス24"
            return body of targetNote
        end tell
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return result.stdout.strip()
        else:
            print(f"❌ エラー: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"❌ メモ取得エラー: {e}")
        return None

def main():
    print("🔍 Apple Notesのメモ内容を確認中...")
    
    memo_content = get_memo_content()
    
    if memo_content:
        print(f"📱 メモ内容（最新1000文字）:")
        print("=" * 60)
        print(memo_content[-1000:])
        print("=" * 60)
        
        # 混雑状況データの有無をチェック
        lines = memo_content.split('\n')
        recent_data = [line for line in lines if '混雜状況' in line or '混雑状況' in line]
        
        print(f"\n📊 検出された混雑状況データ数: {len(recent_data)}")
        if recent_data:
            print("🔍 最新の混雑状況データ（最新5件）:")
            for i, data in enumerate(recent_data[-5:], 1):
                print(f"  {i}. {data.strip()}")
        
    else:
        print("❌ メモ内容を取得できませんでした")

if __name__ == "__main__":
    main()