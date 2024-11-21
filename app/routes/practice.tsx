import { json, redirect, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { ProblemView } from '~/components/practice/ProblemView';
import { LanguageSelect } from '~/components/practice/LanguageSelect';
import { answerAnalysisQueue } from '~/services/answer-analysis.server';
import { requireUserId } from '~/utils/auth.server';
import { prisma } from '~/utils/db.server';
import { practiceQueueService } from '~/services/practice-queue.server';

export const SUPPORTED_LANGUAGES = ['python', 'cpp'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

interface LoaderData {
  problem: {
    id: string;
    title: string;
    description: string;
    startingCode: string;
    difficulty: string;
    language: SupportedLanguage;
    timeLimit: number;
    hints: string;
  } | null;
  session: {
    id: string;
    status: string;
  } | null;
  stats: {
    problemsAttemptedToday: number;
    dailyLimit: number;
    remainingProblems: number;
    streak: number;
    xp: number;
    level: number;
    nextLevelXp: number;
  };
  similarProblems?: Array<{
    id: string;
    title: string;
    difficulty: string;
    distance: number;
  }>;
}

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  console.log(`[Practice Loader] User ${userId} requesting practice problem`);

  // Get user stats
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      streak: true,
      xp: true,
      level: true,
      lastPractice: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if streak should be reset (no practice in last 24 hours)
  const lastPractice = user.lastPractice;
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (!lastPractice || lastPractice < yesterday) {
    await prisma.user.update({
      where: { id: userId },
      data: { streak: 0 }
    });
    user.streak = 0;
  }

  // Calculate XP needed for next level (exponential growth)
  const baseXp = 1000;
  const nextLevelXp = Math.floor(baseXp * Math.pow(1.5, user.level - 1));

  // Get or create a practice session
  let session = await prisma.practiceSession.findFirst({
    where: {
      userId,
      status: 'IN_PROGRESS'
    }
  });

  if (!session) {
    console.log(`[Practice Loader] Creating new session for user ${userId}`);
    session = await prisma.practiceSession.create({
      data: {
        userId,
        status: 'IN_PROGRESS'
      }
    });
  }

  // Get practice stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stats = await prisma.practiceSession.aggregate({
    where: {
      userId,
      createdAt: {
        gte: today
      }
    },
    _count: true
  });

  const dailyLimit = 20;
  const remainingProblems = Math.max(0, dailyLimit - stats._count);
  console.log(`[Practice Stats] User ${userId} has attempted ${stats._count} problems today, ${remainingProblems} remaining`);

  // Get current problem from queue
  const url = new URL(request.url);
  const language = url.searchParams.get('language') === 'cpp' ? 'cpp' : 'python';
  console.log(`[Practice Loader] Getting next ${language} problem for user ${userId}`);
  
  const problem = await practiceQueueService.getNextProblem(userId, language);

  if (!problem) {
    console.log(`[Practice Loader] No problems available for user ${userId}`);
  } else {
    console.log(`[Practice Loader] Serving problem ${problem.id} to user ${userId}`);
  }

  return json<LoaderData>({
    problem: problem ? {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      startingCode: problem.startingCode,
      difficulty: problem.difficulty,
      language: problem.language as SupportedLanguage,
      timeLimit: problem.timeLimit,
      hints: problem.hints
    } : null,
    session,
    stats: {
      problemsAttemptedToday: stats._count,
      dailyLimit,
      remainingProblems,
      streak: user.streak,
      xp: user.xp,
      level: user.level,
      nextLevelXp
    },
    similarProblems: []
  });
}

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const sessionId = formData.get('sessionId') as string;
  const problemId = formData.get('problemId') as string;
  const answer = formData.get('answer') as string;

  console.log(`[Practice Action] User ${userId} submitted solution for problem ${problemId}`);

  // Queue the analysis
  const jobId = await answerAnalysisQueue.queueAnalysis(
    sessionId,
    problemId,
    userId,
    answer,
    1
  );
  console.log(`[Practice Action] Analysis job ${jobId} queued for problem ${problemId}`);

  // Mark the session as completed
  await prisma.practiceSession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED' }
  });
  console.log(`[Practice Action] Session ${sessionId} marked as completed`);

  // Create a new session for the next problem
  const newSession = await prisma.practiceSession.create({
    data: {
      userId,
      status: 'IN_PROGRESS'
    }
  });
  console.log(`[Practice Action] Created new session ${newSession.id} for user ${userId}`);

  // Update user stats
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      streak: true,
      xp: true,
      level: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const xpReward = 100;
  const newXp = user.xp + xpReward;
  const newLevel = Math.floor(Math.log2(newXp / 1000) + 1);
  const newStreak = user.streak + 1;

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      lastPractice: new Date()
    }
  });

  const url = new URL(request.url);
  const language = url.searchParams.get('language') === 'cpp' ? 'cpp' : 'python';
  
  return redirect(`/practice?language=${language}`);
}

export default function Practice() {
  const { problem, session, stats, similarProblems } = useLoaderData<LoaderData>();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('python');
  const fetcher = useFetcher();

  const handleSubmit = async (answer: string) => {
    if (!session || !problem) return;

    const formData = new FormData();
    formData.append('sessionId', session.id);
    formData.append('problemId', problem.id);
    formData.append('answer', answer);

    fetcher.submit(formData, { method: 'post' });
  };

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-semibold text-white mb-4">No Problems Available</h2>
        <p className="text-gray-400 mb-8">
          {stats.remainingProblems === 0
            ? "You've completed all available problems for today."
            : "We're generating new problems for you. Please try again in a few minutes."}
        </p>
        
        <div className="space-y-4 w-full max-w-sm">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Problems attempted today:</span>
            <span>{stats.problemsAttemptedToday} / {stats.dailyLimit}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Problems remaining today:</span>
            <span>{stats.remainingProblems}</span>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = (stats.xp / stats.nextLevelXp) * 100;

  return (
    <div className="flex flex-col space-y-4 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold">Practice</h1>
          <div className="flex items-center space-x-4">
            {/* Level Badge */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                <span className="text-white font-bold">{stats.level}</span>
              </div>
              {/* XP Progress Bar */}
              <div className="w-32">
                <div className="text-xs text-gray-400 mb-1">Level {stats.level}</div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div
                    className="h-full bg-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {stats.xp} / {stats.nextLevelXp} XP
                </div>
              </div>
            </div>
            {/* Streak Badge */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-white font-bold">🔥</span>
              </div>
              <span className="text-orange-500 font-bold">{stats.streak} days</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Problems today:</span>
            <span className="text-sm font-semibold">{stats.problemsAttemptedToday} / {stats.dailyLimit}</span>
          </div>
          <LanguageSelect
            value={selectedLanguage}
            onChange={(lang) => {
              setSelectedLanguage(lang);
              window.location.href = `/practice?language=${lang}`;
            }}
          />
        </div>
      </div>
      
      <ProblemView
        problem={problem!}
        onSubmit={handleSubmit}
        isSubmitting={fetcher.state !== 'idle'}
        stats={stats}
        similarProblems={similarProblems}
      />
    </div>
  );
}
