import { useState, useCallback } from 'react';
import { useFetcher } from '@remix-run/react';
import type { GeneratedProblem, ProblemFeedback } from '../types/practice';

interface PracticeSessionState {
  sessionId: string | null;
  currentProblem: GeneratedProblem | null;
  isLoading: boolean;
  error: Error | null;
}

export function usePracticeSession() {
  const fetcher = useFetcher();
  const [state, setState] = useState<PracticeSessionState>({
    sessionId: null,
    currentProblem: null,
    isLoading: false,
    error: null
  });

  const startSession = useCallback((language: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    fetcher.submit(
      { 
        intent: 'startSession',
        language 
      },
      { method: 'post' }
    );
  }, [fetcher]);

  const submitSolution = useCallback((solution: string) => {
    if (!state.currentProblem || !state.sessionId) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    fetcher.submit(
      {
        intent: 'submitSolution',
        solution,
        problemId: state.currentProblem.id,
        sessionId: state.sessionId,
        startTime: Date.now().toString(),
        language: state.currentProblem.language
      },
      { method: 'post' }
    );
  }, [fetcher, state.currentProblem, state.sessionId]);

  const skipProblem = useCallback(() => {
    if (!state.currentProblem || !state.sessionId) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    fetcher.submit(
      {
        intent: 'skipProblem',
        problemId: state.currentProblem.id,
        sessionId: state.sessionId
      },
      { method: 'post' }
    );
  }, [fetcher, state.currentProblem, state.sessionId]);

  // Handle fetcher updates
  if (fetcher.data) {
    if (fetcher.data.error) {
      setState(prev => ({
        ...prev,
        error: new Error(fetcher.data.error),
        isLoading: false
      }));
    } else if (fetcher.data.session) {
      setState(prev => ({
        ...prev,
        sessionId: fetcher.data.session.id,
        currentProblem: fetcher.data.session.problems[0]?.problem || null,
        isLoading: false,
        error: null
      }));
    }
  }

  return {
    ...state,
    startSession,
    submitSolution,
    skipProblem
  };
}
