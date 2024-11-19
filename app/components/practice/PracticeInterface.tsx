import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '../../components/ui/button';
import type { PracticeInterfaceProps } from '../../types/practice';

export function PracticeInterface({ problem, onSubmit, feedback }: PracticeInterfaceProps) {
  const [code, setCode] = useState(problem.startingCode || '');
  const [showHint, setShowHint] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (feedback?.isCorrect) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

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
              defaultLanguage="javascript"
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

          {/* Feedback */}
          {feedback && (
            <div className={`mt-6 p-4 rounded-lg border ${
              feedback.isCorrect 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  feedback.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {feedback.isCorrect ? '✨' : '❌'}
                </div>
                <div>
                  <p className="font-medium">
                    {feedback.isCorrect ? 'Great job!' : 'Not quite right'}
                  </p>
                  {feedback.message && (
                    <p className="text-sm mt-1 opacity-80">{feedback.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6">
            <Button 
              onClick={() => onSubmit(code)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity py-6 text-lg font-bold"
            >
              Submit Solution 🚀
            </Button>
          </div>
        </div>
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-confetti">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#98FB98'][i % 4],
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animation: `fall ${1 + Math.random() * 2}s linear forwards`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
