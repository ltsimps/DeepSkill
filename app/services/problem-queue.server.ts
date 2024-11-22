import { prisma } from '../utils/db.server';

export class ProblemQueue {
  private readonly PROBLEMS_PER_SESSION = 5;

  private getDifficultyForLevel(level: number): 'EASY' | 'MEDIUM' | 'HARD' {
    if (level <= 3) return 'EASY';
    if (level <= 6) return 'MEDIUM';
    return 'HARD';
  }

  async populateSessionQueue(sessionId: string) {
    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session) throw new Error('Session not found');

    // Get user's completed problems
    const completedProblemIds = await prisma.sessionProblem.findMany({
      where: {
        userId: session.userId,
        status: 'COMPLETED'
      },
      select: { problemId: true }
    });

    const userDifficulty = this.getDifficultyForLevel(session.user.level);

    // Try to get problems at user's level first
    let availableProblems = await prisma.problem.findMany({
      where: {
        difficulty: userDifficulty,
        language: 'python',
        id: {
          notIn: completedProblemIds.map(p => p.problemId)
        }
      },
      take: this.PROBLEMS_PER_SESSION,
      orderBy: {
        id: 'asc' // Consistent ordering
      }
    });

    // If not enough problems at user's level, try easier ones
    if (availableProblems.length < this.PROBLEMS_PER_SESSION) {
      const remainingCount = this.PROBLEMS_PER_SESSION - availableProblems.length;
      const easierDifficulty = userDifficulty === 'HARD' ? 'MEDIUM' : 'EASY';
      
      const easierProblems = await prisma.problem.findMany({
        where: {
          difficulty: easierDifficulty,
          language: 'python',
          id: {
            notIn: [
              ...completedProblemIds.map(p => p.problemId),
              ...availableProblems.map(p => p.id)
            ]
          }
        },
        take: remainingCount,
        orderBy: {
          id: 'asc' // Consistent ordering
        }
      });

      availableProblems.push(...easierProblems);
    }

    // If still not enough problems, try any unsolved problems regardless of difficulty
    if (availableProblems.length < this.PROBLEMS_PER_SESSION) {
      const remainingCount = this.PROBLEMS_PER_SESSION - availableProblems.length;
      
      const anyProblems = await prisma.problem.findMany({
        where: {
          language: 'python',
          id: {
            notIn: [
              ...completedProblemIds.map(p => p.problemId),
              ...availableProblems.map(p => p.id)
            ]
          }
        },
        take: remainingCount,
        orderBy: {
          id: 'asc' // Consistent ordering
        }
      });

      availableProblems.push(...anyProblems);
    }

    // If we still have no problems, try including already completed ones
    if (availableProblems.length === 0) {
      availableProblems = await prisma.problem.findMany({
        where: {
          language: 'python'
        },
        take: this.PROBLEMS_PER_SESSION,
        orderBy: {
          id: 'asc' // Consistent ordering
        }
      });
    }

    // If we still have no problems, something is wrong with our database
    if (availableProblems.length === 0) {
      throw new Error('No problems available in the database');
    }

    // Ensure ProblemProgression entries exist for each problem
    await Promise.all(
      availableProblems.map(problem =>
        prisma.problemProgression.upsert({
          where: {
            userId_problemId: {
              userId: session.userId,
              problemId: problem.id
            }
          },
          create: {
            userId: session.userId,
            problemId: problem.id,
            attempts: 0,
            timeSpent: 0,
            solved: false,
            consecutiveCorrect: 0
          },
          update: {} // No updates needed if it exists
        })
      )
    );

    // Create session problems with explicit order
    const sessionProblems = await Promise.all(
      availableProblems.map((problem, index) =>
        prisma.sessionProblem.create({
          data: {
            problemId: problem.id,
            sessionId,
            userId: session.userId,
            status: 'PENDING',
            order: index
          }
        })
      )
    );

    return sessionProblems;
  }

  async getNextProblem(sessionId: string) {
    const nextProblem = await prisma.sessionProblem.findFirst({
      where: {
        sessionId,
        status: 'PENDING'
      },
      include: {
        problem: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return nextProblem;
  }

  async markProblemCompleted(sessionProblemId: string) {
    return prisma.sessionProblem.update({
      where: { id: sessionProblemId },
      data: {
        status: 'COMPLETED',
        endTime: new Date()
      }
    });
  }

  async markProblemSkipped(sessionProblemId: string) {
    return prisma.sessionProblem.update({
      where: { id: sessionProblemId },
      data: {
        status: 'SKIPPED',
        endTime: new Date()
      }
    });
  }
}
