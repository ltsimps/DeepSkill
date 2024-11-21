import { prisma } from '~/utils/db.server';
import { questionPoolManager } from './question-pool.server';
import type { ProgrammingLanguage } from '~/types/practice';

const LANGUAGES: ProgrammingLanguage[] = ['javascript', 'python', 'java'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export class PoolMonitor {
  private isRunning: boolean = false;

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log('Starting question pool monitor...');
    this.monitor();
    setInterval(() => this.monitor(), CHECK_INTERVAL);
  }

  private async monitor() {
    try {
      // Check pool size for each language and difficulty
      for (const language of LANGUAGES) {
        for (const difficulty of DIFFICULTIES) {
          await this.checkPoolHealth(language, difficulty);
        }
      }

      // Clean up old or invalid questions
      await this.cleanupQuestions();

      // Update question statistics
      await this.updateQuestionStats();
    } catch (error) {
      console.error('Error in pool monitor:', error);
    }
  }

  private async checkPoolHealth(language: ProgrammingLanguage, difficulty: string) {
    try {
      await questionPoolManager.checkAndReplenishPool(language, difficulty);
    } catch (error) {
      console.error(`Failed to check pool health for ${language}/${difficulty}:`, error);
    }
  }

  private async cleanupQuestions() {
    const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;
    const now = new Date();

    // Remove old questions that haven't been used
    await prisma.problem.deleteMany({
      where: {
        createdAt: {
          lt: new Date(now.getTime() - ONE_MONTH)
        },
        practiceSession: {
          none: {} // No associated practice sessions
        }
      }
    });

    // Archive questions with low success rate
    await prisma.problem.updateMany({
      where: {
        practiceSession: {
          some: {
            isCorrect: false
          }
        },
        AND: {
          practiceSession: {
            group: {
              problemId: true,
              _avg: {
                isCorrect: true
              },
              having: {
                _avg: {
                  isCorrect: {
                    lt: 0.2 // Less than 20% success rate
                  }
                }
              }
            }
          }
        }
      },
      data: {
        status: 'ARCHIVED'
      }
    });
  }

  private async updateQuestionStats() {
    // Get all active problems
    const problems = await prisma.problem.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        practiceSession: {
          select: {
            isCorrect: true,
            timeSpent: true
          }
        }
      }
    });

    // Update statistics for each problem
    for (const problem of problems) {
      const sessions = problem.practiceSession;
      if (sessions.length === 0) continue;

      const successRate = sessions.filter(s => s.isCorrect).length / sessions.length;
      const avgTimeSpent = sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / sessions.length;

      await prisma.problem.update({
        where: { id: problem.id },
        data: {
          metadata: {
            ...problem.metadata,
            statistics: {
              successRate,
              avgTimeSpent,
              totalAttempts: sessions.length,
              lastUpdated: new Date().toISOString()
            }
          }
        }
      });
    }
  }
}

// Create and start the monitor
export const poolMonitor = new PoolMonitor();
poolMonitor.start().catch(console.error);
