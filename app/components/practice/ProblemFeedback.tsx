import type { ProblemFeedback as FeedbackType } from '../../types/practice';

interface ProblemFeedbackProps {
  feedback: FeedbackType;
}

export function ProblemFeedback({ feedback }: ProblemFeedbackProps) {
  if (!feedback) return null;

  return (
    <div className={`p-4 rounded-lg ${
      feedback.isCorrect ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'
    } border`}>
      <p className="text-lg font-semibold mb-2">
        {feedback.isCorrect ? '✅ Correct!' : '❌ Not quite right'}
      </p>
      <p className="text-gray-300">{feedback.feedback}</p>
      {!feedback.isCorrect && feedback.hint && (
        <div className="mt-4">
          <p className="text-yellow-400 font-semibold">💡 Hint:</p>
          <p className="text-yellow-300">{feedback.hint}</p>
        </div>
      )}
      {feedback.suggestions && feedback.suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-blue-400 font-semibold">🔍 Suggestions for improvement:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {feedback.suggestions.map((suggestion, index) => (
              <li key={index} className="text-blue-300">{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
