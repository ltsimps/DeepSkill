import { prisma } from '../utils/db.server';
import { ProblemQueue } from './problem-queue.server';
import { AnalysisQueue } from './analysis-queue.server';
import { DAILY_PROBLEM_LIMIT } from '../constants/practice';

export class PracticeSessionService {
  private problemQueue: ProblemQueue;
  private analysisQueue: AnalysisQueue;
  private readonly DAILY_LIMIT = DAILY_PROBLEM_LIMIT;

  constructor(problemQueue: ProblemQueue, analysisQueue: AnalysisQueue) {
    this.problemQueue = problemQueue;
    this.analysisQueue = analysisQueue;
  }

  async getUserStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [user, problemsToday] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          streak: true,
          xp: true,
          level: true,
          lastPractice: true
        }
      }),
      prisma.sessionProblem.count({
        where: {
          userId,
          session: {
            createdAt: { gte: today }
          },
          status: 'COMPLETED' // Only count completed problems, not failed ones
        }
      })
    ]);

    if (!user) throw new Error('User not found');

    const nextLevelXp = Math.pow(2, user.level - 1) * 1000;

    return {
      streak: user.streak,
      xp: user.xp,
      level: user.level,
      nextLevelXp,
      problemsAttemptedToday: problemsToday,
      dailyLimit: this.DAILY_LIMIT,
      remainingProblems: Math.max(0, this.DAILY_LIMIT - problemsToday)
    };
  }

  async resetDailyProgress(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mark all pending problems as skipped
    await prisma.sessionProblem.updateMany({
      where: {
        userId,
        session: {
          createdAt: { gte: today }
        },
        status: 'PENDING'
      },
      data: {
        status: 'SKIPPED'
      }
    });

    // Mark all active sessions as completed
    await prisma.practiceSession.updateMany({
      where: {
        userId,
        createdAt: { gte: today },
        status: 'ACTIVE'
      },
      data: {
        status: 'COMPLETED'
      }
    });

    return this.getUserStats(userId);
  }

  async startSession(userId: string) {
    // Get user stats to check daily limit
    const stats = await this.getUserStats(userId);
    
    // If user has reached daily limit, return null
    if (stats.remainingProblems <= 0) {
      return null;
    }

    // Check for existing active session
    const existingSession = await prisma.practiceSession.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    if (existingSession) {
      // Check if the session has any pending problems
      const pendingProblems = await prisma.sessionProblem.count({
        where: {
          sessionId: existingSession.id,
          status: 'PENDING'
        }
      });

      if (pendingProblems > 0) {
        return existingSession;
      } else {
        // Mark session as completed if no pending problems
        await prisma.practiceSession.update({
          where: { id: existingSession.id },
          data: { status: 'COMPLETED' }
        });
      }
    }

    // Create new session and populate with problems
    const session = await prisma.practiceSession.create({
      data: {
        userId,
        status: 'ACTIVE'
      }
    });

    // Queue up initial problems
    const problems = await this.problemQueue.populateSessionQueue(session.id);
    
    // If no problems were queued, mark session as completed
    if (!problems || problems.length === 0) {
      await prisma.practiceSession.update({
        where: { id: session.id },
        data: { status: 'COMPLETED' }
      });
      return null;
    }

    return session;
  }

  async getCurrentProblem(sessionId: string) {
    const problem = await prisma.sessionProblem.findFirst({
      where: {
        sessionId,
        status: 'PENDING'
      },
      orderBy: { order: 'asc' },
      include: {
        problem: true
      }
    });

    return problem?.problem || null;
  }

  async submitSolution(sessionId: string, problemId: string, userId: string, solution: string) {
    // Queue solution for analysis
    const analysisJob = await this.analysisQueue.queueAnalysis({
      sessionId,
      problemId,
      userId,
      solution
    });

    // Mark the problem as completed
    await prisma.sessionProblem.update({
      where: {
        sessionId_problemId: {
          sessionId,
          problemId
        }
      },
      data: {
        status: 'COMPLETED',
        attempts: { increment: 1 }
      }
    });

    // Check if session is complete
    const pendingProblems = await prisma.sessionProblem.count({
      where: {
        sessionId,
        status: 'PENDING'
      }
    });

    if (pendingProblems === 0) {
      await prisma.practiceSession.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED' }
      });
    }

    return analysisJob;
  }

  async skipProblem(sessionId: string, problemId: string) {
    await prisma.sessionProblem.update({
      where: {
        sessionId_problemId: {
          sessionId,
          problemId
        }
      },
      data: {
        status: 'FAILED'
      }
    });
  }
}
