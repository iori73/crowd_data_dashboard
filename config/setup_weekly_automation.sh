#!/bin/bash
#
# ジム混雑状況 週次自動実行セットアップスクリプト
# 日曜00:01自動実行の設定とテスト機能
#

echo "🚀 ジム混雑状況 週次自動実行セットアップ"
echo "=============================================="

# プロジェクトディレクトリ
PROJECT_DIR="/Users/i_kawano/Documents/training_waitnum_analysis"
PLIST_FILE="$PROJECT_DIR/config/com.user.gym.analysis.weekly.plist"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"
LAUNCHD_PLIST="$LAUNCHD_DIR/com.user.gym.analysis.weekly.plist"

# 関数: ステータス確認
check_status() {
    echo "📊 現在のステータス確認..."
    
    if [ -f "$LAUNCHD_PLIST" ]; then
        echo "✅ launchd設定ファイル: インストール済み"
        
        # ジョブの状態確認
        STATUS=$(launchctl list | grep "com.user.gym.analysis.weekly" || echo "Not found")
        if [ "$STATUS" != "Not found" ]; then
            echo "✅ 自動実行ジョブ: 登録済み"
            echo "   $STATUS"
        else
            echo "⚠️  自動実行ジョブ: 未登録"
        fi
    else
        echo "❌ launchd設定ファイル: 未インストール"
    fi
    
    # 次回実行予定
    echo ""
    echo "📅 次回実行予定:"
    NEXT_SUNDAY=$(date -v+Sun -v0H -v1M -v0S '+%Y-%m-%d %H:%M:%S')
    echo "   $NEXT_SUNDAY (日曜 00:01)"
}

# 関数: インストール
install_service() {
    echo "📦 週次自動実行サービスをインストール中..."
    
    # LaunchAgentsディレクトリ作成
    mkdir -p "$LAUNCHD_DIR"
    
    # plistファイルをコピー
    cp "$PLIST_FILE" "$LAUNCHD_PLIST"
    
    # ジョブを登録
    launchctl load "$LAUNCHD_PLIST"
    
    echo "✅ インストール完了！"
    echo "   日曜00:01に自動実行されます"
}

# 関数: アンインストール
uninstall_service() {
    echo "🗑️  週次自動実行サービスをアンインストール中..."
    
    # ジョブを停止・登録解除
    launchctl unload "$LAUNCHD_PLIST" 2>/dev/null || true
    
    # plistファイルを削除
    rm -f "$LAUNCHD_PLIST"
    
    echo "✅ アンインストール完了！"
}

# 関数: テスト実行
test_run() {
    echo "🧪 テスト実行を開始..."
    
    cd "$PROJECT_DIR"
    python3 src/automation/weekly_automation.py --weekly
    
    echo ""
    echo "📋 実行結果を確認:"
    if [ -f "logs/automation.log" ]; then
        echo "--- 最新ログ（最後の20行）---"
        tail -20 logs/automation.log
    fi
}

# 関数: 手動実行
manual_run() {
    echo "🤖 手動実行モードを開始..."
    
    cd "$PROJECT_DIR"
    python3 src/automation/weekly_automation.py
}

# 関数: ログ確認
check_logs() {
    echo "📋 実行ログを確認..."
    
    cd "$PROJECT_DIR"
    
    if [ -f "logs/automation.log" ]; then
        echo "--- logs/automation.log（最新50行）---"
        tail -50 logs/automation.log
    else
        echo "❌ logs/automation.log が見つかりません"
    fi
    
    echo ""
    
    if [ -f "logs/automation_output.log" ]; then
        echo "--- logs/automation_output.log（最新20行）---"
        tail -20 logs/automation_output.log
    fi
    
    if [ -f "logs/automation_error.log" ]; then
        echo "--- logs/automation_error.log（最新20行）---"
        tail -20 logs/automation_error.log
    fi
}

# メインメニュー
show_menu() {
    echo ""
    echo "📋 操作メニュー:"
    echo "1. 📊 ステータス確認"
    echo "2. 📦 自動実行サービス インストール"
    echo "3. 🗑️  自動実行サービス アンインストール"
    echo "4. 🧪 テスト実行（週次処理をすぐ実行）"
    echo "5. 🤖 手動実行モード"
    echo "6. 📋 ログ確認"
    echo "7. 🚪 終了"
    echo ""
}

# メインループ
while true; do
    show_menu
    read -p "選択してください (1-7): " choice
    
    case $choice in
        1)
            check_status
            ;;
        2)
            install_service
            check_status
            ;;
        3)
            uninstall_service
            check_status
            ;;
        4)
            test_run
            ;;
        5)
            manual_run
            ;;
        6)
            check_logs
            ;;
        7)
            echo "👋 セットアップ完了！"
            exit 0
            ;;
        *)
            echo "❌ 無効な選択です"
            ;;
    esac
    
    echo ""
    read -p "Enterキーで続行..."
done
