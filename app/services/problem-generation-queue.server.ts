import { generateProblem } from '~/utils/openai.server'
import { prisma } from '~/utils/db.server'
import { GeneratedProblem } from '~/routes/practice'

export interface JobStatus {
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  problemIds?: string[]
  error?: string
}

export class ProblemGenerationQueue {
  private jobs: Map<string, JobStatus>

  constructor() {
    this.jobs = new Map()
  }

  async queueProblemGeneration(language: string, topic?: string): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`
    this.jobs.set(jobId, { status: 'PENDING' })

    // Start the generation process in the background
    this.generateProblems(jobId, language, topic).catch(error => {
      console.error('Error generating problems:', error)
      this.jobs.set(jobId, { status: 'FAILED', error: error.message })
    })

    return jobId
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    return this.jobs.get(jobId) || { status: 'FAILED', error: 'Job not found' }
  }

  private async generateProblems(jobId: string, language: string, topic?: string): Promise<void> {
    try {
      this.jobs.set(jobId, { status: 'IN_PROGRESS' })

      // Generate problems in parallel
      const problemPromises = Array(3).fill(null).map(async () => {
        const problem = await generateProblem(language, 'beginner')
        
        // Store the problem in the database
        const savedProblem = await prisma.problem.create({
          data: {
            title: problem.title,
            description: problem.description,
            difficulty: problem.difficulty,
            language: problem.language,
            problem: problem.problem,
            startingCode: problem.startingCode,
            solution: problem.solution,
            hints: problem.hints,
            testCases: problem.testCases,
            source: 'GENERATED',
            tags: topic ? JSON.stringify([topic]) : JSON.stringify([])
          }
        })

        return savedProblem.id
      })

      const problemIds = await Promise.all(problemPromises)
      this.jobs.set(jobId, { status: 'COMPLETED', problemIds })

    } catch (error) {
      console.error('Error in problem generation:', error)
      this.jobs.set(jobId, { status: 'FAILED', error: error.message })
      throw error
    }
  }
}
