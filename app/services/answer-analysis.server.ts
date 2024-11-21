import { prisma } from '~/utils/db.server';
import { analyzeAnswer } from '~/utils/openai.server';
import { LRUCache } from 'lru-cache';

interface AnalysisResult {
  isCorrect: boolean;
  feedback: string;
  suggestions: string[];
  performance?: {
    timeComplexity: string;
    spaceComplexity: string;
    suggestions: string[];
  };
  codeQuality?: {
    readability: number;
    maintainability: number;
    suggestions: string[];
  };
}

interface AnalysisJob {
  id: string;
  sessionId: string;
  problemId: string;
  userId: string;
  userAnswer: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  result?: AnalysisResult;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  priority: number;
}

export class AnswerAnalysisQueue {
  private analysisJobs: Map<string, AnalysisJob> = new Map();
  private analysisCache: LRUCache<string, AnalysisResult>;
  private isProcessing: boolean = false;

  constructor() {
    this.analysisCache = new LRUCache({
      max: 500, // Store up to 500 analysis results
      ttl: 1000 * 60 * 60 * 24, // Cache for 24 hours
    });
  }

  private getCacheKey(problemId: string, answer: string): string {
    return `${problemId}:${answer}`;
  }

  async queueAnalysis(
    sessionId: string,
    problemId: string,
    userId: string,
    userAnswer: string,
    priority: number = 1
  ) {
    // Check cache first
    const cacheKey = this.getCacheKey(problemId, userAnswer);
    const cachedResult = this.analysisCache.get(cacheKey);
    if (cachedResult) {
      const jobId = `${sessionId}-${Date.now()}`;
      const job: AnalysisJob = {
        id: jobId,
        sessionId,
        problemId,
        userId,
        userAnswer,
        status: 'COMPLETED',
        result: cachedResult,
        createdAt: new Date(),
        completedAt: new Date(),
        priority
      };
      this.analysisJobs.set(jobId, job);
      return jobId;
    }

    const jobId = `${sessionId}-${Date.now()}`;
    const job: AnalysisJob = {
      id: jobId,
      sessionId,
      problemId,
      userId,
      userAnswer,
      status: 'PENDING',
      createdAt: new Date(),
      priority
    };

    this.analysisJobs.set(jobId, job);
    this.processNextJob().catch(console.error);
    return jobId;
  }

  private async processNextJob() {
    if (this.isProcessing) return;

    try {
      this.isProcessing = true;

      // Get highest priority pending job
      const pendingJobs = Array.from(this.analysisJobs.values())
        .filter(job => job.status === 'PENDING')
        .sort((a, b) => b.priority - a.priority);

      const job = pendingJobs[0];
      if (!job) return;

      job.status = 'IN_PROGRESS';
      this.analysisJobs.set(job.id, job);

      // Get problem details
      const problem = await prisma.problem.findUnique({
        where: { id: job.problemId }
      });

      if (!problem) {
        throw new Error('Problem not found');
      }

      // Analyze the answer
      const analysis = await analyzeAnswer(
        problem.solution,
        job.userAnswer,
        problem.testCases
      );

      // Cache the result
      const cacheKey = this.getCacheKey(job.problemId, job.userAnswer);
      this.analysisCache.set(cacheKey, analysis);

      // Store the result
      await prisma.problemProgression.upsert({
        where: {
          userId_problemId: {
            userId: job.userId,
            problemId: job.problemId
          }
        },
        create: {
          userId: job.userId,
          problemId: job.problemId,
          solved: analysis.isCorrect,
          lastSolution: job.userAnswer,
          lastFeedback: analysis.feedback,
          attempts: 1,
          consecutiveCorrect: analysis.isCorrect ? 1 : 0
        },
        update: {
          solved: analysis.isCorrect,
          lastSolution: job.userAnswer,
          lastFeedback: analysis.feedback,
          attempts: { increment: 1 },
          consecutiveCorrect: analysis.isCorrect ? { increment: 1 } : 0,
          lastAttempt: new Date()
        }
      });

      // Update session status
      await prisma.practiceSession.update({
        where: { id: job.sessionId },
        data: {
          status: 'COMPLETED'
        }
      });

      job.status = 'COMPLETED';
      job.result = analysis;
      job.completedAt = new Date();
      this.analysisJobs.set(job.id, job);

      // Process next job if any
      setImmediate(() => this.processNextJob());
    } catch (error) {
      console.error('Failed to process analysis job:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  getJobStatus(jobId: string): AnalysisJob | null {
    return this.analysisJobs.get(jobId) || null;
  }

  // Clean up old jobs
  cleanupOldJobs() {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const [jobId, job] of this.analysisJobs.entries()) {
      if (
        job.status === 'COMPLETED' ||
        job.status === 'FAILED' ||
        now - job.createdAt.getTime() > ONE_DAY
      ) {
        this.analysisJobs.delete(jobId);
      }
    }
  }
}

// Singleton instance
export const answerAnalysisQueue = new AnswerAnalysisQueue();

// Clean up old jobs periodically
setInterval(() => answerAnalysisQueue.cleanupOldJobs(), 60 * 60 * 1000); // Every hour
