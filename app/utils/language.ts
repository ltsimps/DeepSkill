export type ProgrammingLanguage = typeof LANGUAGES[number]['id'];
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGES = [
  { 
    id: 'python' as const, 
    name: 'Python', 
    icon: '🐍', 
    description: 'Data science & automation',
    difficulty: 'Beginner Friendly',
    supported: true
  }
] as const;

export const SUPPORTED_LANGUAGES = LANGUAGES
  .filter(lang => lang.supported)
  .map(lang => lang.id);
