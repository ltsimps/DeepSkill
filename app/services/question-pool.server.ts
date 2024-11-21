import { prisma } from '~/utils/db.server';
import { generateProblem } from '~/utils/openai.server';
import type { ProgrammingLanguage } from '~/types/practice';

interface Problem {
  title: string;
  description: string;
  startingCode: string;
  solution: string;
  testCases: string[];
  hints: string[];
}

const MIN_POOL_SIZE = 50;
const BATCH_SIZE = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface GenerationJob {
  id: string;
  language: ProgrammingLanguage;
  difficulty: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number;
  totalProblems: number;
  retries: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export class QuestionPoolManager {
  private generationJobs: Map<string, GenerationJob> = new Map();
  private isGenerating: boolean = false;

  async checkAndReplenishPool(language: ProgrammingLanguage, difficulty: string) {
    // Count available questions in the pool
    const count = await prisma.problem.count({
      where: {
        language,
        difficulty,
        source: 'GENERATED',
        userId: null // Only count general pool questions
      }
    });

    if (count < MIN_POOL_SIZE && !this.isGenerating) {
      // Start a background job to generate more questions
      const jobId = `${language}-${Date.now()}`;
      const job: GenerationJob = {
        id: jobId,
        language,
        difficulty,
        status: 'PENDING',
        progress: 0,
        totalProblems: MIN_POOL_SIZE - count,
        retries: 0,
        createdAt: new Date()
      };

      this.generationJobs.set(jobId, job);
      this.generateQuestionBatch(jobId).catch(console.error);
    }

    return count;
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = MAX_RETRIES,
    delayMs: number = RETRY_DELAY
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await this.delay(delayMs);
        return this.retryOperation(operation, retries - 1, delayMs * 2);
      }
      throw error;
    }
  }

  private async generateQuestionBatch(jobId: string) {
    const job = this.generationJobs.get(jobId);
    if (!job || job.status !== 'PENDING') return;

    try {
      this.isGenerating = true;
      job.status = 'IN_PROGRESS';
      this.generationJobs.set(jobId, job);

      // Generate questions in smaller batches for better reliability
      const batchSize = Math.min(BATCH_SIZE, job.totalProblems);
      const problems: Problem[] = [];

      for (let i = 0; i < batchSize; i++) {
        try {
          const problem = await this.retryOperation(async () => {
            const result = await generateProblem({
              language: job.language,
              difficulty: job.difficulty
            });
            return result as Problem;
          });

          problems.push(problem);
          job.progress = i + 1;
          this.generationJobs.set(jobId, job);
        } catch (error) {
          console.error(`Failed to generate problem ${i + 1}:`, error);
          // Continue with next problem
          continue;
        }
      }

      // Store successfully generated problems
      if (problems.length > 0) {
        await prisma.$transaction(
          problems.map(problem =>
            prisma.problem.create({
              data: {
                title: problem.title,
                description: problem.description,
                difficulty: job.difficulty,
                language: job.language,
                startingCode: problem.startingCode,
                solution: problem.solution,
                testCases: problem.testCases,
                hints: problem.hints || [],
                source: 'GENERATED',
                type: 'CODING',
                metadata: {
                  generatedAt: new Date().toISOString(),
                  batchId: jobId
                }
              }
            })
          )
        );
      }

      // Check if we need to generate more problems
      const remainingProblems = job.totalProblems - problems.length;
      if (remainingProblems > 0) {
        // Create a new job for remaining problems
        const newJobId = `${job.language}-${Date.now()}`;
        const newJob: GenerationJob = {
          id: newJobId,
          language: job.language,
          difficulty: job.difficulty,
          status: 'PENDING',
          progress: 0,
          totalProblems: remainingProblems,
          retries: 0,
          createdAt: new Date()
        };

        this.generationJobs.set(newJobId, newJob);
        this.generateQuestionBatch(newJobId).catch(console.error);
      }

      job.status = 'COMPLETED';
      job.completedAt = new Date();
      this.generationJobs.set(jobId, job);
    } catch (error) {
      job.status = 'FAILED';
      job.error = error.message;
      this.generationJobs.set(jobId, job);
      console.error('Failed to generate questions:', error);
    } finally {
      this.isGenerating = false;
    }
  }

  getJobStatus(jobId: string): GenerationJob | null {
    return this.generationJobs.get(jobId) || null;
  }

  // Clean up old jobs
  cleanupOldJobs() {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();

    for (const [jobId, job] of this.generationJobs.entries()) {
      if (
        job.status === 'COMPLETED' ||
        job.status === 'FAILED' ||
        now - job.createdAt.getTime() > ONE_DAY
      ) {
        this.generationJobs.delete(jobId);
      }
    }
  }
}

// Singleton instance
export const questionPoolManager = new QuestionPoolManager();

// Clean up old jobs periodically
setInterval(() => questionPoolManager.cleanupOldJobs(), 60 * 60 * 1000); // Every hour
