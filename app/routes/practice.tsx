import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { useState, useEffect, useRef } from 'react';
import { practiceScheduler } from '../services/practice.server';
import { requireUserId } from '../utils/auth.server';
import { prisma } from '../utils/db.server';
import { generateProblem, validateSolution } from '../utils/openai.server';
import { PracticeInterface } from '../components/practice/PracticeInterface';
import { PracticeDashboard } from '../components/practice/PracticeDashboard';
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

    if (intent === 'validate') {
      const userCode = formData.get('code') as string;
      const solution = formData.get('solution') as string;
      const problemId = formData.get('problemId') as string;
      
      if (!userCode || !solution || !problemId || !startTime) {
        return json<FetcherData>({ error: 'Missing required fields' }, { status: 400 });
      }

      const timeSpent = Date.now() - Number(startTime);
      
      try {
        const result = await validateSolution(userCode, solution, language);
        
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
          timeSpent / 1000
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
    return json<FetcherData>({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export default function PracticePage() {
  const { stats } = useLoaderData<typeof loader>();
  const [currentProblem, setCurrentProblem] = useState<GeneratedProblem | null>(null);
  const [feedback, setFeedback] = useState<ProblemFeedback | null>(null);
  const [xpAnimation, setXpAnimation] = useState<{ amount: number; isVisible: boolean }>({ amount: 0, isVisible: false });
  const [selectedLanguage, setSelectedLanguage] = useState<string>('javascript');
  const fetcher = useFetcher<FetcherData>();
  const transitionTimeoutRef = useRef<NodeJS.Timeout>();

  const handleStart = () => {
    fetcher.submit(
      { intent: 'start', language: selectedLanguage },
      { method: 'post' }
    );
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  const handleSubmit = (code: string) => {
    if (!currentProblem?.solution) return;
    
    fetcher.submit(
      {
        intent: 'validate',
        code,
        solution: currentProblem.solution,
        language: selectedLanguage,
        problemId: currentProblem.id,
        startTime: Date.now().toString()
      },
      { method: 'post' }
    );
  };

  useEffect(() => {
    if (fetcher.data?.problem) {
      setCurrentProblem(fetcher.data.problem);
      setFeedback(null);
    }
    if (fetcher.data?.result) {
      setFeedback({
        isCorrect: fetcher.data.result.isCorrect,
        message: fetcher.data.result.feedback
      });
      
      if (fetcher.data.xpGained) {
        setXpAnimation({ amount: fetcher.data.xpGained, isVisible: true });
        const timer = setTimeout(() => setXpAnimation(prev => ({ ...prev, isVisible: false })), 2000);
        return () => clearTimeout(timer);
      }
      
      if (fetcher.data.nextProblem) {
        transitionTimeoutRef.current = setTimeout(() => {
          setCurrentProblem(fetcher.data.nextProblem);
          setFeedback(null);
        }, 3000);
      } else if (fetcher.data.dailyLimitReached) {
        transitionTimeoutRef.current = setTimeout(() => {
          setCurrentProblem(null);
          setFeedback(null);
        }, 3000);
      }
    }
    
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [fetcher.data]);

  // Handle client-side hydration
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Return null on server-side to prevent hydration mismatch
  }

  if (!currentProblem) {
    return (
      <PracticeDashboard 
        onStart={handleStart} 
        onLanguageChange={handleLanguageChange}
        selectedLanguage={selectedLanguage}
      />
    );
  }

  return (
    <div>
      <PracticeInterface
        problem={currentProblem}
        onSubmit={handleSubmit}
        feedback={feedback}
      />
      {xpAnimation.isVisible && (
        <div className="fixed top-4 right-4 animate-bounce bg-green-500 text-white px-4 py-2 rounded-full shadow-lg">
          +{xpAnimation.amount} XP
        </div>
      )}
    </div>
  );
}
