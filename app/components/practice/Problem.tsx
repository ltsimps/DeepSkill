import { useState } from 'react';
import { motion } from 'framer-motion';
import { marked } from 'marked';
import type { GeneratedProblem } from '../../types/practice';
import { CodeEditor } from '../code/CodeEditor';

interface ProblemProps {
  problem: GeneratedProblem;
  onSubmit: (solution: string) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export function Problem({ problem, onSubmit, onSkip, isLoading = false }: ProblemProps) {
  const [solution, setSolution] = useState(problem.startingCode || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(solution);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="space-y-6"
    >
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-4">{problem.title}</h2>
        <div 
          className="prose prose-invert max-w-none mb-6"
          dangerouslySetInnerHTML={{ __html: marked(problem.description) }}
        />
        {problem.hints && problem.hints.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Hints:</h3>
            <ul className="list-disc list-inside space-y-2">
              {problem.hints.map((hint, index) => (
                <li key={index} className="text-gray-300">{hint}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg">
        <CodeEditor
          value={solution}
          onChange={setSolution}
          language={problem.language || 'javascript'}
          className="min-h-[300px]"
        />
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={onSkip}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Skip Problem
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Submit Solution'}
        </button>
      </div>
    </motion.div>
  );
}
