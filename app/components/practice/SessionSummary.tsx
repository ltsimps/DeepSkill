import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionSummaryProps {
  userStats: {
    problemsAttemptedToday: number;
    dailyLimit: number;
    remainingProblems: number;
    streak: number;
    xp: number;
    level: number;
    nextLevelXp: number;
  };
  onContinue: () => void;
}

export function SessionSummary({ userStats, onContinue }: SessionSummaryProps) {
  const [showXpGain, setShowXpGain] = useState(false);
  const [currentXp, setCurrentXp] = useState(userStats.xp);

  useEffect(() => {
    setTimeout(() => setShowXpGain(true), 500);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm border border-gray-700">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"
          >
            Problem Completed! 🎉
          </motion.h2>
          
          <AnimatePresence>
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
                {showXpGain && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl font-bold text-green-400"
                  >
                    Level {userStats.level}
                  </motion.div>
                )}
              </div>
              <div className="mt-4">
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(userStats.xp / userStats.nextLevelXp) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {userStats.xp.toLocaleString()} / {userStats.nextLevelXp.toLocaleString()} XP to next level
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-700/30 p-6 rounded-lg border border-gray-600"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-300">Problems Today</h3>
              <p className="text-3xl font-bold">{userStats.problemsAttemptedToday} / {userStats.dailyLimit}</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-700/30 p-6 rounded-lg border border-gray-600"
            >
              <h3 className="text-lg font-semibold mb-2 text-gray-300">Daily Streak</h3>
              <p className="text-3xl font-bold">🔥 {userStats.streak} days</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center"
          >
            <Button
              onClick={onContinue}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
            >
              Continue Practice
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
