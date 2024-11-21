import type { ProblemOutput } from '../../utils/problem.server'
import { useState } from 'react'

interface ProblemDisplayProps {
  problem: ProblemOutput
  onSubmit: (solution: string) => void
  feedback?: { isCorrect?: boolean; message?: string }
}

export function ProblemDisplay({ problem, onSubmit, feedback }: ProblemDisplayProps) {
  const [solution, setSolution] = useState(problem.startingCode || '')
  const [showHints, setShowHints] = useState(false)
  const hints = typeof problem.hints === 'string' ? JSON.parse(problem.hints) : problem.hints

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(solution)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{problem.title}</h2>
        <div className="flex gap-2 mt-2">
          <span className="px-2 py-1 text-sm rounded-full bg-gray-100">
            {problem.difficulty}
          </span>
          <span className="px-2 py-1 text-sm rounded-full bg-gray-100">
            {problem.language}
          </span>
        </div>
      </div>

      <div className="prose max-w-none">
        <div className="text-gray-600 mb-4">{problem.description}</div>
        <h3>Problem Requirements</h3>
        <p>{problem.problem}</p>
      </div>

      {hints && hints.length > 0 && (
        <div>
          <button
            onClick={() => setShowHints(!showHints)}
            className="text-indigo-600 hover:text-indigo-800"
          >
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </button>
          {showHints && (
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {hints.map((hint: string, index: number) => (
                <li key={index}>{hint}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {feedback && (
          <div
            className={`p-4 rounded-md ${
              feedback.isCorrect
                ? 'bg-green-50 text-green-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Submit Solution
        </button>
      </form>
    </div>
  )
}
