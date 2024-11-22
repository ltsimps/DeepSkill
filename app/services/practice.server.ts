import { prisma } from '../utils/db.server';
import { DAILY_PROBLEM_LIMIT } from '../constants/practice';
import { llmService } from './llm.server';

interface NextProblemOptions {
  userId: string;
  domainId?: string;
  topicId?: string;
  preferredLanguages?: string[];
}

interface LearningMetrics {
  correctness: number;
  timeSpent: number;
  attemptsCount: number;
  lastReview: Date;
  nextReview: Date;
  easeFactor: number;
  interval: number;
}

interface ReinforcementState {
  skillLevel: number;
  conceptMastery: Record<string, number>;
  recentPerformance: number[];
  explorationRate: number;
}

export class PracticeScheduler {
  // Get the next problem for a user based on their performance and domain
  async getNextProblem({ userId, domainId, topicId, preferredLanguages }: NextProblemOptions) {
    console.log('Getting next problem for user:', userId, 'domain:', domainId, 'topic:', topicId);
    
    // Check if user has reached daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attemptedToday = await prisma.problemProgression.count({
      where: {
        userId,
        lastAttempt: {
          gte: today
        }
      }
    });

    console.log('Attempts today:', attemptedToday);

    if (attemptedToday >= DAILY_PROBLEM_LIMIT) {
      console.log('Daily limit reached');
      return { type: 'DAILY_LIMIT_REACHED' as const };
    }

    // Get user's domain progress
    const userDomain = domainId ? await prisma.userDomain.findUnique({
      where: { userId_domainId: { userId, domainId } },
      include: { domain: true }
    }) : null;

    // Get user's average performance metrics
    const userMetrics = await this.getUserMetrics(userId, domainId);
    
    // Select appropriate difficulty level
    const targetDifficulty = this.selectDifficulty(userMetrics);
    console.log('Selected difficulty:', targetDifficulty);

    // Build base query
    const baseQuery = {
      difficulty: targetDifficulty,
      ...(domainId && { domainId }),
      ...(topicId && { topicId }),
      NOT: {
        progressions: {
          some: {
            userId,
            lastAttempt: { gte: today }
          }
        }
      }
    };

    // If this is a programming domain, add language filter
    if (userDomain?.domain.name === 'Programming' && preferredLanguages?.length) {
      baseQuery['content'] = {
        path: ['language'],
        in: preferredLanguages
      };
    }
    
    // Try to find a problem using vector similarity
    const lastProblem = await prisma.problemProgression.findFirst({
      where: { userId },
      orderBy: { lastAttempt: 'desc' },
      include: { problem: true }
    });

    let problem = null;
    if (lastProblem?.problem.embedding) {
      // Find similar problem using vector similarity
      problem = await prisma.$queryRaw`
        SELECT p.*, (p.embedding <=> ${lastProblem.problem.embedding}::vector) as similarity
        FROM Problem p
        WHERE p.id != ${lastProblem.problem.id}
        AND p.difficulty = ${targetDifficulty}
        ${domainId ? prisma.sql`AND p.domainId = ${domainId}` : prisma.sql``}
        ${topicId ? prisma.sql`AND p.topicId = ${topicId}` : prisma.sql``}
        ORDER BY similarity ASC
        LIMIT 1
      `;
    }

    // If no similar problem found, try regular query
    if (!problem) {
      // Get reinforcement learning state
      const rlState = await this.getUserReinforcementState(userId, domainId);

      // Get problems using existing query
      let problems = await prisma.problem.findMany({
        where: baseQuery,
        orderBy: [
          { lastUsed: 'asc' },
          { totalUses: 'asc' }
        ],
        take: 10
      });

      // Use RL to select the best problem
      const selectedProblem = this.selectProblemRL(problems, rlState);

      if (!selectedProblem) {
        return null;
      }

      // Update problem selection metrics
      await prisma.problem.update({
        where: { id: selectedProblem.id },
        data: {
          lastUsed: new Date(),
          totalUses: { increment: 1 }
        }
      });

      problem = selectedProblem;
    }

    if (problem) {
      console.log('Found problem:', problem.id);
      // Update usage metrics
      await prisma.problem.update({
        where: { id: problem.id },
        data: {
          lastUsed: new Date(),
          totalUses: { increment: 1 }
        }
      });
      
      return { type: 'PROBLEM_FOUND' as const, problem };
    }

    // If no problem found, generate one with LLM
    console.log('No problem found, generating with LLM');
    
    // Get domain and topic info
    const domain = await prisma.domain.findUnique({ where: { id: domainId } });
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    
    if (!domain || !topic) {
      throw new Error('Domain or topic not found');
    }

    const newProblem = await llmService.generateProblem(
      domain.name,
      topic.name,
      targetDifficulty
    );

    return { type: 'PROBLEM_FOUND' as const, problem: newProblem };
  }

  async getAvailableProblemsCount(userId: string, domainId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attemptedToday = await prisma.problemProgression.count({
      where: {
        userId,
        lastAttempt: {
          gte: today
        },
        ...(domainId && {
          problem: {
            domainId
          }
        })
      }
    });

    const availableProblems = await prisma.problem.count({
      where: {
        ...(domainId && { domainId }),
        NOT: {
          progressions: {
            some: {
              userId,
              lastAttempt: { gte: today }
            }
          }
        }
      }
    });

    return {
      attempted: attemptedToday,
      available: availableProblems,
      remaining: Math.max(0, DAILY_PROBLEM_LIMIT - attemptedToday)
    };
  }

  // Get user's performance metrics for a specific domain
  private async getUserMetrics(userId: string, domainId?: string) {
    const progressions = await prisma.problemProgression.findMany({
      where: {
        userId,
        ...(domainId && {
          problem: {
            domainId
          }
        })
      },
      include: {
        problem: true
      },
      orderBy: {
        lastAttempt: 'desc'
      },
      take: 10 // Look at last 10 problems
    });

    if (progressions.length === 0) {
      return { averageScore: 0, averageTime: 0 };
    }

    const scores = progressions.map(p => p.solved ? 1 : 0);
    const times = progressions.map(p => p.timeSpent);

    return {
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length
    };
  }

  // Select difficulty based on user performance
  private selectDifficulty(metrics: { averageScore: number; averageTime: number }): string {
    const { averageScore } = metrics;
    
    if (averageScore < 0.3) return 'EASY';
    if (averageScore < 0.7) return 'MEDIUM';
    return 'HARD';
  }

  private readonly MIN_INTERVAL = 1; // 1 day
  private readonly MAX_INTERVAL = 365; // 1 year
  private readonly DEFAULT_EASE = 2.5;
  private readonly EPSILON_DECAY = 0.995;

  private async getUserReinforcementState(userId: string, domainId?: string): Promise<ReinforcementState> {
    const userDomain = domainId ? await prisma.userDomain.findUnique({
      where: { userId_domainId: { userId, domainId } },
      include: {
        progressions: {
          take: 10,
          orderBy: { lastAttempt: 'desc' },
          select: { status: true }
        }
      }
    }) : null;

    const recentPerformance = userDomain?.progressions.map(p => p.status === 'COMPLETED' ? 1 : 0) || [];
    
    return {
      skillLevel: userDomain?.skillLevel || 0,
      conceptMastery: userDomain?.conceptMastery || {},
      recentPerformance,
      explorationRate: Math.max(0.1, 0.5 * Math.pow(this.EPSILON_DECAY, userDomain?.totalAttempts || 0))
    };
  }

  private calculateNextReview(metrics: LearningMetrics, performance: number): LearningMetrics {
    // SM-2 Algorithm with modifications
    const newEaseFactor = metrics.easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02));
    const adjustedEase = Math.max(1.3, newEaseFactor);

    let newInterval;
    if (performance < 3) {
      newInterval = this.MIN_INTERVAL;
    } else if (metrics.interval === 0) {
      newInterval = 1;
    } else if (metrics.interval === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.min(this.MAX_INTERVAL, metrics.interval * adjustedEase);
    }

    return {
      ...metrics,
      easeFactor: adjustedEase,
      interval: newInterval,
      nextReview: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000)
    };
  }

  private selectProblemRL(problems: any[], state: ReinforcementState): any {
    // Epsilon-greedy strategy
    if (Math.random() < state.explorationRate) {
      // Exploration: try a random problem
      return problems[Math.floor(Math.random() * problems.length)];
    }

    // Exploitation: select problem based on expected learning value
    return problems.reduce((best, current) => {
      const expectedValue = this.calculateExpectedValue(current, state);
      if (!best || expectedValue > best.value) {
        return { problem: current, value: expectedValue };
      }
      return best;
    }, null)?.problem;
  }

  private calculateExpectedValue(problem: any, state: ReinforcementState): number {
    const difficultyMatch = Math.exp(-Math.pow(problem.difficulty - state.skillLevel, 2) / 2);
    const conceptValue = problem.concepts.reduce((sum: number, concept: string) => 
      sum + (1 - (state.conceptMastery[concept] || 0)), 0) / problem.concepts.length;
    const timeDecay = problem.lastAttempt ? 
      Math.exp(-(Date.now() - new Date(problem.lastAttempt).getTime()) / (7 * 24 * 60 * 60 * 1000)) : 1;

    return (0.4 * difficultyMatch + 0.4 * conceptValue + 0.2 * (1 - timeDecay));
  }

  async updateLearningMetrics(userId: string, problemId: string, performance: number) {
    const progression = await prisma.problemProgression.findFirst({
      where: { userId, problemId },
      orderBy: { lastAttempt: 'desc' }
    });

    const currentMetrics: LearningMetrics = progression?.metrics || {
      correctness: 0,
      timeSpent: 0,
      attemptsCount: 0,
      lastReview: new Date(),
      nextReview: new Date(),
      easeFactor: this.DEFAULT_EASE,
      interval: 0
    };

    const newMetrics = this.calculateNextReview(currentMetrics, performance);

    // Update progression with new metrics
    await prisma.problemProgression.update({
      where: { id: progression.id },
      data: { metrics: newMetrics }
    });

    // Update user's reinforcement learning state
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { concepts: true, domainId: true }
    });

    await prisma.userDomain.update({
      where: { 
        userId_domainId: { 
          userId, 
          domainId: problem.domainId 
        } 
      },
      data: {
        conceptMastery: {
          update: problem.concepts.reduce((acc, concept) => ({
            ...acc,
            [concept]: Math.min(1, ((acc[concept] || 0) + performance / 5) * 0.95)
          }), {})
        },
        totalAttempts: { increment: 1 }
      }
    });

    return newMetrics;
  }

  // Update problem and user metrics after an attempt
  async updateProgression(userId: string, problemId: string, isCorrect: boolean, timeSpent: number) {
    const progression = await prisma.problemProgression.findUnique({
      where: {
        userId_problemId: { userId, problemId }
      },
      include: {
        problem: true,
        user: true
      }
    });

    // Calculate XP based on difficulty and performance
    const xpGained = this.calculateXP(progression?.problem.difficulty || 'EASY', isCorrect, timeSpent);

    // Update both user and domain XP
    const updates = [
      // Update user XP
      prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpGained }
        }
      })
    ];

    // If problem is associated with a domain, update domain XP too
    if (progression?.problem.domainId) {
      updates.push(
        prisma.userDomain.upsert({
          where: {
            userId_domainId: {
              userId,
              domainId: progression.problem.domainId
            }
          },
          create: {
            userId,
            domainId: progression.problem.domainId,
            xp: xpGained
          },
          update: {
            xp: { increment: xpGained }
          }
        })
      );
    }

    // Run all updates in parallel
    await Promise.all(updates);

    if (!progression) {
      // Create new progression
      return await prisma.problemProgression.create({
        data: {
          userId,
          problemId,
          attempts: 1,
          timeSpent,
          solved: isCorrect,
          consecutiveCorrect: isCorrect ? 1 : 0
        }
      });
    }

    // Update existing progression
    return await prisma.problemProgression.update({
      where: {
        id: progression.id
      },
      data: {
        attempts: { increment: 1 },
        timeSpent: { increment: timeSpent },
        solved: isCorrect,
        consecutiveCorrect: isCorrect 
          ? { increment: 1 }
          : 0
      }
    });
  }

  private calculateXP(difficulty: string, isCorrect: boolean, timeSpent: number): number {
    const baseXP = {
      'EASY': 10,
      'MEDIUM': 20,
      'HARD': 30
    }[difficulty] || 10;

    // Bonus for solving quickly (under 5 minutes)
    const timeBonus = timeSpent < 300 ? 5 : 0;
    
    return isCorrect ? baseXP + timeBonus : Math.floor(baseXP * 0.1);
  }
}

export const practiceScheduler = new PracticeScheduler();
