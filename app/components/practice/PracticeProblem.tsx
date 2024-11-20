import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '../ui/button';
import { usePracticeSession } from '../../contexts/PracticeContext';
import type { GeneratedProblem } from '../../types/practice';

interface PracticeProblemProps {
  onSubmit: (solution: string) => void;
  onSkip: () => void;
}

export function PracticeProblem({ onSubmit, onSkip }: PracticeProblemProps) {
  const { state } = usePracticeSession();
  const { currentProblem, feedback } = state;
  
  const [code, setCode] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (currentProblem?.startingCode) {
      setCode(currentProblem.startingCode);
    }
  }, [currentProblem]);

  if (!isClient || !currentProblem) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Problem Description */}
      <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            currentProblem.difficulty === 'EASY' ? 'bg-green-500/20 text-green-400' :
            currentProblem.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {currentProblem.difficulty}
          </span>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
            {currentProblem.type}
          </span>
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {currentProblem.title || 'Coding Challenge'}
        </h2>
        <p className="text-gray-300 whitespace-pre-wrap">{currentProblem.problem}</p>
      </div>

      {/* Hints */}
      {currentProblem.hints && currentProblem.hints.length > 0 && (
        <div>
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
                {currentProblem.hints.map((hint, index) => (
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
          defaultLanguage={currentProblem.language || 'javascript'}
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
        <div className={`p-4 rounded-lg ${
          feedback.isCorrect ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
        } border`}>
          <p className="text-lg font-semibold">
            {feedback.isCorrect ? '✅ Correct!' : '❌ Not quite right'}
          </p>
          <p className="text-gray-300 mt-2">{feedback.message}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => onSubmit(code)}
          className="bg-green-500 hover:bg-green-600 text-white px-8"
        >
          Submit Solution
        </Button>
        <Button
          onClick={onSkip}
          variant="outline"
          className="bg-gray-700/50 hover:bg-gray-700 text-gray-300 border-gray-600"
        >
          Skip Problem (-50 points)
        </Button>
      </div>
    </div>
  );
}
