import { json } from '@remix-run/node';
import { requireUserId } from '~/session.server';
import { prisma } from '~/utils/db.server';
import { llmService } from '~/services/llm.server';

export async function action({ request }) {
  const userId = await requireUserId(request);
  const { code, problemId } = await request.json();

  try {
    // Get the problem details
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: true,
      },
    });

    if (!problem) {
      return json({ success: false, message: 'Problem not found' }, { status: 404 });
    }

    // Evaluate the code using LLM
    const evaluation = await llmService.evaluateCode({
      code,
      language: problem.content.language,
      testCases: problem.testCases,
      expectedOutput: problem.content.expectedOutput,
    });

    // Update user's progress
    await prisma.problemProgression.create({
      data: {
        userId,
        problemId,
        code,
        status: evaluation.success ? 'COMPLETED' : 'ATTEMPTED',
        feedback: evaluation.feedback,
        metrics: {
          timeSpent: evaluation.metrics.timeSpent,
          memoryUsed: evaluation.metrics.memoryUsed,
          testsPassed: evaluation.metrics.testsPassed,
          totalTests: evaluation.metrics.totalTests,
        },
      },
    });

    // Update problem usage statistics
    await prisma.problem.update({
      where: { id: problemId },
      data: {
        totalUses: { increment: 1 },
        lastUsed: new Date(),
      },
    });

    // If successful, update user's skill level
    if (evaluation.success) {
      await prisma.userDomain.update({
        where: {
          userId_domainId: {
            userId,
            domainId: problem.domainId,
          },
        },
        data: {
          skillLevel: {
            increment: problem.difficulty === 'HARD' ? 2 : 1,
          },
          lastPracticed: new Date(),
        },
      });
    }

    return json({
      success: evaluation.success,
      feedback: evaluation.feedback,
      metrics: evaluation.metrics,
      nextUrl: evaluation.success ? `/practice/${problem.domainId}` : null,
    });
  } catch (error) {
    console.error('Code evaluation error:', error);
    return json(
      { success: false, message: 'Failed to evaluate code' },
      { status: 500 }
    );
  }
}
