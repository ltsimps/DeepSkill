import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { useEffect } from 'react';
import { practiceScheduler } from '../services/practice.server';
import { requireUserId } from '../utils/auth.server';
import { prisma } from '../utils/db.server';
import { generateProblem, validateSolution, generateAnalysis } from '../utils/openai.server';
import { PracticeLayout } from '../components/practice/PracticeLayout';
import { PracticeProvider, usePracticeSession } from '../contexts/PracticeContext';
import type { 
  GeneratedProblem, 
  LoaderData, 
  ProblemProgression,
  FetcherData,
  ProblemFeedback 
} from '../types/practice';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const metrics = await prisma.problemProgression.findMany({
    where: { userId },
    include: { problem: true },
    orderBy: { lastAttempt: 'desc' },
    take: 10
  }) as ProblemProgression[];

  const stats = {
    totalAttempts: metrics.reduce((acc, m) => acc + m.attempts, 0),
    problemsSolved: metrics.filter(m => m.solved).length,
    averageTime: metrics.reduce((acc, m) => acc + m.timeSpent, 0) / metrics.length || 0,
    streaks: Math.max(...metrics.map(m => m.consecutiveCorrect), 0)
  };

  return json<LoaderData>({ stats });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const startTime = formData.get('startTime') as string;
  const language = formData.get('language') as string | null;
  const solution = formData.get('solution') as string;
  
  try {
    if (intent === 'start') {
      const result = await practiceScheduler.getNextProblem(userId, language);
      
      if (result.type === 'DAILY_LIMIT_REACHED') {
        return json<FetcherData>({ 
          dailyLimitReached: true,
          message: "You've reached your daily practice limit. Come back tomorrow!" 
        });
      }
      
      if (result.type === 'NEED_PRESEEDING') {
        const newProblem = await generateProblem({
          difficulty: result.difficulty === 'EASY' ? 'beginner' : 
                     result.difficulty === 'MEDIUM' ? 'intermediate' : 
                     'advanced',
          language: language || 'javascript',
          prompt: 'Generate a coding problem'
        });

        const problem = await prisma.problem.create({
          data: {
            description: newProblem.problem,
            startingCode: newProblem.startingCode || '',
            solution: newProblem.solution,
            source: 'GPT',
            hints: JSON.stringify(newProblem.hints || []),
            tags: JSON.stringify(newProblem.testCases || []),
            type: newProblem.type || 'FILL_IN',
            difficulty: newProblem.difficulty || 'BEGINNER',
            language: newProblem.language || 'javascript',
            title: `Generated Problem - ${new Date().toLocaleString()}`
          }
        });
        
        return json<FetcherData>({ 
          problem: {
            ...newProblem,
            id: problem.id
          }
        });
      }
      
      if (result.type === 'PROBLEM_FOUND') {
        const problem = result.problem;
        return json<FetcherData>({ 
          problem: {
            problem: problem.description,
            startingCode: problem.type === 'FILL_IN' ? problem.template : problem.startingCode,
            solution: problem.type === 'FILL_IN' ? 
              JSON.parse(problem.fillInSections || '[]')[0]?.solution : 
              problem.solution,
            hints: JSON.parse(problem.hints),
            type: problem.type,
            title: problem.title,
            difficulty: problem.difficulty,
            id: problem.id,
            language: problem.language
          }
        });
      }
      
      return json<FetcherData>({ error: 'No problems available' }, { status: 404 });
    }

    if (intent === 'submit') {
      const problemId = formData.get('problemId') as string;
      const timeSpent = (Date.now() - Number(startTime)) / 1000; // Convert to seconds

      // Handle skipping
      if (solution === 'SKIP') {
        console.log('Skipping problem:', problemId);
        
        try {
          // First, get the next problem before updating the current one
          const nextProblem = await practiceScheduler.getNextProblem(userId, language);
          
          // Then update the current problem's progression
          await prisma.problemProgression.upsert({
            where: {
              userId_problemId: {
                userId,
                problemId
              }
            },
            create: {
              attempts: 1,
              solved: false,
              timeSpent,
              rewardSignal: -50,
              lastAttempt: new Date(),
              userSolution: 'SKIP',
              user: { connect: { id: userId } },
              problem: { connect: { id: problemId } }
            },
            update: {
              attempts: { increment: 1 },
              solved: false,
              timeSpent: { increment: timeSpent },
              rewardSignal: -50,
              lastAttempt: new Date(),
              userSolution: 'SKIP'
            }
          });
          
          console.log('Successfully recorded skip');
          
          // Count skipped problems for this session
          const skippedProblems = await prisma.problemProgression.count({
            where: {
              userId,
              userSolution: 'SKIP',
              lastAttempt: {
                gte: new Date(Number(startTime))
              }
            }
          });
          
          if (nextProblem.type === 'PROBLEM_FOUND') {
            const problem = nextProblem.problem;
            return json<FetcherData>({ 
              feedback: {
                isCorrect: false,
                message: 'Question skipped. -50 points deducted.',
                points: -50
              },
              problem: {
                id: problem.id,
                problem: problem.description,
                startingCode: problem.type === 'FILL_IN' ? problem.template : problem.startingCode,
                solution: problem.type === 'FILL_IN' ? 
                  JSON.parse(problem.fillInSections || '[]')[0]?.solution : 
                  problem.solution,
                hints: JSON.parse(problem.hints),
                type: problem.type,
                title: problem.title,
                difficulty: problem.difficulty,
                language: problem.language
              },
              skippedProblems
            });
          } else if (nextProblem.type === 'NEED_PRESEEDING') {
            const newProblem = await generateProblem({
              difficulty: nextProblem.difficulty === 'EASY' ? 'beginner' : 
                         nextProblem.difficulty === 'MEDIUM' ? 'intermediate' : 
                         'advanced',
              language: language || 'javascript',
              prompt: 'Generate a coding problem'
            });

            const problem = await prisma.problem.create({
              data: {
                description: newProblem.problem,
                startingCode: newProblem.startingCode || '',
                solution: newProblem.solution,
                source: 'GPT',
                hints: JSON.stringify(newProblem.hints || []),
                tags: JSON.stringify(newProblem.testCases || []),
                type: newProblem.type || 'FILL_IN',
                difficulty: newProblem.difficulty || 'BEGINNER',
                language: newProblem.language || 'javascript',
                title: `Generated Problem - ${new Date().toLocaleString()}`
              }
            });

            return json<FetcherData>({ 
              feedback: {
                isCorrect: false,
                message: 'Question skipped. -50 points deducted.',
                points: -50
              },
              problem: {
                ...newProblem,
                id: problem.id
              },
              skippedProblems
            });
          } else {
            return json<FetcherData>({ 
              dailyLimitReached: nextProblem.type === 'DAILY_LIMIT_REACHED',
              skippedProblems
            });
          }
        } catch (error) {
          console.error('Error handling skip:', error);
          return json({ error: 'Failed to handle skip' }, { status: 500 });
        }
      }

      // Store the solution without LLM validation
      console.log('Storing solution for problem:', problemId);
      
      try {
        await prisma.problemProgression.upsert({
          where: {
            userId_problemId: {
              userId,
              problemId
            }
          },
          create: {
            attempts: 1,
            solved: null,
            timeSpent,
            rewardSignal: 0,
            lastAttempt: new Date(),
            userSolution: solution,
            user: { connect: { id: userId } },
            problem: { connect: { id: problemId } }
          },
          update: {
            attempts: { increment: 1 },
            solved: null,
            timeSpent: { increment: timeSpent },
            rewardSignal: 0,
            lastAttempt: new Date(),
            userSolution: solution
          }
        });
        
        console.log('Successfully stored solution');
        
        return json<FetcherData>({
          feedback: {
            isCorrect: null,
            message: 'Solution recorded. Continue to next question.',
            points: null
          }
        });
      } catch (error) {
        console.error('Error storing solution:', error);
        return json({ error: 'Failed to store solution' }, { status: 500 });
      }
    }

    if (intent === 'finish') {
      console.log('Starting session analysis');
      
      // Get all problem progressions for this session
      const sessionProblems = await prisma.problemProgression.findMany({
        where: { 
          userId,
          lastAttempt: {
            gte: new Date(startTime)
          }
        },
        include: { problem: true }
      });

      console.log(`Found ${sessionProblems.length} problems to analyze`);
      
      // Analyze all solutions at once
      const analysisPromises = sessionProblems.map(async (progression) => {
        if (progression.userSolution === 'SKIP') {
          return {
            id: progression.id,
            isCorrect: false,
            points: -50
          };
        }

        const result = await validateSolution(
          progression.userSolution,
          progression.problem.solution,
          progression.problem.language
        );

        return {
          id: progression.id,
          isCorrect: result.isCorrect,
          points: result.isCorrect ? 100 : 0,
          feedback: result.feedback
        };
      });

      const analysisResults = await Promise.all(analysisPromises);

      // Update all progressions with results
      await Promise.all(
        analysisResults.map(result =>
          prisma.problemProgression.update({
            where: { id: result.id },
            data: {
              solved: result.isCorrect,
              rewardSignal: result.points
            }
          })
        )
      );

      // Calculate total points and generate overall analysis
      const totalPoints = analysisResults.reduce((acc, res) => acc + res.points, 0);
      const correctCount = analysisResults.filter(res => res.isCorrect).length;
      const skippedCount = analysisResults.filter(res => res.points === -50).length;

      const analysis = {
        totalProblems: sessionProblems.length,
        correctCount,
        skippedCount,
        incorrectCount: sessionProblems.length - correctCount - skippedCount,
        totalPoints,
        problemFeedback: analysisResults.map((res, i) => ({
          title: sessionProblems[i].problem.title,
          isCorrect: res.isCorrect,
          points: res.points,
          feedback: res.feedback
        }))
      };

      return json<FetcherData>({
        sessionComplete: true,
        analysis,
        totalPoints
      });
    }

    if (intent === 'validate') {
      const userCode = formData.get('code') as string;
      const problemId = formData.get('problemId') as string;
      
      if (!userCode || !problemId || !startTime) {
        return json<FetcherData>({ error: 'Missing required fields' }, { status: 400 });
      }

      const timeSpent = (Date.now() - Number(startTime)) / 1000; // Convert to seconds
      
      try {
        const result = await validateSolution(userCode, formData.get('problemSolution') as string, language);
        
        if (!result || typeof result !== 'object') {
          return json<FetcherData>({ error: 'Invalid validation result format' }, { status: 500 });
        }
        
        if (typeof result.isCorrect !== 'boolean' || !result.feedback) {
          return json<FetcherData>({ error: 'Missing required validation fields' }, { status: 500 });
        }

        const { progression, xpGained } = await practiceScheduler.updateProgression(
          userId,
          problemId,
          result.isCorrect,
          timeSpent
        );
        
        const nextProblem = await practiceScheduler.getNextProblem(userId, language);
        
        return json<FetcherData>({ 
          result,
          xpGained,
          nextProblem: nextProblem.type === 'PROBLEM_FOUND' ? {
            problem: nextProblem.problem.description,
            startingCode: nextProblem.problem.type === 'FILL_IN' ? 
              nextProblem.problem.template : 
              nextProblem.problem.startingCode,
            solution: nextProblem.problem.type === 'FILL_IN' ? 
              JSON.parse(nextProblem.problem.fillInSections || '[]')[0]?.solution : 
              nextProblem.problem.solution,
            hints: JSON.parse(nextProblem.problem.hints),
            type: nextProblem.problem.type,
            title: nextProblem.problem.title,
            difficulty: nextProblem.problem.difficulty,
            id: nextProblem.problem.id,
            language: nextProblem.problem.language
          } : null,
          dailyLimitReached: nextProblem.type === 'DAILY_LIMIT_REACHED'
        });
      } catch (error) {
        console.error('Error validating solution:', error);
        return json<FetcherData>({ 
          error: error instanceof Error ? error.message : 'Failed to validate solution'
        }, { status: 500 });
      }
    }

    return json<FetcherData>({ error: 'Invalid intent' }, { status: 400 });
  } catch (error) {
    console.error('Action error:', error);
    return json({ error: 'Failed to process request' }, { status: 500 });
  }
}

function PracticePage() {
  const { stats } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<FetcherData>();
  const { state, dispatch } = usePracticeSession();
  
  // Handle fetcher data updates
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.error) {
        dispatch({ 
          type: 'SET_ERROR', 
          error: new Error(fetcher.data.error)
        });
        return;
      }

      if (fetcher.data.dailyLimitReached) {
        dispatch({ type: 'END_SESSION' });
      } else if (fetcher.data.problem) {
        dispatch({ type: 'SET_PROBLEM', problem: fetcher.data.problem });
      }
      if (fetcher.data.feedback) {
        dispatch({ type: 'SET_FEEDBACK', feedback: fetcher.data.feedback });
        
        if (fetcher.data.feedback.isCorrect) {
          dispatch({ 
            type: 'COMPLETE_PROBLEM',
            timeSpent: (Date.now() - state.sessionStartTime) / 1000,
            points: fetcher.data.feedback.points || 100
          });
        }
      }
    }
  }, [fetcher.data, dispatch, state.sessionStartTime]);

  // Handle solution submission
  const handleSubmit = (solution: string) => {
    try {
      dispatch({ type: 'SET_LOADING', isLoading: true });
      const startTime = state.sessionStartTime;
      fetcher.submit(
        {
          intent: 'submit',
          solution,
          problemId: state.currentProblem?.id || '',
          startTime: startTime.toString(),
          language: state.currentProblem?.language || 'javascript'
        },
        { method: 'post' }
      );
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR',
        error: error instanceof Error ? error : new Error('Failed to submit solution')
      });
    }
  };

  // Handle problem skip
  const handleSkip = () => {
    try {
      const startTime = state.sessionStartTime;
      dispatch({ type: 'SKIP_PROBLEM' });
      fetcher.submit(
        {
          intent: 'submit',
          solution: 'SKIP',
          problemId: state.currentProblem?.id || '',
          startTime: startTime.toString(),
          language: state.currentProblem?.language || 'javascript'
        },
        { method: 'post' }
      );
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR',
        error: error instanceof Error ? error : new Error('Failed to skip problem')
      });
    }
  };

  // Handle starting new session
  const handleStartNew = () => {
    try {
      dispatch({ type: 'START_SESSION' });
      fetcher.submit(
        { 
          intent: 'start',
          language: 'javascript'
        },
        { method: 'post' }
      );
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR',
        error: error instanceof Error ? error : new Error('Failed to start session')
      });
    }
  };

  // Start session on mount if no current problem
  useEffect(() => {
    if (!state.currentProblem && !state.isSessionComplete && !state.isLoading) {
      handleStartNew();
    }
  }, [state.currentProblem, state.isSessionComplete, state.isLoading]);

  return (
    <PracticeLayout
      onSubmit={handleSubmit}
      onSkip={handleSkip}
      onStartNew={handleStartNew}
    />
  );
}

export default function Practice() {
  return (
    <PracticeProvider>
      <PracticePage />
    </PracticeProvider>
  );
}
