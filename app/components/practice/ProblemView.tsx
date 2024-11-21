import React, { useState, useMemo, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import type { SupportedLanguage } from '~/routes/practice';
import { ClientOnly } from '../common/ClientOnly';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import ReactMarkdown from 'react-markdown';

interface ProblemViewProps {
  problem: {
    id: string;
    title: string;
    description: string;
    startingCode: string;
    difficulty: string;
    language: SupportedLanguage;
    timeLimit: number;
    hints: string;
  };
  onSubmit: (code: string) => void;
  isSubmitting: boolean;
  stats: {
    streak: number;
    xp: number;
    level: number;
    nextLevelXp: number;
  };
}

export function ProblemView({ problem, onSubmit, isSubmitting, stats }: ProblemViewProps) {
  const [code, setCode] = useState(problem?.startingCode || '');
  const [showHints, setShowHints] = useState(false);
  const [timeLeft, setTimeLeft] = useState(problem?.timeLimit || 0);
  const hints = useMemo(() => {
    try {
      return JSON.parse(problem?.hints || '[]');
    } catch {
      return [];
    }
  }, [problem?.hints]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const xpProgress = (stats.xp / stats.nextLevelXp) * 100;

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">No More Problems</h2>
          <p>You've completed all available problems for today. Come back tomorrow for more!</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 bg-gray-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">{problem.title}</h1>
          <span className={`px-2 py-1 rounded ${
            problem.difficulty === 'EASY' ? 'bg-green-600' :
            problem.difficulty === 'MEDIUM' ? 'bg-yellow-600' :
            'bg-red-600'
          }`}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">🔥</span>
            <span>{stats.streak}</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <span className="text-blue-400 mr-2">⭐</span>
              <span>Level {stats.level}</span>
            </div>
            <div className="w-32 h-2 bg-gray-700 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
          <div className="text-xl">⏰ {formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 flex-grow">
        <div className="p-4 overflow-y-auto">
          <div className="prose prose-invert">
            <ReactMarkdown>{problem.description}</ReactMarkdown>
          </div>
          {hints.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowHints(!showHints)}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              >
                {showHints ? 'Hide Hints' : 'Show Hints'}
              </button>
              {showHints && (
                <div className="mt-2 space-y-2">
                  {hints.map((hint: string, index: number) => (
                    <div key={index} className="p-2 bg-gray-700 rounded">
                      {hint}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-l border-gray-700">
          <Editor
            height="100%"
            language={problem.language}
            theme="vs-dark"
            value={code}
            onChange={value => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => onSubmit(code)}
          disabled={isSubmitting}
          className={`px-6 py-2 rounded ${
            isSubmitting
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Solution'}
        </button>
      </div>
    </div>
  );
}
