import { json, type ActionFunctionArgs } from '@remix-run/node'
import { useLoaderData, useFetcher } from '@remix-run/react'
import { useState, useEffect, useRef } from 'react'
import { CodeFlashcard } from '../components/flashcards/CodeFlashcard'
import { FlashcardFeedback } from '../components/flashcards/FlashcardFeedback'
import { generateProblem, validateSolution } from '../utils/openai.server'
import { Button } from '../components/ui/button'
import Editor from '@monaco-editor/react'
import { prisma } from '../utils/db.server'

export async function loader() {
  // Load all problems from the database
  const problems = await prisma.problem.findMany({
    orderBy: {
      difficulty: 'asc'
    }
  })

  return json({
    problems,
    currentProblem: null,
  })
}

export async function action({ request }: ActionFunctionArgs) {
  console.log('Action called with method:', request.method)
  
  try {
    const formData = await request.formData()
    const intent = formData.get('intent')
    console.log('Action intent:', intent)
    
    if (intent === 'start') {
      try {
        // Get a random problem from the database
        const problemCount = await prisma.problem.count()
        const skip = Math.floor(Math.random() * problemCount)
        const problem = await prisma.problem.findFirst({
          skip,
          take: 1
        })

        if (!problem) {
          return json({ error: 'No problems found' }, { status: 404 })
        }

        // Format the problem for the frontend
        const formattedProblem = {
          problem: problem.description,
          startingCode: problem.type === 'FILL_IN' ? problem.template : problem.startingCode,
          solution: problem.type === 'FILL_IN' ? 
            JSON.parse(problem.fillInSections || '[]')[0]?.solution : 
            problem.solution,
          hints: JSON.parse(problem.hints),
          type: problem.type,
          title: problem.title,
          difficulty: problem.difficulty
        }
        
        return json({ problem: formattedProblem })
      } catch (error) {
        console.error('Error fetching problem:', error)
        return json({ 
          error: error instanceof Error ? error.message : 'Failed to fetch problem'
        }, { status: 500 })
      }
    }

    if (intent === 'validate') {
      const userCode = formData.get('code') as string
      const solution = formData.get('solution') as string
      const language = formData.get('language') as string

      console.log('Validating solution:', { language })

      if (!userCode || !solution || !language) {
        console.error('Missing validation fields:', { userCode, solution, language })
        return json({ error: 'Missing required fields for validation' }, { status: 400 })
      }

      try {
        const result = await validateSolution(userCode, solution, language)
        console.log('Validation result:', result)
        
        if (!result || typeof result !== 'object') {
          console.error('Invalid validation result format:', result)
          return json({ error: 'Invalid validation result format' }, { status: 500 })
        }
        
        if (typeof result.isCorrect !== 'boolean' || !result.feedback) {
          console.error('Missing required validation fields:', result)
          return json({ error: 'Missing required validation fields' }, { status: 500 })
        }
        
        return json({ result })
      } catch (error) {
        console.error('Error validating solution:', error)
        return json({ 
          error: error instanceof Error ? error.message : 'Failed to validate solution'
        }, { status: 500 })
      }
    }

    console.error('Invalid intent:', intent)
    return json({ error: 'Invalid intent' }, { status: 400 })
  } catch (error) {
    console.error('Action error:', error)
    return json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

function IntroAnimation() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="relative w-96 h-96 mb-8" />
  }

  return (
    <div className="relative w-96 h-96 mb-8">
      {/* Nebula core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 opacity-75 blur-xl animate-pulse" />
        <div className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60 blur-lg animate-pulse-slow" />
      </div>
      
      {/* Orbiting elements */}
      <div className="absolute inset-0">
        <div className="absolute w-8 h-8 rounded-full bg-blue-400 blur-sm animate-orbit" 
             style={{top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(0deg) translateX(150px)'}} />
        <div className="absolute w-6 h-6 rounded-full bg-purple-400 blur-sm animate-orbit-reverse"
             style={{top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(120deg) translateX(120px)'}} />
        <div className="absolute w-4 h-4 rounded-full bg-pink-400 blur-sm animate-orbit-slow"
             style={{top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(240deg) translateX(100px)'}} />
      </div>

      {/* Static stars instead of random positions */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => {
          const top = `${(i * 17) % 100}%`
          const left = `${(i * 23) % 100}%`
          const delay = `${(i * 0.3) % 2}s`
          return (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                top,
                left,
                animationDelay: delay
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

function PracticeDashboard({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <IntroAnimation />
      <Button
        onClick={onStart}
        size="lg"
        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 text-lg hover:opacity-90 transition-opacity mt-8"
      >
        Begin Practice
      </Button>
    </div>
  )
}

function PracticeInterface({ 
  problem, 
  onSubmit,
  feedback
}: { 
  problem: {
    problem: string
    startingCode?: string
    hints?: string[]
    type: string
    title: string
    difficulty: string
  }
  onSubmit: (code: string) => void
  feedback?: {
    isCorrect?: boolean
    message?: string
  }
}) {
  const [code, setCode] = useState(problem.startingCode || '')
  const [showHint, setShowHint] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (feedback?.isCorrect) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Top Bar with Progress */}
      <div className="fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              problem.difficulty === 'EASY' ? 'bg-green-500/20 text-green-400' :
              problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {problem.difficulty}
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              {problem.type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">XP: </span>
            <span className="text-lg font-bold text-yellow-400">100</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-6 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Problem Title and Description */}
          <div className="bg-gray-800/50 rounded-lg p-6 mb-6 backdrop-blur-sm border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {problem.title}
            </h2>
            <p className="text-gray-300 whitespace-pre-wrap">{problem.problem}</p>
          </div>

          {/* Hints */}
          {problem.hints && problem.hints.length > 0 && (
            <div className="mb-6">
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
                    {problem.hints.map((hint, index) => (
                      <li key={index} className="text-yellow-200">{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Code Editor */}
          <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm border border-gray-700">
            <Editor
              height="300px"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                padding: { top: 20 },
              }}
              className="rounded-lg overflow-hidden"
            />
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`mt-6 p-4 rounded-lg border ${
              feedback.isCorrect 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  feedback.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {feedback.isCorrect ? '✨' : '❌'}
                </div>
                <div>
                  <p className="font-medium">
                    {feedback.isCorrect ? 'Great job!' : 'Not quite right'}
                  </p>
                  {feedback.message && (
                    <p className="text-sm mt-1 opacity-80">{feedback.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6">
            <Button 
              onClick={() => onSubmit(code)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 transition-opacity py-6 text-lg font-bold"
            >
              Submit Solution 🚀
            </Button>
          </div>
        </div>
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none">
          {/* Add confetti animation here */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-confetti">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#98FB98'][i % 4],
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animation: `fall ${1 + Math.random() * 2}s linear forwards`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PracticePage() {
  const { problems } = useLoaderData<typeof loader>()
  const [currentProblem, setCurrentProblem] = useState<any>(null)
  const [feedback, setFeedback] = useState<any>(null)
  const fetcher = useFetcher()

  useEffect(() => {
    if (fetcher.data?.problem) {
      setCurrentProblem(fetcher.data.problem)
      setFeedback(null)
    }
    if (fetcher.data?.result) {
      setFeedback({
        isCorrect: fetcher.data.result.isCorrect,
        message: fetcher.data.result.feedback
      })
    }
  }, [fetcher.data])

  const handleStart = () => {
    fetcher.submit(
      { intent: 'start' },
      { method: 'post' }
    )
  }

  const handleSubmit = (code: string) => {
    if (!currentProblem?.solution) return
    
    fetcher.submit(
      {
        intent: 'validate',
        code,
        solution: currentProblem.solution,
        language: 'javascript'
      },
      { method: 'post' }
    )
  }

  if (!currentProblem) {
    return <PracticeDashboard onStart={handleStart} />
  }

  return (
    <PracticeInterface
      problem={currentProblem}
      onSubmit={handleSubmit}
      feedback={feedback}
    />
  )
}
