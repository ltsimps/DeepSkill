import OpenAI from 'openai'
import { z } from 'zod'
import { GeneratedProblem } from '../routes/practice'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const CodePromptSchema = z.object({
  prompt: z.string(),
  language: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
})

export type CodePrompt = z.infer<typeof CodePromptSchema>

export async function generateProblem(prompt: CodePrompt): Promise<GeneratedProblem> {
  console.log('Generating problem with prompt:', prompt)
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a coding instructor creating practice problems. Generate a coding problem based on the following prompt. 
          Your response must be a valid JSON object with this exact structure:
          {
            "title": "problem title",
            "difficulty": "${prompt.difficulty}",
            "language": "${prompt.language}",
            "problem": "detailed problem description",
            "startingCode": "initial code template with missing parts",
            "solution": "complete solution",
            "hints": ["array of hints"],
            "testCases": ["array of test cases"]
          }
          
          Make sure your response is a properly formatted JSON object that can be parsed. Do not include any additional text or formatting.`
        },
        {
          role: "user",
          content: `Create a ${prompt.difficulty} level problem in ${prompt.language} for: ${prompt.prompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0].message.content
    if (!response) throw new Error('No response from OpenAI')
    
    console.log('OpenAI response:', response)
    try {
      const parsedResponse: GeneratedProblem = JSON.parse(response)
      
      // Validate the response has the required fields
      if (!parsedResponse.title || !parsedResponse.difficulty || !parsedResponse.language || !parsedResponse.problem || !parsedResponse.startingCode || !parsedResponse.solution) {
        throw new Error('Invalid response format from OpenAI')
      }
      
      return parsedResponse
    } catch (error) {
      console.error('Error parsing OpenAI response:', error)
      throw new Error('Failed to parse OpenAI response')
    }
  } catch (error) {
    console.error('Error generating problem:', error)
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
