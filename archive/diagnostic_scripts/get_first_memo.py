#!/usr/bin/env python3
"""
最初のメモ（FIT PLACE24関連）の内容を取得
"""
import subprocess

def get_first_memo_content():
    """最初のメモの内容を取得"""
    try:
        script = '''
        tell application "Notes"
            set firstNote to first note
            return body of firstNote
        end tell
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            content = result.stdout.strip()
            print("📱 FIT PLACE24 メモ内容:")
            print("=" * 60)
            print(content)
            print("=" * 60)
            
            # 混雑状況データの検索
            lines = content.split('\n')
            gym_data = []
            for line in lines:
                if ('混雜状況' in line or '混雑状況' in line) and ('人' in line):
                    gym_data.append(line.strip())
            
            print(f"\n📊 検出された混雑状況データ数: {len(gym_data)}")
            if gym_data:
                print("🔍 混雑状況データ:")
                for i, data in enumerate(gym_data, 1):
                    print(f"  {i:2d}. {data}")
            else:
                print("❌ 混雑状況データが見つかりませんでした")
                
        else:
            print(f"❌ エラー: {result.stderr}")
            
    except Exception as e:
        print(f"❌ エラー: {e}")

if __name__ == "__main__":
    get_first_memo_content()