import * as React from 'react';
import { TimeIcon } from './TimeIcon';

interface TextSectionProps {
  title: string;
  subtitle?: string;
  content: string;
  icon?: 'clock' | 'calendar' | React.ReactNode;
  iconSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TextSection({
  title,
  subtitle,
  content,
  icon = 'clock',
  iconSize = 'md',
  className = '',
}: TextSectionProps) {
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return <TimeIcon variant={icon} size={iconSize} />;
    }
    return icon;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with icon and title */}
      <div className="flex items-center gap-2">
        <div className="bg-gray-100 rounded-full p-1.5">{renderIcon()}</div>
        <h3 className="text-base font-medium text-gray-700">{title}</h3>
      </div>

      {/* Subtitle if provided */}
      {subtitle && <p className="text-label-small text-optimized text-gray-600">{subtitle}</p>}

      {/* Main content */}
      <p className="text-body-medium text-optimized text-gray-600 leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}
