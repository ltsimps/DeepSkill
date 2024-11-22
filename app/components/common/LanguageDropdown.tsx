import { useFetcher } from '@remix-run/react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

const LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍' }
] as const;

type Language = typeof LANGUAGES[number]['id'];

interface LanguageDropdownProps {
  selectedLanguage: Language;
  onLanguageSelect: (language: Language) => void;
  className?: string;
}

export function LanguageDropdown({ 
  selectedLanguage, 
  onLanguageSelect,
  className 
}: LanguageDropdownProps) {
  // Since we only have Python, we can simplify this to a single button
  return (
    <Button
      onClick={() => onLanguageSelect('python')}
      className={className}
    >
      <span className="mr-2">🐍</span>
      Python
    </Button>
  );
}
