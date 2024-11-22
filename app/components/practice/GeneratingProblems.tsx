import { useEffect, useState } from 'react';
import { DAILY_PROBLEM_LIMIT } from '../../services/practice.server';

interface GeneratingProblemsProps {
  jobId: string;
  onComplete?: () => void;
}

interface ProblemGenerationResponse {
  status: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS';
  error?: string;
  progress?: number;
}

export function GeneratingProblems({ jobId, onComplete }: GeneratingProblemsProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'generating' | 'completed' | 'error'>('generating');
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(0);
  const [available, setAvailable] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    void (async () => {
      const checkProgress = async () => {
        try {
          const response = await fetch(`/api/problem-generation/${jobId}`);
          const data = await response.json();
          
          // Add type guard to ensure data matches ProblemGenerationResponse
          if (
            typeof data === 'object' && 
            data !== null && 
            'status' in data && 
            typeof data.status === 'string' &&
            ['COMPLETED', 'FAILED', 'IN_PROGRESS'].includes(data.status)
          ) {
            const typedData: ProblemGenerationResponse = {
              ...data,
              status: data.status as 'COMPLETED' | 'FAILED' | 'IN_PROGRESS',
            };
            if (typedData.status === 'COMPLETED') {
              setStatus('completed');
              onComplete?.();
              clearInterval(intervalId);
            } else if (typedData.status === 'FAILED') {
              setStatus('error');
              setError(typedData.error || 'Unknown error occurred');
              clearInterval(intervalId);
            } else if (typedData.status === 'IN_PROGRESS') {
              setProgress(typedData.progress || 0);
            }
          } else {
            setStatus('error');
            setError('Invalid response from server');
            clearInterval(intervalId);
          }
        } catch (err) {
          setStatus('error');
          setError('Failed to check generation progress');
          clearInterval(intervalId);
        }
      };

      // Initial check
      await checkProgress();
      // Then set up interval
      intervalId = setInterval(() => {
        void checkProgress();
      }, 1000);
    })();

    return () => clearInterval(intervalId);
  }, [jobId, onComplete]);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/practice/counts');
        const data = await response.json();
        setAttempted(data.attempted);
        setAvailable(data.available);
        setRemaining(Math.max(0, DAILY_PROBLEM_LIMIT - data.attempted));
      } catch (error) {
        console.error('Failed to fetch problem counts:', error);
        // Optionally set some error state here if needed
        setError('Failed to fetch problem counts');
      }
    })();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      {status === 'generating' && (
        <>
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-semibold">
              {progress}/5
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">Generating Problems</h3>
            <p className="text-gray-400">Creating new practice problems tailored to your level...</p>
          </div>
        </>
      )}

      {status === 'error' && (
        <div className="text-center text-red-500">
          <h3 className="text-xl font-semibold mb-2">Error Generating Problems</h3>
          <p>{error || 'An unexpected error occurred'}</p>
        </div>
      )}

      <div className="mt-6 space-y-4 w-full max-w-sm">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Problems attempted today:</span>
          <span>{attempted} / {available}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Problems available:</span>
          <span>{available}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Problems remaining today:</span>
          <span>{remaining}</span>
        </div>
      </div>
    </div>
  );
}
