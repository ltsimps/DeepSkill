import { Button } from '../ui/button';
import { usePracticeSession, getSessionStats } from '../../contexts/PracticeContext';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionSummaryProps {
  onStartNew: () => void;
}

export function SessionSummary({ onStartNew }: SessionSummaryProps) {
  const { state } = usePracticeSession();
  const { totalProblems, problemsSolved, skippedProblems, totalPoints, averageTime } = getSessionStats(state);
  const wasSessionSkipped = state.error?.message.includes('Too many problems skipped');
  const [showXpGain, setShowXpGain] = useState(false);
  const [currentXp, setCurrentXp] = useState(state.analysis?.startingXp || 0);

  useEffect(() => {
    if (state.analysis) {
      // Show initial XP
      setCurrentXp(state.analysis.startingXp);
      // Start animation after a short delay
      setTimeout(() => setShowXpGain(true), 500);
    }
  }, [state.analysis]);

  useEffect(() => {
    if (showXpGain && state.analysis) {
      // Animate XP counter
      const duration = 2000; // 2 seconds
      const startTime = Date.now();
      const startXp = state.analysis.startingXp;
      const endXp = state.analysis.finalXp;
      const xpDiff = endXp - startXp;

      const animate = () => {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Use easeOut cubic function for smooth animation
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
        const currentProgress = easeOut(progress);
        
        setCurrentXp(Math.round(startXp + (xpDiff * currentProgress)));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [showXpGain, state.analysis]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm border border-gray-700">
          <h2 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Practice Session Summary
          </h2>

          {wasSessionSkipped && (
            <div className="mb-8 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-300 text-center">
                Session ended early due to too many skipped problems. Try to solve more problems in your next session!
              </p>
            </div>
          )}
          
          <AnimatePresence>
            {state.analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 p-6 bg-blue-500/20 border border-blue-500/50 rounded-lg text-center"
              >
                <h3 className="text-xl font-semibold mb-4 text-blue-300">Experience Points</h3>
                <div className="flex items-center justify-center space-x-4">
                  <motion.div
                    className="text-4xl font-bold"
                    key={currentXp}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentXp.toLocaleString()} XP
                  </motion.div>
                  {showXpGain && state.analysis.finalXp > state.analysis.startingXp && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-2xl font-bold text-green-400"
                    >
                      +{(state.analysis.finalXp - state.analysis.startingXp).toLocaleString()} XP
                    </motion.div>
                  )}
                </div>
                <p className="mt-2 text-blue-300">Level {state.analysis.level}</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Achievement Notifications */}
          {state.newAchievements?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">🏆 Achievements Unlocked!</h3>
              <div className="space-y-4">
                {state.newAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center gap-4"
                  >
                    <span className="text-3xl">{achievement.icon}</span>
                    <div>
                      <h4 className="font-semibold text-yellow-300">{achievement.name}</h4>
                      <p className="text-gray-300">{achievement.description}</p>
                      <p className="text-yellow-400 text-sm mt-1">+{achievement.xpReward} XP Bonus!</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold mb-2 text-gray-300">Total Problems Attempted</h3>
              <p className="text-3xl font-bold">{totalProblems}</p>
            </div>
            
            <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold mb-2 text-gray-300">Session Points</h3>
              <p className="text-3xl font-bold">{totalPoints}</p>
            </div>
            
            <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold mb-2 text-gray-300">Problems Solved</h3>
              <p className="text-3xl font-bold text-green-400">{problemsSolved}</p>
            </div>
            
            <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold mb-2 text-gray-300">Problems Skipped</h3>
              <p className="text-3xl font-bold text-yellow-400">{skippedProblems}</p>
            </div>
          </div>

          <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600 mb-8">
            <h3 className="text-lg font-semibold mb-2 text-gray-300">Average Time per Problem</h3>
            <p className="text-3xl font-bold">{averageTime.toFixed(1)} seconds</p>
          </div>

          {state.analysis?.problemFeedback && (
            <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600 mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Problem Details</h3>
              <div className="space-y-4">
                {state.analysis.problemFeedback.map((problem, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-300">{problem.title}</h4>
                      <p className="text-sm text-gray-400">{problem.feedback}</p>
                    </div>
                    <div className={`text-lg font-bold ${problem.points > 0 ? 'text-green-400' : problem.points < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                      {problem.points > 0 ? '+' : ''}{problem.points} points
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={onStartNew}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 text-lg"
            >
              Start New Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
