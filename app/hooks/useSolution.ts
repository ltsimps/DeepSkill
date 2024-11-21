import { useFetcher } from '@remix-run/react';
import type { GeneratedProblem } from '../types/practice';

interface SubmitSolutionParams {
  solution: string;
  problem: GeneratedProblem;
  sessionId: string;
}

export function useSolution() {
  const fetcher = useFetcher();

  // Derive submission state from fetcher
  const isLoading = fetcher.state === 'submitting';
  const error = fetcher.data?.error ? new Error(fetcher.data.error) : null;
  const feedback = fetcher.data?.feedback ?? null;

  const submitSolution = ({ solution, problem, sessionId }: SubmitSolutionParams) => {
    if (!sessionId || !problem) return;

    fetcher.submit(
      {
        intent: 'submitSolution',
        solution,
        problemId: problem.id,
        sessionId,
        startTime: Date.now().toString(),
        language: problem.language
      },
      { method: 'post' }
    );
  };

  return {
    submitSolution,
    isLoading,
    error,
    feedback
  };
}
