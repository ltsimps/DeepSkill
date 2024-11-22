import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GeneratedProblem } from '../../types/practice';
import { CodeEditor } from '../code/CodeEditor';
import { marked } from 'marked';

interface ProblemTransitionProps {
  problem: GeneratedProblem;
  onSubmit: (solution: string) => void;
  onSkip: () => void;
}

export function ProblemTransition({ problem, onSubmit, onSkip }: ProblemTransitionProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [solution, setSolution] = useState(problem.startingCode || '');

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [problem.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(solution);
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={problem.id}
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
              language={problem.language}
              className="min-h-[300px]"
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={onSkip}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Skip Problem
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Submit Solution
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
