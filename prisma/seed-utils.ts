import { Prisma } from '@prisma/client'

export interface FillInSection {
  id: string
  start: number
  end: number
  solution: string
}

export interface TestCase {
  input: string
  expectedOutput: string
  description: string
}

export type ProgrammingLanguage = 'javascript' | 'python' | 'cpp';
export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

// Helper to create a FILL_IN type problem
export function createFillInProblem({
  title,
  difficulty,
  language,
  template,
  fillInSections,
  description,
  hints = [],
  tags = [],
  timeLimit = 300,
  baseComplexity = 1.0,
}: {
  title: string
  difficulty: DifficultyLevel
  language: ProgrammingLanguage
  template: string
  fillInSections: FillInSection[]
  description: string
  hints?: string[]
  tags?: string[]
  timeLimit?: number
  baseComplexity?: number
}): Prisma.ProblemCreateInput {
  return {
    type: 'FILL_IN',
    difficulty,
    language,
    title,
    description,
    problem: description, // Use description as problem statement
    hints: JSON.stringify(hints),
    tags: JSON.stringify(tags),
    timeLimit,
    template,
    fillInSections: JSON.stringify(fillInSections),
    testCases: null,
    startingCode: null,
    solution: null,
    source: 'SEEDED',
    baseComplexity,
    adaptiveDifficulty: 1.0,
    successRate: 0.0,
    averageTime: 0.0,
    dailyUseCount: 0,
    totalUses: 0
  }
}

// Helper to create a SCENARIO type problem
export function createScenarioProblem({
  title,
  difficulty,
  language,
  description,
  startingCode,
  solution,
  testCases,
  hints = [],
  tags = [],
  timeLimit = 300,
  baseComplexity = 1.0,
}: {
  title: string
  difficulty: DifficultyLevel
  language: ProgrammingLanguage
  description: string
  startingCode: string
  solution: string
  testCases: TestCase[]
  hints?: string[]
  tags?: string[]
  timeLimit?: number
  baseComplexity?: number
}): Prisma.ProblemCreateInput {
  return {
    type: 'SCENARIO',
    difficulty,
    language,
    title,
    description,
    problem: description, // Use description as problem statement
    hints: JSON.stringify(hints),
    tags: JSON.stringify(tags),
    timeLimit,
    template: null,
    fillInSections: null,
    startingCode,
    solution,
    testCases: JSON.stringify(testCases),
    source: 'SEEDED',
    baseComplexity,
    adaptiveDifficulty: 1.0,
    successRate: 0.0,
    averageTime: 0.0,
    dailyUseCount: 0,
    totalUses: 0
  }
}

// Helper to create a SCENARIO type problem
export function createProblem({
  title,
  difficulty,
  language,
  description,
  problem,
  startingCode,
  solution,
  testCases,
  hints = [],
  tags = [],
  timeLimit = 300,
  baseComplexity = 1.0,
}: {
  title: string
  difficulty: DifficultyLevel
  language: ProgrammingLanguage
  description: string
  problem: string
  startingCode: string
  solution: string
  testCases: TestCase[]
  hints?: string[]
  tags?: string[]
  timeLimit?: number
  baseComplexity?: number
}): Prisma.ProblemCreateInput {
  return {
    title,
    difficulty,
    language,
    description,
    problem,
    startingCode,
    solution,
    testCases: JSON.stringify(testCases),
    hints: JSON.stringify(hints),
    tags: JSON.stringify(tags),
    timeLimit,
    baseComplexity,
    type: 'SCENARIO',
    source: 'SEEDED',
    status: 'ACTIVE'
  }
}
