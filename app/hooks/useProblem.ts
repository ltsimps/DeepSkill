import { useFetcher } from '@remix-run/react';
import type { GeneratedProblem } from '../types/practice';

export function useProblem(sessionId: string | null) {
  const fetcher = useFetcher();

  // Derive problem state from fetcher data
  const currentProblem = fetcher.data?.session?.problems[0]?.problem ?? null;
  const error = fetcher.data?.error ? new Error(fetcher.data.error) : null;
  const isLoading = fetcher.state === 'submitting';

  const skipProblem = () => {
    if (!sessionId || !currentProblem) return;
    
    fetcher.submit(
      {
        intent: 'skipProblem',
        problemId: currentProblem.id,
        sessionId
      },
      { method: 'post' }
    );
  };

  return {
    currentProblem,
    isLoading,
    error,
    skipProblem
  };
}
