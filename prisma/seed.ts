import { PrismaClient } from '@prisma/client'
import { prisma } from '#app/utils/db.server.ts'

// Helper function to create a problem
function createProblem(
  language: string,
  difficulty: string,
  index: number,
  totalInDifficulty: number
) {
  const topics = {
    arrays: {
      name: 'Array Operations',
      description: (lang: string) => `Implement a function that ${['finds the maximum element', 'calculates the sum', 'reverses the array', 'finds duplicate elements', 'finds two numbers that sum to target', 'finds the longest subarray', 'rotates array by k steps', 'merges two sorted arrays'][index % 8]} in an array.`,
      template: {
        'C++': `vector<int> arr = {1, 2, 3, 4, 5};`,
        'PYTHON': `arr = [1, 2, 3, 4, 5]`
      }
    },
    strings: {
      name: 'String Manipulation',
      description: (lang: string) => `Create a function that ${['checks if a string is palindrome', 'counts character frequency', 'reverses words in a sentence', 'removes duplicate characters', 'finds longest substring without repeating chars', 'generates all permutations', 'finds longest common prefix', 'implements string compression'][index % 8]}.`,
      template: {
        'C++': `string str = "example";`,
        'PYTHON': `text = "example"`
      }
    },
    math: {
      name: 'Mathematical Problems',
      description: (lang: string) => `Implement a function that ${['calculates factorial', 'finds prime numbers', 'computes Fibonacci sequence', 'calculates GCD', 'finds square root', 'checks if number is power of two', 'calculates combination nCr', 'solves linear equations'][index % 8]}.`,
      template: {
        'C++': `int n = 10;`,
        'PYTHON': `n = 10`
      }
    },
    sorting: {
      name: 'Sorting Algorithms',
      description: (lang: string) => `Implement ${['bubble sort', 'quick sort', 'merge sort', 'insertion sort', 'heap sort', 'counting sort', 'radix sort', 'bucket sort'][index % 8]} algorithm.`,
      template: {
        'C++': `vector<int> arr = {5, 2, 8, 1, 9};`,
        'PYTHON': `arr = [5, 2, 8, 1, 9]`
      }
    },
    datastructures: {
      name: 'Data Structures',
      description: (lang: string) => `Implement ${['stack using arrays', 'queue using linked list', 'binary search tree', 'min heap', 'hash table', 'trie for strings', 'graph using adjacency list', 'LRU cache'][index % 8]}.`,
      template: {
        'C++': `class DataStructure {\n    // Implement your solution here\n};`,
        'PYTHON': `class DataStructure:\n    # Implement your solution here\n    pass`
      }
    }
  }

  const topic = Object.values(topics)[index % Object.keys(topics).length]
  const problemNumber = index + 1
  const difficultyPrefix = difficulty[0] + String(problemNumber).padStart(2, '0')
  
  const testCases = {
    arrays: [
      { input: "[1, 2, 3, 4, 5]", expectedOutput: "5", description: "Basic test case" },
      { input: "[-1, -5, 0, 10, 100]", expectedOutput: "100", description: "With negative numbers" }
    ],
    strings: [
      { input: '"racecar"', expectedOutput: "true", description: "Basic palindrome" },
      { input: '"hello world"', expectedOutput: "false", description: "Non-palindrome" }
    ],
    math: [
      { input: "5", expectedOutput: "120", description: "Factorial of 5" },
      { input: "0", expectedOutput: "1", description: "Edge case" }
    ],
    sorting: [
      { input: "[5, 2, 8, 1, 9]", expectedOutput: "[1, 2, 5, 8, 9]", description: "Basic sorting" },
      { input: "[]", expectedOutput: "[]", description: "Empty array" }
    ],
    datastructures: [
      { input: "push(1), push(2), pop()", expectedOutput: "2", description: "Basic operations" },
      { input: "isEmpty()", expectedOutput: "false", description: "State check" }
    ]
  }

  return {
    title: `${topic.name} #${problemNumber}`,
    difficulty,
    type: index % 2 === 0 ? 'SCENARIO' : 'FILL_IN',
    language,
    description: topic.description(language),
    problem: `Given ${topic.template[language]}, implement the solution.`,
    startingCode: topic.template[language],
    solution: topic.template[language], // We'll add proper solutions later
    testCases: JSON.stringify(testCases[Object.keys(topics)[index % Object.keys(topics).length]]),
    hints: JSON.stringify([
      "Think about edge cases",
      "Consider time complexity",
      "Break down the problem into smaller steps"
    ]),
    tags: JSON.stringify([
      topic.name.toLowerCase(),
      difficulty.toLowerCase(),
      language.toLowerCase()
    ]),
    timeLimit: difficulty === 'EASY' ? 300 : difficulty === 'MEDIUM' ? 600 : 900,
    baseComplexity: difficulty === 'EASY' ? 1.0 : difficulty === 'MEDIUM' ? 2.0 : 3.0,
    source: 'SEEDED',
    dailyUseCount: 0,  // Initialize usage metrics
    totalUses: 0,
    lastUsed: new Date(),
    successRate: 0,
    averageTime: 0,
    adaptiveDifficulty: 1.0
  }
}

async function seed() {
  console.log('🌱 Seeding...')
  console.time(`🌱 Database has been seeded`)

  // Create roles first
  console.time('👑 Creating roles...')
  const roles = [
    {
      name: 'admin',
      permissions: [
        { action: '*', entity: '*', access: 'any' }
      ]
    },
    {
      name: 'user',
      permissions: [
        { action: 'read', entity: 'user', access: 'own' },
        { action: 'update', entity: 'user', access: 'own' },
        { action: 'read', entity: 'problem', access: 'any' },
        { action: 'submit', entity: 'problem', access: 'any' }
      ]
    }
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        permissions: {
          deleteMany: {},
          create: role.permissions
        }
      },
      create: {
        name: role.name,
        permissions: {
          create: role.permissions
        }
      }
    }).catch(e => {
      console.error('Error creating role:', e)
      return null
    })
  }
  console.timeEnd('👑 Creating roles...')

  // Clear existing problems
  await prisma.problem.deleteMany()
  console.log('Cleared existing problems')

  const languages = ['C++', 'PYTHON']
  const difficulties = {
    'EASY': 100,    // 40% of problems
    'MEDIUM': 150,  // 40% of problems
    'HARD': 150     // 20% of problems
  }

  for (const language of languages) {
    console.log(`Creating ${language} problems...`)
    
    let problemIndex = 0
    for (const [difficulty, percentage] of Object.entries(difficulties)) {
      const count = percentage
      console.log(`Creating ${count} ${difficulty} problems for ${language}...`)
      
      for (let i = 0; i < count; i++) {
        const problem = createProblem(language, difficulty, problemIndex, count)
        await prisma.problem.create({ data: problem })
        problemIndex++
      }
    }
  }

  const totalUsers = 5
  console.time(`👤 Created ${totalUsers} users...`)
  // ... rest of the code remains the same ...
}
