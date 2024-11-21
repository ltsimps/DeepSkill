import { prisma } from './db.server'

export type ProgrammingLanguage = 'javascript' | 'python' | 'java' | 'typescript'

export interface ProblemInput {
  title: string
  description: string
  difficulty: string
  language: ProgrammingLanguage
  problem: string
  startingCode?: string
  solution: string
  hints?: string[]
  testCases?: string[]
  type?: string
  source?: string
}

export interface ProblemOutput extends ProblemInput {
  id: string
  createdAt: Date
  updatedAt: Date
  baseComplexity: number
  adaptiveDifficulty: number
  successRate: number
  averageTime: number
  lastUsed: Date
  dailyUseCount: number
  totalUses: number
}

export async function createProblem(input: ProblemInput): Promise<ProblemOutput> {
  const {
    title,
    description,
    difficulty,
    language,
    problem,
    startingCode,
    solution,
    hints = [],
    testCases = [],
    type = 'SCENARIO',
    source = 'GENERATED'
  } = input

  return prisma.problem.create({
    data: {
      title,
      description,
      difficulty,
      language,
      problem,
      startingCode,
      solution,
      hints: JSON.stringify(hints),
      testCases: JSON.stringify(testCases),
      type,
      source
    }
  })
}

export async function getProblemById(id: string): Promise<ProblemOutput | null> {
  return prisma.problem.findUnique({
    where: { id }
  })
}

export async function updateProblem(id: string, data: Partial<ProblemInput>): Promise<ProblemOutput> {
  return prisma.problem.update({
    where: { id },
    data: {
      ...data,
      hints: data.hints ? JSON.stringify(data.hints) : undefined,
      testCases: data.testCases ? JSON.stringify(data.testCases) : undefined
    }
  })
}

export function validateProblemInput(input: Partial<ProblemInput>): string[] {
  const errors: string[] = []
  
  if (!input.title?.trim()) {
    errors.push('Title is required')
  }
  if (!input.description?.trim()) {
    errors.push('Description is required')
  }
  if (!input.difficulty?.trim()) {
    errors.push('Difficulty is required')
  }
  if (!input.language?.trim()) {
    errors.push('Language is required')
  }
  if (!input.problem?.trim()) {
    errors.push('Problem statement is required')
  }
  if (!input.solution?.trim()) {
    errors.push('Solution is required')
  }

  return errors
}
