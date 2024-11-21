import type { GeneratedProblem } from '../../types/practice';

interface ProblemDescriptionProps {
  problem: GeneratedProblem;
}

export function ProblemDescription({ problem }: ProblemDescriptionProps) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
      <div className="flex items-center gap-4 mb-4">
        <span className={`px-3 py-1 rounded-full text-sm ${
          problem.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
          problem.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {problem.difficulty.toUpperCase()}
        </span>
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
          {problem.language}
        </span>
      </div>
      
      <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        {problem.title || 'Coding Challenge'}
      </h2>
      <p className="text-gray-300 whitespace-pre-wrap">{problem.problem}</p>
    </div>
  );
}
