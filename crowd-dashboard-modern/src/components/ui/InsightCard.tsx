import React from 'react';
import '../../styles/typography.css';

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
    <div className={`space-y-2 ${className}`}>
      {/* Content Items */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="space-y-1">
            <h4 className="text-lg text-optimized font-medium text-gray-700">
              {item.title}
            </h4>
            <p className="text-body-medium text-optimized text-gray-600 leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

