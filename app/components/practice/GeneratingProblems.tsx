import { useEffect, useState } from 'react';

interface GeneratingProblemsProps {
  jobId: string;
  onComplete?: () => void;
}

export function GeneratingProblems({ jobId, onComplete }: GeneratingProblemsProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'generating' | 'completed' | 'error'>('generating');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/problem-generation/${jobId}`);
        const data = await response.json();
        
        if (data.status === 'COMPLETED') {
          setStatus('completed');
          onComplete?.();
          clearInterval(intervalId);
        } else if (data.status === 'FAILED') {
          setStatus('error');
          setError(data.error);
          clearInterval(intervalId);
        } else if (data.status === 'IN_PROGRESS') {
          setProgress(data.progress);
        }
      } catch (err) {
        setStatus('error');
        setError('Failed to check generation progress');
        clearInterval(intervalId);
      }
    };

    intervalId = setInterval(checkProgress, 1000);
    return () => clearInterval(intervalId);
  }, [jobId, onComplete]);

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
          <span>{15} / {100}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Problems available:</span>
          <span>{0}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Problems remaining today:</span>
          <span>{5}</span>
        </div>
      </div>
    </div>
  );
}
