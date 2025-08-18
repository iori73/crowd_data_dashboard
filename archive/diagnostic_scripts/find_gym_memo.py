#!/usr/bin/env python3
"""
ジム関連のメモを探すスクリプト
"""
import subprocess

def find_gym_memo():
    """フィットプレイス関連のメモを検索"""
    try:
        script = '''
        tell application "Notes"
            set allNotes to every note
            repeat with aNote in allNotes
                set noteName to name of aNote
                if noteName contains "フィット" or noteName contains "練馬" or noteName contains "早宮" then
                    return "Found: " & noteName & "\\nContent preview: " & (first 200 characters of body of aNote)
                end if
            end repeat
            return "No gym-related note found"
        end tell
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("🔍 検索結果:")
            print("=" * 50)
            print(result.stdout.strip())
        else:
            print(f"❌ エラー: {result.stderr}")
            
    except Exception as e:
        print(f"❌ エラー: {e}")

def get_all_memo_names():
    """すべてのメモの名前を取得"""
    try:
        script = '''
        tell application "Notes"
            set allNotes to every note
            set noteNames to {}
            repeat with aNote in allNotes
                set end of noteNames to name of aNote
            end repeat
            return noteNames as string
        end tell
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("\n📝 全メモ名（最初の20個）:")
            print("=" * 50)
            names = result.stdout.strip().split(', ')
            for i, name in enumerate(names[:20], 1):
                print(f"{i:2d}. {name}")
            print(f"... (総数: {len(names)} 個)")
        else:
            print(f"❌ メモ名取得エラー: {result.stderr}")
            
    except Exception as e:
        print(f"❌ メモ名取得エラー: {e}")

if __name__ == "__main__":
    find_gym_memo()
    get_all_memo_names()