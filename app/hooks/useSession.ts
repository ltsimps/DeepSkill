import { useState, useCallback } from 'react';
import { useFetcher } from '@remix-run/react';
import type { ProgrammingLanguage } from '../types/practice';

interface SessionState {
  id: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useSession() {
  const fetcher = useFetcher();
  const [state, setState] = useState<SessionState>({
    id: null,
    isLoading: false,
    error: null
  });

  const startSession = useCallback((language: ProgrammingLanguage) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    fetcher.submit(
      { intent: 'startSession', language },
      { method: 'post' }
    );
  }, [fetcher]);

  // Handle session updates from fetcher
  const sessionId = fetcher.data?.session?.id ?? state.id;
  const error = fetcher.data?.error ? new Error(fetcher.data.error) : null;
  const isLoading = fetcher.state === 'submitting';

  return {
    sessionId,
    isLoading,
    error,
    startSession
  };
}
