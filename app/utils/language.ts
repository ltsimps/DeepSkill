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
  },
  { 
    id: 'cpp' as const, 
    name: 'C++', 
    icon: '⚡', 
    description: 'Systems & game development',
    difficulty: 'Intermediate',
    supported: true
  },
  { 
    id: 'javascript' as const, 
    name: 'JavaScript', 
    icon: '📱', 
    description: 'Modern web development',
    difficulty: 'Intermediate',
    supported: false
  },
  { 
    id: 'typescript' as const, 
    name: 'TypeScript', 
    icon: '💪', 
    description: 'Type-safe JavaScript', 
    difficulty: 'Intermediate',
    supported: false
  },
  { 
    id: 'java' as const, 
    name: 'Java', 
    icon: '☕', 
    description: 'Enterprise & Android',
    difficulty: 'Advanced',
    supported: false
  }
] as const;

export const SUPPORTED_LANGUAGES = LANGUAGES
  .filter(lang => lang.supported)
  .map(lang => lang.id);
