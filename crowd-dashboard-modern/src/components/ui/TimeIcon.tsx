import { Clock } from "lucide-react";

interface TimeIconProps {
  className?: string;
  size?: number;
}

export function TimeIcon({ className, size = 16 }: TimeIconProps) {
  return <Clock className={className} size={size} />;
}
