#!/usr/bin/env python3
"""
Apple Notesのクリーニング結果を確認
"""
import subprocess

def check_memo_content():
    """現在のメモ内容を確認"""
    try:
        script = '''
        tell application "Notes"
            try
                set targetNote to first note whose name contains "フィット"
                return body of targetNote
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
            content = result.stdout.strip()
            print("📱 現在のApple Notesメモ内容:")
            print("=" * 60)
            print(content)
            print("=" * 60)
            
            # 混雑状況データが残っているかチェック
            if "混雜状況" in content or "混雑状況" in content:
                print("\n⚠️  まだ混雑状況データが残っています")
                
                # 残っているデータをカウント
                import re
                clean_content = re.sub(r"<[^>]*>", "", content)
                pattern = r"混[雜雑]状況\s*(\d+)人\s*([^\d]*?)\s*(\d{1,2}):(\d{2})時点(?:\s*(\d{2}/\d{2}))?"
                matches = re.findall(pattern, clean_content)
                print(f"残存データ数: {len(matches)}件")
                
                if matches:
                    print("残存データの例:")
                    for i, match in enumerate(matches[:3], 1):
                        print(f"  {i}. 混雜状況 {match[0]}人 {match[1].strip()} {match[2]}:{match[3]}時点")
            else:
                print("\n✅ 混雑状況データは正常にクリーニングされました")
                print("メモにはタイトルのみが残っています")
        else:
            print(f"❌ エラー: {result.stderr}")
            
    except Exception as e:
        print(f"❌ エラー: {e}")

if __name__ == "__main__":
    check_memo_content()