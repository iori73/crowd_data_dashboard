import * as React from 'react';
import '@/styles/typography.css';

interface LegendItem {
  color: string;
  label: string;
  width?: 'sm' | 'md' | 'lg';
}

interface LegendProps {
  items: LegendItem[];
  variant?: 'horizontal' | 'vertical';
  className?: string;
  backgroundColor?: string;
}

export function Legend({ items, variant = 'horizontal', className = '', backgroundColor = '#F4F4F5' }: LegendProps) {
  const containerClasses = variant === 'horizontal' ? 'flex items-center gap-4' : 'flex flex-col gap-2';

  const getBarWidth = (width?: 'sm' | 'md' | 'lg') => {
    switch (width) {
      case 'sm':
        return 'w-8';
      case 'lg':
        return 'w-10'; // Figmaの40pxに相当
      default:
        return 'w-8'; // md default
    }
  };

  return (
    <div className={`${containerClasses} ${className}`} style={{ backgroundColor }}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2" style={{ alignItems: 'baseline' }}>
          <div
            className={`${getBarWidth(item.width)} h-2 rounded-lg ${
              item.color === 'white' ? 'bg-white border border-gray-300' : ''
            }`}
            style={{
              backgroundColor: item.color === 'white' ? 'white' : item.color,
              borderColor: item.color === 'white' ? '#E5E7EB' : undefined,
            }}
          />
          <span className="text-label-medium text-optimized text-black font-normal">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
