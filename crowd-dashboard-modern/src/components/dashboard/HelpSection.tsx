import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, BarChart3, Mouse, Lightbulb, HelpCircle } from 'lucide-react';

export function HelpSection() {
  const [isOpen, setIsOpen] = useState(false);

  const helpItems = [
    {
      icon: BarChart3,
      title: 'グラフの見方',
      items: [
        '縦軸: 平均人数（その時間帯の混雑度）',
        '横軸: 時間（0:00-23:00の24時間表示）',
        'バーの高さが高いほど混雑している時間帯',
        'グレーのバーはデータが不足している時間帯',
      ],
    },
    {
      icon: Mouse,
      title: '操作方法',
      items: [
        'グラフにマウスを合わせると詳細情報が表示',
        '「更新」ボタンでデータを最新に更新',
        '「JSON/CSV」ボタンでデータをダウンロード',
        'キーボードショートカット: Ctrl+R (更新), Ctrl+S (JSON保存)',
      ],
    },
    {
      icon: Lightbulb,
      title: '活用のヒント',
      items: [
        '混雑の少ない時間帯を狙って快適に利用',
        '曜日別の傾向を把握してスケジュール調整',
        'データの平均値は過去の実績に基づいています',
        'リアルタイム状況は現地で確認してください',
      ],
    },
  ];

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader 
        className="cursor-pointer pb-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center gap-3 text-base font-semibold">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          使い方・操作方法
          {isOpen ? (
            <ChevronDown className="h-4 w-4 ml-auto text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 ml-auto text-gray-500" />
          )}
        </CardTitle>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {helpItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                  </div>
                  <ul className="space-y-2">
                    {item.items.map((listItem, itemIndex) => (
                      <li key={itemIndex} className="text-sm text-gray-600 leading-relaxed">
                        • {listItem}
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
  );
}