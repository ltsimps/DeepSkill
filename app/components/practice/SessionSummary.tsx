import { Button } from '../ui/button';
import { usePracticeSession, getSessionStats } from '../../contexts/PracticeContext';

interface SessionSummaryProps {
  onStartNew: () => void;
}

export function SessionSummary({ onStartNew }: SessionSummaryProps) {
  const { state } = usePracticeSession();
  const { totalProblems, problemsSolved, skippedProblems, totalPoints, averageTime } = getSessionStats(state);
  const wasSessionSkipped = state.error?.message.includes('Too many problems skipped');

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
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold mb-2 text-gray-300">Total Problems Attempted</h3>
              <p className="text-3xl font-bold">{totalProblems}</p>
            </div>
            
            <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold mb-2 text-gray-300">Total Points</h3>
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
