import { prisma } from './db.server';

export type ProgrammingLanguage = 'python';

export const LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍', description: 'Data science & backend' }
] as const;

export function validateLanguage(language: string): language is ProgrammingLanguage {
  return language === 'python';
}

export function getDefaultLanguage(): ProgrammingLanguage {
  return 'python';
}

export async function updateUserPreferredLanguage(userId: string, language: ProgrammingLanguage) {
  if (!LANGUAGES.find(l => l.id === language)) {
    throw new Error(`Invalid language: ${language}`);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { preferredLanguage: language },
    select: { preferredLanguage: true }
  });
}
