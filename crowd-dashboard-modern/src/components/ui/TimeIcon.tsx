import { Clock } from "lucide-react";

interface TimeIconProps {
  className?: string;
  size?: number | 'sm' | 'md' | 'lg';
  variant?: string;
}

export function TimeIcon({ className, size = 16 }: TimeIconProps) {
  const getSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm': return 14;
      case 'md': return 16;
      case 'lg': return 20;
      default: return 16;
    }
  };

  return <Clock className={className} size={getSize()} />;
}
