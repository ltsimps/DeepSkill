import { json, redirect, type LoaderArgs, type ActionArgs } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { useState } from 'react';
import { ProblemView } from '~/components/practice/ProblemView';
import { requireUserId } from '~/utils/auth.server';
import { PracticeSessionService } from '~/services/practice-session.server';
import { ProblemQueue } from '~/services/problem-queue.server';
import { AnalysisQueue } from '~/services/analysis-queue.server';
import { motion } from 'framer-motion';
import { Link } from '@remix-run/react';

// Initialize services
const analysisQueue = new AnalysisQueue();
const problemQueue = new ProblemQueue();
const practiceSession = new PracticeSessionService(problemQueue, analysisQueue);

interface LoaderData {
  problem: {
    id: string;
    title: string;
    description: string;
    startingCode: string;
    difficulty: string;
    language: string;
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
}

export async function loader({ request }: LoaderArgs) {
  const userId = await requireUserId(request);
  console.log(`[Practice Loader] User ${userId} requesting practice problem`);

  // Get user stats first
  const stats = await practiceSession.getUserStats(userId);

  // Get or create session
  const session = await practiceSession.startSession(userId);
  
  // If no session (daily limit reached or no problems available), return stats only
  if (!session) {
    return json<LoaderData>({
      problem: null,
      session: null,
      stats
    });
  }

  // Get current problem
  const currentProblem = await practiceSession.getCurrentProblem(session.id);

  return json<LoaderData>({
    problem: currentProblem,
    session,
    stats
  });
}

export async function action({ request }: ActionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'reset') {
    await practiceSession.resetDailyProgress(userId);
    return redirect('/practice');
  }

  const { sessionId, problemId, solution } = Object.fromEntries(formData);

  if (typeof sessionId !== 'string' || typeof problemId !== 'string' || typeof solution !== 'string') {
    throw new Error('Invalid form data');
  }

  await practiceSession.submitSolution(sessionId, problemId, userId, solution);
  return json({ success: true });
}

export default function Practice() {
  const { problem, session, stats } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const [showHints, setShowHints] = useState(false);
  const isResetting = fetcher.state === 'submitting' && fetcher.submission?.formData.get('intent') === 'reset';

  // If no session or problem, show completion message
  if (!session || !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-purple-500/20"
          >
            {/* Background Effects */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
                Ready to Start Coding?
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Begin your daily coding practice with {stats.remainingProblems} new challenges!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {stats.problemsAttemptedToday}
                  </div>
                  <div className="text-sm text-gray-400">
                    Problems Today
                  </div>
                </div>
                <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {stats.streak}
                  </div>
                  <div className="text-sm text-gray-400">
                    Day Streak
                  </div>
                </div>
                <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    Level {stats.level}
                  </div>
                  <div className="text-sm text-gray-400">
                    Current Level
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <fetcher.Form method="post" className="space-y-6">
                  <input type="hidden" name="intent" value="reset" />
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isResetting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Starting New Session...
                      </span>
                    ) : (
                      'Start Practicing'
                    )}
                  </button>
                </fetcher.Form>

                <Link
                  to="/dashboard"
                  className="inline-block w-full bg-gray-700 hover:bg-gray-600 text-gray-300 text-lg font-semibold py-4 px-8 rounded-xl transition-colors duration-300"
                >
                  Return to Dashboard
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show problem view
  return (
    <ProblemView
      problem={problem}
      session={session}
      stats={stats}
      showHints={showHints}
      onToggleHints={() => setShowHints(!showHints)}
      onSubmit={(solution: string) => {
        fetcher.submit(
          {
            sessionId: session.id,
            problemId: problem.id,
            solution
          },
          { method: 'post' }
        );
      }}
    />
  );
}
