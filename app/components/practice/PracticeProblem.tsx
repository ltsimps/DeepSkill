import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { ProblemDisplay } from './ProblemDisplay';
import { SessionSummary } from './SessionSummary';
import { PracticeLoader } from './PracticeLoader';
import { ClientOnly } from '../common/ClientOnly';
import { CodeEditor } from './CodeEditor';

interface PracticeProblemProps {
  problem: {
    id: string;
    title: string;
    description: string;
    startingCode: string;
    difficulty: string;
    language: string;
    timeLimit: number;
    hints: string;
  };
  sessionId: string;
  userStats: {
    problemsAttemptedToday: number;
    dailyLimit: number;
    remainingProblems: number;
    streak: number;
    xp: number;
    level: number;
    nextLevelXp: number;
  };
}

export function PracticeProblem({ problem, sessionId, userStats }: PracticeProblemProps) {
  const [code, setCode] = useState(problem.startingCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('problemId', problem.id);
      formData.append('answer', code);

      const response = await fetch('/practice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit solution');
      }

      setShowSummary(true);
    } catch (error) {
      toast.error('Failed to submit solution. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSummary) {
    return <SessionSummary userStats={userStats} onContinue={() => setShowSummary(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Problem Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">{problem.title}</h1>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              problem.difficulty === 'EASY' ? 'bg-green-500/20 text-green-400' :
              problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {problem.difficulty}
            </span>
            <span className="text-gray-400">Time Limit: {problem.timeLimit}s</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Problem Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 rounded-lg p-6"
          >
            <ProblemDisplay
              description={problem.description}
              hints={problem.hints}
              showHints={showHints}
              onToggleHints={() => setShowHints(!showHints)}
            />
          </motion.div>

          {/* Code Editor */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 rounded-lg overflow-hidden"
          >
            <ClientOnly fallback={<PracticeLoader />}>
              {() => (
                <div className="h-[600px]">
                  <CodeEditor
                    height="600px"
                    language="python"
                    code={code}
                    onChange={setCode}
                  />
                </div>
              )}
            </ClientOnly>

            <div className="p-4 border-t border-gray-700 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCode(problem.startingCode)}
                className="text-gray-400 hover:text-white"
              >
                Reset Code
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      ⚡
                    </motion.div>
                    Analyzing...
                  </div>
                ) : (
                  'Submit Solution'
                )}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* User Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Problems Today</div>
            <div className="text-2xl font-bold">{userStats.problemsAttemptedToday} / {userStats.dailyLimit}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Streak</div>
            <div className="text-2xl font-bold">🔥 {userStats.streak} days</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">Level</div>
            <div className="text-2xl font-bold">⭐ {userStats.level}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400">XP Progress</div>
            <div className="text-2xl font-bold">{userStats.xp} / {userStats.nextLevelXp}</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
