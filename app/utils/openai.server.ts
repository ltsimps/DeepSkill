import OpenAI from 'openai'
import { z } from 'zod'
import { GeneratedProblem } from '../routes/practice'
import crypto from 'crypto'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const CodePromptSchema = z.object({
  language: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})

export type CodePrompt = z.infer<typeof CodePromptSchema>

export async function generateProblem(language: string, difficulty: string): Promise<GeneratedProblem> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a coding instructor creating practice problems. Generate a coding problem.
          Your response must be a valid JSON object with this exact structure:
          {
            "title": "problem title",
            "description": "brief overview of the problem",
            "difficulty": "${difficulty}",
            "language": "${language}",
            "problem": "detailed problem description with requirements",
            "startingCode": "initial code template with missing parts",
            "solution": "complete solution",
            "hints": ["array of hints"],
            "testCases": ["array of test cases"]
          }
          
          Make sure your response is a properly formatted JSON object that can be parsed. The description should be a brief summary while the problem should contain detailed requirements. Do not include any additional text or formatting.`
        },
        {
          role: "user",
          content: `Create a ${difficulty} level problem in ${language}.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0].message.content
    if (!response) throw new Error('No response from OpenAI')

    try {
      const problem = JSON.parse(response)
      // Convert arrays to JSON strings for Prisma
      return {
        ...problem,
        id: crypto.randomUUID(),
        hints: JSON.stringify(problem.hints),
        testCases: JSON.stringify(problem.testCases)
      }
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error)
      throw new Error('Invalid problem format returned from OpenAI')
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw error
  }
}

export async function validateSolution(
  userCode: string,
  correctSolution: string,
  language: string
) {
  console.log('Validating solution:', { language })
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a code reviewer. Compare the user's solution with the correct solution and provide feedback.
          Your response must be a valid JSON object with this exact structure:
          {
            "isCorrect": boolean,
            "feedback": "detailed feedback message",
            "hint": "hint for improvement if incorrect",
            "suggestions": ["array of improvement suggestions"]
          }
          
          Make sure your response is a properly formatted JSON object that can be parsed. Do not include any additional text or formatting.`
        },
        {
          role: "user",
          content: `Language: ${language}\n\nUser Solution:\n${userCode}\n\nCorrect Solution:\n${correctSolution}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0].message.content
    if (!response) throw new Error('No response from OpenAI')
    
    console.log('OpenAI validation response:', response)
    try {
      const parsedResponse = JSON.parse(response)
      
      // Validate the response has the required fields
      if (typeof parsedResponse.isCorrect !== 'boolean' || !parsedResponse.feedback) {
        throw new Error('Invalid response format from OpenAI')
      }
      
      return parsedResponse
    } catch (error) {
      console.error('Error parsing OpenAI response:', error)
      throw new Error('Failed to parse OpenAI response')
    }
  } catch (error) {
    console.error('Error validating solution:', error)
    throw error
  }
}

export async function generateAnalysis(
  userCode: string,
  tests: string,
  isCorrect: boolean
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a coding instructor providing feedback on student solutions. Analyze the code and provide constructive feedback.
          Focus on:
          1. Code quality and style
          2. Potential improvements
          3. Best practices
          4. Performance considerations
          
          Keep your response concise but informative. If the solution is incorrect, explain why and provide guidance for improvement.`
        },
        {
          role: "user",
          content: `
Solution Status: ${isCorrect ? 'Correct' : 'Incorrect'}

User's Code:
${userCode}

Test Cases:
${tests}
`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('No response from OpenAI');
    
    return response;
  } catch (error) {
    console.error('Error generating analysis:', error);
    return 'Unable to generate analysis at this time. Please try again later.';
  }
}

export async function analyzeAnswer(userAnswer: string, correctAnswer: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a coding instructor analyzing student solutions. Compare the student's answer to the correct solution and provide constructive feedback. Focus on:
          1. Whether the solution is correct
          2. Code quality and best practices
          3. Performance considerations
          4. Specific suggestions for improvement
          Keep your response concise but informative.`
        },
        {
          role: "user",
          content: `Student's answer:\n${userAnswer}\n\nCorrect solution:\n${correctAnswer}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return completion.choices[0].message.content || 'Unable to analyze answer'
  } catch (error) {
    console.error('Error analyzing answer:', error)
    throw new Error('Failed to analyze answer')
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

export async function generateProblemEmbedding(problem: GeneratedProblem): Promise<number[]> {
  // Combine relevant problem fields for embedding
  const textForEmbedding = `
    ${problem.title}
    ${problem.description}
    ${problem.problem}
    ${problem.difficulty}
    ${problem.language}
  `.trim()

  return generateEmbedding(textForEmbedding)
}
