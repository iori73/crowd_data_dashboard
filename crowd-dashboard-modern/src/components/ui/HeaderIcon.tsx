
interface HeaderIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function HeaderIcon({ size = 'md', className = '' }: HeaderIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClasses[size]}
      >
        <rect width="96" height="96" rx="16" fill="currentColor" />
        <path d="M48 24V14.9333" stroke="#F1F1F1" strokeOpacity="0.9" strokeWidth="5" strokeLinecap="round" />
        <path
          d="M54.2109 24.8178L55.8674 18.6359"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M60 27.2154L63.2 21.6728"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M64.9707 31.0295L69.4962 26.504"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M68.7852 36L74.3277 32.8"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M71.1816 41.7883L77.3636 40.1319"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M72 48H78.4" stroke="#F1F1F1" strokeOpacity="0.9" strokeWidth="5" strokeLinecap="round" />
        <path
          d="M71.1816 54.2117L79.9394 56.5583"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M68.7852 60L77.099 64.8"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M64.9707 64.9706L71.3818 71.3817"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M60 68.7846L65.7333 78.715"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M54.2109 71.1823L56.7646 80.7127"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M48 72V85.0667" stroke="#F1F1F1" strokeOpacity="0.9" strokeWidth="5" strokeLinecap="round" />
        <path
          d="M41.7887 71.1823L39.166 80.9703"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M35.9996 68.7846L29.5996 79.8697"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M31.0302 64.9706L22.5449 73.4559"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M27.216 60L16.1309 66.4"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M24.8177 54.2117L13.2266 57.3175"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M23.9996 48H9.59961"
          stroke="#F1F1F1"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M24.8179 41.7883L13.4844 38.7515"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M27.2162 36L18.9023 31.2"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M31.0302 31.0294L22.5449 22.5442"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M36.0003 27.2154L28.9336 14.9756"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M41.7893 24.8178L40.1328 18.6359"
          stroke="#A3A3A3"
          strokeOpacity="0.9"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M48 52C50.2091 52 52 50.2091 52 48C52 45.7909 50.2091 44 48 44C45.7909 44 44 45.7909 44 48C44 50.2091 45.7909 52 48 52Z"
          fill="#6B7280"
        />
      </svg>
    </div>
  );
}