import React from 'react';
import '@/styles/typography.css';

interface InsightItem {
  title: string;
  content: string;
  highlight?: boolean;
  icon?: React.ReactNode;
}

interface InsightCardProps {
  title: string;
  subtitle?: string;
  items: InsightItem[];
  className?: string;
}

export function InsightCard({ items, className = '' }: Omit<InsightCardProps, 'title' | 'subtitle'>) {
  return (
    <div className={`space-y-3 lg:space-y-4 ${className}`}>
      {/* Content Items */}
      <div className="space-y-2 lg:space-y-4">
        {items.map((item, index) => (
          <div key={index} className="space-y-1">
            <h4 className="text-optimized font-medium text-gray-700" style={{ fontSize: '16px' }}>
              {item.title}
            </h4>
            <p className="text-body-medium text-optimized text-gray-600 leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// アイコンコンポーネント
export const InsightIcons = {
  Weekday: () => (
    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
      <div className="w-2 h-2 bg-blue-500 rounded-full" />
    </div>
  ),
  Weekend: () => (
    <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
      <div className="w-2 h-2 bg-orange-500 rounded-full" />
    </div>
  ),
  Peak: () => (
    <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
      <div className="w-2 h-2 bg-red-500 rounded-full" />
    </div>
  ),
  Info: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-blue-500">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M8 7v3M8 5h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
};
