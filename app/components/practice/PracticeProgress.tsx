import { usePracticeSession } from '../../contexts/PracticeContext';

export function PracticeProgress() {
  const { state } = usePracticeSession();
  const { problemsAttempted, skippedProblems, totalPoints } = state;

  const solvedProblems = problemsAttempted - skippedProblems;
  const pointsClass = totalPoints >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 rounded-lg border border-gray-700">
      {/* Problems Progress */}
      <div className="flex items-center space-x-4">
        <div className="text-sm">
          <span className="text-gray-400">Problems: </span>
          <span className="font-medium text-white">{problemsAttempted}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Solved: </span>
          <span className="font-medium text-green-400">{solvedProblems}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Skipped: </span>
          <span className="font-medium text-yellow-400">{skippedProblems}</span>
        </div>
      </div>

      {/* Points */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">Points:</span>
        <span className={`font-bold ${pointsClass}`}>
          {totalPoints >= 0 ? '+' : ''}{totalPoints}
        </span>
      </div>

      {/* Visual Progress */}
      <div className="hidden sm:block w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ 
            width: `${Math.min((solvedProblems / Math.max(problemsAttempted, 1)) * 100, 100)}%`
          }}
        />
      </div>
    </div>
  );
}
