import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { HelpCircle, BarChart3, Mouse, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import type { Language } from '../../lib/translations';

interface HelpSectionProps {
  language: Language;
}

export function HelpSection({ language }: HelpSectionProps) {
  const { t } = useTranslation(language);
  const [isOpen, setIsOpen] = useState(false);

  const helpItems = [
    {
      icon: BarChart3,
      title: t('howToReadCharts'),
      description: t('chartInterpretation'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      content: [
        t('yAxisLabel'),
        t('xAxisLabel'),
        t('barHeightMeaning'),
        t('grayBarsMeaning')
      ]
    },
    {
      icon: Mouse,
      title: t('operationMethods'),
      description: t('interfaceUsage'),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      content: [
        t('hoverDetails'),
        t('refreshButton'),
        t('downloadButton'),
        t('keyboardShortcuts')
      ]
    },
    {
      icon: Lightbulb,
      title: t('usageTips'),
      description: t('effectiveUsage'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      content: [
        t('avoidCrowds'),
        t('planByWeekday'),
        t('dataAverage'),
        t('realTimeCheck')
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
            aria-label={isOpen ? `${t('howToUse')}を閉じる` : `${t('howToUse')}を開く`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <HelpCircle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t('howToUse')}</h2>
                <p className="text-sm text-gray-600 mt-1">{t('dashboardUsage')}</p>
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