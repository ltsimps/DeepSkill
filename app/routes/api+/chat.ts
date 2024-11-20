import { StreamingTextResponse, OpenAIStream } from 'ai';
import { json } from '@remix-run/node';
import OpenAI from 'openai';
import { requireUserId } from '../../utils/auth.server';
import { prisma } from '../../utils/db.server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = `You are a friendly and knowledgeable coding practice assistant. Your goal is to help users improve their programming skills through interactive practice sessions.

When responding:
1. Be conversational and encouraging
2. Identify the programming language and topic they want to practice
3. Suggest specific types of problems that would help them practice
4. Keep responses concise but friendly
5. Always mention the programming language explicitly in your response
6. Focus on one main concept at a time
7. Use emojis occasionally to make the conversation more engaging

Example responses:
"That's a great choice! 🚀 For Python list comprehensions, I'll set up some problems that will help you master this powerful feature. We'll start with basic filtering and mapping exercises."

"I'd be happy to help you practice JavaScript promises! 💪 Let's work through some async/await problems to strengthen your understanding of asynchronous programming."`;

export async function action({ request }: { request: Request }) {
  try {
    const userId = await requireUserId(request);
    const { messages } = await request.json();

    // Get user's recent practice history
    const recentPractice = await prisma.problemProgression.findMany({
      where: { userId },
      include: { problem: true },
      orderBy: { lastAttempt: 'desc' },
      take: 5
    });

    // Add context about user's recent practice
    const recentLanguages = [...new Set(recentPractice.map(p => p.problem.language))];
    const contextPrompt = recentLanguages.length > 0 
      ? `The user has recently practiced ${recentLanguages.join(', ')}. Consider this when making recommendations.`
      : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt + '\n' + contextPrompt },
        ...messages
      ]
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Chat API Error:', error);
    return json({ error: 'Failed to process chat request' }, { status: 500 });
  }
}
