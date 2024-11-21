import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '../../components/ui/button';
import type { PracticeInterfaceProps } from '../../types/practice';

export function PracticeInterface({ problem, onSubmit, feedback }: PracticeInterfaceProps) {
  const [code, setCode] = useState(problem.startingCode || '');
  const [showHint, setShowHint] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading...</div>; // Show a loading state during server-side rendering
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Top Bar with Progress */}
      <div className="fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              problem.difficulty === 'EASY' ? 'bg-green-500/20 text-green-400' :
              problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {problem.difficulty}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              {problem.type}
            </span>
            {feedback && (
              <div className={`px-3 py-1 rounded-full text-sm ${
                feedback.isCorrect ? 'bg-green-500/20 text-green-400' :
                feedback.isCorrect === false ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {feedback.points > 0 && (
                  <span className="font-bold">+{feedback.points}XP</span>
                )}
                {feedback.points < 0 && (
                  <span className="font-bold">{feedback.points}XP</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-6 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Problem Title and Description */}
          <div className="bg-gray-800/50 rounded-lg p-6 mb-6 backdrop-blur-sm border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {problem.title}
            </h2>
            <p className="text-gray-300 whitespace-pre-wrap">{problem.problem}</p>
          </div>

          {/* Hints */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setShowHint(!showHint)}
                className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
              >
                {showHint ? '🎯 Hide Hint' : '💡 Need a Hint?'}
              </Button>
              {showHint && (
                <div className="mt-2 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <ul className="list-disc list-inside space-y-2">
                    {problem.hints.map((hint, index) => (
                      <li key={index} className="text-yellow-200">{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Code Editor */}
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
            <Editor
              height="300px"
              defaultLanguage={problem.language || 'javascript'}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                padding: { top: 20 },
              }}
              className="rounded-lg overflow-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            <Button
              onClick={() => onSubmit(code)}
              className="bg-green-500 hover:bg-green-600 text-white px-8"
            >
              Submit Solution
            </Button>
            <Button
              onClick={() => onSubmit('SKIP')}
              variant="outline"
              className="bg-gray-700/50 hover:bg-gray-700 text-gray-300 border-gray-600"
            >
              Skip Question (-50 points)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
