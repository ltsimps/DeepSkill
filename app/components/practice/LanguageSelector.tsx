import { usePracticeSession } from '../../contexts/PracticeContext';
import { useFetcher } from '@remix-run/react';

export const LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍', description: 'Data science & backend' }
] as const;

export type ProgrammingLanguage = typeof LANGUAGES[number]['id'];

interface LanguageSelectorProps {
  variant?: 'grid' | 'inline';
  onLanguageSelect?: (language: ProgrammingLanguage) => void;
  showDescription?: boolean;
}

export function LanguageSelector({ 
  variant = 'grid', 
  onLanguageSelect,
  showDescription = false 
}: LanguageSelectorProps) {
  const { state, dispatch } = usePracticeSession();
  const fetcher = useFetcher();

  const handleLanguageSelect = (language: ProgrammingLanguage) => {
    dispatch({ type: 'SET_LANGUAGE', language });
    fetcher.submit(
      { 
        intent: 'updateLanguage',
        language 
      },
      { method: 'post' }
    );
    onLanguageSelect?.(language);
  };

  // Since we only have Python, we can simplify the UI
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        key="python"
        onClick={() => handleLanguageSelect('python')}
        className="px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 bg-blue-500/20 border-blue-500/50 text-blue-300"
      >
        <span>🐍</span>
        <span>Python</span>
        {showDescription && (
          <span className="text-sm text-gray-400">Data science & backend</span>
        )}
      </button>
    </div>
  );
}
