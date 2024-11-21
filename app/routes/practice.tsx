import { json, redirect, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { ProblemView } from '~/components/practice/ProblemView';
import { LanguageSelect } from '~/components/practice/LanguageSelect';
import { answerAnalysisQueue } from '~/services/answer-analysis.server';
import { requireUserId } from '~/utils/auth.server';
import { prisma } from '~/utils/db.server';
import { practiceQueueService } from '~/services/practice-queue.server';
import { motion } from 'framer-motion';
import { Link } from '@remix-run/react';

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
  
  const problemsToday = await prisma.sessionProblem.count({
    where: {
      userId,
      session: {
        createdAt: {
          gte: today
        }
      }
    }
  });

  const dailyLimit = 20;
  const remainingProblems = Math.max(0, dailyLimit - problemsToday);
  console.log(`[Practice Stats] User ${userId} has attempted ${problemsToday} problems today, ${remainingProblems} remaining`);

  // Enforce daily limit
  if (remainingProblems <= 0) {
    return json<LoaderData>({
      problem: null,
      session: null,
      stats: {
        problemsAttemptedToday: problemsToday,
        dailyLimit,
        remainingProblems: 0,
        streak: user.streak,
        xp: user.xp,
        level: user.level,
        nextLevelXp
      }
    });
  }

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
      problemsAttemptedToday: problemsToday,
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            type: "spring",
            duration: 0.5,
          }}
          className="max-w-2xl w-full mx-4"
        >
          <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/50 to-gray-900 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-purple-500/20">
            {/* Close button */}
            <Link
              to="/dashboard"
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>

            <div className="flex flex-col items-center text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  duration: 0.6,
                  delay: 0.1,
                  bounce: 0.4
                }}
                className="w-24 h-24 rounded-full bg-purple-600/20 flex items-center justify-center mb-4"
              >
                <motion.span
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-4xl"
                >
                  🎉
                </motion.span>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-3xl font-bold text-white bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
              >
                You've Crushed It!
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-xl text-gray-300"
              >
                You've completed all available problems for today. Come back tomorrow for more challenges!
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="grid grid-cols-2 gap-8 w-full max-w-md mt-8"
              >
                <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-500/20">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="text-3xl font-bold text-white mb-2"
                  >
                    {stats.problemsAttemptedToday}
                  </motion.div>
                  <div className="text-sm text-gray-400">Problems Solved Today</div>
                </div>

                <div className="bg-cyan-900/30 rounded-xl p-4 border border-cyan-500/20">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="text-3xl font-bold text-white mb-2"
                  >
                    {stats.streak}
                  </motion.div>
                  <div className="text-sm text-gray-400">Day Streak</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="w-full max-w-md mt-4"
              >
                <div className="relative pt-1">
                  <div className="text-xs text-gray-400 mb-2">Daily Progress</div>
                  <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.problemsAttemptedToday / stats.dailyLimit) * 100}%` }}
                      transition={{ duration: 1, delay: 1 }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-cyan-500"
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {stats.problemsAttemptedToday} / {stats.dailyLimit} Problems
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
                className="mt-8"
              >
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:from-purple-700 hover:to-cyan-700 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  <motion.span
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.2 }}
                  >
                    Return to Dashboard
                  </motion.span>
                  <motion.svg
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.3 }}
                    className="ml-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </motion.svg>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
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
