import { useState } from 'react';
import { Button } from '../ui/button';

interface ProblemHintsProps {
  hints: string[];
}

export function ProblemHints({ hints }: ProblemHintsProps) {
  const [showHint, setShowHint] = useState(false);

  if (!hints || hints.length === 0) {
    return null;
  }

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setShowHint(!showHint)}
        className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
      >
        {showHint ? '🎯 Hide Hint' : '💡 Need a Hint?'}
      </Button>
      {showHint && (
        <div className="mt-2 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <ul className="list-disc list-inside space-y-2">
            {hints.map((hint, index) => (
              <li key={index} className="text-yellow-200">{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
