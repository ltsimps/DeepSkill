import { useEffect } from 'react';
import { Button } from '../ui/button';
import { usePracticeSession } from '../../contexts/PracticeContext';

interface ErrorDisplayProps {
  error: Error;
  onRetry: () => void;
}

function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="min-h-[300px] flex items-center justify-center">
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 max-w-md text-center">
        <h3 className="text-xl font-semibold text-red-400 mb-4">
          Oops! Something went wrong
        </h3>
        <p className="text-gray-300 mb-6">
          {error.message || 'An error occurred while loading the practice session.'}
        </p>
        <Button
          onClick={onRetry}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}

interface PracticeErrorBoundaryProps {
  children: React.ReactNode;
}

export function PracticeErrorBoundary({ children }: PracticeErrorBoundaryProps) {
  const { state, dispatch } = usePracticeSession();
  const { error } = state;

  const handleRetry = () => {
    dispatch({ type: 'CLEAR_ERROR' });
    dispatch({ type: 'START_SESSION' });
  };

  // Reset error state when unmounting
  useEffect(() => {
    return () => {
      dispatch({ type: 'CLEAR_ERROR' });
    };
  }, [dispatch]);

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  return <>{children}</>;
}
