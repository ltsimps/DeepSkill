import { Icon } from '../ui/icon'

interface FlashcardFeedbackProps {
  isCorrect?: boolean
  message?: string
  hint?: string
}

export function FlashcardFeedback({
  isCorrect,
  message,
  hint,
}: FlashcardFeedbackProps) {
  if (!message && !hint) return null

  return (
    <div className="w-full max-w-4xl mx-auto mt-4">
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            isCorrect
              ? 'bg-green-500/10 text-green-500'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          <Icon
            name={isCorrect ? 'check' : 'x'}
            className="h-5 w-5 mt-0.5"
          />
          <div>
            <p className="font-medium">{message}</p>
            {hint && (
              <p className="text-sm mt-1 text-muted-foreground">
                Hint: {hint}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
