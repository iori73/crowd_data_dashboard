#!/usr/bin/env python3
"""
正しいフィットプレイス関連のメモを検索
"""
import subprocess

def search_memo_by_content():
    """メモ内容に混雑状況が含まれるメモを検索"""
    try:
        script = '''
        tell application "Notes"
            set allNotes to every note
            repeat with aNote in allNotes
                set noteBody to body of aNote
                if noteBody contains "混雜状況" or noteBody contains "混雑状況" then
                    return "Found memo with gym data:\\nTitle: " & name of aNote & "\\nPreview: " & (first 300 characters of noteBody)
                end if
            end repeat
            return "No memo with gym data found"
        end tell
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("🔍 混雑状況データを含むメモ:")
            print("=" * 60)
            print(result.stdout.strip())
        else:
            print(f"❌ エラー: {result.stderr}")
            
    except Exception as e:
        print(f"❌ エラー: {e}")

def get_memo_by_index(index):
    """指定されたインデックスのメモを取得"""
    try:
        script = f'''
        tell application "Notes"
            set targetNote to note {index}
            set noteTitle to name of targetNote
            set noteBody to body of targetNote
            return "Title: " & noteTitle & "\\n\\nContent preview:\\n" & (first 500 characters of noteBody)
        end tell
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print(f"\n📝 メモ {index} の内容:")
            print("=" * 60)
            print(result.stdout.strip())
        else:
            print(f"❌ メモ {index} 取得エラー: {result.stderr}")
            
    except Exception as e:
        print(f"❌ メモ {index} 取得エラー: {e}")

if __name__ == "__main__":
    search_memo_by_content()
    
    # 最初の数個のメモをチェック
    print("\n" + "="*60)
    print("最初の5個のメモをチェック:")
    for i in range(1, 6):
        get_memo_by_index(i)