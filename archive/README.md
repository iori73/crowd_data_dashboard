# 📂 アーカイブフォルダ

このフォルダには、現在使用していないが保持しておくべきファイルが格納されています。

## 📁 フォルダ構成

### `diagnostic_scripts/`
**診断・テスト用スクリプト**
- `test_*.py` - 包括的なテストスイート
- `check_memo.py` - Apple Notes接続確認
- `find_gym_memo.py` - ジムメモ検索
- `simple_memo_check.py` - 基本メモチェック
- `verify_memo_cleaning.py` - メモクリーニング検証
- その他診断用スクリプト

### `test_reports/`
**テストレポートと技術文書**
- `COMPREHENSIVE_TEST_REPORT.md` - 総合テストレポート
- `FILTER_IMPLEMENTATION.md` - フィルター実装詳細
- `system_reliability_analysis.md` - システム信頼性分析
- `docs/` - 詳細技術ドキュメント

### `alternative_implementations/`
**代替実装・実験的機能**
- `nagent_automation.py` - nAgent版自動化システム
- `requirements_nagent.txt` - nAgent依存関係
- `README_nagent.md` - nAgent実装ガイド
- `index.html` - 旧版ダッシュボード

### `temp_files/`
**一時ファイル・バックアップ**
- `*.log` - 古いログファイル
- `*.backup` - バックアップファイル
- `csv_viewer.html` - 簡易CSVビューア
- PDFファイル等

## 🔄 復元方法

必要に応じて、これらのファイルをメインプロジェクトに復元できます：

```bash
# 診断スクリプトを復元する場合
cp archive/diagnostic_scripts/test_gym_automation.py ./

# 代替実装を試す場合
cp archive/alternative_implementations/nagent_automation.py ./
```

## ⚠️ 注意事項

- これらのファイルは定期的な更新対象外です
- 古いパス設定が含まれている可能性があります
- 使用前に現在のプロジェクト構造に合わせて調整が必要な場合があります