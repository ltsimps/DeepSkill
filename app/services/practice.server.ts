import { prisma } from '../utils/db.server'

const DAILY_PROBLEM_LIMIT = 20
const DIFFICULTY_LEVELS = ['EASY', 'MEDIUM', 'HARD']
const MIN_PRESEEDED_PER_DIFFICULTY = 10

interface ProblemMetrics {
  successRate: number
  averageTime: number
  adaptiveDifficulty: number
}

export class PracticeScheduler {
  // Get the next problem for a user based on their performance
  async getNextProblem(userId: string) {
    // Check if user has reached daily limit
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const attemptedToday = await prisma.problemProgression.count({
      where: {
        userId,
        lastAttempt: {
          gte: today
        }
      }
    })

    if (attemptedToday >= DAILY_PROBLEM_LIMIT) {
      return { type: 'DAILY_LIMIT_REACHED' as const }
    }

    // Get user's average performance metrics
    const userMetrics = await this.getUserMetrics(userId)
    
    // Select appropriate difficulty level
    const targetDifficulty = this.selectDifficulty(userMetrics)
    
    // First try to get a preseeded problem
    const problem = await prisma.problem.findFirst({
      where: {
        difficulty: targetDifficulty,
        source: 'SEEDED',
        dailyUseCount: { lt: 3 }, // Limit daily uses per problem
        NOT: {
          progressions: {
            some: {
              userId,
              lastAttempt: { gte: today }
            }
          }
        }
      },
      orderBy: {
        lastUsed: 'asc' // Prefer less recently used problems
      }
    })

    if (problem) {
      // Update usage metrics
      await prisma.problem.update({
        where: { id: problem.id },
        data: {
          lastUsed: new Date(),
          dailyUseCount: { increment: 1 },
          totalUses: { increment: 1 }
        }
      })
      
      return { type: 'PROBLEM_FOUND' as const, problem }
    }

    // If no preseeded problem found, check if we need to generate more
    const preseededCount = await prisma.problem.count({
      where: {
        difficulty: targetDifficulty,
        source: 'SEEDED'
      }
    })

    if (preseededCount < MIN_PRESEEDED_PER_DIFFICULTY) {
      return { type: 'NEED_PRESEEDING' as const, difficulty: targetDifficulty }
    }

    // As a fallback, get any available problem
    const fallbackProblem = await prisma.problem.findFirst({
      where: {
        difficulty: targetDifficulty,
        NOT: {
          progressions: {
            some: {
              userId,
              lastAttempt: { gte: today }
            }
          }
        }
      },
      orderBy: {
        lastUsed: 'asc'
      }
    })

    if (fallbackProblem) {
      await prisma.problem.update({
        where: { id: fallbackProblem.id },
        data: {
          lastUsed: new Date(),
          dailyUseCount: { increment: 1 },
          totalUses: { increment: 1 }
        }
      })
      
      return { type: 'PROBLEM_FOUND' as const, problem: fallbackProblem }
    }

    return { type: 'NO_PROBLEMS_AVAILABLE' as const }
  }

  // Update problem and user metrics after an attempt
  async updateProgression(
    userId: string,
    problemId: string,
    isCorrect: boolean,
    timeSpent: number
  ) {
    const progression = await prisma.problemProgression.findUnique({
      where: {
        userId_problemId: { userId, problemId }
      },
      include: {
        problem: true
      }
    })

    const xpGained = this.calculateXP(progression?.problem.difficulty || 'EASY', isCorrect, timeSpent)

    if (!progression) {
      // Create new progression
      return {
        progression: await prisma.problemProgression.create({
          data: {
            userId,
            problemId,
            attempts: 1,
            solved: isCorrect,
            lastAttempt: new Date(),
            timeSpent,
            consecutiveCorrect: isCorrect ? 1 : 0,
            rewardSignal: this.calculateReward(isCorrect, timeSpent),
            stateVector: JSON.stringify({
              attempts: 1,
              timeSpent,
              isCorrect
            })
          }
        }),
        xpGained
      }
    }

    // Update existing progression
    const newConsecutiveCorrect = isCorrect 
      ? progression.consecutiveCorrect + 1 
      : 0

    const reward = this.calculateReward(isCorrect, timeSpent)
    
    // Update problem metrics
    await prisma.problem.update({
      where: { id: problemId },
      data: {
        successRate: {
          set: (progression.problem.successRate * progression.problem.totalUses + (isCorrect ? 1 : 0)) / (progression.problem.totalUses + 1)
        },
        averageTime: {
          set: (progression.problem.averageTime * progression.problem.totalUses + timeSpent) / (progression.problem.totalUses + 1)
        },
        adaptiveDifficulty: {
          set: this.updateAdaptiveDifficulty(
            progression.problem.adaptiveDifficulty,
            isCorrect,
            timeSpent
          )
        }
      }
    })

    return {
      progression: await prisma.problemProgression.update({
        where: {
          userId_problemId: { userId, problemId }
        },
        data: {
          attempts: { increment: 1 },
          solved: isCorrect || progression.solved,
          lastAttempt: new Date(),
          timeSpent: { increment: timeSpent },
          consecutiveCorrect: newConsecutiveCorrect,
          rewardSignal: reward,
          stateVector: JSON.stringify({
            attempts: progression.attempts + 1,
            timeSpent: progression.timeSpent + timeSpent,
            consecutiveCorrect: newConsecutiveCorrect,
            isCorrect
          })
        }
      }),
      xpGained
    }
  }

  private calculateXP(difficulty: string, isCorrect: boolean, timeSpent: number): number {
    const baseXP = {
      'EASY': 10,
      'MEDIUM': 20,
      'HARD': 30
    }[difficulty] || 10

    // Bonus XP for fast solutions (under 5 minutes)
    const timeBonus = timeSpent < 300 ? Math.floor((300 - timeSpent) / 60) * 2 : 0
    
    return isCorrect ? baseXP + timeBonus : Math.floor(baseXP * 0.1)
  }

  private async getUserMetrics(userId: string) {
    const progressions = await prisma.problemProgression.findMany({
      where: { userId },
      include: { problem: true },
      orderBy: { lastAttempt: 'desc' },
      take: 10 // Look at last 10 attempts
    })

    if (progressions.length === 0) {
      return {
        successRate: 0.5,
        averageTime: 300,
        adaptiveDifficulty: 1.0
      }
    }

    return {
      successRate: progressions.filter(p => p.solved).length / progressions.length,
      averageTime: progressions.reduce((acc, p) => acc + p.timeSpent, 0) / progressions.length,
      adaptiveDifficulty: progressions.reduce((acc, p) => acc + p.problem.adaptiveDifficulty, 0) / progressions.length
    }
  }

  private selectDifficulty(metrics: ProblemMetrics) {
    // Adjust difficulty based on success rate and speed
    const performanceScore = metrics.successRate * (1 - metrics.averageTime / 600)
    
    if (performanceScore > 0.7) return 'HARD'
    if (performanceScore > 0.4) return 'MEDIUM'
    return 'EASY'
  }

  private calculateReward(isCorrect: boolean, timeSpent: number) {
    // Base reward for solving the problem
    let reward = isCorrect ? 1.0 : -0.2
    
    // Time bonus/penalty (normalized to expected time of 300 seconds)
    const timeScore = Math.max(0, 1 - timeSpent / 300)
    reward += isCorrect ? timeScore * 0.5 : 0
    
    return reward
  }

  private updateAdaptiveDifficulty(
    currentDifficulty: number,
    isCorrect: boolean,
    timeSpent: number
  ) {
    const timeScore = Math.max(0, 1 - timeSpent / 300)
    const performanceScore = isCorrect ? (1 + timeScore) / 2 : 0
    
    // Adjust difficulty based on performance
    const adjustment = (performanceScore - 0.6) * 0.1
    return Math.max(0.5, Math.min(2.0, currentDifficulty + adjustment))
  }
}

export const practiceScheduler = new PracticeScheduler()
