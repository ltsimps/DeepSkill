import { prisma } from '../utils/db.server';
import OpenAI from 'openai';
import crypto from 'crypto';

interface LLMRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class LLMService {
  private openai: OpenAI;
  private defaultModel = 'gpt-4';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Get a response from the LLM, using cache if available
   */
  async getResponse(request: LLMRequest) {
    const {
      prompt,
      model = this.defaultModel,
      temperature = 0.7,
      maxTokens = 1000
    } = request;

    // Generate cache key from request parameters
    const cacheKey = this.generateCacheKey(prompt, model, temperature, maxTokens);

    // Check cache first
    const cached = await prisma.lLMCache.findFirst({
      where: { prompt: cacheKey }
    });

    if (cached) {
      // Update usage stats
      await prisma.lLMCache.update({
        where: { id: cached.id },
        data: {
          usage: { increment: 1 },
          lastUsed: new Date()
        }
      });

      return cached.response;
    }

    // If not in cache, call OpenAI
    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature,
      max_tokens: maxTokens
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from OpenAI');

    // Cache the response
    await prisma.lLMCache.create({
      data: {
        prompt: cacheKey,
        response: { content: response },
        model,
        version: model, // We could get more specific version info from OpenAI
        usage: 1,
      }
    });

    return { content: response };
  }

  /**
   * Generate a problem using the LLM
   */
  async generateProblem(domain: string, topic: string, difficulty: string) {
    const prompt = `Create a ${difficulty} difficulty practice problem for ${topic} in the ${domain} domain.
    Include:
    1. Title
    2. Description
    3. Solution approach
    4. Test cases
    5. Hints
    Format as JSON.`;

    const response = await this.getResponse({
      prompt,
      temperature: 0.8 // Slightly higher for more creativity
    });

    // Parse and validate the response
    const problem = JSON.parse(response.content);
    
    // Store in database with embedding
    const embedding = await this.generateEmbedding(problem.description);
    
    return await prisma.problem.create({
      data: {
        title: problem.title,
        description: problem.description,
        difficulty,
        type: domain === 'Programming' ? 'CODE' : 'MCQ',
        content: problem,
        solution: { approach: problem.solution },
        hints: problem.hints,
        testCases: problem.testCases,
        domain: { connect: { name: domain } },
        topic: { connect: { name: topic } },
        embedding,
        llmVersion: this.defaultModel,
        llmConfidence: 0.8 // We could get this from the LLM
      }
    });
  }

  /**
   * Analyze a solution using the LLM
   */
  async analyzeSolution(problemId: string, solution: string) {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId }
    });
    
    if (!problem) throw new Error('Problem not found');

    const prompt = `Analyze this solution for the following problem:
    
Title: ${problem.title}
Description: ${problem.description}
Difficulty: ${problem.difficulty}

Solution:
${solution}

Provide feedback on:
1. Correctness
2. Efficiency
3. Style
4. Improvements`;

    const response = await this.getResponse({ prompt });
    return response.content;
  }

  /**
   * Generate a hint for a problem based on the hint level
   */
  async generateHint(problem: any, hintLevel: number = 1) {
    const prompt = `
      For this ${problem.domain} problem: "${problem.title}"
      
      Problem description:
      ${problem.content.description}
      
      Generate a hint at level ${hintLevel} (1=subtle, 2=moderate, 3=detailed).
      
      Guidelines for hint levels:
      - Level 1: Provide a general direction or concept to consider, without giving away the approach
      - Level 2: Offer a more specific suggestion about the approach or technique to use
      - Level 3: Give a detailed walkthrough of the first steps, but still let the student implement it
      
      Make the hint encouraging and educational. Don't just give away the answer.
    `;

    const response = await this.getResponse({
      prompt,
      temperature: 0.7,
      maxTokens: 200
    });

    return response.content;
  }

  /**
   * Generate a detailed explanation of the solution
   */
  async explainSolution(problem: any) {
    const prompt = `
      For this ${problem.domain} problem: "${problem.title}"
      
      Problem description:
      ${problem.content.description}
      
      Solution:
      ${problem.solution.code}
      
      Provide a detailed explanation of the solution that:
      1. Explains the overall approach and why it was chosen
      2. Breaks down the key steps and concepts used
      3. Discusses the time and space complexity
      4. Points out any important patterns or techniques that can be applied to similar problems
      5. Suggests variations or improvements to consider
      
      Make the explanation educational and help the student understand the underlying concepts.
    `;

    const response = await this.getResponse({
      prompt,
      temperature: 0.7,
      maxTokens: 500
    });

    return response.content;
  }

  /**
   * Evaluate code submission and provide feedback
   */
  async evaluateCode({ code, language, testCases, expectedOutput }: {
    code: string;
    language: string;
    testCases: any[];
    expectedOutput: any;
  }) {
    const prompt = `
      As a programming tutor, evaluate this ${language} code submission:
      
      Code:
      ${code}
      
      Test Cases:
      ${JSON.stringify(testCases, null, 2)}
      
      Expected Output:
      ${JSON.stringify(expectedOutput, null, 2)}
      
      Provide:
      1. Whether the solution is correct
      2. Detailed feedback on:
         - Correctness
         - Code quality
         - Performance
         - Style
      3. Specific suggestions for improvement
      4. If incorrect, identify where the code fails
      
      Format response as JSON with fields:
      - success: boolean
      - feedback: string
      - suggestions: string[]
      - metrics: { timeComplexity, spaceComplexity, testsPassed, totalTests }
    `;

    const response = await this.getResponse({
      prompt,
      temperature: 0.3, // Lower temperature for more consistent evaluation
      maxTokens: 500
    });

    return JSON.parse(response.content);
  }

  /**
   * Generate voice instructions for the current learning context
   */
  async generateVoiceInstructions(context: {
    domain: string;
    topic: string;
    userLevel: string;
    recentPerformance: number[];
    conceptMastery: Record<string, number>;
  }) {
    const prompt = `
      As an AI tutor, generate natural voice instructions for a student learning ${context.domain}, specifically ${context.topic}.
      
      Student Context:
      - Current level: ${context.userLevel}
      - Recent performance: ${context.recentPerformance.join(', ')}
      - Concept mastery: ${JSON.stringify(context.conceptMastery, null, 2)}
      
      Create instructions that:
      1. Are conversational and encouraging
      2. Adapt to their current understanding
      3. Address any patterns in their recent performance
      4. Focus on concepts they need to strengthen
      5. Maintain a natural, tutorial-like tone
      
      The response should be in a natural speaking voice, including appropriate pauses and emphasis.
    `;

    const response = await this.getResponse({
      prompt,
      temperature: 0.8, // Higher temperature for more natural conversation
      maxTokens: 300
    });

    return response.content;
  }

  /**
   * Generate embedding for similarity search
   */
  private async generateEmbedding(text: string) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });

    return response.data[0].embedding;
  }

  /**
   * Generate a cache key for an LLM request
   */
  private generateCacheKey(prompt: string, model: string, temperature: number, maxTokens: number): string {
    const data = JSON.stringify({ prompt, model, temperature, maxTokens });
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export const llmService = new LLMService();
