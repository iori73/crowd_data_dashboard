interface TextSectionItem {
  title: string;
  content: string;
  color?: string;
}

interface TextSectionProps {
  items: TextSectionItem[];
  className?: string;
}

export function TextSection({ items, className = '' }: TextSectionProps) {
  return (
    <div className={`flex flex-col gap-4 items-start justify-start relative shrink-0 w-full ${className}`}>
      <div className="flex flex-col gap-2 items-start justify-start relative shrink-0 w-full">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-1 items-start justify-start relative shrink-0 w-full">
            <div className="flex gap-1 items-center justify-center relative shrink-0">
              {item.color && (
                <div 
                  className="rounded-lg shrink-0 w-4 h-4" 
                  style={{ backgroundColor: item.color }}
                />
              )}
              <div className="font-medium text-lg text-gray-900 text-nowrap leading-normal whitespace-pre">
                {item.title}
              </div>
            </div>
            <div className="font-normal text-base text-gray-700 min-w-full leading-normal" style={{ width: "min-content" }}>
              {item.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
