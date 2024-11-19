import { prisma } from "../utils/db.server"

// Constants for rating calculation
const K_FACTOR = 32
const VOLATILITY_WEIGHT = 0.5
const DIFFICULTY_WEIGHT = 0.2
const TIME_WEIGHT = 0.1

interface RatingChange {
  oldRating: number
  newRating: number
  ratingChange: number
  volatilityChange: number
}

export class RatingSystem {
  /**
   * Calculate expected score based on ratings
   */
  private static getExpectedScore(playerRating: number, problemRating: number): number {
    return 1 / (1 + Math.pow(10, (problemRating - playerRating) / 400))
  }

  /**
   * Calculate performance rating based on solution quality and time
   */
  private static calculatePerformance(
    isCorrect: boolean,
    timeSpent: number,
    averageTime: number,
    difficulty: number
  ): number {
    const timeFactor = Math.max(0, 1 - (timeSpent - averageTime) / averageTime * TIME_WEIGHT)
    const basePerformance = isCorrect ? 1 : 0
    return basePerformance * (1 + difficulty * DIFFICULTY_WEIGHT) * (1 + timeFactor)
  }

  /**
   * Update user's rating based on problem performance
   */
  static async updateRating(
    userId: string,
    problemId: string,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<RatingChange> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { performanceStats: true }
    })

    const problem = await prisma.problem.findUnique({
      where: { id: problemId }
    })

    if (!user || !problem) throw new Error("User or problem not found")

    const expectedScore = this.getExpectedScore(user.rating, problem.baseComplexity * 400)
    const performance = this.calculatePerformance(
      isCorrect,
      timeSpent,
      problem.averageTime,
      problem.adaptiveDifficulty
    )

    // Calculate rating change
    const ratingChange = Math.round(
      K_FACTOR * (performance - expectedScore) * (1 + user.volatility * VOLATILITY_WEIGHT)
    )

    // Update volatility based on performance variance
    const volatilityChange = Math.abs(performance - expectedScore) * VOLATILITY_WEIGHT
    const newVolatility = Math.max(50, Math.min(200, user.volatility + volatilityChange))

    // Update ratings
    const newRating = Math.max(100, user.rating + ratingChange)
    const maxRating = Math.max(user.maxRating, newRating)

    // Store rating history
    await prisma.ratingHistory.create({
      data: {
        userId,
        problemId,
        rating: newRating,
        volatility: newVolatility
      }
    })

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        rating: newRating,
        maxRating,
        volatility: newVolatility
      }
    })

    return {
      oldRating: user.rating,
      newRating,
      ratingChange,
      volatilityChange
    }
  }

  /**
   * Get user's current rank title based on rating
   */
  static getRankTitle(rating: number): string {
    if (rating >= 2400) return "Grandmaster"
    if (rating >= 2200) return "Master"
    if (rating >= 2000) return "Expert"
    if (rating >= 1800) return "Advanced"
    if (rating >= 1600) return "Intermediate"
    if (rating >= 1400) return "Apprentice"
    return "Novice"
  }

  /**
   * Get color code for rating display
   */
  static getRatingColor(rating: number): string {
    if (rating >= 2400) return "#FF0000"  // Red for Grandmaster
    if (rating >= 2200) return "#FFA500"  // Orange for Master
    if (rating >= 2000) return "#FFD700"  // Gold for Expert
    if (rating >= 1800) return "#4169E1"  // Royal Blue for Advanced
    if (rating >= 1600) return "#32CD32"  // Lime Green for Intermediate
    if (rating >= 1400) return "#808080"  // Gray for Apprentice
    return "#A0522D"                      // Brown for Novice
  }
}

interface LearningState {
  problemHistory: number[]      // Success rate history
  timeHistory: number[]         // Completion time history
  retentionScores: number[]     // Retention test scores
  difficultyLevels: number[]    // Problem difficulty levels
}

export class LearningOptimizer {
  private static readonly LEARNING_RATE = 0.1
  private static readonly GAMMA = 0.95  // Discount factor for future rewards

  /**
   * Update learning parameters based on performance
   */
  static async updateLearningMetrics(
    userId: string,
    problemId: string,
    isCorrect: boolean,
    timeSpent: number,
    retentionScore?: number
  ) {
    const stats = await prisma.performanceStats.findUnique({
      where: { userId }
    })

    if (!stats) throw new Error("Performance stats not found")

    // Get problem progression
    const progression = await prisma.problemProgression.findUnique({
      where: { userId_problemId: { userId, problemId } }
    })

    if (!progression) throw new Error("Problem progression not found")

    // Create state vector for RL
    const state = {
      successRate: stats.correctSolutions / stats.totalProblems,
      averageTime: stats.averageTime,
      retentionRate: stats.retentionRate,
      difficultyLevel: stats.difficultyLevel,
      problemDifficulty: progression.easeFactor,
      consecutiveCorrect: progression.consecutiveCorrect
    }

    // Calculate reward based on multiple factors
    const timeReward = Math.max(0, 1 - (timeSpent - stats.averageTime) / stats.averageTime)
    const correctnessReward = isCorrect ? 1 : -0.5
    const retentionReward = retentionScore ? retentionScore - stats.retentionRate : 0

    const totalReward = (correctnessReward + timeReward + retentionReward) / 3

    // Update state-action value (Q-value)
    const newActionValue = progression.actionValue + 
      this.LEARNING_RATE * (totalReward + this.GAMMA * Math.max(progression.actionValue, totalReward) - progression.actionValue)

    // Update progression with new metrics
    await prisma.problemProgression.update({
      where: { id: progression.id },
      data: {
        stateVector: JSON.stringify(state),
        actionValue: newActionValue,
        rewardSignal: totalReward
      }
    })

    // Update performance stats
    await prisma.performanceStats.update({
      where: { userId },
      data: {
        totalProblems: stats.totalProblems + 1,
        correctSolutions: stats.correctSolutions + (isCorrect ? 1 : 0),
        averageTime: (stats.averageTime * stats.totalProblems + timeSpent) / (stats.totalProblems + 1),
        retentionRate: retentionScore ? 
          (stats.retentionRate + retentionScore) / 2 : 
          stats.retentionRate,
        learningRate: this.LEARNING_RATE * (1 + totalReward),  // Adapt learning rate based on performance
        difficultyLevel: stats.difficultyLevel * (1 + 0.1 * Math.sign(totalReward))  // Adjust difficulty
      }
    })
  }

  /**
   * Suggest next problem difficulty based on learning state
   */
  static async suggestNextDifficulty(userId: string): Promise<number> {
    const stats = await prisma.performanceStats.findUnique({
      where: { userId }
    })

    // For new users or if stats don't exist, start with base difficulty
    if (!stats || stats.totalProblems === 0) {
      return 0.5 // Start with medium difficulty
    }

    // Use current performance to adjust difficulty
    const successWeight = stats.correctSolutions / stats.totalProblems
    const retentionWeight = stats.retentionRate ?? 0.5
    const learningWeight = stats.learningRate ?? 0.1

    // Combine factors to suggest next difficulty
    const suggestedDifficulty = (stats.difficultyLevel ?? 0.5) * (
      1 + 0.1 * (successWeight + retentionWeight + learningWeight - 1.5)
    )

    return Math.max(0.1, Math.min(1.0, suggestedDifficulty))
  }
}
