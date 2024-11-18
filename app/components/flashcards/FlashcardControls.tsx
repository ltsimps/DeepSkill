import { Button } from '../ui/button'

interface FlashcardControlsProps {
  onNext: () => void
  onPrevious: () => void
  onSkip?: () => void
  showSkip?: boolean
  isFirstCard?: boolean
  isLastCard?: boolean
}

export function FlashcardControls({
  onNext,
  onPrevious,
  onSkip,
  showSkip = true,
  isFirstCard = false,
  isLastCard = false,
}: FlashcardControlsProps) {
  return (
    <div className="flex justify-between items-center w-full max-w-4xl mx-auto mt-8">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstCard}
      >
        Previous
      </Button>

      <div className="flex gap-4">
        {showSkip && onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
        )}
      </div>

      <Button
        variant="outline"
        onClick={onNext}
        disabled={isLastCard}
      >
        Next
      </Button>
    </div>
  )
}
