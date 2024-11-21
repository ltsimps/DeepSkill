import { usePracticeSession } from '../../contexts/PracticeContext';
import { useFetcher } from '@remix-run/react';

export const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '⚡', description: 'Modern web development' },
  { id: 'python', name: 'Python', icon: '🐍', description: 'Data science & backend' },
  { id: 'typescript', name: 'TypeScript', icon: '💪', description: 'Type-safe JavaScript' },
  { id: 'java', name: 'Java', icon: '☕', description: 'Enterprise & Android' },
  { id: 'cpp', name: 'C++', icon: '⚙️', description: 'Systems & game dev' }
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

  if (variant === 'inline') {
    return (
      <div className="flex gap-2 flex-wrap">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => handleLanguageSelect(lang.id)}
            className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 ${
              state.selectedLanguage === lang.id
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <span>{lang.icon}</span>
            <span className="font-medium">{lang.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.id}
          onClick={() => handleLanguageSelect(lang.id)}
          className={`p-4 rounded-lg border transition-all ${
            state.selectedLanguage === lang.id
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
              : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
          }`}
        >
          <span className="text-2xl mb-1 block">{lang.icon}</span>
          <span className="font-medium block">{lang.name}</span>
          {showDescription && (
            <span className="text-sm text-gray-400 mt-1 block">{lang.description}</span>
          )}
        </button>
      ))}
    </div>
  );
}
