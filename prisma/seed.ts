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
      description: (lang: string) => `Implement a function that ${['finds the maximum element', 'calculates the sum', 'reverses the array', 'finds duplicate elements'][index % 4]} in an array.`,
      template: {
        'C++': `vector<int> arr = {1, 2, 3, 4, 5};`,
        'PYTHON': `arr = [1, 2, 3, 4, 5]`
      }
    },
    strings: {
      name: 'String Manipulation',
      description: (lang: string) => `Create a function that ${['checks if a string is palindrome', 'counts character frequency', 'reverses words in a sentence', 'removes duplicate characters'][index % 4]}.`,
      template: {
        'C++': `string str = "example";`,
        'PYTHON': `text = "example"`
      }
    },
    math: {
      name: 'Mathematical Problems',
      description: (lang: string) => `Implement a function that ${['calculates factorial', 'finds prime numbers', 'computes Fibonacci sequence', 'calculates GCD'][index % 4]}.`,
      template: {
        'C++': `int n = 10;`,
        'PYTHON': `n = 10`
      }
    },
    sorting: {
      name: 'Sorting Algorithms',
      description: (lang: string) => `Implement ${['bubble sort', 'quick sort', 'merge sort', 'insertion sort'][index % 4]} algorithm.`,
      template: {
        'C++': `vector<int> arr = {5, 2, 8, 1, 9};`,
        'PYTHON': `arr = [5, 2, 8, 1, 9]`
      }
    }
  }

  const topic = Object.values(topics)[index % Object.keys(topics).length]
  const problemNumber = index + 1
  const difficultyPrefix = difficulty[0] + String(problemNumber).padStart(2, '0')
  
  return {
    title: `${topic.name} #${problemNumber}`,
    difficulty,
    type: index % 2 === 0 ? 'SCENARIO' : 'FILL_IN',
    language,
    description: topic.description(language),
    problem: `Given ${topic.template[language]}, implement the solution.`,
    startingCode: topic.template[language],
    solution: topic.template[language], // We'll add proper solutions later
    testCases: JSON.stringify([
      { input: "example input", expectedOutput: "example output", description: "Basic test case" }
    ]),
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
    'EASY': 40,    // 40% of problems
    'MEDIUM': 40,  // 40% of problems
    'HARD': 20     // 20% of problems
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
