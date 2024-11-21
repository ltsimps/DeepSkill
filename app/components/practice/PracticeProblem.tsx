import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '../ui/button';
import { usePracticeSession } from '../../contexts/PracticeContext';
import { motion } from 'framer-motion';
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
  const [editorLanguage, setEditorLanguage] = useState('javascript');

  useEffect(() => {
    setIsClient(true);
    if (currentProblem?.startingCode) {
      setCode(currentProblem.startingCode);
    }
    if (currentProblem?.language) {
      // Map common language names to Monaco editor language IDs
      const languageMap: { [key: string]: string } = {
        'javascript': 'javascript',
        'js': 'javascript',
        'typescript': 'typescript',
        'ts': 'typescript',
        'python': 'python',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c++': 'cpp',
        'csharp': 'csharp',
        'c#': 'csharp',
        'go': 'go',
        'rust': 'rust',
        'ruby': 'ruby',
        'php': 'php'
      };
      
      const normalizedLanguage = currentProblem.language.toLowerCase();
      setEditorLanguage(languageMap[normalizedLanguage] || normalizedLanguage);
    }
  }, [currentProblem]);

  if (!isClient || !currentProblem) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Problem Description */}
      <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
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
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
              {editorLanguage}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Problems Due:</span>
            <span className="px-3 py-1 bg-gray-700/50 text-gray-200 rounded-full text-sm font-medium">
              {state.remainingProblems} / {state.totalProblems}
            </span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          {currentProblem.title || 'Coding Challenge'}
        </h2>
        
        {/* Description */}
        <div className="space-y-4">
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 whitespace-pre-wrap">{currentProblem.description}</div>
          </div>
          
          {/* Problem Statement */}
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-200">Problem Statement</h3>
            <div className="text-gray-300 whitespace-pre-wrap">{currentProblem.problem}</div>
          </div>
        </div>
      </div>

      {/* Hints and Test Cases */}
      {(currentProblem.hints || currentProblem.testCases) && (
        <div>
          <Button
            variant="outline"
            onClick={() => setShowHint(!showHint)}
            className="mb-4"
          >
            {showHint ? 'Hide Hints' : 'Show Hints'}
          </Button>
          {showHint && (
            <div className="space-y-4">
              {/* Test Cases */}
              {currentProblem.testCases && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-3 text-blue-400">Example Test Cases:</h4>
                  <div className="space-y-4">
                    {JSON.parse(currentProblem.testCases).slice(0, 3).map((test: any, index: number) => (
                      <div key={index} className="pl-4 border-l-2 border-blue-500/30">
                        <div className="text-sm text-gray-400">Input:</div>
                        <div className="font-mono text-gray-300 bg-gray-800/30 p-2 rounded mt-1">{test.input}</div>
                        <div className="text-sm text-gray-400 mt-2">Expected Output:</div>
                        <div className="font-mono text-gray-300 bg-gray-800/30 p-2 rounded mt-1">{test.output}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Hints */}
              {currentProblem.hints && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-3 text-yellow-400">Hints:</h4>
                  <div className="space-y-3">
                    {JSON.parse(currentProblem.hints).map((hint: string, index: number) => (
                      <div key={index} className="pl-4 border-l-2 border-yellow-500/30">
                        <span className="text-gray-300">{hint}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Code Editor */}
      <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
        <Editor
          height="300px"
          defaultLanguage={editorLanguage}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            padding: { top: 20 },
            scrollBeyondLastLine: false,
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',
            tabSize: 2
          }}
          className="rounded-lg overflow-hidden"
        />
      </div>

      {/* Feedback */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            feedback.isCorrect ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
          } border`}
        >
          <p className="text-lg font-semibold">
            {feedback.isCorrect ? '✅ Correct!' : '❌ Not quite right'}
          </p>
          <p className="mt-2 text-gray-300">{feedback.message}</p>
          {feedback.points && (
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`mt-2 text-lg font-bold ${feedback.points > 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {feedback.points > 0 ? '+' : ''}{feedback.points} points
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button
          onClick={onSkip}
          variant="outline"
          className="bg-gray-700/30 text-gray-300 border-gray-600 hover:bg-gray-700/50"
        >
          Skip Problem (-50 points)
        </Button>
        <Button
          onClick={() => onSubmit(code)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8"
        >
          Submit Solution
        </Button>
      </div>
    </div>
  );
}
