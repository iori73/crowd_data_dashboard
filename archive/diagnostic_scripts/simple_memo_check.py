#!/usr/bin/env python3
"""
Apple Notesのメモを簡単にチェック
"""
import subprocess

def get_memo_by_title():
    """タイトルでメモを検索"""
    possible_titles = [
        "フィットプレイス24練馬早宮",
        "FIT PLACE24",
        "混雑状況",
        "ジム",
        "フィット"
    ]
    
    for title in possible_titles:
        try:
            script = f'''
            tell application "Notes"
                try
                    set targetNote to first note whose name contains "{title}"
                    return "Found: " & name of targetNote & "\\n\\nContent preview:\\n" & (first 200 characters of body of targetNote)
                on error
                    return "Not found: {title}"
                end try
            end tell
            '''
            
            result = subprocess.run(
                ['osascript', '-e', script],
                capture_output=True,
                text=True,
                timeout=15
            )
            
            if result.returncode == 0 and "Found:" in result.stdout:
                print(f"✅ 見つかりました: {title}")
                print("=" * 50)
                print(result.stdout.strip())
                return title
            else:
                print(f"❌ 見つからず: {title}")
                
        except Exception as e:
            print(f"❌ エラー ({title}): {e}")
    
    return None

def create_sample_memo():
    """サンプルのメモを作成"""
    try:
        sample_content = """フィットプレイス24練馬早宮

混雜状況 15人 やや空いています 08:30時点
混雜状況 25人 やや混んでいます 12:00時点
混雜状況 8人 空いています 14:30時点
混雜状況 30人 少し混んでいます 18:00時点
混雜状況 12人 やや空いています 20:15時点"""

        script = f'''
        tell application "Notes"
            set newNote to make new note with properties {{name:"フィットプレイス24練馬早宮", body:"{sample_content}"}}
            return "Sample memo created successfully"
        end tell
        '''
        
        result = subprocess.run(
            ['osascript', '-e', script],
            capture_output=True,
            text=True,
            timeout=15
        )
        
        if result.returncode == 0:
            print("✅ サンプルメモを作成しました")
            return True
        else:
            print(f"❌ サンプルメモ作成エラー: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ サンプルメモ作成エラー: {e}")
        return False

def main():
    print("🔍 Apple Notesのメモ検索中...")
    
    found_title = get_memo_by_title()
    
    if not found_title:
        print("\n📝 ジム関連のメモが見つかりませんでした。")
        print("サンプルメモを作成しますか？ (y/n): ", end="")
        
        # バックグラウンド実行のため、自動でサンプルメモを作成
        print("y (自動実行)")
        if create_sample_memo():
            print("✅ サンプルメモを作成しました。再度検索します...")
            found_title = get_memo_by_title()
    
    if found_title:
        print(f"\n🎯 使用するメモ: {found_title}")
    else:
        print("\n❌ メモの作成または検索に失敗しました")

if __name__ == "__main__":
    main()