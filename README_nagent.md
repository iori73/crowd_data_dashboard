# 🤖 nAgent モード - 週次自動実行システム

Cursor の nAgent モードを使用した FIT PLACE24 混雑状況分析の自動実行システムです。

## ✨ nAgent モードの利点

### **🔄 macOS launchd vs nAgent モード**

| 機能                 | launchd            | nAgent モード    |
| -------------------- | ------------------ | ---------------- |
| **実行方式**         | システムレベル     | Cursor 内蔵      |
| **設定の複雑さ**     | plist ファイル必要 | 設定ファイル不要 |
| **リアルタイム監視** | ❌                 | ✅               |
| **Cursor 連携**      | ❌                 | ✅               |
| **デバッグ**         | ログファイル       | リアルタイム表示 |
| **動的設定変更**     | ❌                 | ✅               |
| **増分データ処理**   | ❌                 | ✅               |
| **エラー通知**       | メール等           | Cursor 通知      |

## 🚀 セットアップ

### **1. 依存関係インストール**

```bash
pip install -r requirements_nagent.txt
```

### **2. nAgent モード起動**

```bash
# Cursor内でnAgentとして実行
python3 nagent_automation.py
```

### **3. 設定例**

```json
{
  "weekly_schedule": "sunday 00:01",
  "data_check_interval": 60,
  "memo_watch_enabled": true,
  "auto_cleanup": true,
  "debug_mode": false
}
```

## 📋 機能一覧

### **⏰ 自動スケジュール実行**

- **週次実行**: 日曜日 00:01（既存と同じタイミング）
- **デイリーチェック**: 毎日 12:00 にヘルスチェック
- **データ監視**: 1 時間ごとに新データチェック

### **🔍 リアルタイム監視**

- メモアプリの変更検知
- 新しい混雑データの即座処理
- システム状態の継続監視

### **🔔 Cursor 連携**

- 処理完了通知
- エラー発生時のアラート
- リアルタイム状態表示

### **⚙️ 動的設定変更**

- 実行中の設定変更
- デバッグモードの切り替え
- 監視間隔の調整

## 🎯 使用方法

### **基本操作**

```bash
🤖 nAgent インタラクティブモード
==================================================
1. 🚀 今すぐ週次実行
2. 🔍 データチェック
3. 📊 状態確認
4. ⚙️ 設定変更
5. 🛑 停止

選択してください (1-5):
```

### **状態確認**

```bash
📊 nAgent 状態:
   実行中: ✅
   最終実行: 2025-07-23T22:01:00
   次回実行: 2025-07-28 00:01:00
   設定: {
     "weekly_schedule": "sunday 00:01",
     "memo_watch_enabled": true,
     "auto_cleanup": true
   }
```

## 🔧 高度な機能

### **増分データ処理**

- 新データ検出時の即座処理
- メモクリーニングなしの軽量更新
- リアルタイムダッシュボード更新

### **エラーハンドリング**

- 自動リトライ機能
- 詳細エラーログ
- Cursor 通知による即座アラート

### **設定ファイル**

```json
{
  "weekly_schedule": "sunday 00:01",
  "data_check_interval": 60,
  "memo_watch_enabled": true,
  "auto_cleanup": true,
  "debug_mode": false,
  "auto_process_new_data": false,
  "notification_level": "info"
}
```

## 🆚 システム選択ガイド

### **launchd を推奨する場合**

- ✅ システムレベルの確実な実行が必要
- ✅ Cursor を常時起動しない環境
- ✅ シンプルな週次実行のみで十分

### **nAgent を推奨する場合**

- ✅ リアルタイム監視が必要
- ✅ Cursor を常時使用する開発環境
- ✅ 柔軟な設定変更が必要
- ✅ 増分データ処理が必要
- ✅ 開発時のデバッグが重要

## 🔄 移行方法

### **launchd → nAgent モード**

1. 既存の launchd サービスを停止

```bash
./setup_weekly_automation.sh
# メニューから「3. 🗑️ アンインストール」を選択
```

2. nAgent モードを起動

```bash
python3 nagent_automation.py
```

### **nAgent モード → launchd**

1. nAgent を停止（Ctrl+C またはメニューから停止）
2. launchd サービスを再設定

```bash
./setup_weekly_automation.sh
# メニューから「2. 📦 インストール」を選択
```

## 📊 パフォーマンス比較

| 項目             | launchd     | nAgent モード |
| ---------------- | ----------- | ------------- |
| **メモリ使用量** | 最小        | 中程度        |
| **CPU 使用量**   | 最小        | 低～中程度    |
| **応答性**       | 週 1 回のみ | リアルタイム  |
| **柔軟性**       | 低          | 高            |
| **デバッグ性**   | 低          | 高            |

## ⚠️ 注意事項

1. **Cursor 起動必須**: nAgent モードは Cursor が起動中でないと動作しません
2. **リソース使用**: 継続的な監視でリソースを使用します
3. **状態保存**: 設定と状態は`nagent_state.json`に保存されます
4. **通知ログ**: 通知履歴は`nagent_notifications.jsonl`に記録されます

## 🎯 推奨設定

### **開発環境**

```json
{
  "data_check_interval": 10,
  "memo_watch_enabled": true,
  "auto_process_new_data": true,
  "debug_mode": true
}
```

### **本番環境**

```json
{
  "data_check_interval": 60,
  "memo_watch_enabled": true,
  "auto_process_new_data": false,
  "debug_mode": false
}
```
