import { usePracticeSession } from '../../contexts/PracticeContext';

const loadingMessages = {
  'START_SESSION': 'Starting new practice session...',
  'SET_PROBLEM': 'Loading next problem...',
  'SKIP_PROBLEM': 'Skipping problem...',
  'COMPLETE_PROBLEM': 'Checking solution...',
  'default': 'Loading...'
};

export function LoadingState() {
  const { state } = usePracticeSession();
  const { lastAction } = state;
  
  const message = lastAction ? loadingMessages[lastAction as keyof typeof loadingMessages] || loadingMessages.default : loadingMessages.default;

  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center">
      <div className="relative">
        {/* Pulsing circle animation */}
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-25"></div>
        <div className="relative rounded-full bg-blue-500 h-12 w-12"></div>
      </div>
      <p className="mt-6 text-lg text-gray-300">{message}</p>
    </div>
  );
}
