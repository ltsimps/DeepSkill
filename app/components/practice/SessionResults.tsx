import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';

interface ProblemResult {
  problemId: string;
  isCorrect: boolean;
  feedback: string;
  timeSpent: number;
}

interface SessionResultsProps {
  results: {
    totalXP: number;
    problemResults: ProblemResult[];
  };
  onClose: () => void;
}

export function SessionResults({ results, onClose }: SessionResultsProps) {
  const totalProblems = results.problemResults.length;
  const correctProblems = results.problemResults.filter(r => r.isCorrect).length;
  const accuracy = (correctProblems / totalProblems) * 100;
  
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Session Complete! 🎉</h2>
          <p className="text-muted-foreground">
            Here's how you did in this practice session
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{results.totalXP}</div>
            <div className="text-sm text-muted-foreground">XP Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalProblems}</div>
            <div className="text-sm text-muted-foreground">Problems Attempted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{accuracy.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Problem Breakdown</h3>
          <div className="space-y-4">
            {results.problemResults.map((result, index) => (
              <div key={result.problemId} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={result.isCorrect ? "text-green-500" : "text-red-500"}>
                      {result.isCorrect ? "✓" : "✗"}
                    </span>
                    <span>Problem {index + 1}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(result.timeSpent)}s
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{result.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
