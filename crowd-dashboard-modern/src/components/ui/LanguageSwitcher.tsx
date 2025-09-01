import React from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Button } from './button';

interface Language {
  code: string;
  label: string;
}

const languages: Language[] = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

interface LanguageSwitcherProps {
  languages?: Language[];
  value?: string;
  onValueChange?: (value: string) => void;
  align?: 'start' | 'center' | 'end';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
}

export function LanguageSwitcher({ 
  languages: customLanguages = languages,
  value = 'en',
  onValueChange,
  align = 'end',
  variant = 'outline',
  className = ''
}: LanguageSwitcherProps) {
  // Use the value prop directly instead of internal state
  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue);
  };

  const currentLanguage = customLanguages.find(lang => lang.code === value) || customLanguages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={`flex items-center justify-center w-10 h-10 p-0 ${className}`}
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[120px]">
        {customLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleValueChange(language.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{language.label}</span>
            {value === language.code && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}