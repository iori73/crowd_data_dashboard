import { useState } from 'react';

export function HelpSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="help-section">
      <details className="help-details" open={isOpen}>
        <summary 
          className="help-summary"
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen);
          }}
        >
          <span className="help-icon">❓</span>
          使い方・操作方法
        </summary>
        {isOpen && (
          <div className="help-content">
            <div className="help-grid">
              <div className="help-item">
                <h4>📊 グラフの見方</h4>
                <ul>
                  <li>縦軸: 平均人数（その時間帯の混雑度）</li>
                  <li>横軸: 時間（0:00-23:00の24時間表示）</li>
                  <li>バーの高さが高いほど混雑している時間帯</li>
                  <li>グレーのバーはデータが不足している時間帯</li>
                </ul>
              </div>
              <div className="help-item">
                <h4>🖱️ 操作方法</h4>
                <ul>
                  <li>グラフにマウスを合わせると詳細情報が表示</li>
                  <li>「更新」ボタンでデータを最新に更新</li>
                  <li>「JSON/CSV」ボタンでデータをダウンロード</li>
                  <li>キーボードショートカット: Ctrl+R (更新), Ctrl+S (JSON保存)</li>
                </ul>
              </div>
              <div className="help-item">
                <h4>💡 活用のヒント</h4>
                <ul>
                  <li>混雑の少ない時間帯を狙って快適に利用</li>
                  <li>曜日別の傾向を把握してスケジュール調整</li>
                  <li>データの平均値は過去の実績に基づいています</li>
                  <li>リアルタイム状況は現地で確認してください</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </details>
    </section>
  );
}