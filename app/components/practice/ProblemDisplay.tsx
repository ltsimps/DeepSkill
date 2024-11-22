import type { ProblemOutput } from '../../utils/problem.server'
import { useState } from 'react'
import { Button } from '../ui/button';
import { motion } from 'framer-motion';

interface ProblemDisplayProps {
  problem: ProblemOutput
  description: string;
  hints: string;
  showHints: boolean;
  onToggleHints: () => void;
}

export function ProblemDisplay({ problem, description, hints, showHints, onToggleHints }: ProblemDisplayProps) {
  const [solution, setSolution] = useState(problem.startingCode || '')
  const parsedHints = typeof hints === 'string' ? JSON.parse(hints) : hints;

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="prose prose-invert max-w-none">
        <div className="text-gray-300 whitespace-pre-wrap">{problem.description}</div>
      </div>

      {/* Hints */}
      {parsedHints && parsedHints.length > 0 && (
        <div>
          <Button
            variant="outline"
            onClick={onToggleHints}
            className="text-gray-400 hover:text-white"
          >
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </Button>

          {showHints && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              {parsedHints.map((hint: string, index: number) => (
                <div 
                  key={index} 
                  className="pl-4 border-l-2 border-yellow-500/30 py-2"
                >
                  <span className="text-gray-300">{hint}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Solution */}
      <div>
        <label className="block text-sm font-medium">Your Solution</label>
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm font-mono"
          rows={10}
          required
        />
      </div>
    </div>
  )
}
