#!/usr/bin/env python3
"""
Apple Notesのフォルダとメモ一覧を表示するスクリプト
"""
import subprocess

def list_notes_structure():
    """Apple Notesのフォルダとメモ構造を表示"""
    try:
        # フォルダ一覧を取得
        script = '''
        tell application "Notes"
            set folderList to every folder
            set result to ""
            repeat with aFolder in folderList
                set result to result & "Folder: " & name of aFolder & "\\n"
                set noteList to every note of aFolder
                repeat with aNote in noteList
                    set result to result & "  Note: " & name of aNote & "\\n"
                end repeat
                set result to result & "\\n"
            end repeat
            return result
        end tell
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("📁 Apple Notes 構造:")
            print("=" * 50)
            print(result.stdout.strip())
        else:
            print(f"❌ エラー: {result.stderr}")
            
    except Exception as e:
        print(f"❌ エラー: {e}")

def search_gym_notes():
    """ジム関連のメモを検索"""
    try:
        script = '''
        tell application "Notes"
            set allNotes to every note
            set result to ""
            repeat with aNote in allNotes
                set noteName to name of aNote
                if noteName contains "フィット" or noteName contains "ジム" or noteName contains "24" then
                    set result to result & "Found: " & noteName & " in folder: " & name of folder of aNote & "\\n"
                end if
            end repeat
            return result
        end tell
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("\n🔍 ジム関連メモ検索結果:")
            print("=" * 50)
            print(result.stdout.strip())
        else:
            print(f"❌ 検索エラー: {result.stderr}")
            
    except Exception as e:
        print(f"❌ 検索エラー: {e}")

if __name__ == "__main__":
    list_notes_structure()
    search_gym_notes()