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

// Helper to create a FILL_IN type problem
export function createFillInProblem({
  title,
  difficulty,
  template,
  fillInSections,
  description,
  hints = [],
  tags = [],
  timeLimit = 300,
  baseComplexity = 1.0,
}: {
  title: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
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
    language: 'JAVASCRIPT', // Default to JavaScript for now
    title,
    description,
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
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
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
    language: 'JAVASCRIPT',
    title,
    description,
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
