import { prisma } from '../utils/db.server';
import { XP_REWARDS } from '../constants/practice';
import { llmService } from './llm.server';

interface AnalysisJob {
  sessionId: string;
  problemId: string;
  userId: string;
  solution: string;
}

export class AnalysisQueue {
  async queueAnalysis(job: AnalysisJob) {
    const { sessionId, problemId, userId, solution } = job;

    // Update problem progression
    const progression = await prisma.problemProgression.upsert({
      where: {
        userId_problemId: {
          userId,
          problemId
        }
      },
      create: {
        userId,
        problemId,
        attempts: 1,
        timeSpent: 0,
        lastSolution: solution,
        lastAttempt: new Date()
      },
      update: {
        attempts: { increment: 1 },
        lastSolution: solution,
        lastAttempt: new Date()
      }
    });

    // Start analysis in background
    this.analyzeSolution(progression.id, solution).catch(console.error);

    return progression;
  }

  private async analyzeSolution(progressionId: string, solution: string) {
    try {
      const progression = await prisma.problemProgression.findUnique({
        where: { id: progressionId },
        include: { problem: true }
      });

      if (!progression) throw new Error('Progression not found');

      // Use LLM service to analyze solution (with caching)
      const feedback = await llmService.analyzeSolution(progression.problemId, solution);

      // Update progression with feedback
      await prisma.problemProgression.update({
        where: { id: progressionId },
        data: {
          lastFeedback: feedback,
          solved: true // We'll assume the solution is correct for now
        }
      });

      // Award XP based on difficulty
      const xpReward = XP_REWARDS[progression.problem.difficulty] || XP_REWARDS.EASY;
      await prisma.user.update({
        where: { id: progression.userId },
        data: {
          xp: { increment: xpReward }
        }
      });

    } catch (error) {
      console.error('Error analyzing solution:', error);
      
      // Update progression with error
      await prisma.problemProgression.update({
        where: { id: progressionId },
        data: {
          lastFeedback: 'Error analyzing solution. Please try again.',
          solved: false
        }
      });
    }
  }
}
