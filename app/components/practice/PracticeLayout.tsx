import { useLoaderData } from '@remix-run/react';
import { usePracticeSession } from '../../contexts/PracticeContext';
import { LoadingState } from './LoadingState';
import { PracticeProgress } from './PracticeProgress';
import { ProblemTransition } from './ProblemTransition';
import { LanguageDropdown } from '../common/LanguageDropdown';
import type { LoaderData, ProgrammingLanguage } from '../../types/practice';

interface PracticeLayoutProps {
  onSubmit: (solution: string) => void;
  onSkip: () => void;
  onStartNew: () => void;
}

export function PracticeLayout({ onSubmit, onSkip, onStartNew }: PracticeLayoutProps) {
  const { state, dispatch } = usePracticeSession();
  const { stats } = useLoaderData<LoaderData>();
  const { isSessionComplete, isLoading, currentProblem, sessionId, selectedLanguage } = state;

  const handleLanguageSelect = (language: ProgrammingLanguage) => {
    dispatch({ type: 'SET_LANGUAGE', language });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Practice Session
            </h1>
            <div className="flex items-center space-x-4">
              <LanguageDropdown 
                selectedLanguage={selectedLanguage} 
                onLanguageSelect={handleLanguageSelect}
                className="w-48"
              />
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400">⚡</span>
                <span className="text-sm font-medium">{stats.totalXp.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-400">🔥</span>
                <span className="text-sm font-medium">{stats.streak} day streak</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-purple-400">📈</span>
                <span className="text-sm font-medium">Level {stats.level}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto pt-20 pb-8">
        {isLoading ? (
          <LoadingState />
        ) : isSessionComplete ? (
          <PracticeProgress />
        ) : currentProblem ? (
          <ProblemTransition
            problem={currentProblem}
            onSubmit={onSubmit}
            onSkip={onSkip}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Ready to practice?</h2>
            <button
              onClick={onStartNew}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start New Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
