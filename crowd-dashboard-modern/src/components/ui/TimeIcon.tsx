interface TimeIconProps {
  property1?: "moon.zzz 2" | "sun.max.fill 2" | "sunrise.fill 2" | "sunset.fill 2";
  className?: string;
}

export function TimeIcon({ className = "" }: TimeIconProps) {
  // SVG icon based on Figma design - clock/time icon
  return (
    <svg className={`w-6 h-6 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M12 6v6l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

