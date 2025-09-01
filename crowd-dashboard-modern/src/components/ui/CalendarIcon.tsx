interface CalendarIconProps {
  className?: string;
}

export function CalendarIcon({ className = "" }: CalendarIconProps) {
  return (
    <svg className={`w-6 h-6 ${className}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M8 2v4M16 2v4M3 10h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}