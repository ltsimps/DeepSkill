import { useFetcher } from '@remix-run/react';
import { cn } from '../../lib/utils';
import { ClientOnly } from './ClientOnly';
import { LANGUAGES, type SupportedLanguage } from '../../utils/language';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select"

interface LanguageDropdownProps {
  selectedLanguage: SupportedLanguage;
  onLanguageSelect?: (language: SupportedLanguage) => void;
  className?: string;
}

export function LanguageDropdown({ selectedLanguage, onLanguageSelect, className = '' }: LanguageDropdownProps) {
  const fetcher = useFetcher();

  const handleLanguageSelect = (value: string) => {
    const language = value as SupportedLanguage;
    fetcher.submit(
      { 
        intent: 'updateLanguage',
        language 
      },
      { method: 'post' }
    );
    onLanguageSelect?.(language);
  };

  const supportedLanguages = LANGUAGES.filter(l => l.supported);
  const selectedLang = supportedLanguages.find(l => l.id === selectedLanguage) || supportedLanguages[0];

  return (
    <ClientOnly fallback={
      <div className={cn(
        "w-[200px] h-10 bg-gray-800/50 border border-gray-700 text-gray-200 rounded-md flex items-center px-3",
        className
      )}>
        <span className="flex items-center gap-2">
          <span>{selectedLang.icon}</span>
          <span>{selectedLang.name}</span>
        </span>
      </div>
    }>
      <Select value={selectedLanguage} onValueChange={handleLanguageSelect}>
        <SelectTrigger className={cn(
          "w-[200px] bg-gray-800/50 border-gray-700 text-gray-200",
          "hover:bg-gray-800/70 hover:border-gray-600",
          "focus:ring-blue-500/20",
          className
        )}>
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{selectedLang.icon}</span>
              <span>{selectedLang.name}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
          <SelectGroup>
            <SelectLabel className="text-gray-400">Supported Languages</SelectLabel>
            {supportedLanguages.map((lang) => (
              <SelectItem 
                key={lang.id} 
                value={lang.id}
                className="hover:bg-gray-700 focus:bg-gray-700 focus:text-gray-100"
              >
                <span className="flex items-center gap-2">
                  <span>{lang.icon}</span>
                  <span>{lang.name}</span>
                  <span className="ml-2 text-xs text-gray-400">({lang.difficulty})</span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </ClientOnly>
  );
}
