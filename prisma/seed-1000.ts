import { PrismaClient } from '@prisma/client'
import { createScenarioProblem, createFillInProblem } from './seed-utils'

const prisma = new PrismaClient()

// Problem distribution constants
const TOTAL_PROBLEMS = 1000
const PYTHON_SCENARIO_PROBLEMS = 500
const LEETCODE_PROBLEMS = 500

// Difficulty distribution (for each category)
const DIFFICULTY_DISTRIBUTION = {
  EASY: 0.4,    // 40%
  MEDIUM: 0.4,  // 40%
  HARD: 0.2     // 20%
}

// Topics for scenario-based problems
const PYTHON_SCENARIOS = [
  {
    topic: 'File Handling',
    templates: [
      'Write a function that reads a CSV file and returns a list of dictionaries',
      'Create a function to process log files and extract error messages',
      'Implement a function to merge multiple text files into one',
      'Write a script to monitor a directory for file changes',
    ]
  },
  {
    topic: 'Data Processing',
    templates: [
      'Create a function to clean and normalize data from different sources',
      'Implement a data transformation pipeline',
      'Write a function to aggregate time series data',
      'Create a function to detect outliers in a dataset',
    ]
  },
  {
    topic: 'API Integration',
    templates: [
      'Write a function to fetch and process data from a REST API',
      'Implement error handling for API requests',
      'Create a rate-limited API client',
      'Write a caching layer for API responses',
    ]
  },
  {
    topic: 'Database Operations',
    templates: [
      'Write a function to safely update multiple database records',
      'Implement a connection pool manager',
      'Create a function to migrate data between databases',
      'Write a query builder for complex SQL operations',
    ]
  },
  {
    topic: 'System Integration',
    templates: [
      'Create a message queue consumer',
      'Implement a service discovery client',
      'Write a function to handle distributed locks',
      'Create a circuit breaker implementation',
    ]
  }
]

// Topics for LeetCode-style problems
const LEETCODE_TOPICS = [
  {
    topic: 'Arrays & Strings',
    templates: [
      'Implement a sliding window algorithm to find the longest substring without repeating characters',
      'Create a function to find all anagrams in a string',
      'Write an algorithm to rotate an array by k steps',
      'Implement a solution for the container with most water problem',
    ]
  },
  {
    topic: 'Dynamic Programming',
    templates: [
      'Solve the longest increasing subsequence problem',
      'Implement a solution for the coin change problem',
      'Create a function to find the longest common subsequence',
      'Write an algorithm for the knapsack problem',
    ]
  },
  {
    topic: 'Trees & Graphs',
    templates: [
      'Implement a function to serialize and deserialize a binary tree',
      'Create an algorithm to find the shortest path in a weighted graph',
      'Write a solution for the lowest common ancestor problem',
      'Implement a trie data structure with search and autocomplete',
    ]
  },
  {
    topic: 'System Design',
    templates: [
      'Implement a thread-safe cache with LRU eviction',
      'Create a rate limiter class',
      'Design a tiny URL service',
      'Implement a concurrent job scheduler',
    ]
  }
]

function generateProblem(index: number, isScenario: boolean) {
  const difficulty = Object.entries(DIFFICULTY_DISTRIBUTION).find(([_, threshold], i, arr) => {
    const sum = arr.slice(0, i + 1).reduce((acc, [__, t]) => acc + t, 0)
    return Math.random() <= sum
  })?.[0] as 'EASY' | 'MEDIUM' | 'HARD'

  if (isScenario) {
    const scenario = PYTHON_SCENARIOS[Math.floor(Math.random() * PYTHON_SCENARIOS.length)]
    const template = scenario.templates[Math.floor(Math.random() * scenario.templates.length)]
    
    return {
      title: `${scenario.topic}: ${template}`,
      difficulty,
      type: 'SCENARIO',
      language: 'python',
      description: template,
      problem: `You are working on a ${scenario.topic.toLowerCase()} system. ${template}`,
      startingCode: '# Your implementation here',
      solution: '# Solution will be provided by the system',
      testCases: JSON.stringify(['Basic functionality test', 'Edge case test', 'Error handling test']),
      hints: JSON.stringify(['Consider error cases', 'Think about scalability', 'Use appropriate Python libraries']),
      tags: JSON.stringify([scenario.topic.toLowerCase(), 'python', difficulty.toLowerCase()]),
      timeLimit: 300,
      baseComplexity: difficulty === 'EASY' ? 0.5 : difficulty === 'MEDIUM' ? 0.7 : 0.9,
      source: 'SEEDED'
    }
  } else {
    const topic = LEETCODE_TOPICS[Math.floor(Math.random() * LEETCODE_TOPICS.length)]
    const template = topic.templates[Math.floor(Math.random() * topic.templates.length)]
    
    return {
      title: template,
      difficulty,
      type: 'FILL_IN',
      language: 'python',
      description: `Implement a solution for the following problem: ${template}`,
      problem: template,
      startingCode: 'def solution():\n    # Your implementation here\n    pass',
      solution: '# Solution will be provided by the system',
      testCases: JSON.stringify(['Basic test case', 'Edge case', 'Performance test']),
      hints: JSON.stringify(['Think about edge cases', 'Consider time complexity', 'Look for optimal solutions']),
      tags: JSON.stringify([topic.topic.toLowerCase().replace(/&/g, '').replace(/\s+/g, '-'), 'algorithms', difficulty.toLowerCase()]),
      timeLimit: 300,
      baseComplexity: difficulty === 'EASY' ? 0.5 : difficulty === 'MEDIUM' ? 0.7 : 0.9,
      source: 'SEEDED'
    }
  }
}

async function seed() {
  console.log('🌱 Starting database seed...')

  // Clear existing problems
  await prisma.problem.deleteMany({})
  console.log('Cleared existing problems')

  // Generate Python scenario problems
  console.log('Generating Python scenario problems...')
  for (let i = 0; i < PYTHON_SCENARIO_PROBLEMS; i++) {
    const problem = generateProblem(i, true)
    await prisma.problem.create({ data: problem })
    if (i % 50 === 0) console.log(`Created ${i} scenario problems`)
  }

  // Generate LeetCode-style problems
  console.log('Generating LeetCode-style problems...')
  for (let i = 0; i < LEETCODE_PROBLEMS; i++) {
    const problem = generateProblem(i, false)
    await prisma.problem.create({ data: problem })
    if (i % 50 === 0) console.log(`Created ${i} LeetCode problems`)
  }

  console.log('✅ Database seeded successfully!')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
