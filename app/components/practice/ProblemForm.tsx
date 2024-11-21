import { useState } from 'react'
import type { ProblemInput, ProgrammingLanguage } from '../../utils/problem.server'

interface ProblemFormProps {
  onSubmit: (problem: ProblemInput) => void
  initialData?: Partial<ProblemInput>
  error?: string
  defaultLanguage?: ProgrammingLanguage
}

export function ProblemForm({ onSubmit, initialData = {}, error, defaultLanguage = 'python' }: ProblemFormProps) {
  const [formData, setFormData] = useState<Partial<ProblemInput>>({
    title: '',
    description: '',
    difficulty: 'EASY',
    language: defaultLanguage,
    problem: '',
    startingCode: '',
    solution: '',
    hints: [],
    testCases: [],
    type: 'SCENARIO',
    source: 'GENERATED',
    ...initialData
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData as ProblemInput)
    }
  }

  const validateForm = (): boolean => {
    const requiredFields = ['title', 'description', 'difficulty', 'language', 'problem', 'solution']
    return requiredFields.every(field => formData[field as keyof ProblemInput]?.trim())
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleArrayChange = (name: 'hints' | 'testCases', value: string) => {
    const array = value.split('\n').filter(item => item.trim())
    setFormData(prev => ({ ...prev, [name]: array }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500">{error}</div>}
      
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Difficulty</label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Language</label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Problem Statement</label>
        <textarea
          name="problem"
          value={formData.problem}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
          rows={5}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Starting Code (Optional)</label>
        <textarea
          name="startingCode"
          value={formData.startingCode}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm font-mono"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Solution</label>
        <textarea
          name="solution"
          value={formData.solution}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm font-mono"
          required
          rows={5}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Hints (One per line)</label>
        <textarea
          name="hints"
          value={formData.hints?.join('\n')}
          onChange={(e) => handleArrayChange('hints', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Test Cases (One per line)</label>
        <textarea
          name="testCases"
          value={formData.testCases?.join('\n')}
          onChange={(e) => handleArrayChange('testCases', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={3}
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Create Problem
      </button>
    </form>
  )
}
