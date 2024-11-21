import { redis } from './redis.server'
import { prisma } from './db.server'
import { GeneratedProblem } from '../routes/practice'
import { generateProblem, generateProblemEmbedding } from './openai.server'

const QUEUE_PREFIX = 'problem_queue:'
const QUEUE_SIZE = 5
const SIMILARITY_THRESHOLD = 0.8

export async function getUserProblemQueue(userId: string): Promise<string[]> {
  const key = `${QUEUE_PREFIX}${userId}`
  const queue = await redis.lrange(key, 0, -1)
  return queue
}

export async function addProblemToQueue(userId: string, problemId: string) {
  const key = `${QUEUE_PREFIX}${userId}`
  await redis.rpush(key, problemId)
}

export async function getNextProblem(userId: string, language: string, difficulty: string): Promise<GeneratedProblem> {
  const queue = await getUserProblemQueue(userId)
  
  if (queue.length === 0) {
    await replenishQueue(userId, language, difficulty)
    return getNextProblem(userId, language, difficulty)
  }
  
  const problemId = await redis.lpop(`${QUEUE_PREFIX}${userId}`)
  if (!problemId) {
    throw new Error('Failed to get next problem from queue')
  }
  
  const problem = await prisma.problem.findUnique({
    where: { id: problemId }
  })
  
  if (!problem) {
    // Problem was deleted, try next one
    return getNextProblem(userId, language, difficulty)
  }
  
  return problem as unknown as GeneratedProblem
}

async function replenishQueue(userId: string, language: string, difficulty: string) {
  const queueSize = await redis.llen(`${QUEUE_PREFIX}${userId}`)
  
  if (queueSize >= QUEUE_SIZE) {
    return
  }
  
  const numToGenerate = QUEUE_SIZE - queueSize
  
  for (let i = 0; i < numToGenerate; i++) {
    const problem = await generateProblem(language, difficulty)
    const embedding = await generateProblemEmbedding(problem)
    
    // Store the problem with its embedding
    const storedProblem = await prisma.problem.create({
      data: {
        ...problem,
        embedding
      }
    })
    
    await addProblemToQueue(userId, storedProblem.id)
  }
}

export async function findSimilarProblems(embedding: number[], limit: number = 5) {
  // Using pgvector's L2 distance to find similar problems
  const similarProblems = await prisma.$queryRaw`
    SELECT *, embedding <-> ${embedding}::vector AS distance
    FROM "Problem"
    ORDER BY distance
    LIMIT ${limit}
  `
  
  return similarProblems
}
