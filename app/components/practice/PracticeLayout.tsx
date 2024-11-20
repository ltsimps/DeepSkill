import { ReactNode } from 'react';
import { usePracticeSession } from '../../contexts/PracticeContext';
import { SessionSummary } from './SessionSummary';
import { PracticeProblem } from './PracticeProblem';
import { PracticeErrorBoundary } from './PracticeErrorBoundary';
import { LoadingState } from './LoadingState';
import { PracticeProgress } from './PracticeProgress';
import { ProblemTransition } from './ProblemTransition';

interface PracticeLayoutProps {
  onSubmit: (solution: string) => void;
  onSkip: () => void;
  onStartNew: () => void;
}

export function PracticeLayout({ onSubmit, onSkip, onStartNew }: PracticeLayoutProps) {
  const { state } = usePracticeSession();
  const { isSessionComplete, isLoading, currentProblem } = state;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Practice Session
          </h1>
          {!isSessionComplete && !isLoading && (
            <PracticeProgress />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-32 pb-6 px-6">
        <div className="max-w-4xl mx-auto">
          <PracticeErrorBoundary>
            {isLoading ? (
              <LoadingState />
            ) : isSessionComplete ? (
              <SessionSummary onStartNew={onStartNew} />
            ) : (
              <ProblemTransition problemId={currentProblem?.id || 'loading'}>
                <PracticeProblem 
                  onSubmit={onSubmit}
                  onSkip={onSkip}
                />
              </ProblemTransition>
            )}
          </PracticeErrorBoundary>
        </div>
      </div>
    </div>
  );
}
