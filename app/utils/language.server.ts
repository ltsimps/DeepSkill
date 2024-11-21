import { prisma } from './db.server';

export type ProgrammingLanguage = 'javascript' | 'python' | 'typescript' | 'java' | 'cpp';

export const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '⚡', description: 'Modern web development' },
  { id: 'python', name: 'Python', icon: '🐍', description: 'Data science & backend' },
  { id: 'typescript', name: 'TypeScript', icon: '💪', description: 'Type-safe JavaScript' },
  { id: 'java', name: 'Java', icon: '☕', description: 'Enterprise & Android' },
  { id: 'cpp', name: 'C++', icon: '⚙️', description: 'Systems & game dev' }
] as const;

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
