import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HelpCircle, BarChart3, Mouse, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

export function HelpSection() {
  const [isOpen, setIsOpen] = useState(false);

  const helpItems = [
    {
      icon: BarChart3,
      title: 'グラフの見方',
      description: 'データの解釈方法を理解する',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      content: [
        '縦軸: 平均人数（その時間帯の混雑度）',
        '横軸: 時間（0:00-23:00の24時間表示）',
        'バーの高さが高いほど混雑している時間帯',
        'グレーのバーはデータが不足している時間帯'
      ]
    },
    {
      icon: Mouse,
      title: '操作方法',
      description: 'インターフェースの使い方',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      content: [
        'グラフにマウスを合わせると詳細情報が表示',
        '「更新」ボタンでデータを最新に更新',
        '「JSON/CSV」ボタンでデータをダウンロード',
        'キーボードショートカット: Ctrl+R (更新), Ctrl+S (JSON保存)'
      ]
    },
    {
      icon: Lightbulb,
      title: '活用のヒント',
      description: '効果的な利用方法とコツ',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      content: [
        '混雑の少ない時間帯を狙って快適に利用',
        '曜日別の傾向を把握してスケジュール調整',
        'データの平均値は過去の実績に基づいています',
        'リアルタイム状況は現地で確認してください'
      ]
    }
  ];

  return (
    <section className="space-y-4">
      <Card className="min-h-[60px] border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-lg">
        <CardHeader>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full text-left min-h-[44px] transition-colors duration-200 hover:bg-gray-50 rounded-lg p-2 -m-2"
            aria-expanded={isOpen}
            aria-label={isOpen ? "使い方・操作方法を閉じる" : "使い方・操作方法を開く"}
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <HelpCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">使い方・操作方法</h2>
                <p className="text-sm text-gray-600 mt-1">ダッシュボードの効果的な活用方法</p>
              </div>
            </div>
            <div className="flex items-center justify-center w-8 h-8">
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              )}
            </div>
          </button>
        </CardHeader>

        {isOpen && (
          <CardContent className="pt-0">
            <div className="space-y-8">
              {helpItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed ml-8">{item.description}</p>
                    <ul className="space-y-2 ml-8">
                      {item.content.map((point, pointIndex) => (
                        <li key={pointIndex} className="flex items-start space-x-2 text-sm text-gray-700">
                          <span className="text-gray-400 mt-1.5 block w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
                          <span className="leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>
    </section>
  );
}