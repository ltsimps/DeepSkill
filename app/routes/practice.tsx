import { json, type ActionFunctionArgs } from '@remix-run/node'
import { useLoaderData, useFetcher } from '@remix-run/react'
import { useState, useEffect, useRef } from 'react'
import { CodeFlashcard } from '../components/flashcards/CodeFlashcard'
import { FlashcardFeedback } from '../components/flashcards/FlashcardFeedback'
import { generateProblem, validateSolution } from '../utils/openai.server'
import { Button } from '../components/ui/button'
import Editor from '@monaco-editor/react'

export async function loader() {
  return json({
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
        console.log('Generating problem...')
        const problem = await generateProblem({
          prompt: "Write a function that finds the maximum number in an array",
          language: "javascript",
          difficulty: "beginner"
        })
        console.log('Generated problem:', problem)
        
        // Validate the problem structure
        if (!problem || typeof problem !== 'object') {
          console.error('Invalid problem format:', problem)
          return json({ error: 'Invalid problem format' }, { status: 500 })
        }
        
        if (!problem.problem || !problem.startingCode || !problem.solution) {
          console.error('Missing required problem fields:', problem)
          return json({ error: 'Missing required problem fields' }, { status: 500 })
        }
        
        return json({ problem })
      } catch (error) {
        console.error('Error generating problem:', error)
        return json({ 
          error: error instanceof Error ? error.message : 'Failed to generate problem'
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
  onSubmit 
}: { 
  problem: {
    problem: string
    startingCode?: string
    hints?: string[]
  }
  onSubmit: (code: string) => void 
}) {
  const [code, setCode] = useState('')
  
  useEffect(() => {
    if (problem?.startingCode) {
      setCode(problem.startingCode)
    }
  }, [problem])

  return (
    <div className="h-[calc(100vh-6rem)] flex">
      {/* Problem Description */}
      <div className="w-1/2 p-6 border-r overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Problem</h2>
        <div className="prose dark:prose-invert">
          <p>{problem.problem}</p>
          {problem.hints && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Hints:</h3>
              <ul>
                {problem.hints.map((hint: string, index: number) => (
                  <li key={index}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="w-1/2 flex flex-col">
        <div className="flex-1">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
        <div className="p-4 border-t">
          <Button 
            onClick={() => onSubmit(code)}
            className="w-full"
          >
            Submit Solution
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PracticePage() {
  const { currentProblem: initialProblem } = useLoaderData<typeof loader>()
  const [currentProblem, setCurrentProblem] = useState(initialProblem)
  const [feedback, setFeedback] = useState<any>(null)
  const fetcher = useFetcher()

  // Log fetcher state changes
  useEffect(() => {
    console.log('Fetcher state:', {
      state: fetcher.state,
      data: fetcher.data,
      formData: fetcher.formData
    })
  }, [fetcher.state, fetcher.data])

  // Handle fetcher state
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      console.log('Received data:', fetcher.data)
      if (fetcher.data.error) {
        console.error('Error from server:', fetcher.data.error)
        return
      }
      if (fetcher.data.problem) {
        console.log('Setting problem:', fetcher.data.problem)
        setCurrentProblem(fetcher.data.problem)
        setFeedback(null)
      } else if (fetcher.data.result) {
        console.log('Setting feedback:', fetcher.data.result)
        setFeedback(fetcher.data.result)
      }
    }
  }, [fetcher.state, fetcher.data])

  const handleStart = () => {
    console.log('Starting practice...')
    const formData = new FormData()
    formData.append('intent', 'start')
    fetcher.submit(formData, { method: 'post' })
  }

  const handleSubmit = (code: string) => {
    if (!currentProblem) {
      console.error('No current problem available')
      return
    }
    console.log('Submitting solution...')
    const formData = new FormData()
    formData.append('intent', 'validate')
    formData.append('code', code)
    formData.append('solution', currentProblem.solution)
    formData.append('language', currentProblem.language || 'javascript')
    fetcher.submit(formData, { method: 'post' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {!currentProblem ? (
        <PracticeDashboard onStart={handleStart} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          <PracticeInterface 
            problem={currentProblem} 
            onSubmit={handleSubmit}
          />
          {feedback && (
            <div className="fixed bottom-4 right-4 max-w-md">
              <FlashcardFeedback
                isCorrect={feedback.isCorrect}
                message={feedback.feedback}
                hint={feedback.hint}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
