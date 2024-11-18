import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from '../ui/button'

interface CodeFlashcardProps {
  prompt: string
  language: string
  onSubmit: (code: string) => void
  initialCode?: string
  showHints?: boolean
}

export function CodeFlashcard({
  prompt,
  language,
  onSubmit,
  initialCode = '',
  showHints = true,
}: CodeFlashcardProps) {
  const [code, setCode] = useState(initialCode)
  const [isLoading, setIsLoading] = useState(false)

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await onSubmit(code)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Prompt Section */}
      <div className="bg-card p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Problem:</h3>
        <p className="text-muted-foreground">{prompt}</p>
      </div>

      {/* Code Editor */}
      <div className="border rounded-lg overflow-hidden">
        <Editor
          height="400px"
          defaultLanguage={language}
          value={code}
          onChange={handleEditorChange}
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

      {/* Controls */}
      <div className="flex justify-end gap-4">
        {showHints && (
          <Button variant="outline" onClick={() => {}}>
            Get Hint
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Checking...' : 'Submit'}
        </Button>
      </div>
    </div>
  )
}
