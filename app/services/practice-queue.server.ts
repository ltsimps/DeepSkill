import { prisma } from '../utils/db.server';
import { generateProblem } from '../utils/openai.server';
import type { Problem } from '@prisma/client';
import { ProblemGenerationQueue } from './problem-generation-queue.server';

const BATCH_SIZE = 5;  // Number of problems to fetch/generate at once
const MIN_PROBLEMS_THRESHOLD = 3;  // Minimum problems needed to start a session

interface ProblemBatch {
  problems: Problem[];
  isNewlyGenerated: boolean;
}

export class PracticeQueueService {
  private problemGenerationQueue: ProblemGenerationQueue;

  constructor(problemGenerationQueue: ProblemGenerationQueue) {
    this.problemGenerationQueue = problemGenerationQueue;
  }

  async getOrCreateProblemBatch(userId: string, language: string, topic?: string): Promise<ProblemBatch> {
    // First, try to get existing problems from the database
    const existingProblems = await prisma.problem.findMany({
      where: {
        language,
        // Only get problems the user hasn't attempted or hasn't solved
        NOT: {
          progressions: {
            some: {
              userId,
              solved: true
            }
          }
        },
        ...(topic ? {
          tags: {
            contains: topic
          }
        } : {})
      },
      take: BATCH_SIZE,
      orderBy: {
        progressions: {
          _count: 'asc'  // Prefer less attempted problems
        }
      }
    });

    // If we have enough problems, return them
    if (existingProblems.length >= MIN_PROBLEMS_THRESHOLD) {
      return {
        problems: existingProblems,
        isNewlyGenerated: false
      };
    }

    // Otherwise, generate new problems
    const jobId = await this.problemGenerationQueue.queueProblemGeneration(language, topic);
    let status = await this.problemGenerationQueue.getJobStatus(jobId);

    // Wait for the job to complete
    while (status.status === 'PENDING' || status.status === 'IN_PROGRESS') {
      await new Promise(resolve => setTimeout(resolve, 1000));  // Wait 1 second
      status = await this.problemGenerationQueue.getJobStatus(jobId);
    }

    if (status.status === 'FAILED') {
      throw new Error(`Failed to generate problems: ${status.error}`);
    }

    // Return the newly generated problems along with any existing ones
    const newProblems = await prisma.problem.findMany({
      where: {
        id: {
          in: status.problemIds || []
        }
      }
    });

    return {
      problems: [...existingProblems, ...newProblems].slice(0, BATCH_SIZE),
      isNewlyGenerated: true
    };
  }

  async saveBatchResults(userId: string, results: Array<{
    problemId: string;
    solution: string;
    isCorrect: boolean;
    timeSpent: number;
    points: number;
  }>) {
    // Use a transaction to ensure all results are saved atomically
    return prisma.$transaction(
      results.map(result =>
        prisma.problemProgression.upsert({
          where: {
            userId_problemId: {
              userId,
              problemId: result.problemId
            }
          },
          create: {
            userId,
            problemId: result.problemId,
            attempts: 1,
            solved: result.isCorrect,
            timeSpent: result.timeSpent,
            rewardSignal: result.points,
            lastAttempt: new Date(),
            userSolution: result.solution
          },
          update: {
            attempts: { increment: 1 },
            solved: result.isCorrect,
            timeSpent: { increment: result.timeSpent },
            rewardSignal: { increment: result.points },
            lastAttempt: new Date(),
            userSolution: result.solution
          }
        })
      )
    );
  }

  async getNextProblem(userId: string, language: string): Promise<Problem | null> {
    // Get current session
    const currentSession = await prisma.practiceSession.findFirst({
      where: {
        userId,
        status: 'IN_PROGRESS'
      },
      include: {
        problems: {
          select: {
            problemId: true
          }
        }
      }
    });

    if (!currentSession) {
      throw new Error('No active session found');
    }

    // Get a random problem that hasn't been attempted in this session
    const problem = await prisma.problem.findFirst({
      where: {
        language: language.toUpperCase(),
        NOT: {
          id: {
            in: await prisma.sessionProblem.findMany({
              where: { 
                session: { 
                  userId,
                  status: 'IN_PROGRESS'
                }
              },
              select: { problemId: true },
            }).then(problems => problems.map(p => p.problemId))
          }
        }
      },
      orderBy: {
        progressions: {
          _count: 'asc'
        }
      }
    });

    if (!problem) {
      // If no problems available, generate new ones
      const batch = await this.getOrCreateProblemBatch(userId, language);
      return batch.problems[0] || null;
    }

    // Get the current max order for this session
    const lastProblem = await prisma.sessionProblem.findFirst({
      where: { sessionId: currentSession.id },
      orderBy: { order: 'desc' }
    });

    const nextOrder = (lastProblem?.order ?? -1) + 1;

    // Ensure ProblemProgression exists
    await prisma.problemProgression.upsert({
      where: {
        userId_problemId: {
          userId: userId,
          problemId: problem.id
        }
      },
      create: {
        userId: userId,
        problemId: problem.id
      },
      update: {}
    });

    // Add problem to current session
    await prisma.sessionProblem.create({
      data: {
        sessionId: currentSession.id,
        problemId: problem.id,
        order: nextOrder,
        userId: userId
      }
    });

    return problem;
  }
}

// Create a singleton instance of the problem generation queue
export const problemGenerationQueue = new ProblemGenerationQueue();

// Create a singleton instance of the practice queue service
export const practiceQueueService = new PracticeQueueService(problemGenerationQueue);
